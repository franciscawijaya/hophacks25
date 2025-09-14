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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {resolvedParams.symbol} data...</p>
          <p className="text-sm text-gray-500 mt-2">Fetching information from AI...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h3 className="font-bold">Error Loading Data</h3>
            <p className="text-sm">{error}</p>
          </div>
          <button 
            onClick={fetchCryptoData}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {resolvedParams.symbol}
            </h1>
            <p className="text-gray-600">
              Cryptocurrency information and character details
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description Section */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start space-x-6 mb-6">
                  {/* Character Image */}
                  <div className="flex-shrink-0">
                    {cryptoInfo?.characterImage ? (
                      <div className="relative">
                        <img
                          src={cryptoInfo.characterImage.imageUrl}
                          alt={`${resolvedParams.symbol} character`}
                          className="w-32 h-32 rounded-lg object-cover border-4 border-purple-200 shadow-lg"
                        />
                        {cryptoInfo.characterImage.imageUrl.startsWith('data:image/svg') && (
                          <div className="absolute -top-2 -right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full border border-yellow-300">
                            SVG
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-4xl font-bold border-4 border-purple-200 shadow-lg">
                        {resolvedParams.symbol.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  {/* Character Info */}
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      Meet {resolvedParams.symbol}!
                    </h2>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                      <span>AI Generated Character</span>
                      {cryptoInfo?.characterImage?.imageUrl.startsWith('data:image/svg') && (
                        <span className="text-yellow-600 text-xs">
                          (Free tier - using SVG fallback)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="prose max-w-none">
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {cryptoInfo?.description || `Learn about ${resolvedParams.symbol}, a prominent cryptocurrency in the digital asset space.`}
                  </p>
                  
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Context & History</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {cryptoInfo?.context || `${resolvedParams.symbol} has established itself as a significant player in the cryptocurrency market.`}
                  </p>

                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Key Features</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
                    {cryptoInfo?.keyFeatures?.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    )) || (
                      <>
                        <li>Advanced blockchain technology</li>
                        <li>Decentralized network</li>
                        <li>Secure transactions</li>
                        <li>Community governance</li>
                      </>
                    )}
                  </ul>

                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Market Position</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {cryptoInfo?.marketPosition || `${resolvedParams.symbol} holds a significant position in the cryptocurrency market.`}
                  </p>
                </div>
              </div>

            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <QuickStats symbol={resolvedParams.symbol} />

              {/* Relevant News */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Relevant News
                </h3>
                {loadingNews ? (
                  <div className="space-y-3">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                ) : news.length > 0 ? (
                  <div className="space-y-4">
                    {news.map((item, index) => (
                      <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-900 leading-tight flex-1 mr-2">
                            {item.title}
                          </h4>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                            item.sentiment === 'positive' 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}>
                            <span className="mr-1">{item.sentiment === 'positive' ? '📈' : '📉'}</span>
                            {item.sentiment}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                          {item.summary}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="font-medium">{item.source}</span>
                          {item.url && item.url !== "#" && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Read more →
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No news available at the moment.</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Link
                    href={`/chart?symbol=${resolvedParams.symbol}`}
                    className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Chart
                  </Link>
                  <button className="block w-full bg-gray-200 text-gray-700 text-center py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                    Add to Watchlist
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
