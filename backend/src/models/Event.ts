import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  eventType: string;
  userId?: mongoose.Types.ObjectId;
  anonymousId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  createdAt: Date;
}

const EventSchema: Schema = new Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: [
        // Product events
        'product_viewed',
        'product_search',
        
        // Cart events
        'added_to_cart',
        'removed_from_cart',
        'cart_viewed',
        
        // Checkout events
        'checkout_started',
        'checkout_info_completed',
        'payment_method_selected',
        'payment_attempted',
        'payment_completed',
        'payment_failed',
        
        // Order events
        'order_created',
        'order_cancelled',
        
        // Page events
        'page_viewed'
      ],
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true
    },
    anonymousId: {
      type: String,
      required: false,
      index: true
    },
    requestId: {
      type: String,
      required: false
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient querying
EventSchema.index({ eventType: 1, timestamp: -1 });
EventSchema.index({ userId: 1, timestamp: -1 });
EventSchema.index({ anonymousId: 1, timestamp: -1 });
EventSchema.index({ eventType: 1, userId: 1, timestamp: -1 });

// TTL index - auto delete events older than 90 days
EventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model<IEvent>('Event', EventSchema);
