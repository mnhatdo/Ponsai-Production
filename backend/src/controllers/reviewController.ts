import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import Review from '../models/Review';
import Product from '../models/Product';
import Order from '../models/Order';
import { AppError } from '../middleware/errorHandler';
import mongoose from 'mongoose';

// Get all reviews for a product
export const getProductReviews = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(new AppError('Invalid product ID', 400));
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Build query
    const query: any = { product: productId };

    // Filter by rating
    if (req.query.rating) {
      query.rating = parseInt(req.query.rating as string);
    }

    // Filter verified only
    if (req.query.verified === 'true') {
      query.verified = true;
    }

    // Sorting
    let sort: any = { createdAt: -1 }; // Default: newest first
    if (req.query.sort === 'helpful') {
      sort = { helpful: -1, createdAt: -1 };
    } else if (req.query.sort === 'rating-high') {
      sort = { rating: -1, createdAt: -1 };
    } else if (req.query.sort === 'rating-low') {
      sort = { rating: 1, createdAt: -1 };
    }

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('user', 'name avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(query)
    ]);

    // Calculate rating distribution
    const ratingStats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      }
    ]);

    const distribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };

    ratingStats.forEach(stat => {
      distribution[stat._id as keyof typeof distribution] = stat.count;
    });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        stats: {
          total,
          averageRating: product.rating || 0,
          distribution
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create a new review
export const createReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const { rating, title, comment, images } = req.body;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(new AppError('Invalid product ID', 400));
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Validate required fields
    if (!rating || !title || !comment) {
      return next(new AppError('Please provide rating, title, and comment', 400));
    }

    // Check if user already reviewed this product
    if (req.user) {
      const existingReview = await Review.findOne({
        product: productId,
        user: req.user.id
      });

      if (existingReview) {
        return next(new AppError('You have already reviewed this product', 400));
      }
    }

    // Check if user purchased this product (verified purchase)
    let verified = false;
    if (req.user) {
      const order = await Order.findOne({
        user: req.user.id,
        'items.product': productId,
        status: 'delivered'
      });
      verified = !!order;
    }

    // Create review
    const review = await Review.create({
      product: productId,
      user: req.user?.id,
      userName: req.user?.name || req.body.userName,
      userEmail: req.user?.email || req.body.userEmail,
      rating,
      title,
      comment,
      images: images || [],
      verified
    });

    // Populate user data
    await review.populate('user', 'name avatar');

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// Update a review
export const updateReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment, images } = req.body;

    // Validate reviewId
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return next(new AppError('Invalid review ID', 400));
    }

    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return next(new AppError('Review not found', 404));
    }

    // Check ownership
    if (!req.user || review.user?.toString() !== req.user.id) {
      return next(new AppError('You can only update your own reviews', 403));
    }

    // Update fields
    if (rating !== undefined) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;
    if (images !== undefined) review.images = images;

    await review.save();
    await review.populate('user', 'name avatar');

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// Delete a review
export const deleteReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reviewId } = req.params;

    // Validate reviewId
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return next(new AppError('Invalid review ID', 400));
    }

    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return next(new AppError('Review not found', 404));
    }

    // Check permission (owner or admin)
    if (!req.user || (review.user?.toString() !== req.user.id && req.user.role !== 'admin')) {
      return next(new AppError('You do not have permission to delete this review', 403));
    }

    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Mark review as helpful
export const markHelpful = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reviewId } = req.params;

    // Validate reviewId
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return next(new AppError('Invalid review ID', 400));
    }

    // Find and update review
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpful: 1 } },
      { new: true }
    ).populate('user', 'name avatar');

    if (!review) {
      return next(new AppError('Review not found', 404));
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// Get user's own reviews (for authenticated users)
export const getMyReviews = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Please login to view your reviews', 401));
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ user: req.user.id })
        .populate('product', 'name images primaryImage slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ user: req.user.id })
    ]);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
