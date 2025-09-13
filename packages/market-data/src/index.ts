import { SYMBOLS } from "./env";
import { backfillSymbol } from "./backfill";
import { startGeminiWS } from "./geminiWS";
import { initDB } from "./dbInit";

async function main() {
  await initDB();
  console.log("DB ready");

  console.log("Backfilling:", SYMBOLS.join(", "));
  for (const s of SYMBOLS) {
    try { await backfillSymbol(s, 300); }
    catch (e) { console.error("Backfill error", s, e); }
  }
  console.log("Starting Gemini WebSocket…");
  startGeminiWS();
}
main().catch(err => { console.error(err); process.exit(1); });
