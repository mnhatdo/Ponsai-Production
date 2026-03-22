/**
 * PageVisit Model - Individual Page View Tracking
 * 
 * Records each page view within a session for detailed analytics
 * 
 * Academic Purpose:
 * - Tracks user navigation patterns
 * - Provides granular data for funnel analysis
 * - Supports conversion optimization research
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IPageVisit extends Document {
  session: mongoose.Types.ObjectId; // Reference to Session
  sessionId: string; // Denormalized for faster queries
  url: string; // Page URL visited
  path: string; // URL path (e.g., /products/123)
  title?: string; // Page title
  referrer?: string; // Previous page/external source
  timestamp: Date; // When page was visited
  timeOnPage?: number; // Seconds spent on page (calculated)
  createdAt: Date;
}

const PageVisitSchema: Schema = new Schema(
  {
    session: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      index: true
    },
    sessionId: {
      type: String,
      required: true,
      index: true
    },
    url: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true,
      index: true // For analyzing popular pages
    },
    title: {
      type: String
    },
    referrer: {
      type: String
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    timeOnPage: {
      type: Number, // in seconds
      min: 0
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Compound indexes for efficient queries
PageVisitSchema.index({ timestamp: 1, path: 1 });
PageVisitSchema.index({ session: 1, timestamp: 1 });

/**
 * Static method: Get popular pages for date range
 */
PageVisitSchema.statics.getPopularPages = function(startDate: Date, endDate: Date, limit = 10) {
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$path',
        views: { $sum: 1 },
        uniqueSessions: { $addToSet: '$sessionId' }
      }
    },
    {
      $project: {
        path: '$_id',
        views: 1,
        uniqueVisitors: { $size: '$uniqueSessions' }
      }
    },
    {
      $sort: { views: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

export default mongoose.model<IPageVisit>('PageVisit', PageVisitSchema);
