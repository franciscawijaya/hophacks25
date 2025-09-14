"use client";

import { NewsItem } from "@/utils/gemini";

interface NewsListProps {
  news: NewsItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function NewsList({ news, loading, error, onRetry }: NewsListProps) {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '📈';
      case 'negative':
        return '📉';
      default:
        return '📊';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Latest News
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Latest News
        </h3>
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Latest News
      </h3>
      <div className="space-y-4">
        {news.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No news available at the moment.</p>
        ) : (
          news.map((item, index) => {
            const isClickable = item.url && item.url !== "#";
            
            const NewsContent = () => (
              <>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 leading-tight flex-1 mr-2">
                    {item.title}
                  </h4>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSentimentColor(item.sentiment)}`}>
                    <span className="mr-1">{getSentimentIcon(item.sentiment)}</span>
                    {item.sentiment}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                  {item.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-medium">{item.source}</span>
                  <span>{formatDate(item.publishedAt)}</span>
                </div>
                
                {isClickable && (
                  <div className="inline-flex items-center text-blue-600 text-xs mt-2">
                    <span>Click to read full article</span>
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                )}
              </>
            );

            return (
              <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                {isClickable ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors duration-200 group"
                  >
                    <NewsContent />
                  </a>
                ) : (
                  <div className="p-2 -m-2">
                    <NewsContent />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
