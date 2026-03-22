import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  initiateMomoPayment,
  handleMomoIPN,
  handleMomoCallback,
  checkPaymentStatus,
  initiateManualPayment,
  getPaymentMethods,
  initiateCardPayment,
  processCardPayment,
  initiateBankTransfer,
  getBankTransferInvoice,
  verifyBankTransfer
} from '../controllers/paymentController';
import { paymentLimiter } from '../middleware/rateLimit';

const router = Router();

// ================================
// PAYMENT METHODS
// ================================
// Get available payment methods
router.get('/methods', protect, getPaymentMethods);

// Check payment status (requires auth)
router.get('/status/:orderId', protect, checkPaymentStatus);

// ================================
// MOMO PAYMENT
// ================================
// Initiate MOMO payment (requires auth)
router.post('/momo/initiate', paymentLimiter, protect, initiateMomoPayment);

// MOMO IPN callback (server-to-server, no auth)
router.post('/momo/ipn', handleMomoIPN);

// MOMO redirect callback (user returns from MOMO, no auth required)
router.get('/momo/callback', handleMomoCallback);

// ================================
// MANUAL PAYMENT (Separate from MoMo)
// ================================
// Initiate manual payment (requires auth)
router.post('/manual/initiate', paymentLimiter, protect, initiateManualPayment);

// ================================
// CARD PAYMENT
// ================================
// Initiate card payment (requires auth)
router.post('/card/initiate', paymentLimiter, protect, initiateCardPayment);

// Process card payment (requires auth)
router.post('/card/process', paymentLimiter, protect, processCardPayment);

// ================================
// BANK TRANSFER PAYMENT
// ================================
// Initiate bank transfer (requires auth)
router.post('/bank-transfer/initiate', paymentLimiter, protect, initiateBankTransfer);

// Get bank transfer invoice details (requires auth)
router.get('/bank-transfer/invoice/:orderId', protect, getBankTransferInvoice);

// Verify bank transfer payment (requires auth)
router.post('/bank-transfer/verify', paymentLimiter, protect, verifyBankTransfer);

export default router;
