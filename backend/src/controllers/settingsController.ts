import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import Settings from '../models/Settings';
import AuditLog from '../models/AuditLog';
import exchangeRateService from '../services/exchangeRateService';

// Helper to create audit log
const createAuditLog = async (
  req: AuthRequest,
  action: string,
  oldData?: any,
  newData?: any
) => {
  try {
    const auditLogData = {
      action,
      entityType: 'system',
      user: req.user?.id,
      userName: req.user?.name || req.user?.email,
      userRole: req.user?.role,
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      oldData,
      newData,
      status: 'success'
    };
    await AuditLog.create(auditLogData);
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

/**
 * @desc    Get shop settings
 * @route   GET /api/v1/admin/settings
 * @access  Private/Admin
 */
export const getSettings = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Use static method to get or create settings
    const settings = await (Settings as any).getSettings();

    // Get current exchange rates
    const exchangeRates = await exchangeRateService.getAllRates();

    res.status(200).json({
      success: true,
      data: settings,
      exchangeRates: exchangeRates
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update shop settings
 * @route   PUT /api/v1/admin/settings
 * @access  Private/Admin
 */
export const updateSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get current settings
    const currentSettings = await (Settings as any).getSettings();
    const oldData = currentSettings.toObject();

    // Update settings
    const allowedFields = [
      'shopName',
      'shopDescription',
      'contactEmail',
      'contactPhone',
      'address',
      'currency',
      'taxRate',
      'shippingFee',
      'freeShippingThreshold',
      'orderPrefix',
      'lowStockThreshold',
      'maintenanceMode'
    ];

    // Only update allowed fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        (currentSettings as any)[field] = req.body[field];
      }
    });

    // Set updatedBy
    currentSettings.updatedBy = req.user?.id;

    // Validate before saving
    await currentSettings.validate();

    // Save settings
    await currentSettings.save();

    // Create audit log
    const changes: any = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined && oldData[field] !== req.body[field]) {
        changes[field] = {
          old: oldData[field],
          new: req.body[field]
        };
      }
    });

    await createAuditLog(
      req,
      'settings_update',
      oldData,
      { changes }
    );

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: currentSettings
    });
  } catch (error: any) {
    // Validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
      return;
    }
    next(error);
  }
};

/**
 * @desc    Reset settings to default
 * @route   POST /api/v1/admin/settings/reset
 * @access  Private/Admin
 */
export const resetSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const currentSettings = await (Settings as any).getSettings();
    const oldData = currentSettings.toObject();

    // Reset to defaults
    currentSettings.shopName = 'Ponsai Store';
    currentSettings.shopDescription = 'Cửa hàng cây cảnh bonsai cao cấp';
    currentSettings.contactEmail = 'contact@ponsai.vn';
    currentSettings.contactPhone = '0123 456 789';
    currentSettings.address = '123 Đường ABC, Quận 1, TP.HCM';
    currentSettings.currency = 'GBP';
    currentSettings.taxRate = 10;
    currentSettings.shippingFee = 5;
    currentSettings.freeShippingThreshold = 50;
    currentSettings.orderPrefix = 'ORD';
    currentSettings.lowStockThreshold = 10;
    currentSettings.maintenanceMode = false;
    currentSettings.updatedBy = req.user?.id;

    await currentSettings.save();

    // Create audit log
    await createAuditLog(
      req,
      'settings_reset',
      oldData,
      { message: 'Settings reset to default values' }
    );

    res.status(200).json({
      success: true,
      message: 'Settings reset to defaults',
      data: currentSettings
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getSettings,
  updateSettings,
  resetSettings
};
