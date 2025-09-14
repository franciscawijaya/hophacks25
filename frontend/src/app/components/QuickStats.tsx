"use client";

import { useMarketData } from '@/hooks/useMarketData';

interface QuickStatsProps {
  symbol: string;
}

export default function QuickStats({ symbol }: QuickStatsProps) {
  const { marketData, loading, error, refetch } = useMarketData(symbol);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Quick Stats
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Symbol:</span>
          <span className="font-medium">{symbol}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Price:</span>
          <span className="font-medium text-green-600">
            {loading ? (
              <span className="text-gray-400">Loading...</span>
            ) : error ? (
              <span className="text-red-500">Error</span>
            ) : marketData ? (
              `$${marketData.currentPrice.toFixed(2)}`
            ) : (
              <span className="text-gray-400">N/A</span>
            )}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">24h Change:</span>
          <span className={`font-medium ${
            loading ? 'text-gray-400' :
            error ? 'text-red-500' :
            marketData ? (marketData.priceChangePercent24h >= 0 ? 'text-green-600' : 'text-red-600') :
            'text-gray-400'
          }`}>
            {loading ? (
              'Loading...'
            ) : error ? (
              'Error'
            ) : marketData ? (
              `${marketData.priceChangePercent24h >= 0 ? '+' : ''}${marketData.priceChangePercent24h.toFixed(2)}%`
            ) : (
              'N/A'
            )}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">24h Volume:</span>
          <span className="font-medium">
            {loading ? (
              <span className="text-gray-400">Loading...</span>
            ) : error ? (
              <span className="text-red-500">Error</span>
            ) : marketData ? (
              `${(marketData.volume24h / 1000000).toFixed(2)}M`
            ) : (
              <span className="text-gray-400">N/A</span>
            )}
          </span>
        </div>
        {error && (
          <div className="pt-2 border-t border-gray-200">
            <button 
              onClick={refetch}
              className="w-full text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Retry loading market data
            </button>
          </div>
        )}
        {marketData && (
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              Last updated: {marketData.lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
