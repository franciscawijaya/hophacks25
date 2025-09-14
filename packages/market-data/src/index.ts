// src/index.ts
import { SYMBOLS } from "./env";
import { backfillSymbol } from "./backfill";
import { startGeminiWS } from "./geminiWS";
import { initDB } from "./dbInit";
import { runAllRollups } from "./rollup";

async function main() {
  await initDB();
  console.log("DB ready");

  console.log("Backfilling daily for:", SYMBOLS.join(", "));
  for (const s of SYMBOLS) {
    try { await backfillSymbol(s, 300); }  // your existing daily backfill
    catch (e) { console.error("Backfill error", s, e); }
  }

  console.log("Building rollups…");
  await runAllRollups();

  setInterval(async () => {
    try { await runAllRollups(); }
    catch (e) { console.error("rollup error:", e); }
  }, 60 * 60 * 1000); // hourly

  console.log("Starting Gemini WebSocket…");
  startGeminiWS();
}
main().catch(err => { console.error(err); process.exit(1); });
