import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "./db";
import { SYMBOLS } from "./env";

// ---- helpers to serialize BigInt ----
const toNumber = (bi: bigint | null | undefined) =>
  typeof bi === "bigint" ? Number(bi) : bi == null ? null : Number(bi);
const serializeCandle = (r: any) => ({
  symbol: r.symbol, timeframe: r.timeframe, ts: toNumber(r.ts),
  open: r.open, high: r.high, low: r.low, close: r.close, volume: r.volume
});
const serializeQuote = (r: any) => ({
  symbol: r.symbol, ts: toNumber(r.ts), bid: r.bid ?? null, ask: r.ask ?? null, last: r.last ?? null
});

const app = Fastify({ logger: true });
app.register(cors, { origin: true });

// Health
app.get("/healthz", async () => ({ ok: true }));
// Symbols
app.get("/api/symbols", async () => ({ symbols: SYMBOLS }));

// Latest N candles
app.get("/api/candles", async (req, reply) => {
  const q = req.query as any;
  const symbol = String(q.symbol ?? "").toUpperCase();
  const timeframe = String(q.timeframe ?? "1m");
  const limit = Math.min(Math.max(Number(q.limit ?? 200), 1), 1000);
  if (!symbol || !SYMBOLS.includes(symbol)) {
    return reply.code(400).send({ error: "symbol is required and must be one of /api/symbols" });
  }
  const rows = await prisma.candle.findMany({
    where: { symbol, timeframe }, orderBy: { ts: "desc" }, take: limit
  });
  return rows.reverse().map(serializeCandle);
});

// Latest quote
app.get("/api/quote/latest", async (req, reply) => {
  const q = (req.query as any);
  const symbol = String(q.symbol ?? "").toUpperCase();
  if (!symbol || !SYMBOLS.includes(symbol)) {
    return reply.code(400).send({ error: "symbol is required and must be one of /api/symbols" });
  }
  const row = await prisma.quote.findFirst({ where: { symbol }, orderBy: { ts: "desc" } });
  return row ? serializeQuote(row) : {};
});

// Range candles (ms epoch)
app.get("/api/candles/range", async (req, reply) => {
  const q = req.query as any;
  const symbol = String(q.symbol ?? "").toUpperCase();
  const timeframe = String(q.timeframe ?? "1m");
  const from = BigInt(q.from ?? 0);
  const to = BigInt(q.to ?? Date.now());
  if (!symbol || !SYMBOLS.includes(symbol)) {
    return reply.code(400).send({ error: "symbol is required and must be one of /api/symbols" });
  }
  const rows = await prisma.candle.findMany({
    where: { symbol, timeframe, ts: { gte: from, lte: to } },
    orderBy: { ts: "asc" }, take: 5000
  });
  return rows.map(serializeCandle);
});

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
start();
