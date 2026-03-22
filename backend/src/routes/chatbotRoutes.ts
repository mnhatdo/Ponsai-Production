import express from 'express';
import {
  sendMessage,
  getChatbotStatus,
  getQuickRepliesList
} from '../controllers/chatbotController';

const router = express.Router();

// Public routes - no authentication required for chatbot
router.post('/message', sendMessage);
router.get('/status', getChatbotStatus);
router.get('/quick-replies', getQuickRepliesList);

export default router;
