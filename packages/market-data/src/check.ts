import { prisma } from "./db";
(async () => {
  const candles = await prisma.candle.count();
  const quotes = await prisma.quote.count();
  const latest = await prisma.candle.findFirst({ orderBy: { ts: "desc" } });
  console.log({ candles, quotes, latest });
  process.exit(0);
})();
