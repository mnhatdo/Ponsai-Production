import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  orderNumber: string;
  user: mongoose.Types.ObjectId;
  items: Array<{
    product: mongoose.Types.ObjectId;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  status: 'created' | 'pending' | 'pending_manual_payment' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'created' | 'pending' | 'pending_manual_payment' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod?: 'momo' | 'manual_payment' | 'cod' | 'card' | 'bank_transfer' | string;
  paymentDetails?: {
    gateway?: string; // 'momo', 'manual_payment', 'cod', 'bank_transfer', etc.
    transactionId?: string; // MOMO transId or bank transaction ID
    momoOrderId?: string; // MOMO orderId
    momoRequestId?: string; // MOMO requestId
    resultCode?: number; // MOMO resultCode
    paidAt?: Date; // When payment was confirmed
    amountGBP?: number; // Original amount in GBP (for MoMo payments)
    amountVND?: number; // Converted amount in VND (for MoMo payments)
    // Manual payment specific fields
    confirmedAt?: Date; // When manual payment was confirmed by admin
    confirmedBy?: mongoose.Types.ObjectId; // Admin user who confirmed payment
    confirmedByName?: string; // Admin name for quick reference
    manualPaymentNote?: string; // Optional note from admin
    // Bank transfer specific fields
    reference?: string; // Payment reference code (e.g., GBPORD-12345678)
    invoiceNumber?: string; // Invoice number (e.g., INV-2024-001234)
    invoiceIssuedAt?: Date; // When invoice was generated
    invoiceDueDate?: Date; // Payment due date
  };
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      trim: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        price: {
          type: Number,
          required: true,
          min: 0
        }
      }
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true }
    },
    status: {
      type: String,
      enum: ['created', 'pending', 'pending_manual_payment', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'created'
    },
    paymentStatus: {
      type: String,
      enum: ['created', 'pending', 'pending_manual_payment', 'paid', 'failed', 'refunded', 'cancelled'],
      default: 'created'
    },
    paymentMethod: {
      type: String,
      enum: ['momo', 'manual_payment', 'cod', 'card', 'bank_transfer', null],
      default: null
    },
    paymentDetails: {
      gateway: String,
      transactionId: String,
      momoOrderId: String,
      momoRequestId: String,
      resultCode: Number,
      paidAt: Date,
      amountGBP: Number, // Original amount in GBP
      amountVND: Number,  // Converted amount in VND
      // Manual payment specific fields
      confirmedAt: Date,
      confirmedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      confirmedByName: String,
      manualPaymentNote: String
    },
    trackingNumber: String,
    notes: String
  },
  {
    timestamps: true
  }
);

// Indexes
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ paymentStatus: 1, createdAt: -1 }); // For analytics queries

export default mongoose.model<IOrder>('Order', OrderSchema);
