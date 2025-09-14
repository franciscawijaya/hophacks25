// src/env.ts
import "dotenv/config";

const csv = (v?: string) => (v ?? "").split(",").map(s => s.trim()).filter(Boolean);

// existing
export const SYMBOLS = (process.env.SYMBOLS ?? "BTCUSD,ETHUSD,SOLUSD")
  .split(",").map(s => s.trim().toUpperCase()).filter(Boolean);

export const TIMEFRAME = (process.env.TIMEFRAME ?? "1m").toLowerCase();

// NEW for rollups
export type HighTF = "1w" | "1mo" | "6mo" | "1y";
export const ROLLUP_BASE_TF = (process.env.ROLLUP_BASE_TF ?? "1d").toLowerCase();

const VALID: HighTF[] = ["1w","1mo","6mo","1y"];
export const ROLLUP_TFS: HighTF[] = (() => {
  const raw = csv(process.env.ROLLUP_TFS);
  const list = (raw.length ? raw : ["1w","1mo","6mo","1y"]).map(s => s.toLowerCase());
  return list.filter((s): s is HighTF => (VALID as string[]).includes(s));
})();
