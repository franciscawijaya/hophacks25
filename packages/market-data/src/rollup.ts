// src/rollup.ts
import { prisma } from "./db";
import { SYMBOLS, ROLLUP_BASE_TF, ROLLUP_TFS } from "./env";

export type HighTF = "1w" | "1mo" | "6mo" | "1y";
const VALID_HIGH_TF: HighTF[] = ["1w", "1mo", "6mo", "1y"] as const;

function assertHighTF(tf: string): asserts tf is HighTF {
  if (!VALID_HIGH_TF.includes(tf as HighTF)) {
    throw new Error(`Unsupported rollup timeframe: ${tf}`);
  }
}

function floorToDayStartUTC(tsMs: number): number {
  const d = new Date(tsMs);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

function floorToPeriodStartUTC(tsMs: number, tf: HighTF): number {
  const d = new Date(tsMs);
  d.setUTCHours(0, 0, 0, 0); // midnight UTC

  if (tf === "1w") {
    // ISO week: Monday start
    const day = d.getUTCDay();         // 0..6 (Sun..Sat)
    const diff = (day + 6) % 7;        // Mon=0, Sun=6
    d.setUTCDate(d.getUTCDate() - diff);
  } else if (tf === "1mo") {
    d.setUTCDate(1);
  } else if (tf === "6mo") {
    const m = d.getUTCMonth();         // 0..11
    d.setUTCMonth(m < 6 ? 0 : 6, 1);   // Jan or Jul, day 1
  } else if (tf === "1y") {
    d.setUTCMonth(0, 1);               // Jan 1
  }
  return d.getTime();
}

/** 1m -> 1d for one symbol (incremental) */
export async function rollup1mTo1d(symbol: string) {
  // Last existing daily candle
  const lastDaily = await prisma.candle.findFirst({
    where: { symbol, timeframe: "1d" },
    orderBy: { ts: "desc" },
    select: { ts: true },
  });
  const sinceMs = lastDaily ? Number(lastDaily.ts) : 0;

  // Grab minute candles since last daily bucket start
  const minuteRows = await prisma.candle.findMany({
    where: {
      symbol,
      timeframe: "1m",
      ...(sinceMs > 0 ? { ts: { gte: BigInt(sinceMs) } } : {}),
    },
    orderBy: { ts: "asc" },
    select: { ts: true, open: true, high: true, low: true, close: true, volume: true },
  });
  if (minuteRows.length === 0) return;

  type Agg = { ts: number; open: number; high: number; low: number; close: number; volume: number; firstTs: number; lastTs: number; };
  const buckets = new Map<number, Agg>();

  for (const r of minuteRows) {
    const tsMs = Number(r.ts);
    const bucket = floorToDayStartUTC(tsMs);
    const a = buckets.get(bucket);
    if (!a) {
      buckets.set(bucket, {
        ts: bucket,
        open: r.open,
        high: r.high,
        low: r.low,
        close: r.close,
        volume: r.volume,
        firstTs: tsMs,
        lastTs: tsMs,
      });
    } else {
      a.high = Math.max(a.high, r.high);
      a.low = Math.min(a.low, r.low);
      a.volume += r.volume;
      if (tsMs < a.firstTs) { a.firstTs = tsMs; a.open = r.open; }
      if (tsMs > a.lastTs)  { a.lastTs  = tsMs; a.close = r.close; }
    }
  }

  for (const c of Array.from(buckets.values()).sort((x, y) => x.ts - y.ts)) {
    await prisma.candle.upsert({
      where: { symbol_timeframe_ts: { symbol, timeframe: "1d", ts: BigInt(c.ts) } },
      update: { open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume },
      create: { symbol, timeframe: "1d", ts: BigInt(c.ts), open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume },
    });
  }
}

/** 1d -> (1w|1mo|6mo|1y) for one symbol (incremental) */
export async function rollup1dToHigher(symbol: string, tf: HighTF) {
  assertHighTF(tf);

  const lastDest = await prisma.candle.findFirst({
    where: { symbol, timeframe: tf },
    orderBy: { ts: "desc" },
    select: { ts: true },
  });
  const sinceMs = lastDest ? Number(lastDest.ts) : 0;

  const dailyRows = await prisma.candle.findMany({
    where: {
      symbol,
      timeframe: "1d",
      ...(sinceMs > 0 ? { ts: { gte: BigInt(sinceMs) } } : {}),
    },
    orderBy: { ts: "asc" },
    select: { ts: true, open: true, high: true, low: true, close: true, volume: true },
  });
  if (dailyRows.length === 0) return;

  type Agg = { ts: number; open: number; high: number; low: number; close: number; volume: number; firstTs: number; lastTs: number; };
  const buckets = new Map<number, Agg>();

  for (const r of dailyRows) {
    const tsMs = Number(r.ts);
    const bucket = floorToPeriodStartUTC(tsMs, tf);
    const a = buckets.get(bucket);
    if (!a) {
      buckets.set(bucket, {
        ts: bucket,
        open: r.open,
        high: r.high,
        low: r.low,
        close: r.close,
        volume: r.volume,
        firstTs: tsMs,
        lastTs: tsMs,
      });
    } else {
      a.high = Math.max(a.high, r.high);
      a.low = Math.min(a.low, r.low);
      a.volume += r.volume;
      if (tsMs < a.firstTs) { a.firstTs = tsMs; a.open = r.open; }
      if (tsMs > a.lastTs)  { a.lastTs  = tsMs; a.close = r.close; }
    }
  }

  for (const c of Array.from(buckets.values()).sort((x, y) => x.ts - y.ts)) {
    await prisma.candle.upsert({
      where: { symbol_timeframe_ts: { symbol, timeframe: tf, ts: BigInt(c.ts) } },
      update: { open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume },
      create: { symbol, timeframe: tf, ts: BigInt(c.ts), open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume },
    });
  }
}

/** Orchestrator */
export async function runAllRollups() {
  // If base is 1m, build 1d first
  if (ROLLUP_BASE_TF === "1m") {
    for (const symbol of SYMBOLS) {
      await rollup1mTo1d(symbol);
    }
  } else if (ROLLUP_BASE_TF !== "1d") {
    throw new Error(`Unsupported ROLLUP_BASE_TF='${ROLLUP_BASE_TF}'. Use '1m' or '1d'.`);
  }

  // Then build higher frames from daily
  for (const symbol of SYMBOLS) {
    for (const tf of ROLLUP_TFS) {
      assertHighTF(tf);
      await rollup1dToHigher(symbol, tf);
    }
  }
}
