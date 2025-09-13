import { prisma } from "./db";
import { TIMEFRAME } from "./env";

/** REST backfill for last N candles; Gemini returns newest-first */
export async function backfillSymbol(symbol: string, limit = 300) {
  const restSymbol = symbol.toLowerCase();
  const url = "https://api.gemini.com/v2/candles/" + restSymbol + "/" + TIMEFRAME;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Backfill " + symbol + " failed: " + res.status);
  }

  const rows: [number, number, number, number, number, number][] = await res.json();
  const bars = rows.slice(0, limit).reverse(); // oldest->newest

  for (const [ts, open, high, low, close, volume] of bars) {
    await prisma.candle.upsert({
      where: { symbol_timeframe_ts: { symbol, timeframe: TIMEFRAME, ts: BigInt(ts) } },
      create: { symbol, timeframe: TIMEFRAME, ts: BigInt(ts), open, high, low, close, volume },
      update: { open, high, low, close, volume }
    });
  }
}
