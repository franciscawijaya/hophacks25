const CANDIDATES = [
  "BTC","ETH","SOL","AVAX","ADA","DOGE","MATIC","LINK","LTC","BCH",
  "UNI","AAVE","ATOM","DOT","ETC","FIL","XLM","SHIB","ALGO","NEAR",
  "APT","ARB","OP","SUI","INJ","RNDR","TIA","SEI","TON","TRX"
];

async function main() {
  const res = await fetch("https://api.gemini.com/v1/symbols");
  if (!res.ok) throw new Error("Failed to fetch symbols: " + res.status);
  const all = (await res.json()) as string[];          // e.g. ["btcusd","ethusd",...]
  const usd = new Set(all.filter(s => s.endsWith("usd"))); // only USD pairs

  const picks: string[] = [];
  for (const t of CANDIDATES) {
    const pair = (t.toLowerCase() + "usd");
    if (usd.has(pair)) picks.push(t + "USD");
    if (picks.length >= 20) break;
  }

  if (picks.length === 0) {
    console.log("No matches found. Try a different candidate list.");
    return;
  }

  const line = "SYMBOLS=" + picks.join(",");
  console.log("\nPaste this into your .env (replace the SYMBOLS= line):\n");
  console.log(line + "\n");
}
main().catch(e => { console.error(e); process.exit(1); });
