import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import Product from '../models/Product';
import Category from '../models/Category';
import Order from '../models/Order';
import User from '../models/User';
import Promotion from '../models/Promotion';
import AuditLog from '../models/AuditLog';
import Settings from '../models/Settings';
import { AppError } from '../middleware/errorHandler';
import mongoose from 'mongoose';
import manualPaymentService, { MANUAL_PAYMENT_METHOD } from '../services/manualPaymentService';
import bankTransferService from '../services/bankTransferService';
import paymentLifecycle, { PaymentStatus } from '../services/paymentLifecycleManager';

// ================================
// UTILITY FUNCTIONS
// ================================

const createAuditLog = async (
  req: AuthRequest,
  action: string,
  entityType: string,
  entityId?: mongoose.Types.ObjectId,
  entityName?: string,
  previousData?: any,
  newData?: any,
  status: 'success' | 'failure' = 'success',
  errorMessage?: string
) => {
  try {
    const changes: Record<string, { from: any; to: any }> = {};
    
    if (previousData && newData) {
      Object.keys(newData).forEach(key => {
        if (JSON.stringify(previousData[key]) !== JSON.stringify(newData[key])) {
          changes[key] = { from: previousData[key], to: newData[key] };
        }
      });
    }

    await AuditLog.create({
      action,
      entityType,
      entityId,
      entityName,
      user: req.user?.id,
      userName: req.user?.name || req.user?.email,
      userRole: req.user?.role,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
      previousData,
      newData,
      changes: Object.keys(changes).length > 0 ? changes : undefined,
      status,
      errorMessage
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

// ================================
// DASHBOARD STATISTICS
// ================================

export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get date range from query params and parse as local dates (UTC+7)
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    if (req.query.startDate) {
      // Parse as local date: "2026-01-24" → 2026-01-24 00:00:00 Local → UTC
      const [year, month, day] = (req.query.startDate as string).split('-').map(Number);
      startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    }
    
    if (req.query.endDate) {
      // Parse as local date: "2026-01-24" → 2026-01-24 23:59:59 Local → UTC
      const [year, month, day] = (req.query.endDate as string).split('-').map(Number);
      endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
    }
    
    // Build date filter
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = startDate;
      }
      if (endDate) {
        dateFilter.createdAt.$lte = endDate;
      }
    }

    // Get lowStockThreshold from settings
    const settings = await Settings.getSettings();
    const lowStockThreshold = settings.lowStockThreshold || 10;

    const [
      totalProducts,
      totalCategories,
      totalOrders,
      totalUsers,
      totalRevenue,
      pendingOrders,
      lowStockProducts,
      recentOrders,
      topProducts,
      ordersByStatus
    ] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments({ active: true }),
      Order.countDocuments(dateFilter),
      User.countDocuments({ role: 'user' }),
      Order.aggregate([
        { $match: { paymentStatus: { $nin: ['failed', 'refunded'] }, ...dateFilter } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.countDocuments({ ...dateFilter, status: { $in: ['pending', 'pending_manual_payment'] } }),
      Product.countDocuments({ stockQuantity: { $lte: lowStockThreshold } }),
      Order.find(dateFilter)
        .populate('user', 'name email')
        .populate('items.product', 'name price primaryImage sku')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Order.aggregate([
        { $match: dateFilter },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' } } },
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $project: {
            name: '$product.name',
            totalSold: 1,
            price: '$product.price',
            primaryImage: '$product.primaryImage'
          }
        }
      ]),
      Order.aggregate([
        { $match: dateFilter },
        {
          $addFields: {
            normalizedStatus: {
              $cond: {
                if: { $eq: ['$status', 'pending_manual_payment'] },
                then: 'pending',
                else: '$status'
              }
            }
          }
        },
        { $group: { _id: '$normalizedStatus', count: { $sum: 1 } } }
      ])
    ]);

    // Daily revenue for chart (filtered by date range)
    const dailyRevenue = await Order.aggregate([
      { $match: { paymentStatus: { $nin: ['failed', 'refunded'] }, ...dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Monthly revenue for chart
    const monthlyRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid', ...dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // Top 5 products by revenue (filtered by date range)
    const topProductsByRevenue = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' }, ...dateFilter } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          totalRevenue: 1
        }
      }
    ]);

    // Heatmap data: orders by day and hour (filtered by date range, exclude cancelled)
    const heatmapData = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' }, ...dateFilter } },
      {
        $project: {
          dayOfWeek: { $dayOfWeek: '$createdAt' },
          hour: { $hour: '$createdAt' }
        }
      },
      {
        $group: {
          _id: {
            day: '$dayOfWeek',
            hourInterval: { $floor: { $divide: ['$hour', 2] } }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalProducts,
          totalCategories,
          totalOrders,
          totalUsers,
          totalRevenue: totalRevenue[0]?.total || 0,
          pendingOrders,
          lowStockProducts
        },
        recentOrders,
        topProducts,
        topProductsByRevenue,
        heatmapData,
        ordersByStatus: ordersByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>),
        dailyRevenue,
        monthlyRevenue
      }
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// PRODUCT MANAGEMENT
// ================================

export const getAdminProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    const filter: any = {};
    
    // Search
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { sku: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Category filter
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    // Stock filter - ensure no overlap between categories
    const settings = await Settings.getSettings();
    const lowStockThreshold = settings.lowStockThreshold || 10;
    
    if (req.query.inStock === 'true') {
      // Còn hàng: stockQuantity > threshold
      filter.stockQuantity = { $gt: lowStockThreshold };
    } else if (req.query.inStock === 'false') {
      // Hết hàng: stockQuantity = 0
      filter.stockQuantity = 0;
    } else if (req.query.lowStock === 'true') {
      // Sắp hết: 0 < stockQuantity <= threshold
      filter.stockQuantity = { $gt: 0, $lte: lowStockThreshold };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminProductById = async (
  req: AuthRequest,
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

export const createAdminProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await Product.create(req.body);
    
    await createAuditLog(
      req,
      'product_create',
      'product',
      product._id as mongoose.Types.ObjectId,
      product.name,
      undefined,
      req.body
    );

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const previousProduct = await Product.findById(req.params.id).lean();
    
    if (!previousProduct) {
      return next(new AppError('Product not found', 404));
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    await createAuditLog(
      req,
      'product_update',
      'product',
      product?._id as mongoose.Types.ObjectId,
      product?.name,
      previousProduct,
      req.body
    );

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAdminProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    await product.deleteOne();

    await createAuditLog(
      req,
      'product_delete',
      'product',
      product._id as mongoose.Types.ObjectId,
      product.name,
      product.toObject()
    );

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return next(new AppError('Please provide product IDs', 400));
    }

    const products = await Product.find({ _id: { $in: ids } }).lean();
    await Product.deleteMany({ _id: { $in: ids } });

    await createAuditLog(
      req,
      'product_bulk_delete',
      'product',
      undefined,
      `${ids.length} products`,
      { productIds: ids, products }
    );

    res.status(200).json({
      success: true,
      message: `${ids.length} products deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

export const updateProductStock = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { stockQuantity, reason } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    const previousStock = product.stockQuantity;
    product.stockQuantity = stockQuantity;
    product.inStock = stockQuantity > 0;
    await product.save();

    await createAuditLog(
      req,
      'inventory_adjustment',
      'inventory',
      product._id as mongoose.Types.ObjectId,
      product.name,
      { stockQuantity: previousStock },
      { stockQuantity, reason }
    );

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// CATEGORY MANAGEMENT
// ================================

export const getAdminCategories = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await Category.find()
      .populate('parent', 'name slug')
      .sort({ name: 1 })
      .lean();

    // Count products per category
    const productCounts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const countMap = productCounts.reduce((acc, item) => {
      acc[item._id?.toString()] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const categoriesWithCount = categories.map(cat => ({
      ...cat,
      productCount: countMap[cat._id?.toString()] || 0
    }));

    res.status(200).json({
      success: true,
      data: categoriesWithCount
    });
  } catch (error) {
    next(error);
  }
};

export const createAdminCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Generate slug from name
    const slug = req.body.name
      ? req.body.name.toLowerCase().replace(/\s+/g, '-')
      : '';

    // Sanitize parent field - convert empty string or undefined to null
    const categoryData = {
      ...req.body,
      slug,
      parent: req.body.parent && req.body.parent !== '' ? req.body.parent : null
    };

    const category = await Category.create(categoryData);

    await createAuditLog(
      req,
      'category_create',
      'category',
      category._id as mongoose.Types.ObjectId,
      category.name,
      undefined,
      categoryData
    );

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const previousCategory = await Category.findById(req.params.id).lean();
    
    if (!previousCategory) {
      return next(new AppError('Category not found', 404));
    }

    // Generate slug from name if name is being updated
    const slug = req.body.name
      ? req.body.name.toLowerCase().replace(/\s+/g, '-')
      : undefined;

    // Sanitize parent field - convert empty string or undefined to null
    const updateData = {
      ...req.body,
      ...(slug && { slug }),
      parent: req.body.parent && req.body.parent !== '' ? req.body.parent : null
    };

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('parent', 'name slug');

    await createAuditLog(
      req,
      'category_update',
      'category',
      category?._id as mongoose.Types.ObjectId,
      category?.name,
      previousCategory,
      updateData
    );

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAdminCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ category: req.params.id });
    
    if (productCount > 0) {
      return next(new AppError(`Cannot delete category with ${productCount} products. Please reassign products first.`, 400));
    }

    await category.deleteOne();

    await createAuditLog(
      req,
      'category_delete',
      'category',
      category._id as mongoose.Types.ObjectId,
      category.name,
      category.toObject()
    );

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// ORDER MANAGEMENT
// ================================

export const getAdminOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    const filter: any = {};
    
    // Status filter - "pending" includes both "pending" and "pending_manual_payment"
    if (req.query.status) {
      if (req.query.status === 'pending') {
        filter.status = { $in: ['pending', 'pending_manual_payment'] };
      } else {
        filter.status = req.query.status;
      }
    }
    
    // Payment status filter
    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus;
    }
    
    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate as string);
      }
    }

    // Search by order ID or user email
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      
      // Find users matching email
      const matchingUsers = await User.find({ email: searchRegex }).select('_id');
      const userIds = matchingUsers.map(u => u._id);
      
      filter.$or = [
        { user: { $in: userIds } }
      ];
      
      // Also try to match by ID if it's a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(req.query.search as string)) {
        filter.$or.push({ _id: req.query.search });
      }
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email')
        .populate('items.product', 'name primaryImage price sku')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminOrderById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name primaryImage price sku');

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    await createAuditLog(
      req,
      'order_view',
      'order',
      order._id as mongoose.Types.ObjectId,
      `Order #${order._id}`
    );

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, paymentStatus, trackingNumber, notes } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    const previousData = {
      status: order.status,
      paymentStatus: order.paymentStatus,
      trackingNumber: order.trackingNumber,
      notes: order.notes
    };

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (notes) order.notes = notes;

    await order.save();

    await createAuditLog(
      req,
      'order_update_status',
      'order',
      order._id as mongoose.Types.ObjectId,
      `Order #${order._id}`,
      previousData,
      { status, paymentStatus, trackingNumber, notes }
    );

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reason } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    if (order.status === 'delivered') {
      return next(new AppError('Cannot cancel delivered order', 400));
    }

    if (order.status === 'cancelled') {
      return next(new AppError('Order is already cancelled', 400));
    }

    const previousStatus = order.status;
    
    // Use lifecycle manager for proper state transition and stock restoration
    await paymentLifecycle.transitionToCancelled(order, {
      cancelledBy: 'admin',
      reason: reason || 'Cancelled by admin'
    });

    // Update notes
    order.notes = reason || 'Cancelled by admin';
    await order.save();

    await createAuditLog(
      req,
      'order_cancel',
      'order',
      order._id as mongoose.Types.ObjectId,
      `Order #${order._id}`,
      { status: previousStatus },
      { status: 'cancelled', reason }
    );

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// USER/CUSTOMER MANAGEMENT
// ================================

export const getAdminUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    const filter: any = {};
    
    // Role filter
    if (req.query.role) {
      filter.role = req.query.role;
    }
    
    // Search
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Active filter
    if (req.query.active === 'true') {
      filter.isActive = true;
    } else if (req.query.active === 'false') {
      filter.isActive = false;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -otp')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ]);

    // Get order count and total spent for each user
    // Option B: 
    // - Order Count: All orders EXCEPT cancelled
    // - Total Spent: Only PAID orders (paymentStatus === 'paid')
    const userIds = users.map(u => u._id);
    
    // Get order count (exclude cancelled orders)
    const orderCounts = await Order.aggregate([
      { 
        $match: { 
          user: { $in: userIds },
          status: { $ne: 'cancelled' }  // Exclude cancelled orders
        } 
      },
      { 
        $group: { 
          _id: '$user', 
          count: { $sum: 1 }
        } 
      }
    ]);

    // Get total spent (only paid orders)
    const totalSpentData = await Order.aggregate([
      { 
        $match: { 
          user: { $in: userIds },
          paymentStatus: 'paid'  // Only paid orders
        } 
      },
      { 
        $group: { 
          _id: '$user', 
          totalSpent: { $sum: '$totalAmount' }
        } 
      }
    ]);

    // Create maps for quick lookup
    const orderCountMap = orderCounts.reduce((acc, item) => {
      acc[item._id?.toString()] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const totalSpentMap = totalSpentData.reduce((acc, item) => {
      acc[item._id?.toString()] = item.totalSpent;
      return acc;
    }, {} as Record<string, number>);

    const usersWithStats = users.map(user => ({
      ...user,
      orderCount: orderCountMap[user._id?.toString()] || 0,
      totalSpent: totalSpentMap[user._id?.toString()] || 0
    }));

    res.status(200).json({
      success: true,
      data: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminUserById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -otp')
      .lean();

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Get user's orders
    const orders = await Order.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        ...user,
        recentOrders: orders
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return next(new AppError('Invalid role', 400));
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Prevent removing your own admin role
    if (req.user?.id === req.params.id && role !== 'admin') {
      return next(new AppError('Cannot remove your own admin role', 400));
    }

    const previousRole = user.role;
    user.role = role;
    await user.save();

    await createAuditLog(
      req,
      'user_role_change',
      'user',
      user._id as mongoose.Types.ObjectId,
      user.email,
      { role: previousRole },
      { role }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Prevent banning yourself
    if (req.user?.id === req.params.id) {
      return next(new AppError('Cannot change your own status', 400));
    }

    const previousStatus = user.isActive;
    user.isActive = !user.isActive;
    await user.save();

    await createAuditLog(
      req,
      user.isActive ? 'user_unban' : 'user_ban',
      'user',
      user._id as mongoose.Types.ObjectId,
      user.email,
      { isActive: previousStatus },
      { isActive: user.isActive }
    );

    res.status(200).json({
      success: true,
      message: user.isActive ? 'User activated' : 'User deactivated',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// PROMOTION MANAGEMENT
// ================================

export const getAdminPromotions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const filter: any = {};
    
    if (req.query.active === 'true') {
      filter.active = true;
      filter.endDate = { $gte: new Date() };
    } else if (req.query.active === 'false') {
      filter.$or = [
        { active: false },
        { endDate: { $lt: new Date() } }
      ];
    }

    if (req.query.type) {
      filter.type = req.query.type;
    }

    const promotions = await Promotion.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Add aliases for frontend compatibility
    const promotionsWithAliases = promotions.map((p: any) => ({
      ...p,
      isActive: p.active,
      usageCount: p.usedCount
    }));

    res.status(200).json({
      success: true,
      data: promotionsWithAliases
    });
  } catch (error) {
    next(error);
  }
};

export const createAdminPromotion = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate required fields
    const { code, name, type, startDate, endDate } = req.body;
    
    if (!code || !name || !type || !startDate || !endDate) {
      return next(new AppError('Missing required fields: code, name, type, startDate, endDate', 400));
    }

    // Check if promotion code already exists
    const existingPromo = await Promotion.findOne({ code: code.toUpperCase() });
    if (existingPromo) {
      return next(new AppError('Promotion code already exists', 400));
    }

    const promotionData = {
      ...req.body,
      code: code.toUpperCase(),
      createdBy: req.user?.id
    };

    const promotion = await Promotion.create(promotionData);
    await promotion.populate('createdBy', 'name email');

    await createAuditLog(
      req,
      'promotion_create',
      'promotion',
      promotion._id as mongoose.Types.ObjectId,
      promotion.code,
      undefined,
      req.body
    );

    // Add aliases for frontend compatibility
    const promotionObj: any = promotion.toObject();
    promotionObj.isActive = promotionObj.active;
    promotionObj.usageCount = promotionObj.usedCount;

    res.status(201).json({
      success: true,
      data: promotionObj
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminPromotion = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const previousPromotion = await Promotion.findById(req.params.id).lean();
    
    if (!previousPromotion) {
      return next(new AppError('Promotion not found', 404));
    }

    const promotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    await createAuditLog(
      req,
      'promotion_update',
      'promotion',
      promotion?._id as mongoose.Types.ObjectId,
      promotion?.code,
      previousPromotion,
      req.body
    );

    // Add aliases for frontend compatibility
    const promotionObj: any = promotion?.toObject();
    if (promotionObj) {
      promotionObj.isActive = promotionObj.active;
      promotionObj.usageCount = promotionObj.usedCount;
    }

    res.status(200).json({
      success: true,
      data: promotionObj
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAdminPromotion = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    
    if (!promotion) {
      return next(new AppError('Promotion not found', 404));
    }

    await promotion.deleteOne();

    await createAuditLog(
      req,
      'promotion_delete',
      'promotion',
      promotion._id as mongoose.Types.ObjectId,
      promotion.code,
      promotion.toObject()
    );

    res.status(200).json({
      success: true,
      message: 'Promotion deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const togglePromotionStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    
    if (!promotion) {
      return next(new AppError('Promotion not found', 404));
    }

    promotion.active = !promotion.active;
    await promotion.save();

    await createAuditLog(
      req,
      promotion.active ? 'promotion_activate' : 'promotion_deactivate',
      'promotion',
      promotion._id as mongoose.Types.ObjectId,
      promotion.code,
      { active: !promotion.active },
      { active: promotion.active }
    );

    res.status(200).json({
      success: true,
      data: promotion
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// INVENTORY MANAGEMENT
// ================================

export const getLowStockProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const settings = await Settings.getSettings();
    const threshold = parseInt(req.query.threshold as string) || settings.lowStockThreshold || 10;

    const products = await Product.find({
      stockQuantity: { $lte: threshold }
    })
      .populate('category', 'name')
      .sort({ stockQuantity: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// Update single product stock
export const updateInventoryStock = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    
    if (stock === undefined || stock < 0) {
      return next(new AppError('Please provide a valid stock quantity', 400));
    }

    const product = await Product.findById(id);
    
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    const previousStock = product.stockQuantity;
    product.stockQuantity = stock;
    product.inStock = stock > 0;
    await product.save();

    await createAuditLog(
      req,
      'product_stock_update',
      'product',
      product._id,
      product.name,
      { stockQuantity: previousStock },
      { stockQuantity: stock }
    );

    res.status(200).json({
      success: true,
      data: {
        _id: product._id,
        name: product.name,
        stock: product.stockQuantity,
        stockQuantity: product.stockQuantity,
        inStock: product.inStock
      }
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateStock = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { updates } = req.body;
    
    if (!updates || !Array.isArray(updates)) {
      return next(new AppError('Please provide stock updates', 400));
    }

    const results = [];
    
    for (const update of updates) {
      const product = await Product.findById(update.productId);
      
      if (product) {
        const previousStock = product.stockQuantity;
        product.stockQuantity = update.stockQuantity;
        product.inStock = update.stockQuantity > 0;
        await product.save();
        
        results.push({
          productId: update.productId,
          name: product.name,
          previousStock,
          newStock: update.stockQuantity
        });
      }
    }

    await createAuditLog(
      req,
      'inventory_update',
      'inventory',
      undefined,
      `${results.length} products`,
      undefined,
      { updates: results }
    );

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// AUDIT LOGS
// ================================

export const getAuditLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    
    const filter: any = {};
    
    if (req.query.action) {
      filter.action = req.query.action;
    }
    
    if (req.query.entityType) {
      filter.entityType = req.query.entityType;
    }
    
    if (req.query.user) {
      filter.user = req.query.user;
    }
    
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate as string);
      }
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// MANUAL PAYMENT MANAGEMENT (Admin Only)
// ============================================

/**
 * Get all orders pending manual payment confirmation
 * Admin dashboard endpoint to view orders awaiting manual payment confirmation
 */
export const getPendingManualPayments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter = {
      paymentMethod: MANUAL_PAYMENT_METHOD,
      paymentStatus: PaymentStatus.PENDING
    };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email')
        .populate('items.product', 'name primaryImage price sku')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm manual payment for an order
 * 
 * This endpoint is used by admin to confirm that payment has been received
 * for orders using the manual payment method.
 * 
 * Required: Order must be in PENDING_MANUAL_PAYMENT status
 * Result: Order status changes to PAID
 * 
 * Metadata recorded:
 * - confirmedAt: Timestamp
 * - confirmedBy: Admin user ID
 * - confirmedByName: Admin name
 * - manualPaymentNote: Optional note
 */
export const confirmManualPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: orderId } = req.params;
    const { note } = req.body;
    const adminUserId = req.user?.id;
    const adminUserName = req.user?.name || req.user?.email || 'Admin';

    console.log('\n✅ [Admin] Confirming manual payment...');
    console.log('📦 [Admin] Order ID:', orderId);
    console.log('👤 [Admin] Admin:', adminUserName);

    if (!adminUserId) {
      return next(new AppError('Admin authentication required', 401));
    }

    // Get order for audit log
    const orderBefore = await Order.findById(orderId);
    if (!orderBefore) {
      return next(new AppError('Order not found', 404));
    }

    const previousData = {
      status: orderBefore.status,
      paymentStatus: orderBefore.paymentStatus,
      paymentDetails: orderBefore.paymentDetails
    };

    // Confirm payment via service
    const result = await manualPaymentService.confirmManualPayment({
      orderId,
      adminUserId,
      adminUserName,
      note
    });

    // Create audit log
    await createAuditLog(
      req,
      'manual_payment_confirm',
      'order',
      orderBefore._id as mongoose.Types.ObjectId,
      `Order #${orderId}`,
      previousData,
      {
        status: 'processing',
        paymentStatus: 'paid',
        paymentDetails: {
          confirmedAt: result.confirmedAt,
          confirmedBy: adminUserId,
          confirmedByName: adminUserName,
          manualPaymentNote: note
        }
      }
    );

    console.log('✅ [Admin] Manual payment confirmed successfully');

    res.status(200).json({
      success: true,
      data: {
        orderId: result.orderId,
        previousStatus: result.previousStatus,
        newStatus: result.newStatus,
        confirmedAt: result.confirmedAt,
        confirmedBy: result.confirmedBy
      },
      message: 'Manual payment confirmed successfully'
    });
  } catch (error: any) {
    console.error('❌ [Admin] Failed to confirm manual payment:', error.message);
    
    if (error.message.includes('not found')) {
      return next(new AppError(error.message, 404));
    }
    if (error.message.includes('already paid') || 
        error.message.includes('Cannot confirm') ||
        error.message.includes('cancelled')) {
      return next(new AppError(error.message, 400));
    }
    
    next(error);
  }
};

/**
 * Confirm Bank Transfer Payment (Admin)
 * 
 * Validates and confirms a bank transfer payment for an order.
 * Transitions order from pending → paid when admin verifies bank transfer receipt.
 * 
 * Flow:
 * 1. Validate admin authentication
 * 2. Verify order exists and is pending
 * 3. Call bankTransferService.confirmBankTransfer()
 * 4. Create audit log
 * 5. Return confirmation details
 * 
 * Metadata recorded:
 * - confirmedAt: Timestamp
 * - confirmedBy: Admin user ID
 * - confirmedByName: Admin name
 * - bankReference: Optional bank transaction reference
 */
export const confirmBankTransfer = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: orderId } = req.params;
    const { bankReference, note } = req.body;
    const adminUserId = req.user?.id;
    const adminUserName = req.user?.name || req.user?.email || 'Admin';

    console.log('\n✅ [Admin] Confirming bank transfer payment...');
    console.log('📦 [Admin] Order ID:', orderId);
    console.log('👤 [Admin] Admin:', adminUserName);
    console.log('🏦 [Admin] Bank Reference:', bankReference);

    if (!adminUserId) {
      return next(new AppError('Admin authentication required', 401));
    }

    // Get order for audit log
    const orderBefore = await Order.findById(orderId);
    if (!orderBefore) {
      return next(new AppError('Order not found', 404));
    }

    const previousData = {
      status: orderBefore.status,
      paymentStatus: orderBefore.paymentStatus,
      paymentDetails: orderBefore.paymentDetails
    };

    // Confirm payment via service
    const result = await bankTransferService.confirmBankTransfer(
      orderId,
      adminUserId,
      adminUserName,
      bankReference
    );

    // Create audit log
    await createAuditLog(
      req,
      'bank_transfer_confirm',
      'order',
      orderBefore._id as mongoose.Types.ObjectId,
      `Order #${orderId}`,
      previousData,
      {
        status: 'processing',
        paymentStatus: 'paid',
        paymentDetails: {
          confirmedAt: result.confirmedAt,
          confirmedBy: adminUserId,
          confirmedByName: adminUserName,
          bankReference: bankReference,
          note: note
        }
      }
    );

    console.log('✅ [Admin] Bank transfer payment confirmed successfully');

    res.status(200).json({
      success: true,
      data: {
        orderId: result.orderId,
        previousStatus: result.previousStatus,
        newStatus: result.newStatus,
        confirmedAt: result.confirmedAt,
        confirmedBy: result.confirmedBy,
        transactionId: result.transactionId
      },
      message: 'Bank transfer payment confirmed successfully'
    });
  } catch (error: any) {
    console.error('❌ [Admin] Failed to confirm bank transfer:', error.message);
    
    if (error.message.includes('not found')) {
      return next(new AppError(error.message, 404));
    }
    if (error.message.includes('already paid') || 
        error.message.includes('Cannot confirm') ||
        error.message.includes('cancelled')) {
      return next(new AppError(error.message, 400));
    }
    
    next(error);
  }
};

/**
 * Get manual payment statistics
 * Returns counts and summary for manual payment orders
 */
export const getManualPaymentStats = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const [
      pendingCount,
      confirmedCount,
      totalManualPayments,
      totalManualRevenue,
      recentConfirmed
    ] = await Promise.all([
      // Count pending manual payments
      Order.countDocuments({
        paymentMethod: MANUAL_PAYMENT_METHOD,
        paymentStatus: PaymentStatus.PENDING
      }),
      // Count confirmed manual payments
      Order.countDocuments({
        paymentMethod: MANUAL_PAYMENT_METHOD,
        paymentStatus: 'paid'
      }),
      // Total manual payment orders
      Order.countDocuments({
        paymentMethod: MANUAL_PAYMENT_METHOD
      }),
      // Total revenue from manual payments
      Order.aggregate([
        { 
          $match: { 
            paymentMethod: MANUAL_PAYMENT_METHOD,
            paymentStatus: 'paid'
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      // Recent confirmed orders
      Order.find({
        paymentMethod: MANUAL_PAYMENT_METHOD,
        paymentStatus: 'paid'
      })
        .populate('user', 'name email')
        .sort({ 'paymentDetails.confirmedAt': -1 })
        .limit(5)
        .lean()
    ]);

    res.status(200).json({
      success: true,
      data: {
        pending: pendingCount,
        confirmed: confirmedCount,
        total: totalManualPayments,
        totalRevenue: totalManualRevenue[0]?.total || 0,
        recentConfirmed
      }
    });
  } catch (error) {
    next(error);
  }
};
