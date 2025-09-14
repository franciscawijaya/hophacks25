"use client";

import { useAuth } from "../contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import MultiLineChart from '../components/MultiLineChart';
import BubbleChartPage from "../bubble/page";
import BubbleChartPage2 from "../bubble2/page";

export default function ChartPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialSymbol, setInitialSymbol] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    const symbol = searchParams.get('symbol');
    console.log('🔍 Chart page - symbol from URL:', symbol);
    if (symbol) {
      const upperSymbol = symbol.toUpperCase();
      console.log('🔍 Chart page - setting initial symbol:', upperSymbol);
      setInitialSymbol(upperSymbol);
    }
  }, [searchParams]);

  useEffect(() => {
    console.log('🔍 Chart page - passing to MultiLineChart:', initialSymbol ? [initialSymbol] : undefined);
  }, [initialSymbol]);

  const handleRefresh = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          <div className="absolute top-40 left-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-purple-400 to-pink-400 mx-auto mb-6"></div>
            <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-white mx-auto"></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Your Trading Dashboard</h2>
          <p className="text-purple-200">Preparing real-time market data...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-3xl">📈</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent flex items-center">
                  <span className="mr-3 text-5xl">🎪</span>
                  Progression Booth
                  <span className="ml-3 text-5xl">🎯</span>
                </h1>
                <p className="text-blue-300 text-lg">Interactive data playground with real-time market progression</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                className={`group relative px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
                  isAnimating ? 'animate-pulse' : ''
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className={`w-5 h-5 transition-transform duration-300 ${isAnimating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh Data</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              </button>
              
              <button
                onClick={() => router.push('/')}
                className="group flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md text-white rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
              >
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </button>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-md rounded-2xl p-6 border border-blue-500/20">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-semibold">Live Market Data</span>
            </div>
            <p className="text-blue-200 text-lg leading-relaxed">
              Welcome to the <span className="text-white font-semibold">Progression Booth</span> - your interactive data playground! 
              Explore real-time market progression with <span className="text-cyan-300 font-semibold">interactive multiline charts</span> 
              featuring <span className="text-yellow-300 font-semibold">event markers and filters</span>. 
              <span className="text-blue-300 font-semibold"> Hover over data points</span> to see detailed information and 
              <span className="text-pink-300 font-semibold"> drag & drop</span> to trade in the trading booths below.
            </p>
          </div>
        </div>
        
        {/* Main Chart Section */}
        <div className="mb-12">
          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl">
            <MultiLineChart 
              width={1000}
              height={500}
              timeframe="1m"
              limit={1440}
              initialSelectedSymbols={initialSymbol ? [initialSymbol] : undefined}
            />
          </div>
        </div>
        
        {/* Features Section */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-md rounded-3xl p-8 border border-blue-500/20">
            <h2 className="text-3xl font-bold text-white mb-8 text-center flex items-center justify-center">
              <span className="mr-3 text-4xl">🎪</span>
              Progression Booth Features
              <span className="ml-3 text-4xl">🎯</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">🎪 Interactive Playground Features</h3>
                    <ul className="text-blue-200 space-y-2">
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                        <span>Hover over data points for detailed tooltips</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                        <span>Toggle symbols on/off using the buttons above</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                        <span>Select time periods from 1 hour to 3 months</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                        <span>Smooth animations and transitions</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                        <span>Color-coded legend for easy identification</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">📊 Market Data Playground</h3>
                    <ul className="text-blue-200 space-y-2">
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span>Real-time candle data from market API</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span>Shows closing prices over time</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span>Multiple timeframe options (1H to 3M)</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span>Optimized performance for large datasets</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span>Multiple cryptocurrency symbols supported</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trading Interface Section */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white flex items-center justify-center mb-4">
              <span className="mr-3 text-4xl">🎯</span>
              Trading Booth
              <span className="ml-3 text-4xl">⚡</span>
            </h2>
            <p className="text-green-200 text-lg">Throw tokens like carnival balls - drag, drop, and trade!</p>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-6 py-3 rounded-full border border-green-500/30">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <h3 className="text-2xl font-bold text-white flex items-center">
                    <span className="mr-2 text-2xl">🛒</span>
                    Market Trading
                  </h3>
                </div>
                <p className="text-green-200 mt-2">Drag bubbles to cart to buy</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <BubbleChartPage />
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-6 py-3 rounded-full border border-purple-500/30">
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                  <h3 className="text-2xl font-bold text-white flex items-center">
                    <span className="mr-2 text-2xl">💼</span>
                    Portfolio Management
                  </h3>
                </div>
                <p className="text-purple-200 mt-2">Drag from wallet to cart to sell</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <BubbleChartPage2 />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
