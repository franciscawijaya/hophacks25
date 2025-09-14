"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchSymbols } from "@/utils/api";

// Function to get the logo path for a given symbol
const getSymbolLogo = (symbol: string): string => {
  const logoMap: { [key: string]: string } = {
    'BTCUSD': '/assets/btcusd.png',
    'ETHUSD': '/assets/ethusd.png',
    'DOGEUSD': '/assets/dogeusd.svg',
    'SOLUSD': '/assets/solusd.jpeg',
    'LINKUSD': '/assets/linkusd.png',
    'UNIUSD': '/assets/uniusd.png',
    'XRPUSD': '/assets/xrpusd.png',
    'LTCUSD': '/assets/ltcusd.png',
    'BCHUSD': '/assets/bchusd.png',
    'AVAXUSD': '/assets/avaxusd.jpg'
  };
  
  return logoMap[symbol] || '/assets/btcusd.png'; // fallback to BTC logo
};

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
    <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center">
              💎 Top 10 Cryptocurrencies
            </h2>
            <p className="text-yellow-200 text-sm mt-1">Click to explore each crypto and view detailed analysis!</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-yellow-200">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          <span>Live Market Data</span>
        </div>
      </div>
      
      {loading ? (
        <div className="flex flex-col justify-center items-center py-16 space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-yellow-500 to-orange-500"></div>
            <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-white"></div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">Loading Cryptocurrencies</h3>
            <p className="text-yellow-200">Fetching the latest market data...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 relative">
          {symbols.slice(0, 10).map((symbol, index) => {
            const tarotColors = [
              { bg: 'from-amber-900 to-yellow-800', accent: 'from-amber-700 to-yellow-600', border: 'border-amber-600', symbol: '🔮' },
              { bg: 'from-purple-900 to-indigo-800', accent: 'from-purple-700 to-indigo-600', border: 'border-purple-600', symbol: '🌙' },
              { bg: 'from-emerald-900 to-green-800', accent: 'from-emerald-700 to-green-600', border: 'border-emerald-600', symbol: '🌿' },
              { bg: 'from-rose-900 to-pink-800', accent: 'from-rose-700 to-pink-600', border: 'border-rose-600', symbol: '💎' },
              { bg: 'from-slate-900 to-gray-800', accent: 'from-slate-700 to-gray-600', border: 'border-slate-600', symbol: '⚡' },
              { bg: 'from-violet-900 to-purple-800', accent: 'from-violet-700 to-purple-600', border: 'border-violet-600', symbol: '✨' },
              { bg: 'from-orange-900 to-red-800', accent: 'from-orange-700 to-red-600', border: 'border-orange-600', symbol: '🔥' },
              { bg: 'from-cyan-900 to-blue-800', accent: 'from-cyan-700 to-blue-600', border: 'border-cyan-600', symbol: '🌊' },
              { bg: 'from-teal-900 to-emerald-800', accent: 'from-teal-700 to-emerald-600', border: 'border-teal-600', symbol: '🐉' },
              { bg: 'from-fuchsia-900 to-purple-800', accent: 'from-fuchsia-700 to-purple-600', border: 'border-fuchsia-600', symbol: '🌟' }
            ];
            
            const tarotColor = tarotColors[index % tarotColors.length];
            
            return (
              <Link
                key={symbol}
                href={`/crypto/${symbol}`}
                className="group relative transform transition-all duration-700 ease-out hover:scale-110 hover:rotate-1 hover:z-10"
                style={{
                  animationDelay: `${index * 200}ms`,
                  animation: 'fadeInUp 1s ease-out forwards'
                }}
              >
                {/* Tarot Card Container */}
                <div className={`relative bg-gradient-to-br ${tarotColor.bg} text-white rounded-3xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-700 border-2 ${tarotColor.border} overflow-hidden aspect-[3/4] min-h-[280px]`}>
                  
                  {/* Tarot Card Header */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20 backdrop-blur-sm">
                      CARD #{String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="text-lg">
                      {tarotColor.symbol}
                    </div>
                  </div>

                  {/* Tarot Card Border Pattern */}
                  <div className="absolute inset-2 border border-white/20 rounded-2xl"></div>
                  <div className="absolute inset-4 border border-white/10 rounded-xl"></div>

                  {/* Main Content */}
                  <div className="flex flex-col items-center space-y-4 relative z-10 h-full">
                    {/* Logo Container with Mystical Styling */}
                    <div className="relative mt-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl flex items-center justify-center border-2 border-white/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl backdrop-blur-sm">
                        <Image
                          src={getSymbolLogo(symbol)}
                          alt={`${symbol} logo`}
                          width={50}
                          height={50}
                          className="rounded-xl object-cover"
                        />
                      </div>
                      {/* Mystical Glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>

                    {/* Symbol Name with Tarot Styling */}
                    <div className="text-center flex-1 flex flex-col justify-center">
                      <div className="text-xl font-bold tracking-widest drop-shadow-2xl group-hover:text-yellow-200 transition-colors duration-500 mb-2">
                        {symbol}
                      </div>
                      <div className="text-sm text-white/70 group-hover:text-yellow-200 transition-colors duration-500 mb-4">
                        The {symbol.replace('USD', '')} Oracle
                      </div>
                      
                      {/* Tarot Card Divider */}
                      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mb-4"></div>
                    </div>

                    {/* Tarot Card Footer */}
                    <div className="w-full">
                      <div className="text-xs font-bold bg-gradient-to-r from-white/10 to-white/5 px-4 py-2 rounded-full border border-white/20 text-center backdrop-blur-sm">
                        🔮 CRYPTO FORTUNE
                      </div>
                    </div>
                  </div>

                  {/* Mystical Pattern Overlay */}
                  <div className="absolute inset-0 opacity-5 group-hover:opacity-15 transition-opacity duration-500">
                    {/* Corner Symbols */}
                    <div className="absolute top-4 left-4 text-2xl opacity-30">✦</div>
                    <div className="absolute top-4 right-4 text-2xl opacity-30">✦</div>
                    <div className="absolute bottom-4 left-4 text-2xl opacity-30">✦</div>
                    <div className="absolute bottom-4 right-4 text-2xl opacity-30">✦</div>
                    
                    {/* Center Mystical Symbol */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                      {tarotColor.symbol}
                    </div>
                  </div>

                  {/* Mystical Hover Effects */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${tarotColor.accent} rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700`}></div>
                  
                  {/* Floating Particles */}
                  <div className="absolute top-2 right-2 w-1 h-1 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-500"></div>
                  <div className="absolute bottom-2 left-2 w-1 h-1 bg-purple-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-500 delay-200"></div>
                  <div className="absolute top-1/2 left-2 w-1 h-1 bg-pink-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-500 delay-400"></div>

                  {/* Mystical Ripple Effect */}
                  <div className="absolute inset-0 rounded-3xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1500"></div>
                  </div>
                </div>

                {/* Tarot Card Shadow */}
                <div className="absolute inset-0 bg-black/30 rounded-3xl -z-10 transform translate-y-3 translate-x-3 group-hover:translate-y-4 group-hover:translate-x-4 transition-transform duration-500"></div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
