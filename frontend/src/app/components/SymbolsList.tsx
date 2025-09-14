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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse movement for cursor ball effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
    <div className="bg-white rounded-lg shadow p-6 relative overflow-hidden">
      {/* Cursor Ball Effect */}
      <div 
        className="fixed w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full pointer-events-none z-50 shadow-lg border-2 border-white"
        style={{
          left: mousePosition.x - 12,
          top: mousePosition.y - 12,
          transition: 'all 0.1s ease-out'
        }}
      />
      
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        🎪 Top 10 Cryptocurrencies
        <span className="ml-2 text-sm text-gray-500">Click to explore each crypto!</span>
      </h2>
      
      {loading ? (
        <div className="text-center text-gray-500 py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
          Loading symbols...
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 relative">
          {symbols.slice(0, 10).map((symbol, index) => {
            const colors = [
              'bg-gradient-to-br from-red-500 to-red-700 text-white',
              'bg-gradient-to-br from-blue-500 to-blue-700 text-white', 
              'bg-gradient-to-br from-green-500 to-green-700 text-white',
              'bg-gradient-to-br from-yellow-500 to-yellow-700 text-white',
              'bg-gradient-to-br from-purple-500 to-purple-700 text-white',
              'bg-gradient-to-br from-pink-500 to-pink-700 text-white',
              'bg-gradient-to-br from-orange-500 to-orange-700 text-white',
              'bg-gradient-to-br from-teal-500 to-teal-700 text-white',
              'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white',
              'bg-gradient-to-br from-cyan-500 to-cyan-700 text-white',
              'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white',
              'bg-gradient-to-br from-rose-500 to-rose-700 text-white',
              'bg-gradient-to-br from-violet-500 to-violet-700 text-white',
              'bg-gradient-to-br from-amber-500 to-amber-700 text-white',
              'bg-gradient-to-br from-lime-500 to-lime-700 text-white',
              'bg-gradient-to-br from-sky-500 to-sky-700 text-white',
              'bg-gradient-to-br from-fuchsia-500 to-fuchsia-700 text-white',
              'bg-gradient-to-br from-slate-500 to-slate-700 text-white',
              'bg-gradient-to-br from-stone-500 to-stone-700 text-white',
              'bg-gradient-to-br from-zinc-500 to-zinc-700 text-white'
            ];
            
            const colorClass = colors[index % colors.length];
            
            return (
              <Link
                key={symbol}
                href={`/crypto/${symbol}`}
                className={`${colorClass} rounded-lg p-4 text-center font-bold text-lg cursor-pointer transform transition-all duration-300 ease-out relative hover:scale-105 hover:rotate-2 hover:shadow-xl group`}
                style={{
                  animationDelay: `${index * 150}ms`,
                  animation: 'fadeInUp 0.8s ease-out forwards'
                }}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center border-2 border-white/50 group-hover:scale-110 transition-transform duration-300 relative overflow-hidden">
                    <Image
                      src={getSymbolLogo(symbol)}
                      alt={`${symbol} logo`}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  </div>
                  <span className="text-sm font-bold tracking-wide drop-shadow-sm group-hover:text-yellow-200 transition-colors duration-300">
                    {symbol}
                  </span>
                  <div className="text-xs text-white/70 group-hover:text-yellow-200 transition-colors duration-300">
                  </div>
                </div>
                
                {/* Card shadow for depth */}
                <div className="absolute inset-0 bg-black/20 rounded-lg -z-10 transform translate-y-1 translate-x-1 group-hover:translate-y-2 group-hover:translate-x-2 transition-transform duration-300"></div>
                
                {/* Hover effect - subtle knock down preview */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
