import { Router } from 'express';
import productRoutes from './productRoutes';
import categoryRoutes from './categoryRoutes';
import userRoutes from './userRoutes';
import authRoutes from './authRoutes';
import orderRoutes from './orderRoutes';
import blogRoutes from './blogRoutes';
import cartRoutes from './cartRoutes';
import adminRoutes from './adminRoutes';
import paymentRoutes from './paymentRoutes';
import eventRoutes from './eventRoutes';
import mlRoutes from './mlRoutes';
import promotionRoutes from './promotionRoutes';
import reviewRoutes from './reviewRoutes';
import chatbotRoutes from './chatbotRoutes';

const router = Router();

// Route mounting
router.use('/auth', authRoutes);
router.use('/products', productRoutes); // Includes product review routes
router.use('/categories', categoryRoutes);
router.use('/users', userRoutes);
router.use('/orders', orderRoutes);
router.use('/blog', blogRoutes);
router.use('/cart', cartRoutes);
router.use('/admin', adminRoutes);
router.use('/payment', paymentRoutes);
router.use('/events', eventRoutes);
router.use('/promotions', promotionRoutes); // User-facing promotion endpoints
router.use('/admin/ml', mlRoutes); // ML/AI endpoints
router.use('/chatbot', chatbotRoutes); // AI Chatbot endpoints
router.use('/', reviewRoutes); // Other review endpoints (helpful, me, etc.)

export default router;
