import WebSocket, { RawData } from "ws";
import { prisma } from "./db";
import { SYMBOLS } from "./env";
import { Book } from "./orderbook";

type L2Msg = {
  type: "l2_updates";
  symbol: string;
  changes: [("buy" | "sell"), string, string][];
};
type CandleMsg = {
  type: `candles_${string}_updates`;
  symbol: string;
  changes: [number, number, number, number, number, number][];
};

export function startGeminiWS() {
  const ws = new WebSocket("wss://api.gemini.com/v2/marketdata");
  const books = new Map<string, Book>();

  // In-memory latest quote per symbol; flushed periodically
  const pendingQuotes = new Map<string, { bid?: number; ask?: number; ts: number }>();
  let flushing = false;

  async function flushQuotes() {
    if (flushing || pendingQuotes.size === 0) return;
    flushing = true;
    try {
      for (const [sym, q] of Array.from(pendingQuotes.entries())) {
        const ts = BigInt(q.ts);
        await prisma.quote.upsert({
          where: { symbol_ts: { symbol: sym, ts } },
          create: { symbol: sym, ts, bid: q.bid ?? null, ask: q.ask ?? null, last: null },
          update: { bid: q.bid ?? null, ask: q.ask ?? null }
        });
        pendingQuotes.delete(sym);
      }
    } catch (e) {
      console.error("flushQuotes error:", e);
    } finally {
      flushing = false;
    }
  }
  // Write at most once per second per symbol
  setInterval(flushQuotes, 1000);

  ws.on("open", () => {
    const msg = {
      type: "subscribe",
      subscriptions: [
        { name: "l2", symbols: SYMBOLS },
        { name: "candles_1m", symbols: SYMBOLS }
      ]
    };
    ws.send(JSON.stringify(msg));
    console.log("WS connected; subscribed:", SYMBOLS.join(", "));
  });

  ws.on("message", async (buf: RawData) => {
    let m: any; try { m = JSON.parse(buf.toString()); } catch { return; }

    // L2 deltas → update in-memory best bid/ask (DB write is batched)
    if (m?.type === "l2_updates" && m?.symbol && Array.isArray(m?.changes)) {
      const sym: string = m.symbol;
      const book = books.get(sym) ?? (books.set(sym, new Book()), books.get(sym)!);
      (m as L2Msg).changes.forEach(([side, price, qty]) => book.applyChange(side, price, qty));
      const { bid, ask } = book.best();
      pendingQuotes.set(sym, { bid, ask, ts: Date.now() });
      return;
    }

    // Candle updates (low frequency) → write inline
    if (typeof m?.type === "string" && m?.type.endsWith("_updates") && m?.symbol && Array.isArray(m?.changes)) {
      const cm = m as CandleMsg;
      const timeframe = cm.type.replace("candles_", "").replace("_updates", "");
      try {
        for (const [ts, o, h, l, c, v] of cm.changes) {
          await prisma.candle.upsert({
            where: { symbol_timeframe_ts: { symbol: cm.symbol, timeframe, ts: BigInt(ts) } },
            create: { symbol: cm.symbol, timeframe, ts: BigInt(ts), open: o, high: h, low: l, close: c, volume: v },
            update: { open: o, high: h, low: l, close: c, volume: v }
          });
        }
      } catch (e) {
        console.error("candle upsert error:", e);
      }
      return;
    }
  });

  ws.on("close", () => {
    console.warn("WS closed — reconnecting in 1.5s...");
    setTimeout(startGeminiWS, 1500);
  });
  ws.on("error", (e: unknown) => {
    console.error("WS error:", e);
    ws.close();
  });
}
