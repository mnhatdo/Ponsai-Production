import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISettings extends Document {
  // Shop Information
  shopName: string;
  shopDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;

  // Order Settings
  currency: string;
  taxRate: number;
  shippingFee: number;
  freeShippingThreshold: number;
  orderPrefix: string;

  // Inventory Settings
  lowStockThreshold: number;

  // System Settings
  maintenanceMode: boolean;

  // Metadata
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for Settings Model with static methods
export interface ISettingsModel extends Model<ISettings> {
  getSettings(): Promise<ISettings>;
}

const SettingsSchema = new Schema<ISettings, ISettingsModel>(
  {
    // Shop Information
    shopName: {
      type: String,
      required: [true, 'Shop name is required'],
      default: 'Ponsai Store'
    },
    shopDescription: {
      type: String,
      default: 'Cửa hàng cây cảnh bonsai cao cấp'
    },
    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
      default: 'contact@ponsai.vn'
    },
    contactPhone: {
      type: String,
      default: '0123 456 789'
    },
    address: {
      type: String,
      default: '123 Đường ABC, Quận 1, TP.HCM'
    },

    // Order Settings
    currency: {
      type: String,
      enum: ['GBP', 'USD', 'VND'],
      default: 'GBP'
    },
    taxRate: {
      type: Number,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%'],
      default: 10
    },
    shippingFee: {
      type: Number,
      min: [0, 'Shipping fee cannot be negative'],
      default: 5
    },
    freeShippingThreshold: {
      type: Number,
      min: [0, 'Free shipping threshold cannot be negative'],
      default: 50
    },
    orderPrefix: {
      type: String,
      default: 'ORD',
      uppercase: true,
      trim: true
    },

    // Inventory Settings
    lowStockThreshold: {
      type: Number,
      min: [1, 'Low stock threshold must be at least 1'],
      default: 10
    },

    // System Settings
    maintenanceMode: {
      type: Boolean,
      default: false
    },

    // Metadata
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Static method to get or create settings
SettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const Settings = mongoose.model<ISettings, ISettingsModel>('Settings', SettingsSchema);

export default Settings;
