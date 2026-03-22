import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  entityType: 'product' | 'category' | 'order' | 'user' | 'promotion' | 'inventory' | 'system';
  entityId?: mongoose.Types.ObjectId;
  entityName?: string;
  user: mongoose.Types.ObjectId;
  userName?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  previousData?: Record<string, any>;
  newData?: Record<string, any>;
  changes?: Record<string, { from: any; to: any }>;
  status: 'success' | 'failure';
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        // Product actions
        'product_create',
        'product_update',
        'product_delete',
        'product_bulk_delete',
        'product_import',
        'product_export',
        // Category actions
        'category_create',
        'category_update',
        'category_delete',
        // Order actions
        'order_view',
        'order_update_status',
        'order_cancel',
        'order_refund',
        'order_add_note',
        // User actions
        'user_create',
        'user_update',
        'user_delete',
        'user_role_change',
        'user_ban',
        'user_unban',
        // Promotion actions
        'promotion_create',
        'promotion_update',
        'promotion_delete',
        'promotion_activate',
        'promotion_deactivate',
        // Inventory actions
        'inventory_update',
        'inventory_adjustment',
        'stock_alert',
        // System actions
        'admin_login',
        'admin_logout',
        'settings_update',
        'export_data',
        'import_data'
      ]
    },
    entityType: {
      type: String,
      required: true,
      enum: ['product', 'category', 'order', 'user', 'promotion', 'inventory', 'system']
    },
    entityId: {
      type: Schema.Types.ObjectId
    },
    entityName: String,
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: String,
    userRole: String,
    ipAddress: String,
    userAgent: String,
    previousData: Schema.Types.Mixed,
    newData: Schema.Types.Mixed,
    changes: Schema.Types.Mixed,
    status: {
      type: String,
      enum: ['success', 'failure'],
      default: 'success'
    },
    errorMessage: String,
    metadata: Schema.Types.Mixed
  },
  {
    timestamps: true
  }
);

// Indexes for efficient querying
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ user: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ status: 1 });

// TTL index - auto delete logs older than 90 days
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
