import mongoose, { Document, Schema } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  images?: string[];
  author: mongoose.Types.ObjectId;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  viewCount: number;
  likes: number;
  featured: boolean;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    excerpt: {
      type: String,
      required: [true, 'Excerpt is required'],
      maxlength: [500, 'Excerpt cannot exceed 500 characters']
    },
    content: {
      type: String,
      required: [true, 'Content is required']
    },
    featuredImage: {
      type: String
    },
    images: [{
      type: String
    }],
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['tips', 'news', 'guides', 'stories', 'events']
    },
    tags: [{
      type: String,
      trim: true
    }],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft'
    },
    publishedAt: {
      type: Date
    },
    viewCount: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    featured: {
      type: Boolean,
      default: false
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String]
    }
  },
  {
    timestamps: true
  }
);

// Create indexes
BlogSchema.index({ status: 1, publishedAt: -1 });
BlogSchema.index({ category: 1 });
BlogSchema.index({ tags: 1 });
BlogSchema.index({ author: 1 });
BlogSchema.index({ title: 'text', content: 'text', excerpt: 'text' });

// Generate slug before saving
BlogSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = (this.title as string)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  
  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

export default mongoose.model<IBlog>('Blog', BlogSchema);
