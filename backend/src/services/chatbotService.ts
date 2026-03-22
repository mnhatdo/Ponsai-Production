import axios from 'axios';

/**
 * Chatbot Service using Groq API
 * Provides AI-powered customer support responses
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile'; // Updated to current supported model

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  success: boolean;
  message: string;
  conversationId?: string;
}

// System prompt with comprehensive knowledge about Furni e-commerce
const SYSTEM_PROMPT = `You are an AI customer support assistant for Furni (Ponsai) - a Vietnamese e-commerce platform specializing in bonsai trees, furniture, and home decor.

KEY INFORMATION:
- Business: E-commerce platform for Vietnamese bonsai, furniture, and accessories
- Languages: Vietnamese (primary) and English
- Payment methods: MoMo, Bank Transfer (UK account), Credit/Debit Card
- Shipping: Domestic Vietnam + International (40+ countries)

SHIPPING FEES:
Vietnam:
- Thu Duc district: FREE
- HCMC: 20,000đ
- Provinces: 40,000đ - 100,000đ

International:
- Southeast Asia: 180,000đ - 220,000đ
- Asia Pacific: 230,000đ - 280,000đ
- Americas: 450,000đ - 550,000đ
- Europe: 450,000đ
- Oceania: 500,000đ
- Other: 400,000đ

FEATURES:
- Product reviews with verified purchases
- Promotion codes support
- Multiple payment methods
- Google Sign-In authentication
- Order tracking
- Profile management

POLICIES:
- Returns: 7 days for defective/wrong items
- Refunds: 3-14 days depending on payment method
- Free shipping for Thu Duc district only

CONTACT:
- Email: support@furni.vn
- Website: http://localhost:4200
- API: http://localhost:3000/api/v1

YOUR ROLE:
1. Answer questions about products, orders, shipping, payment
2. Help troubleshoot issues
3. Guide users through website features
4. Provide product care advice
5. Be friendly, professional, and helpful
6. Respond in the same language the user uses (Vietnamese or English)
7. If you don't know something, admit it and suggest contacting human support

RESPONSE STYLE:
- Concise but complete answers
- Use emojis moderately (🌱, 📦, 💳, ✅, ❌)
- Provide step-by-step instructions when needed
- Include relevant links when helpful
- Be empathetic and understanding`;

/**
 * Generate chatbot response using Groq API
 */
export const generateChatResponse = async (
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> => {
  try {
    if (!GROQ_API_KEY) {
      console.error('Groq API key not configured');
      return {
        success: false,
        message: 'Chatbot service is currently unavailable. Please contact support@furni.vn'
      };
    }

    // Build messages array with system prompt and conversation history
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    // Call Groq API
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    if (response.data?.choices?.[0]?.message?.content) {
      return {
        success: true,
        message: response.data.choices[0].message.content.trim()
      };
    } else {
      throw new Error('Invalid response from Groq API');
    }

  } catch (error: any) {
    console.error('Chatbot error:', error.response?.data || error.message);

    // Handle specific errors
    if (error.response?.status === 401) {
      return {
        success: false,
        message: 'Chatbot authentication failed. Please contact administrator.'
      };
    } else if (error.response?.status === 429) {
      return {
        success: false,
        message: 'Too many requests. Please wait a moment and try again.'
      };
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return {
        success: false,
        message: 'Request timeout. Please try again.'
      };
    } else {
      return {
        success: false,
        message: 'Sorry, I encountered an error. Please try again or contact support@furni.vn'
      };
    }
  }
};

/**
 * Check if chatbot service is available
 */
export const isChatbotAvailable = (): boolean => {
  return !!GROQ_API_KEY;
};

/**
 * Get suggested quick replies based on common questions
 */
export const getQuickReplies = (language: 'vi' | 'en' = 'vi'): string[] => {
  if (language === 'vi') {
    return [
      'Phí vận chuyển như thế nào?',
      'Làm sao để theo dõi đơn hàng?',
      'Chính sách đổi trả ra sao?',
      'Có mã giảm giá không?',
      'Thanh toán bằng gì?'
    ];
  } else {
    return [
      'How much is shipping?',
      'How do I track my order?',
      'What is the return policy?',
      'Do you have any discount codes?',
      'What payment methods do you accept?'
    ];
  }
};

export default {
  generateChatResponse,
  isChatbotAvailable,
  getQuickReplies
};
