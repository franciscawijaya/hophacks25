# News API Setup Guide

To enable real cryptocurrency news fetching, you need to set up a NewsAPI key.

## Steps to Get NewsAPI Key

1. **Visit NewsAPI**: Go to [https://newsapi.org/](https://newsapi.org/)
2. **Sign Up**: Create a free account
3. **Get API Key**: Copy your API key from the dashboard
4. **Add to Environment**: Add the key to your `.env.local` file

## Environment Variable Setup

Add this line to your `frontend/.env.local` file:

```bash
NEXT_PUBLIC_NEWS_API_KEY=your_news_api_key_here
```

## Free Tier Limits

- **1000 requests per day** (free tier)
- **Articles from last 30 days only**
- **Rate limit**: 1000 requests per day

## Fallback Behavior

If no NewsAPI key is provided or if the API fails:
- The app will show fallback news items
- These are generic news items about the cryptocurrency
- Sentiment analysis will still work using Gemini

## Testing

To test if the NewsAPI is working:
1. Check the browser console for logs starting with "📰"
2. Look for "Found X articles from NewsAPI" message
3. If you see "NewsAPI key not found", add the environment variable

## Troubleshooting

- **CORS Issues**: NewsAPI should work from the frontend, but if you encounter CORS issues, you may need to proxy requests through your backend
- **Rate Limiting**: If you exceed the free tier limits, the app will fall back to generic news
- **No Articles**: If no articles are found for a specific cryptocurrency, fallback news will be shown
