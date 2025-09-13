const BASE_URL = "http://localhost:4000"; 

// Fetch the list of symbols
export async function fetchSymbols() {
  const response = await fetch(`${BASE_URL}/api/symbols`);
  if (!response.ok) {
    throw new Error("Failed to fetch symbols");
  }
  return response.json();
}

// Fetch the latest N candles for a symbol
export async function fetchCandles(symbol: string, timeframe = "1m", limit = 200) {
  const response = await fetch(
    `${BASE_URL}/api/candles?symbol=${symbol}&timeframe=${timeframe}&limit=${limit}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch candles for ${symbol}`);
  }
  return response.json();
}

// Fetch the latest quote for a symbol
export async function fetchLatestQuote(symbol: string) {
  const response = await fetch(`${BASE_URL}/api/quote/latest?symbol=${symbol}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch latest quote for ${symbol}`);
  }
  return response.json();
}