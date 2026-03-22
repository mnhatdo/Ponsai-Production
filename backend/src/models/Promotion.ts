import mongoose, { Document, Schema } from 'mongoose';

export interface IPromotion extends Document {
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'free_shipping' | 'buy_x_get_y';
  value: number; // percentage (0-100) or fixed amount
  minOrderAmount?: number;
  maxDiscount?: number; // maximum discount amount for percentage type
  usageLimit?: number; // total usage limit
  usagePerUser?: number; // usage limit per user
  usedCount: number;
  applicableProducts?: mongoose.Types.ObjectId[]; // specific products
  applicableCategories?: mongoose.Types.ObjectId[]; // specific categories
  excludedProducts?: mongoose.Types.ObjectId[];
  startDate: Date;
  endDate: Date;
  active: boolean;
  createdBy: mongoose.Types.ObjectId;
  usedBy?: Array<{
    user: mongoose.Types.ObjectId;
    usedAt: Date;
    orderId: mongoose.Types.ObjectId;
    discountAmount: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const PromotionSchema: Schema = new Schema(
  {
    code: {
      type: String,
      required: [true, 'Please provide a promotion code'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, 'Code cannot be more than 20 characters']
    },
    name: {
      type: String,
      required: [true, 'Please provide a promotion name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters']
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'free_shipping', 'buy_x_get_y'],
      required: [true, 'Please specify promotion type']
    },
    value: {
      type: Number,
      required: [true, 'Please provide a promotion value'],
      min: [0, 'Value cannot be negative']
    },
    minOrderAmount: {
      type: Number,
      min: [0, 'Minimum order amount cannot be negative'],
      default: 0
    },
    maxDiscount: {
      type: Number,
      min: [0, 'Maximum discount cannot be negative']
    },
    usageLimit: {
      type: Number,
      min: [0, 'Usage limit cannot be negative']
    },
    usagePerUser: {
      type: Number,
      min: [1, 'Usage per user must be at least 1'],
      default: 1
    },
    usedCount: {
      type: Number,
      default: 0
    },
    applicableProducts: [{
      type: Schema.Types.ObjectId,
      ref: 'Product'
    }],
    applicableCategories: [{
      type: Schema.Types.ObjectId,
      ref: 'Category'
    }],
    excludedProducts: [{
      type: Schema.Types.ObjectId,
      ref: 'Product'
    }],
    startDate: {
      type: Date,
      required: [true, 'Please provide a start date']
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide an end date']
    },
    active: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
      // Not required to allow seed data without users
    },
    usedBy: [{
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      usedAt: { type: Date, default: Date.now },
      orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
      discountAmount: { type: Number }
    }]
  },
  {
    timestamps: true
  }
);

// Indexes
PromotionSchema.index({ code: 1 });
PromotionSchema.index({ startDate: 1, endDate: 1 });
PromotionSchema.index({ active: 1 });

// Validate end date is after start date
PromotionSchema.pre('save', function (this: IPromotion, next) {
  if (this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }
  next();
});

// Method to check if promotion is valid
PromotionSchema.methods.isValid = function (): boolean {
  const now = new Date();
  return (
    this.active &&
    now >= this.startDate &&
    now <= this.endDate &&
    (this.usageLimit === undefined || this.usedCount < this.usageLimit)
  );
};

// Method to calculate discount
PromotionSchema.methods.calculateDiscount = function (
  orderTotal: number
): number {
  if (orderTotal < (this.minOrderAmount || 0)) {
    return 0;
  }

  let discount = 0;
  
  switch (this.type) {
    case 'percentage':
      discount = (orderTotal * this.value) / 100;
      if (this.maxDiscount) {
        discount = Math.min(discount, this.maxDiscount);
      }
      break;
    case 'fixed':
      discount = this.value;
      break;
    case 'free_shipping':
      // This would be handled differently in the order logic
      discount = 0;
      break;
  }

  return Math.min(discount, orderTotal); // Don't exceed order total
};

export default mongoose.model<IPromotion>('Promotion', PromotionSchema);
