import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
// Import Category model to ensure schema is registered before populate
import Category from '../models/Category';
import { AppError } from '../middleware/errorHandler';

// @desc    Get all products
// @route   GET /api/v1/products
// @access  Public
export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    // Hard limit to prevent timeout: max 500 items per request (for admin ML analytics)
    const requestedLimit = parseInt(req.query.limit as string) || 10;
    const limit = Math.min(requestedLimit, 500);
    const skip = (page - 1) * limit;

    const query: any = {};

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by featured
    const isFeaturedQuery = req.query.featured === 'true';
    if (req.query.featured) {
      query.featured = isFeaturedQuery;
    }

    // Search by name
    if (req.query.search) {
      query.$text = { $search: req.query.search as string };
    }

    // Get only active categories to filter products
    const activeCategories = await Category.find({ active: true }).select('_id').lean();
    const activeCategoryIds = activeCategories.map(cat => cat._id);
    
    // Only show products from active categories
    query.category = { $in: activeCategoryIds };

    // FAST PATH for featured products (home page use case)
    // Returns minimal fields, no populate, uses compound index
    if (isFeaturedQuery && !req.query.search && limit <= 20) {
      const products = await Product.find(query)
        .select('name slug price originalPrice originalCurrency primaryImage images inStock featured')
        .sort('-createdAt')
        .limit(limit)
        .lean()
        .maxTimeMS(5000); // 5 second timeout guard

      res.status(200).json({
        success: true,
        count: products.length,
        total: products.length,
        page: 1,
        pages: 1,
        data: products
      });
      return;
    }

    // STANDARD PATH for other queries
    // Optimize query: use lean() for better performance
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate({
          path: 'category',
          select: 'name slug',
          match: { active: true }
        })
        .skip(skip)
        .limit(limit)
        .sort('-createdAt')
        .lean()
        .maxTimeMS(10000), // 10 second timeout guard
      Product.countDocuments(query)
    ]);

    // Filter out products where category is null (inactive category)
    const filteredProducts = products.filter(p => p.category !== null);

    res.status(200).json({
      success: true,
      count: filteredProducts.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: filteredProducts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/v1/products/:id
// @access  Public
export const getProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product
// @route   POST /api/v1/products
// @access  Private/Admin
export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private/Admin
export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private/Admin
export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
