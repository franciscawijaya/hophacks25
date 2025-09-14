"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const usernameTrimmed = username.trim();
    const usernameRegex = /^[a-zA-Z0-9_.@-]{3,20}$/;
    if (!usernameRegex.test(usernameTrimmed)) {
      setError("Username must be 3-20 characters and only contain letters, numbers, _ . @ -");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(BACKEND_URL + "/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.status === 201) {
        setSuccess("Registration successful! Redirecting to login...");
        setError("");
        setTimeout(() => router.push("/login"), 1500);
      } else if (res.status === 400) {
        setError(data.error || "Username and password required");
      } else if (res.status === 409) {
        setError(data.error || "Username already exists");
      } else if (res.status === 500) {
        setError(data.error || "Server error");
      } else {
        setError("Registration failed");
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

      {/* Register Card */}
      <div className="relative bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl w-full max-w-md">
        {/* Mystical border pattern */}
        <div className="absolute inset-2 border border-white/20 rounded-2xl"></div>
        <div className="absolute inset-4 border border-white/10 rounded-xl"></div>
        
        {/* Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-emerald-200 to-teal-200 bg-clip-text text-transparent mb-2">
            Join the Carnival
          </h1>
          <p className="text-emerald-300 text-lg">Begin your mystical crypto journey</p>
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
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                placeholder="Choose your mystical name"
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
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                placeholder="Create your secret key"
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
            className="w-full group relative px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center space-x-2">
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Creating your account...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>Join the Carnival</span>
                </>
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
          </button>

          {/* Login Link */}
          <div className="text-center">
            <Link 
              href="/login" 
              className="text-emerald-300 hover:text-yellow-200 transition-colors duration-300 font-medium"
            >
              Already have an account? <span className="text-yellow-200 font-semibold">Enter the Carnival</span>
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
