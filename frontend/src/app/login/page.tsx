"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(BACKEND_URL + "/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.status === 200 && data.token) {
        setSuccess("Login successful!");
        setError("");
        login(data.token, username);
        router.push("/");
      } else if (res.status === 400) {
        setError(data.error || "Username and password required");
      } else if (res.status === 401) {
        setError(data.error || "Invalid username or password");
      } else if (res.status === 500) {
        setError(data.error || "Server error");
      } else {
        setError("Login failed");
      }
    } catch (e) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      </div>

      {/* Login Card */}
      <div className="relative bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl w-full max-w-md">
        {/* Mystical border pattern */}
        <div className="absolute inset-2 border border-white/20 rounded-2xl"></div>
        <div className="absolute inset-4 border border-white/10 rounded-xl"></div>
        
        {/* Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Image 
                  src="/assets/favicon.png" 
                  alt="Crypto Carnival Logo" 
                  width={40} 
                  height={40} 
                  className="rounded-lg" 
                />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-purple-300 text-lg">Enter the mystical realm of crypto fortune</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter your username"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-300 font-medium">{error}</span>
              </div>
            </div>
          )}
          {success && (
            <div className="bg-green-500/20 backdrop-blur-md border border-green-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-300 font-medium">{success}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full group relative px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center space-x-2">
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Entering the realm...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Enter the Carnival</span>
                </>
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
          </button>

          {/* Register Link */}
          <div className="text-center">
            <Link 
              href="/register" 
              className="text-purple-300 hover:text-yellow-200 transition-colors duration-300 font-medium"
            >
              Don't have an account? <span className="text-yellow-200 font-semibold">Join the Carnival</span>
            </Link>
          </div>
        </form>

        {/* Mystical corner decorations */}
        <div className="absolute top-4 left-4 text-2xl opacity-30">✦</div>
        <div className="absolute top-4 right-4 text-2xl opacity-30">✦</div>
        <div className="absolute bottom-4 left-4 text-2xl opacity-30">✦</div>
        <div className="absolute bottom-4 right-4 text-2xl opacity-30">✦</div>
      </div>
    </div>
  );
}
