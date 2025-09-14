import { useState, useEffect } from 'react';
import { fetchMarketData } from '@/utils/api';

interface MarketData {
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  lastUpdated: Date;
}

export function useMarketData(symbol: string) {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMarketData(symbol);
      setMarketData(data);
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError('Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (symbol) {
      fetchData();
    }
  }, [symbol]);

  return { marketData, loading, error, refetch: fetchData };
}
