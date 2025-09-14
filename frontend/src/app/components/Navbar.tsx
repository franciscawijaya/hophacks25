"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    router.push("/login");
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav className="w-full h-16 flex items-center justify-between bg-gradient-to-r from-slate-900/90 via-purple-900/90 to-slate-900/90 backdrop-blur-md border-b border-white/10 px-8 fixed top-0 left-0 z-50 shadow-2xl">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      </div>

      {/* Logo and Brand */}
      <div className="flex items-center space-x-4 relative z-10">
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Image 
              src="/assets/favicon.png" 
              alt="Logo" 
              width={28} 
              height={28} 
              className="rounded-lg" 
            />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
        </div>
        <Link href="/" className="group">
          <span className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent group-hover:from-yellow-200 group-hover:to-orange-200 transition-all duration-300 cursor-pointer tracking-wide">
            🔮 Crypto Carnival
          </span>
        </Link>
      </div>

      {/* Navigation Actions */}
      <div className="flex items-center space-x-4 relative z-10">
        {isAuthenticated && user ? (
          <>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-purple-200 font-medium">
                Welcome, <span className="text-yellow-200 font-semibold">{user}</span>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <button
              className="group relative px-6 py-2 bg-gradient-to-r from-red-500/20 to-red-600/20 backdrop-blur-md text-red-300 rounded-xl font-semibold border border-red-500/30 hover:bg-red-500/30 transition-all duration-300 transform hover:scale-105"
              onClick={handleLogout}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </div>
            </button>
          </>
        ) : (
          <button
            className="group relative px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            onClick={handleLogin}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Login</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
          </button>
        )}
      </div>
    </nav>
  );
}
