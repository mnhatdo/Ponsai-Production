import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  product: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  userName: string;
  userEmail?: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  verified: boolean;
  helpful: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Review must belong to a product'],
      index: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    userName: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters']
    },
    userEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5']
    },
    title: {
      type: String,
      required: [true, 'Please provide a review title'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters']
    },
    comment: {
      type: String,
      required: [true, 'Please provide a review comment'],
      trim: true,
      maxlength: [2000, 'Comment cannot be more than 2000 characters']
    },
    images: {
      type: [String],
      default: []
    },
    verified: {
      type: Boolean,
      default: false,
      index: true
    },
    helpful: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound index để tránh duplicate reviews từ cùng user cho cùng product
ReviewSchema.index({ product: 1, user: 1 }, { unique: true, sparse: true });

// Index để query reviews theo rating
ReviewSchema.index({ product: 1, rating: -1 });

// Index để sort theo helpful
ReviewSchema.index({ product: 1, helpful: -1 });

// Static methods
ReviewSchema.statics.calcAverageRating = async function(productId: mongoose.Types.ObjectId) {
  const stats = await this.aggregate([
    {
      $match: { product: productId }
    },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        numReviews: { $sum: 1 }
      }
    }
  ]);

  try {
    await mongoose.model('Product').findByIdAndUpdate(productId, {
      rating: stats[0]?.avgRating || 0,
      reviews: stats[0]?.numReviews || 0
    });
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
};

// Post-save middleware để update product rating
ReviewSchema.post('save', function() {
  (this.constructor as any).calcAverageRating(this.product);
});

// Post-remove middleware để update product rating
ReviewSchema.post(/^findOneAndDelete/, async function(doc) {
  if (doc) {
    await (doc.constructor as any).calcAverageRating(doc.product);
  }
});

export default mongoose.model<IReview>('Review', ReviewSchema);
