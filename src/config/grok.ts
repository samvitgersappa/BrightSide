import OpenAI from 'openai';

// Groq API configuration
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// Available models from Groq
const GROQ_MODELS = {
  primary: 'llama3-8b-8192', // Fast and efficient
  fallback: 'mixtral-8x7b-32768' // More powerful but could be slower
};

interface AIError {
  error?: {
    message: string;
    type: string;
    code: string;
  };
  message?: string;
}

/**
 * Configure the OpenAI client to use Groq API
 */
export const configureGroq = () => {
  if (!GROQ_API_KEY) {
    console.error('Groq API key not found. Please add VITE_GROQ_API_KEY to your environment variables.');
    return null;
  }
  
  return new OpenAI({
    apiKey: GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
    dangerouslyAllowBrowser: true // For client-side usage
  });
};

/**
 * Generate a chat completion using the Groq API via OpenAI client
 */
export const generateChatCompletion = async (
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  temperature = 0.7
) => {
  const client = configureGroq();
  if (!client) {
    throw new Error('Failed to initialize Groq client. Please check your API key.');
  }

  try {
    const response = await client.chat.completions.create({
      model: GROQ_MODELS.primary,
      messages,
      temperature,
      max_tokens: 800,
      top_p: 0.9,
    });

    return response.choices[0].message;
  } catch (error) {
    const aiError = error as AIError;
    const errorMessage = aiError.error?.message || aiError.message || 'Unknown error occurred';
    console.error('Error generating chat completion with Groq:', {
      message: errorMessage,
      error
    });
    throw new Error(errorMessage);
  }
};

/**
 * Handles fallbacks and retries if the main model fails
 */
export const generateGrokCompletion = async (
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  temperature = 0.7
) => {
  try {
    return await generateChatCompletion(messages, temperature);
  } catch (error) {
    console.error('Error with primary Groq model, trying fallback model...');
    
    const client = configureGroq();
    if (!client) {
      throw new Error('Failed to initialize Groq client for fallback. Please check your API key.');
    }
    
    try {
      // Try with the fallback model
      const response = await client.chat.completions.create({
        model: GROQ_MODELS.fallback,
        messages,
        temperature,
        max_tokens: 500,
        top_p: 0.85,
      });

      return response.choices[0].message;
    } catch (secondError) {
      console.error('Fallback Groq model also failed:', secondError);
      throw new Error('All available Groq models failed to generate a response.');
    }
  }
};

export default generateGrokCompletion;