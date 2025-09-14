import Link from "next/link";

interface DashboardHeaderProps {
  onRefresh?: () => void;
  isAnimating?: boolean;
}

export default function DashboardHeader({ onRefresh, isAnimating = false }: DashboardHeaderProps) {

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent flex items-center">
              <span className="mr-4 text-5xl">🎡</span>
              Crypto Carnival Fairground
              <span className="ml-4 text-5xl">🎪</span>
            </h1>
            <p className="text-purple-300 text-lg">
              Welcome to the most magical crypto experience! Explore booths, play games, and learn through carnival fun.
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {onRefresh && (
            <button
              onClick={onRefresh}
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
          )}
        </div>
      </div>
      
      {/* Crypto Trading Simulation Button */}
      <div className="flex justify-center">
        <Link 
          href="/chart"
          className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
        >
          <div className="flex items-center space-x-4">
            <svg className="w-8 h-8 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <div className="text-center">
              <div className="text-xl font-bold">🎪 Crypto Carnival</div>
              <div className="text-sm text-purple-100">Interactive bubble trading experience</div>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
        </Link>
      </div>
    </div>
  );
}
