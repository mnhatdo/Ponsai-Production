import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';
import Product from '../models/Product';
import Category from '../models/Category';
import Order from '../models/Order';
import User from '../models/User';
import Blog from '../models/Blog';
import Promotion from '../models/Promotion';
import AuditLog from '../models/AuditLog';
import * as XLSX from 'xlsx';

// Helper to create audit log
const createAuditLog = async (
  req: AuthRequest,
  action: string,
  details?: any
) => {
  try {
    await AuditLog.create({
      action,
      entityType: 'system',
      user: req.user?.id,
      userName: req.user?.name || req.user?.email,
      userRole: req.user?.role,
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      newData: details,
      status: 'success'
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

// Export full database backup
export const exportFullBackup = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const [
      products,
      categories,
      orders,
      users,
      blogs,
      promotions
    ] = await Promise.all([
      Product.find().lean(),
      Category.find().lean(),
      Order.find().lean(),
      User.find().select('-password').lean(),
      Blog.find().lean(),
      Promotion.find().lean()
    ]);

    const backup = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      data: {
        products: { count: products.length, items: products },
        categories: { count: categories.length, items: categories },
        orders: { count: orders.length, items: orders },
        users: { count: users.length, items: users },
        blogs: { count: blogs.length, items: blogs },
        promotions: { count: promotions.length, items: promotions }
      }
    };

    await createAuditLog(req, 'database_backup', {
      type: 'full_export',
      counts: {
        products: products.length,
        categories: categories.length,
        orders: orders.length,
        users: users.length,
        blogs: blogs.length,
        promotions: promotions.length
      }
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=ponsai-backup-${new Date().toISOString().split('T')[0]}.json`);
    
    res.status(200).json(backup);
  } catch (error) {
    next(error);
  }
};

// Export specific collection
export const exportCollection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { collection } = req.params;
    
    const models: Record<string, any> = {
      products: Product,
      categories: Category,
      orders: Order,
      users: User,
      blogs: Blog,
      promotions: Promotion
    };

    const Model = models[collection];
    if (!Model) {
      res.status(400).json({
        success: false,
        message: 'Invalid collection name'
      });
      return;
    }

    let data;
    if (collection === 'users') {
      data = await Model.find().select('-password').lean();
    } else {
      data = await Model.find().lean();
    }

    const backup = {
      exportedAt: new Date().toISOString(),
      collection,
      count: data.length,
      data
    };

    await createAuditLog(req, 'collection_export', {
      collection,
      count: data.length
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${collection}-${new Date().toISOString().split('T')[0]}.json`);
    
    res.status(200).json(backup);
  } catch (error) {
    next(error);
  }
};

// Get database statistics
export const getDatabaseStats = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const [
      productsCount,
      categoriesCount,
      ordersCount,
      usersCount,
      blogsCount,
      promotionsCount,
      auditLogsCount
    ] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Order.countDocuments(),
      User.countDocuments(),
      Blog.countDocuments(),
      Promotion.countDocuments(),
      AuditLog.countDocuments()
    ]);

    // Get database size info (MongoDB)
    const dbStats = await mongoose.connection.db?.stats();

    res.status(200).json({
      success: true,
      data: {
        collections: {
          products: productsCount,
          categories: categoriesCount,
          orders: ordersCount,
          users: usersCount,
          blogs: blogsCount,
          promotions: promotionsCount,
          auditLogs: auditLogsCount
        },
        database: {
          name: dbStats?.db || 'ponsai',
          collections: dbStats?.collections || 0,
          dataSize: formatBytes(dbStats?.dataSize || 0),
          storageSize: formatBytes(dbStats?.storageSize || 0),
          indexSize: formatBytes(dbStats?.indexSize || 0)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Export products to Excel
export const exportProductsExcel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const products = await Product.find()
      .populate('category', 'name')
      .lean();

    // Prepare data for Excel
    const data = products.map((product: any) => ({
      'Product ID': product._id.toString(),
      'Name': product.name,
      'SKU': product.sku || '',
      'Category': product.category?.name || '',
      'Price': product.price,
      'Sale Price': product.salePrice || '',
      'Stock': product.stock,
      'Status': product.isActive ? 'Active' : 'Inactive',
      'Featured': product.isFeatured ? 'Yes' : 'No',
      'Description': product.description?.replace(/<[^>]*>/g, '') || '',
      'Created At': new Date(product.createdAt).toLocaleDateString('vi-VN')
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Product ID
      { wch: 40 }, // Name
      { wch: 15 }, // SKU
      { wch: 20 }, // Category
      { wch: 12 }, // Price
      { wch: 12 }, // Sale Price
      { wch: 10 }, // Stock
      { wch: 10 }, // Status
      { wch: 10 }, // Featured
      { wch: 50 }, // Description
      { wch: 15 }  // Created At
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Products');

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    await createAuditLog(req, 'products_excel_export', {
      count: products.length
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=products-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    res.status(200).send(buf);
  } catch (error) {
    next(error);
  }
};

// Export orders to Excel
export const exportOrdersExcel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .lean();

    // Prepare data for Excel
    const data = orders.map((order: any) => ({
      'Order ID': order.orderNumber || order._id.toString(),
      'Customer': order.user?.name || 'Guest',
      'Email': order.user?.email || order.shippingAddress?.email || '',
      'Total Amount': order.totalAmount,
      'Payment Method': order.paymentMethod,
      'Payment Status': order.paymentStatus,
      'Order Status': order.orderStatus,
      'Items Count': order.items?.length || 0,
      'Shipping Address': `${order.shippingAddress?.street || ''}, ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.country || ''}`,
      'Created At': new Date(order.createdAt).toLocaleDateString('vi-VN')
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Order ID
      { wch: 25 }, // Customer
      { wch: 30 }, // Email
      { wch: 15 }, // Total Amount
      { wch: 20 }, // Payment Method
      { wch: 15 }, // Payment Status
      { wch: 15 }, // Order Status
      { wch: 12 }, // Items Count
      { wch: 50 }, // Shipping Address
      { wch: 15 }  // Created At
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Orders');

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    await createAuditLog(req, 'orders_excel_export', {
      count: orders.length
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=orders-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    res.status(200).send(buf);
  } catch (error) {
    next(error);
  }
};

// Export customers to Excel
export const exportCustomersExcel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const customers = await User.find({ role: 'user' })
      .lean();

    // Prepare data for Excel
    const data = customers.map((customer: any) => ({
      'Customer ID': customer._id.toString(),
      'Name': customer.name,
      'Email': customer.email,
      'Phone': customer.phone || '',
      'Address': customer.address ? `${customer.address.street || ''}, ${customer.address.city || ''}, ${customer.address.country || ''}` : '',
      'Auth Provider': customer.authProvider || 'local',
      'Email Verified': customer.isEmailVerified ? 'Yes' : 'No',
      'Active': customer.isActive ? 'Yes' : 'No',
      'Joined Date': new Date(customer.createdAt).toLocaleDateString('vi-VN')
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Customer ID
      { wch: 25 }, // Name
      { wch: 30 }, // Email
      { wch: 15 }, // Phone
      { wch: 50 }, // Address
      { wch: 15 }, // Auth Provider
      { wch: 15 }, // Email Verified
      { wch: 10 }, // Active
      { wch: 15 }  // Joined Date
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Customers');

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    await createAuditLog(req, 'customers_excel_export', {
      count: customers.length
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=customers-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    res.status(200).send(buf);
  } catch (error) {
    next(error);
  }
};

export default {
  exportFullBackup,
  exportCollection,
  exportProductsExcel,
  exportOrdersExcel,
  exportCustomersExcel,
  getDatabaseStats
};
