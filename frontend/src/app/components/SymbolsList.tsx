"use client";

import { useEffect, useState } from "react";
import { fetchSymbols } from "@/utils/api";

export default function SymbolsList() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSymbols() {
      try {
        setLoading(true);
        const data = await fetchSymbols();
        setSymbols(data.symbols);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    }
    loadSymbols();
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-red-800 font-semibold text-lg">Error</h2>
        <p className="text-red-600 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Top 20 Cryptocurrencies</h2>
      {loading ? (
        <div className="text-center text-gray-500 py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
          Loading symbols...
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {symbols.map((symbol) => (
            <div 
              key={symbol}
              className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {symbol}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
