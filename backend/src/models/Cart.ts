import mongoose, { Document, Schema } from 'mongoose';

export interface ICartItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
  updatedAt: Date;
  createdAt: Date;
}

const CartItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const CartSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    items: [CartItemSchema]
  },
  {
    timestamps: true
  }
);

// Note: Index on 'user' field is automatically created by unique: true option above
// No need for manual index: CartSchema.index({ user: 1 });

// Method to calculate total
CartSchema.methods.calculateTotal = function(): number {
  return this.items.reduce((total: number, item: ICartItem) => {
    return total + (item.price * item.quantity);
  }, 0);
};

// Method to get item count
CartSchema.methods.getItemCount = function(): number {
  return this.items.reduce((count: number, item: ICartItem) => {
    return count + item.quantity;
  }, 0);
};

export default mongoose.model<ICart>('Cart', CartSchema);
