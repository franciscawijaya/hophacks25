import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateCryptoCharacterImage, CharacterImage } from './imageGenerator';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export interface CryptoInfo {
  description: string;
  context: string;
  keyFeatures: string[];
  marketPosition: string;
  characterImage?: CharacterImage;
}

export async function getCryptoInfo(symbol: string): Promise<CryptoInfo> {
  try {
    console.log('Fetching crypto info for:', symbol);
    console.log('API Key exists:', !!process.env.NEXT_PUBLIC_GEMINI_API_KEY);
    
    // Get AI description and generate character image
    const aiData = await getAICryptoInfo(symbol);
    const characterImage = await generateCryptoCharacterImage(symbol, aiData.description);
    
    return {
      ...aiData,
      characterImage
    };
    
  } catch (error) {
    console.error('Error fetching crypto info:', error);
    
    // Return fallback data with character image
    const characterImage = await generateCryptoCharacterImage(symbol, `Meet ${symbol}, the digital character!`);
    
    return {
      description: `Meet ${symbol}, the digital character! ${symbol} is like a special carnival prize that lives in the computer world. It has its own unique personality and special powers that make it different from all the other digital characters. People love collecting ${symbol} because it's rare and valuable, just like a special trading card or toy!`,
      context: `${symbol} was born when someone special created it to be a new kind of digital character. It started small but grew bigger and more popular over time, like a character in your favorite cartoon that everyone starts to love!`,
      keyFeatures: [
        `${symbol} has the power to live on computers`,
        `${symbol} can't be controlled by just one person`,
        `${symbol} is super strong and hard to break`,
        `${symbol} can be friends with people all around the world`
      ],
      marketPosition: `${symbol} is one of the popular characters in the digital world! It's like being one of the cool kids that everyone knows and wants to be friends with.`,
      characterImage
    };
  }
}

async function getAICryptoInfo(symbol: string): Promise<Omit<CryptoInfo, 'characterImage'>> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Create a concise analysis of the cryptocurrency ${symbol} with a fun character description for the description field, while keeping other fields brief but informative.
    
    Format your response as a JSON object with the following structure:
    {
      "description": "Describe ${symbol} as a character with its own personality encompassing both its positive and negative traits! What does it look like? What's its special power? What makes it unique and exciting? Write 1 paragraph like you're introducing a new cartoon character that a 10-year-old would understand!",
      "context": "Provide a brief historical overview of ${symbol} in 2-3 sentences. Include when it was created, by whom, and its main purpose. Keep it concise but informative.",
      "keyFeatures": [
        "List 3-4 unique features that make ${symbol} different from other cryptocurrencies",
        "Format each feature as: 'Short description: Longer explanation'",
        "Focus on what makes ${symbol} special and distinctive",
        "Keep explanations concise but informative"
      ],
      "marketPosition": "In 1-2 sentences, provide a professional analysis of ${symbol}'s current market standing, including market capitalization ranking, trading volume, adoption rate, and competitive position within the cryptocurrency ecosystem."
    }
    
    Remember: Keep all responses concise and focused. Only the description should be fun and child-friendly. All other fields should be brief but informative.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('📝 Gemini response:', text);

    // Try to parse JSON from the response
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsedData = JSON.parse(jsonStr);
        console.log('✅ Successfully parsed Gemini response:', parsedData);
        return parsedData;
      }
    } catch (parseError) {
      console.error('❌ Failed to parse JSON from Gemini response:', parseError);
      console.error('Raw response:', text);
    }

    // Fallback if JSON parsing fails
    return {
      description: `Meet ${symbol}, the digital character! ${symbol} is like a special carnival prize that lives in the computer world. It has its own unique personality and special powers that make it different from all the other digital characters. People love collecting ${symbol} because it's rare and valuable, just like a special trading card or toy!`,
      context: `${symbol} was born when someone special created it to be a new kind of digital character. It started small but grew bigger and more popular over time, like a character in your favorite cartoon that everyone starts to love!`,
      keyFeatures: [
        `${symbol} has the power to live on computers`,
        `${symbol} can't be controlled by just one person`,
        `${symbol} is super strong and hard to break`,
        `${symbol} can be friends with people all around the world`
      ],
      marketPosition: `${symbol} is one of the popular characters in the digital world! It's like being one of the cool kids that everyone knows and wants to be friends with.`
    };

  } catch (error) {
    console.error('❌ Error fetching AI crypto info:', error);
    
    // Return fallback data
    return {
      description: `Meet ${symbol}, the digital character! ${symbol} is like a special carnival prize that lives in the computer world. It has its own unique personality and special powers that make it different from all the other digital characters. People love collecting ${symbol} because it's rare and valuable, just like a special trading card or toy!`,
      context: `${symbol} was born when someone special created it to be a new kind of digital character. It started small but grew bigger and more popular over time, like a character in your favorite cartoon that everyone starts to love!`,
      keyFeatures: [
        `${symbol} has the power to live on computers`,
        `${symbol} can't be controlled by just one person`,
        `${symbol} is super strong and hard to break`,
        `${symbol} can be friends with people all around the world`
      ],
      marketPosition: `${symbol} is one of the popular characters in the digital world! It's like being one of the cool kids that everyone knows and wants to be friends with.`
    };
  }
}

