import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import * as adminController from '../controllers/adminController';
import * as blogController from '../controllers/blogController';
import * as backupController from '../controllers/backupController';
import * as settingsController from '../controllers/settingsController';
import analyticsController from '../controllers/analyticsController';
import eventAnalyticsRoutes from './eventAnalyticsRoutes';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Rate limiting for admin routes
const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Apply protection and admin authorization to all routes
router.use(protect);
router.use(authorize('admin'));
router.use(adminRateLimiter);

// ================================
// DASHBOARD
// ================================
router.get('/dashboard', adminController.getDashboardStats);

// ================================
// PRODUCTS
// ================================
router.get('/products', adminController.getAdminProducts);
router.get('/products/:id', adminController.getAdminProductById);
router.post('/products', adminController.createAdminProduct);
router.put('/products/:id', adminController.updateAdminProduct);
router.delete('/products/:id', adminController.deleteAdminProduct);
router.delete('/products', adminController.bulkDeleteProducts);
router.patch('/products/:id/stock', adminController.updateProductStock);

// ================================
// CATEGORIES
// ================================
router.get('/categories', adminController.getAdminCategories);
router.post('/categories', adminController.createAdminCategory);
router.put('/categories/:id', adminController.updateAdminCategory);
router.delete('/categories/:id', adminController.deleteAdminCategory);

// ================================
// ORDERS
// ================================
router.get('/orders', adminController.getAdminOrders);
router.get('/orders/:id', adminController.getAdminOrderById);
router.patch('/orders/:id/status', adminController.updateOrderStatus);
router.patch('/orders/:id/cancel', adminController.cancelOrder);

// ================================
// USERS/CUSTOMERS
// ================================
router.get('/users', adminController.getAdminUsers);
router.get('/users/:id', adminController.getAdminUserById);
router.patch('/users/:id/role', adminController.updateUserRole);
router.patch('/users/:id/status', adminController.toggleUserStatus);

// ================================
// PROMOTIONS
// ================================
router.get('/promotions', adminController.getAdminPromotions);
router.post('/promotions', adminController.createAdminPromotion);
router.put('/promotions/:id', adminController.updateAdminPromotion);
router.delete('/promotions/:id', adminController.deleteAdminPromotion);
router.patch('/promotions/:id/status', adminController.togglePromotionStatus);

// ================================
// INVENTORY
// ================================
router.get('/inventory/low-stock', adminController.getLowStockProducts);
router.patch('/inventory/:id/stock', adminController.updateInventoryStock);
router.patch('/inventory/bulk-update', adminController.bulkUpdateStock);

// ================================
// AUDIT LOGS
// ================================
router.get('/audit-logs', adminController.getAuditLogs);

// ================================
// BLOGS
// ================================
router.get('/blogs', blogController.getAdminBlogs);
router.get('/blogs/stats', blogController.getBlogStats);
router.get('/blogs/:id', blogController.getAdminBlogById);
router.post('/blogs', blogController.createBlog);
router.put('/blogs/:id', blogController.updateBlog);
router.delete('/blogs/:id', blogController.deleteBlog);
router.post('/blogs/bulk-delete', blogController.bulkDeleteBlogs);
router.patch('/blogs/:id/toggle-status', blogController.toggleBlogStatus);
router.patch('/blogs/:id/toggle-featured', blogController.toggleBlogFeatured);

// ================================
// MANUAL PAYMENT MANAGEMENT
// ================================
router.get('/payments/manual/pending', adminController.getPendingManualPayments);
router.get('/payments/manual/stats', adminController.getManualPaymentStats);
router.patch('/payments/manual/:id/confirm', adminController.confirmManualPayment);

// ================================
// BANK TRANSFER MANAGEMENT
// ================================
router.patch('/payments/bank-transfer/:id/confirm', adminController.confirmBankTransfer);

// ================================
// BACKUP & EXPORT
// ================================
router.get('/backup/full', backupController.exportFullBackup);
router.get('/backup/collection/:collection', backupController.exportCollection);
router.get('/backup/products/excel', backupController.exportProductsExcel);
router.get('/backup/orders/excel', backupController.exportOrdersExcel);
router.get('/backup/customers/excel', backupController.exportCustomersExcel);
router.get('/backup/stats', backupController.getDatabaseStats);

// ================================
// SETTINGS
// ================================
router.get('/settings', settingsController.getSettings);
router.put('/settings', settingsController.updateSettings);
router.post('/settings/reset', settingsController.resetSettings);

// ================================
// ANALYTICS (Wave 1 - Trustworthy Data Only)
// ================================

// Revenue Analytics
router.get('/analytics/revenue', analyticsController.getRevenueMetrics);
router.get('/analytics/revenue-by-method', analyticsController.getRevenueByPaymentMethod);
router.get('/analytics/revenue-monthly', analyticsController.getMonthlyRevenue);

// Customer Retention
router.get('/analytics/retention', analyticsController.getCustomerRetention);
router.get('/analytics/new-vs-returning', analyticsController.getNewVsReturningCustomers);

// Product Performance
router.get('/analytics/products/top', analyticsController.getTopProducts);
router.get('/analytics/products/zero-sales', analyticsController.getZeroSalesProducts);

// Payment Health
router.get('/analytics/payment-health', analyticsController.getPaymentMethodHealth);
router.get('/analytics/payment-timing', analyticsController.getPaymentTiming);

// Operational Metrics
router.get('/analytics/operations', analyticsController.getOperationalMetrics);

// Comprehensive Overview
router.get('/analytics/overview', analyticsController.getAnalyticsOverview);

// ================================
// EVENT ANALYTICS (Wave 2 - User Behavior Insights)
// ================================
router.use('/analytics/events', eventAnalyticsRoutes);

export default router;
