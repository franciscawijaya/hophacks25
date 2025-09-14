import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "./db";
import { SYMBOLS, TIMEFRAME } from "./env";

// ---- helpers ----
const toNumber = (bi: bigint | null | undefined) =>
  typeof bi === "bigint" ? Number(bi) : bi == null ? null : Number(bi);

const serializeCandle = (r: any) => ({
  symbol: r.symbol,
  timeframe: r.timeframe,
  ts: toNumber(r.ts),
  open: r.open,
  high: r.high,
  low: r.low,
  close: r.close,
  volume: r.volume,
});

const serializeQuote = (r: any) => ({
  symbol: r.symbol,
  ts: toNumber(r.ts),
  bid: r.bid ?? null,
  ask: r.ask ?? null,
  last: r.last ?? null,
});

function parseLimit(val: any, def = 200, min = 1, max = 1000) {
  const n = Number(val ?? def);
  if (!Number.isFinite(n)) return def;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

function parseBigInt(val: any, fallback: bigint): bigint {
  try {
    const s = String(val ?? "");
    if (s.trim() === "") return fallback;
    return BigInt(s);
  } catch {
    return fallback;
  }
}

// ---- app ----
const app = Fastify({ logger: true });
app.register(cors, { origin: true });

// Health
app.get("/healthz", async () => ({ ok: true }));

// Symbols
app.get("/api/symbols", async () => ({ symbols: SYMBOLS }));

// Latest N candles
app.get("/api/candles", async (req, reply) => {
  const q = req.query as Record<string, any>;
  const symbol = String(q.symbol ?? "").toUpperCase();
  const timeframe = String(q.timeframe ?? TIMEFRAME).toLowerCase();
  const limit = parseLimit(q.limit, 200, 1, 1000);

  if (!symbol || !SYMBOLS.includes(symbol)) {
    return reply.code(400).send({ error: "symbol is required and must be one of /api/symbols" });
  }

  const rows = await prisma.candle.findMany({
    where: { symbol, timeframe },
    orderBy: { ts: "desc" },
    take: limit,
  });

  return rows.reverse().map(serializeCandle);
});

// Latest quote
app.get("/api/quote/latest", async (req, reply) => {
  const q = req.query as Record<string, any>;
  const symbol = String(q.symbol ?? "").toUpperCase();

  if (!symbol || !SYMBOLS.includes(symbol)) {
    return reply.code(400).send({ error: "symbol is required and must be one of /api/symbols" });
  }

  const row = await prisma.quote.findFirst({
    where: { symbol },
    orderBy: { ts: "desc" },
  });

  return row ? serializeQuote(row) : {};
});

// Range candles (ms epoch)
app.get("/api/candles/range", async (req, reply) => {
  const q = req.query as Record<string, any>;
  const symbol = String(q.symbol ?? "").toUpperCase();
  const timeframe = String(q.timeframe ?? TIMEFRAME).toLowerCase();

  const from = parseBigInt(q.from, 0n);
  const to = parseBigInt(q.to, BigInt(Date.now()));

  if (!symbol || !SYMBOLS.includes(symbol)) {
    return reply.code(400).send({ error: "symbol is required and must be one of /api/symbols" });
  }

  const rows = await prisma.candle.findMany({
    where: { symbol, timeframe, ts: { gte: from, lte: to } },
    orderBy: { ts: "asc" },
    take: 5000,
  });

  return rows.map(serializeCandle);
});

// ---- OPTIONAL: manual rollup trigger (place AFTER app is created) ----
// app.post("/api/rollups/run", async () => {
//   await runAllRollups();
//   return { ok: true };
// });

const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST ?? "0.0.0.0";

async function start() {
  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`API listening on http://${HOST}:${PORT}`);
  } catch (e) {
    app.log.error(e);
    process.exit(1);
  }
}
import { runAllRollups } from "./rollup";

app.post("/api/rollups/run", async () => {
  await runAllRollups();
  return { ok: true };
});

start();
