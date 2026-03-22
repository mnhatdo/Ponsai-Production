/**
 * Promotion Controller - User-facing promotion validation & application
 * 
 * Features:
 * - Validate promotion codes
 * - Apply discounts to orders
 * - Track promotion usage
 * - Check user eligibility
 */

import { Request, Response, NextFunction } from 'express';
import Promotion from '../models/Promotion';
import { AuthRequest } from '../middleware/auth';

/**
 * POST /api/v1/promotions/validate
 * 
 * Validate a promotion code and calculate discount
 * 
 * Body:
 * - code: string (promotion code)
 * - orderAmount: number (cart total in GBP)
 * - items: array of { productId, quantity } (optional for product-specific promos)
 * 
 * Returns:
 * - valid: boolean
 * - promotion: object (if valid)
 * - discount: number (calculated discount amount)
 * - message: string (error or success message)
 */
export const validatePromotion = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code, orderAmount, items } = req.body;

    // Validate input
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Promotion code is required'
      });
    }

    if (!orderAmount || orderAmount <= 0) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Valid order amount is required'
      });
    }

    // Find promotion by code
    const searchCode = code.toUpperCase().trim();
    
    const promotion = await Promotion.findOne({ 
      code: searchCode
    });

    if (!promotion) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Invalid promotion code'
      });
    }

    // Check if promotion is active
    if (!promotion.active) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'This promotion is currently inactive'
      });
    }

    // Check date validity
    const now = new Date();
    if (now < promotion.startDate) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: `This promotion will start on ${promotion.startDate.toLocaleDateString()}`
      });
    }

    if (now > promotion.endDate) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'This promotion has expired'
      });
    }

    // Check usage limit
    if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'This promotion has reached its usage limit'
      });
    }

    // Check per-user usage limit (if user is logged in)
    if (req.user && promotion.usagePerUser) {
      const userUsageCount = promotion.usedBy?.filter(
        usage => usage.user.toString() === req.user!._id.toString()
      ).length || 0;

      if (userUsageCount >= promotion.usagePerUser) {
        return res.status(400).json({
          success: false,
          valid: false,
          message: `You have already used this promotion ${promotion.usagePerUser} time(s)`
        });
      }
    }

    // Check minimum order amount
    if (promotion.minOrderAmount && orderAmount < promotion.minOrderAmount) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: `Minimum order amount is £${promotion.minOrderAmount.toFixed(2)}`
      });
    }

    // Check product/category restrictions (if applicable)
    if (items && (promotion.applicableProducts?.length || promotion.applicableCategories?.length)) {
      // TODO: Implement product/category validation when needed
      // For now, we'll allow all items
    }

    // Calculate discount
    let discountAmount = 0;
    let finalAmount = orderAmount;

    switch (promotion.type) {
      case 'percentage':
        discountAmount = (orderAmount * promotion.value) / 100;
        
        // Apply max discount cap if exists
        if (promotion.maxDiscount && discountAmount > promotion.maxDiscount) {
          discountAmount = promotion.maxDiscount;
        }
        break;

      case 'fixed':
        discountAmount = promotion.value;
        
        // Discount cannot exceed order amount
        if (discountAmount > orderAmount) {
          discountAmount = orderAmount;
        }
        break;

      case 'free_shipping':
        // Shipping discount handled separately in order creation
        // For validation, we'll return 0 discount here
        discountAmount = 0;
        break;

      default:
        discountAmount = 0;
    }

    finalAmount = orderAmount - discountAmount;

    // Return validation result
    return res.status(200).json({
      success: true,
      valid: true,
      data: {
        promotion: {
          _id: promotion._id,
          code: promotion.code,
          name: promotion.name,
          description: promotion.description,
          type: promotion.type,
          value: promotion.value,
          maxDiscount: promotion.maxDiscount,
          freeShipping: promotion.type === 'free_shipping'
        },
        discount: {
          amount: discountAmount,
          percentage: promotion.type === 'percentage' ? promotion.value : 0,
          originalAmount: orderAmount,
          finalAmount: finalAmount,
          freeShipping: promotion.type === 'free_shipping'
        }
      },
      message: 'Promotion code applied successfully'
    });

  } catch (error) {
    console.error('Validate promotion error:', error);
    next(error);
  }
};

/**
 * POST /api/v1/promotions/apply
 * 
 * Apply promotion to an order (called after order creation)
 * This records the usage and updates promotion stats
 * 
 * Body:
 * - promotionId: string
 * - orderId: string
 * - discountAmount: number
 * 
 * Note: This should be called from order creation flow
 */
export const applyPromotionToOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { promotionId, orderId, discountAmount } = req.body;

    if (!promotionId || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Promotion ID and Order ID are required'
      });
    }

    const promotion = await Promotion.findById(promotionId);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    // Increment usage count
    promotion.usedCount += 1;

    // Add usage record
    if (!promotion.usedBy) {
      promotion.usedBy = [];
    }

    promotion.usedBy.push({
      user: req.user!._id,
      usedAt: new Date(),
      orderId: orderId,
      discountAmount: discountAmount
    });

    await promotion.save();

    return res.status(200).json({
      success: true,
      message: 'Promotion applied successfully',
      data: {
        usedCount: promotion.usedCount,
        usageLimit: promotion.usageLimit
      }
    });

  } catch (error) {
    console.error('Apply promotion error:', error);
    next(error);
  }
};

/**
 * GET /api/v1/promotions/active
 * 
 * Get all active promotions (public endpoint for promotion discovery)
 * Users can see what promotions are available
 */
export const getActivePromotions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const now = new Date();

    const promotions = await Promotion.find({
      active: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { usageLimit: { $exists: false } },
        { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
      ]
    })
      .select('code name description type value maxDiscount minOrderAmount startDate endDate')
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      count: promotions.length,
      data: promotions
    });

  } catch (error) {
    console.error('Get active promotions error:', error);
    next(error);
  }
};

export default {
  validatePromotion,
  applyPromotionToOrder,
  getActivePromotions
};
