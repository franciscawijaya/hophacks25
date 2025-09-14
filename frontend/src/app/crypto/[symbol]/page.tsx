"use client";

import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { getCryptoInfo, CryptoInfo } from "@/utils/gemini";
import QuickStats from "@/app/components/QuickStats";
import { GoogleGenerativeAI } from '@google/generative-ai';

interface CryptoPageProps {
  params: Promise<{
    symbol: string;
  }>;
}

export default function CryptoPage({ params }: CryptoPageProps) {
  const resolvedParams = use(params);
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [cryptoInfo, setCryptoInfo] = useState<CryptoInfo | null>(null);
  const [news, setNews] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingNews, setLoadingNews] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fallback function to extract news from text when JSON parsing fails
  const extractNewsFromText = (text: string) => {
    const newsItems = [];
    
    // Try to find news items using various patterns
    const patterns = [
      // Pattern 1: Look for title, summary, source, url, sentiment structure
      /title[:\s]*["']?([^"'\n]+)["']?[\s\S]*?summary[:\s]*["']?([^"'\n]+)["']?[\s\S]*?source[:\s]*["']?([^"'\n]+)["']?[\s\S]*?url[:\s]*["']?([^"'\n]+)["']?[\s\S]*?sentiment[:\s]*["']?([^"'\n]+)["']?/gi,
      // Pattern 2: Look for numbered lists or bullet points
      /\d+\.\s*([^.\n]+)[\s\S]*?summary[:\s]*([^.\n]+)[\s\S]*?source[:\s]*([^.\n]+)[\s\S]*?sentiment[:\s]*([^.\n]+)/gi,
      // Pattern 3: Simple title extraction
      /(?:title|headline)[:\s]*["']?([^"'\n]+)["']?/gi
    ];
    
    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        for (const match of matches) {
          if (match.length >= 2) {
            newsItems.push({
              title: match[1]?.trim() || 'News Article',
              summary: match[2]?.trim() || 'No summary available',
              source: match[3]?.trim() || 'Unknown Source',
              url: match[4]?.trim() || '#',
              sentiment: match[5]?.trim()?.toLowerCase() || 'neutral'
            });
          }
        }
        break; // Use the first pattern that finds matches
      }
    }
    
    // If no structured patterns work, try to extract any text that looks like news
    if (newsItems.length === 0) {
      const lines = text.split('\n').filter(line => line.trim().length > 10);
      if (lines.length > 0) {
        newsItems.push({
          title: lines[0].trim(),
          summary: lines[1]?.trim() || 'No summary available',
          source: 'AI Generated',
          url: '#',
          sentiment: 'neutral'
        });
      }
    }
    
    return newsItems.slice(0, 2); // Limit to 2 items
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated && resolvedParams.symbol) {
      fetchCryptoData();
      fetchNews();
    }
  }, [isAuthenticated, resolvedParams.symbol]);

  const fetchCryptoData = async () => {
    try {
      console.log('🚀 Starting to fetch crypto data for:', resolvedParams.symbol);
      setLoadingData(true);
      setError(null);
      const data = await getCryptoInfo(resolvedParams.symbol);
      console.log('📊 Received crypto data:', data);
      console.log('🎨 Character image:', data.characterImage);
      console.log('🖼️ Image URL:', data.characterImage?.imageUrl);
      setCryptoInfo(data);
    } catch (err) {
      console.error('❌ Error fetching crypto data:', err);
      setError('Failed to load cryptocurrency information. Please try again.');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchNews = async () => {
    try {
      setLoadingNews(true);
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `List 1-2 recent news about ${resolvedParams.symbol} and determine sentiment for each article.

IMPORTANT: Respond ONLY with valid JSON. Use double quotes for all property names and string values. No single quotes allowed.

Required JSON format:
[
  {
    "title": "News headline about ${resolvedParams.symbol}",
    "summary": "Brief summary of the news",
    "source": "News source name", 
    "url": "https://example.com/news-article",
    "sentiment": "positive"
  }
]

Rules:
- Use only double quotes (") not single quotes (')
- Ensure all property names are in double quotes
- Ensure all string values are in double quotes
- No trailing commas
- Valid JSON syntax only`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('📰 Gemini news response:', text);

      // Try to parse JSON from the response
      try {
        // First, try to find JSON array in the response
        const jsonMatch = text.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          let jsonStr = jsonMatch[0];
          console.log('🔍 Original JSON match:', jsonStr);
          
          // More comprehensive JSON cleaning
          jsonStr = jsonStr
            // Fix property names (handle various cases)
            .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
            // Fix string values (handle both single and mixed quotes)
            .replace(/:\s*'([^']*)'/g, ': "$1"')
            .replace(/:\s*"([^"]*)"\s*([,}])/g, ': "$1"$2')
            // Fix array strings
            .replace(/\[\s*'([^']*)'\s*\]/g, '["$1"]')
            // Remove trailing commas
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
            // Fix any remaining single quotes in strings
            .replace(/"([^"]*)'([^"]*)"/g, '"$1\'$2"')
            // Clean up any malformed quotes
            .replace(/'([^']*)'/g, '"$1"')
            // Fix any double quotes that got messed up
            .replace(/""/g, '"')
            // Remove any control characters that might break JSON
            .replace(/[\x00-\x1F\x7F]/g, '');
          
          console.log('🔧 Cleaned JSON string:', jsonStr);
          
          // Try to parse the cleaned JSON
          const parsedData = JSON.parse(jsonStr);
          console.log('✅ Successfully parsed news response:', parsedData);
          setNews(parsedData);
        } else {
          console.warn('⚠️ No JSON array found in response');
          console.log('📝 Full response text:', text);
          setNews([]);
        }
      } catch (parseError) {
        console.error('❌ Failed to parse JSON from news response:', parseError);
        console.error('Raw response:', text);
        console.error('JSON match found:', text.match(/\[[\s\S]*?\]/)?.[0]);
        
        // Fallback: try to extract news items manually
        try {
          const fallbackNews = extractNewsFromText(text);
          if (fallbackNews.length > 0) {
            console.log('🔄 Using fallback news extraction:', fallbackNews);
            setNews(fallbackNews);
          } else {
            setNews([]);
          }
        } catch (fallbackError) {
          console.error('❌ Fallback extraction also failed:', fallbackError);
          setNews([]);
        }
      }
    } catch (err) {
      console.error('❌ Error fetching news:', err);
      setNews([]);
    } finally {
      setLoadingNews(false);
    }
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
          <h2 className="text-2xl font-bold text-white mb-2">Loading Your Dashboard</h2>
          <p className="text-purple-200">Preparing your trading environment...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loadingData) {
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
          <h2 className="text-2xl font-bold text-white mb-2">Loading {resolvedParams.symbol} Data</h2>
          <p className="text-purple-200">Fetching information from AI...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        </div>
        
        <div className="text-center max-w-md mx-auto relative z-10">
          <div className="bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-300 px-8 py-6 rounded-2xl mb-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Error Loading Data</h3>
            <p className="text-sm text-red-200">{error}</p>
          </div>
          <button 
            onClick={fetchCryptoData}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Try Again</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>
    );
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <Link 
              href="/"
              className="group inline-flex items-center text-purple-300 hover:text-white mb-6 transition-colors duration-300"
            >
              <svg className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">
                  {resolvedParams.symbol.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                  {resolvedParams.symbol}
                </h1>
                <p className="text-purple-300 text-lg">
                  Cryptocurrency information and character details
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description Section */}
              <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl">
                <div className="flex items-start space-x-8 mb-8">
                  {/* Character Image */}
                  <div className="flex-shrink-0">
                    {cryptoInfo?.characterImage ? (
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                        <img
                          src={cryptoInfo.characterImage.imageUrl}
                          alt={`${resolvedParams.symbol} character`}
                          className="relative w-40 h-40 rounded-2xl object-cover border-2 border-white/20 shadow-2xl group-hover:scale-105 transition-transform duration-300"
                        />
                        {cryptoInfo.characterImage.imageUrl.startsWith('data:image/svg') && (
                          <div className="absolute -top-2 -right-2 bg-yellow-500/20 backdrop-blur-md text-yellow-300 text-xs px-3 py-1 rounded-full border border-yellow-500/30">
                            SVG
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                        <div className="relative w-40 h-40 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-5xl font-bold border-2 border-white/20 shadow-2xl group-hover:scale-105 transition-transform duration-300">
                          {resolvedParams.symbol.charAt(0)}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Character Info */}
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-white mb-3">
                      Meet {resolvedParams.symbol}!
                    </h2>
                    <div className="flex items-center space-x-3 text-sm text-purple-200">
                      <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                      <span>AI Generated Character</span>
                      {cryptoInfo?.characterImage?.imageUrl.startsWith('data:image/svg') && (
                        <span className="text-yellow-300 text-xs bg-yellow-500/20 px-2 py-1 rounded-full border border-yellow-500/30">
                          (Free tier - using SVG fallback)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-8">
                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-md rounded-2xl p-6 border border-blue-500/20">
                    <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      Overview
                    </h3>
                    <p className="text-purple-200 leading-relaxed">
                      {cryptoInfo?.description || `Learn about ${resolvedParams.symbol}, a prominent cryptocurrency in the digital asset space.`}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-md rounded-2xl p-6 border border-green-500/20">
                    <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      Context & History
                    </h3>
                    <p className="text-green-200 leading-relaxed">
                      {cryptoInfo?.context || `${resolvedParams.symbol} has established itself as a significant player in the cryptocurrency market.`}
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 backdrop-blur-md rounded-2xl p-6 border border-orange-500/20">
                    <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      Key Features
                    </h3>
                    <ul className="space-y-2">
                      {cryptoInfo?.keyFeatures?.map((feature, index) => (
                        <li key={index} className="flex items-center text-orange-200">
                          <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                          {feature}
                        </li>
                      )) || (
                        <>
                          <li className="flex items-center text-orange-200">
                            <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                            Advanced blockchain technology
                          </li>
                          <li className="flex items-center text-orange-200">
                            <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                            Decentralized network
                          </li>
                          <li className="flex items-center text-orange-200">
                            <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                            Secure transactions
                          </li>
                          <li className="flex items-center text-orange-200">
                            <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                            Community governance
                          </li>
                        </>
                      )}
                    </ul>
                  </div>

                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-md rounded-2xl p-6 border border-purple-500/20">
                    <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      Market Position
                    </h3>
                    <p className="text-purple-200 leading-relaxed">
                      {cryptoInfo?.marketPosition || `${resolvedParams.symbol} holds a significant position in the cryptocurrency market.`}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Quick Stats */}
              <QuickStats symbol={resolvedParams.symbol} />

              {/* Relevant News */}
              <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-2xl">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Relevant News</h3>
                    <p className="text-cyan-200 text-sm">Latest market updates</p>
                  </div>
                </div>
                
                {loadingNews ? (
                  <div className="space-y-4">
                    <div className="animate-pulse">
                      <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-white/20 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-white/20 rounded w-1/4"></div>
                    </div>
                    <div className="animate-pulse">
                      <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-white/20 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-white/20 rounded w-1/4"></div>
                    </div>
                  </div>
                ) : news.length > 0 ? (
                  <div className="space-y-4">
                    {news.map((item, index) => (
                      <div key={index} className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-sm font-semibold text-white leading-tight flex-1 mr-3">
                            {item.title}
                          </h4>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                            item.sentiment === 'positive' 
                              ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                              : 'bg-red-500/20 text-red-300 border-red-500/30'
                          }`}>
                            <span className="mr-1">{item.sentiment === 'positive' ? '📈' : '📉'}</span>
                            {item.sentiment}
                          </div>
                        </div>
                        
                        <p className="text-sm text-purple-200 mb-3 leading-relaxed">
                          {item.summary}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-purple-300">
                          <span className="font-medium">{item.source}</span>
                          {item.url && item.url !== "#" && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-300 hover:text-cyan-200 transition-colors"
                            >
                              Read more →
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                    <p className="text-purple-300">No news available at the moment.</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-2xl">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Quick Actions</h3>
                    <p className="text-purple-200 text-sm">Trading tools & analysis</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Link
                    href={`/chart?symbol=${resolvedParams.symbol}`}
                    className="group block w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-center py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>View Chart</span>
                    </div>
                  </Link>
                  
                  <button className="group block w-full bg-white/10 backdrop-blur-md text-white text-center py-3 px-6 rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add to Watchlist</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
