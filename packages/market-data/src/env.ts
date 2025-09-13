import "dotenv/config";
export const SYMBOLS = (process.env.SYMBOLS ?? "BTCUSD,ETHUSD,SOLUSD")
  .split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
export const TIMEFRAME = (process.env.TIMEFRAME ?? "1m").toLowerCase();
