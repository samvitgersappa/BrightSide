import OpenAI from 'openai';

// OpenAI configuration file
const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;

interface OpenAIError {
  error?: {
    message: string;
    type: string;
    code: string;
  };
  message?: string;
}

export const configureOpenAI = () => {
  if (!OPENAI_KEY) {
    console.error('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your environment variables.');
    return null;
  }
  
  return new OpenAI({
    apiKey: OPENAI_KEY,
    dangerouslyAllowBrowser: true // Note: In production, you should use a backend proxy
  });
};

export const generateChatCompletion = async (
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  temperature = 0.7
) => {
  const openai = configureOpenAI();
  if (!openai) {
    throw new Error('Failed to initialize OpenAI client. Please check your API key.');
  }

  // Models to try in order of preference - only use chat-compatible models
  const models = ['gpt-3.5-turbo', 'gpt-3.5-turbo-0125'];
  let lastError: Error | null = null;

  // Try each model until one works
  for (const model of models) {
    try {
      const response = await openai.chat.completions.create({
        model: model,
        messages,
        temperature,
        max_tokens: 800, // Reasonable token limit
        presence_penalty: 0.1, // Slightly encourage new topics
        frequency_penalty: 0.1, // Slightly discourage repetition
      });

      return response.choices[0].message;
    } catch (error) {
      const openAIError = error as OpenAIError;
      const errorMessage = openAIError.error?.message || openAIError.message || 'Unknown error occurred';
      console.error(`Error with model ${model}:`, {
        message: errorMessage,
        type: openAIError.error?.type,
        code: openAIError.error?.code
      });
      lastError = new Error(errorMessage);
      
      // If this is a rate limit or token quota error, don't try other models
      if (openAIError.error?.code === 'rate_limit_exceeded' || 
          openAIError.error?.message?.includes('quota') ||
          openAIError.error?.message?.includes('capacity')) {
        throw lastError;
      }
      // Otherwise continue to the next model
    }
  }

  // If we've tried all models and none worked
  throw lastError || new Error('All available models failed to generate a response.');
};

export default configureOpenAI;