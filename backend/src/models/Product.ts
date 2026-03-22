import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug?: string;
  sku?: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  originalCurrency?: string;
  category: mongoose.Types.ObjectId;
  productType?: string;
  images: string[];
  primaryImage?: string;
  inStock: boolean;
  stockQuantity: number;
  featured: boolean;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
    unit: string;
  };
  materials?: string[];
  colors?: string[];
  tags?: string[];
  externalId?: string;
  externalUrl?: string;
  brandId?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
  rating?: number;
  reviews?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
      maxlength: [200, 'Name cannot be more than 200 characters']
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true
    },
    sku: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },
    description: {
      type: String,
      required: [true, 'Please provide a product description'],
      maxlength: [5000, 'Description cannot be more than 5000 characters']
    },
    shortDescription: {
      type: String,
      maxlength: [500, 'Short description cannot be more than 500 characters']
    },
    price: {
      type: Number,
      required: [true, 'Please provide a product price'],
      min: [0, 'Price cannot be negative']
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative']
    },
    originalCurrency: {
      type: String,
      default: 'USD'
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please provide a category']
    },
    productType: {
      type: String,
      trim: true
    },
    images: {
      type: [String],
      default: []
    },
    primaryImage: {
      type: String
    },
    inStock: {
      type: Boolean,
      default: true
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Stock quantity cannot be negative']
    },
    featured: {
      type: Boolean,
      default: false
    },
    dimensions: {
      width: Number,
      height: Number,
      depth: Number,
      unit: {
        type: String,
        enum: ['cm', 'in', 'm'],
        default: 'cm'
      }
    },
    materials: [String],
    colors: [String],
    tags: [String],
    externalId: {
      type: String,
      index: true
    },
    externalUrl: String,
    brandId: String,
    seo: {
      metaTitle: String,
      metaDescription: String
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    reviews: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Indexes (avoiding duplicates from inline index: true definitions)
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
// slug index already defined inline
// sku index already defined inline with unique+sparse
ProductSchema.index({ category: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ featured: 1 });
ProductSchema.index({ inStock: 1 });
// externalId index already defined inline
ProductSchema.index({ productType: 1 });
// Compound indexes for common queries (optimize sort + filter)
ProductSchema.index({ createdAt: -1, featured: 1 });
ProductSchema.index({ category: 1, createdAt: -1 });
ProductSchema.index({ featured: 1, createdAt: -1 });

export default mongoose.model<IProduct>('Product', ProductSchema);
