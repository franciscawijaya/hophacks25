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

// Fetch market data for a symbol (price, 24h change, volume)
export async function fetchMarketData(symbol: string) {
  try {
    // Fetch latest quote for current price
    const quote = await fetchLatestQuote(symbol);
    
    // Fetch last 24 hours of candles to calculate 24h change and volume
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    
    const candles = await fetch(`${BASE_URL}/api/candles/range?symbol=${symbol}&timeframe=1m&from=${twentyFourHoursAgo}&to=${now}`);
    if (!candles.ok) {
      throw new Error(`Failed to fetch candles for ${symbol}`);
    }
    const candleData = await candles.json();
    
    // Calculate 24h change
    let priceChange24h = 0;
    let priceChangePercent24h = 0;
    let volume24h = 0;
    
    if (candleData.length > 0) {
      const latestCandle = candleData[candleData.length - 1];
      const oldestCandle = candleData[0];
      
      // Calculate price change
      const currentPrice = latestCandle.close;
      const price24hAgo = oldestCandle.close;
      priceChange24h = currentPrice - price24hAgo;
      priceChangePercent24h = (priceChange24h / price24hAgo) * 100;
      
      // Calculate total volume over 24h
      volume24h = candleData.reduce((sum: number, candle: any) => sum + candle.volume, 0);
    }
    
    return {
      symbol: symbol.toUpperCase(),
      currentPrice: quote.last || quote.bid || 0,
      priceChange24h,
      priceChangePercent24h,
      volume24h,
      lastUpdated: quote.ts ? new Date(quote.ts) : new Date()
    };
  } catch (error) {
    console.error(`Error fetching market data for ${symbol}:`, error);
    throw error;
  }
}