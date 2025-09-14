"use client";

import { useAuth } from "./contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardHeader from "./components/DashboardHeader";
import SymbolsList from "./components/SymbolsList";

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // If not authenticated, redirect to login
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  const handleRefresh = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1000);
  };

  // Show loading while checking authentication
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
          <h2 className="text-2xl font-bold text-white mb-2">Loading Your Dashboard</h2>
          <p className="text-purple-200">Preparing your trading environment...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render anything (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // If authenticated, show the carnival fairground dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Carnival Fairground Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Main carnival atmosphere */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
        
        {/* Floating carnival lights */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        
        {/* Carnival tent stripes */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-red-500/10 via-yellow-500/10 to-red-500/10 transform -skew-y-1"></div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-r from-blue-500/10 via-green-500/10 to-blue-500/10 transform skew-y-1"></div>
        
        {/* Floating particles */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-yellow-300 rounded-full animate-ping opacity-60"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-pink-300 rounded-full animate-ping opacity-60" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-ping opacity-60" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-40 right-1/3 w-1 h-1 bg-green-300 rounded-full animate-ping opacity-60" style={{animationDelay: '0.5s'}}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Carnival Welcome Header */}
          <DashboardHeader onRefresh={handleRefresh} isAnimating={isAnimating} />
          
          {/* 🎡 CARNIVAL FAIRGROUND LAYOUT */}
          <div className="space-y-12">
            
            {/* 🎴 TAROT CARD BOOTH - Crypto Explorer */}
            <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 backdrop-blur-md rounded-3xl p-8 border border-amber-500/20 shadow-2xl">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-3xl">🎴</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white flex items-center">
                    <span className="mr-3">🎭</span>
                    Tarot Card Booth
                    <span className="ml-3 text-2xl">🔮</span>
                  </h2>
                  <p className="text-amber-200 text-lg">Discover your crypto fortune through mystical character cards</p>
                </div>
              </div>
              <SymbolsList />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}