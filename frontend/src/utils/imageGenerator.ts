import { GoogleGenAI } from "@google/genai";

export interface CharacterImage {
  imageUrl: string;
  prompt: string;
}

export async function generateCryptoCharacterImage(symbol: string, characterDescription: string): Promise<CharacterImage> {
  try {
    console.log('🎨 Generating character image for:', symbol);
    console.log('🔑 API Key exists:', !!process.env.NEXT_PUBLIC_GEMINI_API_KEY);
    
    const imagePrompt = createCharacterImagePrompt(symbol, characterDescription);
    console.log('📝 Image prompt:', imagePrompt);
    
    // Try Google GenAI SDK first
    const genaiResult = await tryGoogleGenAI(symbol, imagePrompt);
    if (genaiResult) {
      return genaiResult;
    }
    
    // Fallback to SVG generation
    const characterImage = await generateCharacterWithFallback(symbol, imagePrompt);
    return characterImage;
    
  } catch (error) {
    console.error('❌ Error generating character image:', error);
    
    // Return a fallback SVG image
    const colors = getCharacterColors(symbol);
    const characterEmoji = getCharacterEmoji(symbol);
    const svgDataUrl = createCharacterSVG(characterEmoji, colors.primary, colors.secondary, symbol);
    
    return {
      imageUrl: svgDataUrl,
      prompt: `Cute cartoon character representing ${symbol} cryptocurrency`
    };
  }
}

// Cache for generated images to avoid repeated API calls
const imageCache = new Map<string, CharacterImage>();

// Rate limiter to prevent hitting quota too quickly
let lastImageGeneration = 0;
const MIN_IMAGE_INTERVAL = 60000; // 1 minute between image generations

async function tryGoogleGenAI(symbol: string, prompt: string): Promise<CharacterImage | null> {
  try {
    // Check cache first
    const cacheKey = `${symbol}-${prompt.slice(0, 50)}`;
    if (imageCache.has(cacheKey)) {
      console.log('🎯 Using cached image for:', symbol);
      return imageCache.get(cacheKey)!;
    }

    // Check rate limit
    const now = Date.now();
    if (now - lastImageGeneration < MIN_IMAGE_INTERVAL) {
      console.log('⏰ Rate limited - too soon since last image generation');
      return null;
    }

    console.log('🤖 Trying Google GenAI SDK for image generation...');
    lastImageGeneration = now;
    
    const ai = new GoogleGenAI({
      apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: prompt,
    });

    console.log('📥 Google GenAI response:', response);

    if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          const imageUrl = `data:image/png;base64,${imageData}`;
          
          const result = {
            imageUrl,
            prompt: prompt
          };
          
          // Cache the result
          imageCache.set(cacheKey, result);
          
          console.log('✅ Image generated successfully with Google GenAI!');
          return result;
        }
      }
    }
    
    console.log('❌ No image data found in Google GenAI response');
    return null;
    
  } catch (error) {
    console.error('❌ Google GenAI error:', error);
    
    // Check if it's a quota error
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as any).message;
      if (errorMessage.includes('quota') || errorMessage.includes('429')) {
        console.log('⚠️ Image generation quota exceeded - this is normal for free tier');
        console.log('💡 Consider upgrading to a paid plan for more image generation');
      }
    }
    
    return null;
  }
}

async function generateCharacterWithFallback(symbol: string, prompt: string): Promise<CharacterImage> {
  // Fallback: Create a data URL with emoji and colors
  const colors = getCharacterColors(symbol);
  const characterEmoji = getCharacterEmoji(symbol);
  
  // Create a simple SVG data URL instead of relying on external service
  const svgDataUrl = createCharacterSVG(characterEmoji, colors.primary, colors.secondary, symbol);
  
  return {
    imageUrl: svgDataUrl,
    prompt: prompt
  };
}


function getCharacterColors(symbol: string): { primary: string; secondary: string } {
  if (symbol.includes('BTC') || symbol.includes('Bitcoin')) {
    return { primary: 'FFD700', secondary: '000000' }; // Gold and black
  } else if (symbol.includes('ETH') || symbol.includes('Ethereum')) {
    return { primary: '627EEA', secondary: 'FFFFFF' }; // Blue and white
  } else if (symbol.includes('ADA') || symbol.includes('Cardano')) {
    return { primary: '0033AD', secondary: 'FFFFFF' }; // Blue and white
  } else if (symbol.includes('SOL') || symbol.includes('Solana')) {
    return { primary: '9945FF', secondary: 'FFFFFF' }; // Purple and white
  } else {
    return { primary: '4F46E5', secondary: 'FFFFFF' }; // Default purple and white
  }
}

function getCharacterEmoji(symbol: string): string {
  if (symbol.includes('BTC') || symbol.includes('Bitcoin')) {
    return '👑'; // Crown for Bitcoin
  } else if (symbol.includes('ETH') || symbol.includes('Ethereum')) {
    return '⚡'; // Lightning for Ethereum
  } else if (symbol.includes('ADA') || symbol.includes('Cardano')) {
    return '🔬'; // Microscope for Cardano
  } else if (symbol.includes('SOL') || symbol.includes('Solana')) {
    return '🚀'; // Rocket for Solana
  } else {
    return '💎'; // Diamond for others
  }
}

function getCharacterSymbol(symbol: string): string {
  // Fallback symbols that work with btoa
  if (symbol.includes('BTC') || symbol.includes('Bitcoin')) {
    return 'B'; // B for Bitcoin
  } else if (symbol.includes('ETH') || symbol.includes('Ethereum')) {
    return 'E'; // E for Ethereum
  } else if (symbol.includes('ADA') || symbol.includes('Cardano')) {
    return 'A'; // A for Cardano
  } else if (symbol.includes('SOL') || symbol.includes('Solana')) {
    return 'S'; // S for Solana
  } else {
    return symbol.charAt(0); // First letter of symbol
  }
}

function createCharacterSVG(emoji: string, primaryColor: string, secondaryColor: string, symbol?: string): string {
  try {
    const svg = `
      <svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#${primaryColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:#${secondaryColor};stop-opacity:1" />
          </linearGradient>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.3)"/>
          </filter>
        </defs>
        <rect width="400" height="400" fill="url(#bg)" rx="20"/>
        <circle cx="200" cy="200" r="120" fill="rgba(255,255,255,0.2)" rx="60"/>
        <text x="200" y="220" font-family="Arial, sans-serif" font-size="80" text-anchor="middle" fill="white" filter="url(#shadow)">${emoji}</text>
      </svg>
    `;
    
    // Use proper UTF-8 to base64 conversion for emoji characters
    const utf8Bytes = new TextEncoder().encode(svg);
    const base64 = btoa(String.fromCharCode(...utf8Bytes));
    
    return `data:image/svg+xml;base64,${base64}`;
  } catch (error) {
    console.error('❌ Error creating SVG with emoji, using fallback:', error);
    
    // Fallback: Create SVG without emoji
    const fallbackSymbol = getCharacterSymbol(symbol || 'C'); // Use the symbol instead of emoji
    const svg = `
      <svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#${primaryColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:#${secondaryColor};stop-opacity:1" />
          </linearGradient>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.3)"/>
          </filter>
        </defs>
        <rect width="400" height="400" fill="url(#bg)" rx="20"/>
        <circle cx="200" cy="200" r="120" fill="rgba(255,255,255,0.2)" rx="60"/>
        <text x="200" y="220" font-family="Arial, sans-serif" font-size="80" text-anchor="middle" fill="white" filter="url(#shadow)">${fallbackSymbol}</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }
}

function createCharacterImagePrompt(symbol: string, characterDescription: string): string {
  // Extract key characteristics from the description to create a visual prompt
  const basePrompt = `A cute, friendly cartoon character representing ${symbol} cryptocurrency. `;
  
  // Add character traits based on common crypto characteristics
  let visualTraits = '';
  
  if (symbol.includes('BTC') || symbol.includes('Bitcoin')) {
    visualTraits = 'Golden color scheme, wise and ancient looking, like a digital king or wizard with a crown made of binary code. ';
  } else if (symbol.includes('ETH') || symbol.includes('Ethereum')) {
    visualTraits = 'Blue and purple color scheme, smart and creative looking, like a digital inventor with tools and gears. ';
  } else if (symbol.includes('ADA') || symbol.includes('Cardano')) {
    visualTraits = 'Green and white color scheme, peaceful and scientific looking, like a digital monk or scientist. ';
  } else if (symbol.includes('SOL') || symbol.includes('Solana')) {
    visualTraits = 'Orange and yellow color scheme, fast and energetic looking, like a digital speedster or athlete. ';
  } else if (symbol.includes('DOT') || symbol.includes('Polkadot')) {
    visualTraits = 'Pink and purple color scheme, connected and network-like, like a digital spider or web weaver. ';
  } else if (symbol.includes('MATIC') || symbol.includes('Polygon')) {
    visualTraits = 'Purple and blue color scheme, geometric and structured, like a digital architect or builder. ';
  } else {
    // Generic character traits
    visualTraits = 'Colorful and friendly looking, like a digital collectible toy or carnival prize. ';
  }
  
  const stylePrompt = 'Cartoon style, 3D rendered, cute and appealing to children, high quality, detailed, vibrant colors, friendly expression, standing pose, digital art style.';
  
  return basePrompt + visualTraits + stylePrompt;
}

// Alternative function using a more direct approach
export async function generateCryptoCharacterImageDirect(symbol: string): Promise<CharacterImage> {
  try {
    console.log('🎨 Generating character image directly for:', symbol);
    
    // Create a simple, direct prompt
    const imagePrompt = `A cute cartoon character representing ${symbol} cryptocurrency. Friendly, colorful, appealing to children, 3D rendered, digital art style, standing pose, high quality.`;
    
    // This would be the actual Imagen API call
    // For now, we'll return a placeholder
    return {
      imageUrl: `https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=${symbol}`,
      prompt: imagePrompt
    };
    
  } catch (error) {
    console.error('❌ Error generating character image:', error);
    
    return {
      imageUrl: `https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=${symbol}`,
      prompt: `Cute cartoon character representing ${symbol} cryptocurrency`
    };
  }
}
