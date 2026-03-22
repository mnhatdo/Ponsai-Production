import { Router } from 'express';
import Category from '../models/Category';

const router = Router();

// Get all active categories (public-facing)
router.get('/', async (_req, res, next) => {
  try {
    const categories = await Category.find({ active: true })
      .populate('parent', 'name slug')
      .sort({ name: 1 })
      .lean();

    res.json({ 
      success: true, 
      data: categories 
    });
  } catch (error) {
    next(error);
  }
});

export default router;
