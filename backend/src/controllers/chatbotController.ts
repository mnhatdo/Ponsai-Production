import { Request, Response, NextFunction } from 'express';
import { generateChatResponse, isChatbotAvailable, getQuickReplies } from '../services/chatbotService';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  language?: 'vi' | 'en';
}

/**
 * @desc    Send message to chatbot
 * @route   POST /api/v1/chatbot/message
 * @access  Public
 */
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { message, conversationHistory = [], language = 'vi' }: ChatRequest = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    if (!isChatbotAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Chatbot service is currently unavailable',
        message: 'Please contact support@furni.vn for assistance'
      });
    }

    // Limit conversation history to last 10 messages to avoid token limits
    const limitedHistory = conversationHistory
      .slice(-10)
      .map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

    // Generate response
    const response = await generateChatResponse(message.trim(), limitedHistory);

    if (response.success) {
      res.status(200).json({
        success: true,
        data: {
          message: response.message,
          timestamp: new Date()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to generate response',
        message: response.message
      });
    }

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get chatbot status
 * @route   GET /api/v1/chatbot/status
 * @access  Public
 */
export const getChatbotStatus = async (
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const available = isChatbotAvailable();

  res.status(200).json({
    success: true,
    data: {
      available,
      model: 'mixtral-8x7b-32768',
      provider: 'Groq',
      languages: ['vi', 'en'],
      features: [
        'Product inquiries',
        'Order tracking',
        'Payment support',
        'Shipping information',
        'Return policy',
        'Product care advice'
      ]
    }
  });
};

/**
 * @desc    Get quick reply suggestions
 * @route   GET /api/v1/chatbot/quick-replies
 * @access  Public
 */
export const getQuickRepliesList = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const language = (req.query.language as 'vi' | 'en') || 'vi';
  const quickReplies = getQuickReplies(language);

  res.status(200).json({
    success: true,
    data: {
      language,
      quickReplies
    }
  });
};

export default {
  sendMessage,
  getChatbotStatus,
  getQuickRepliesList
};
