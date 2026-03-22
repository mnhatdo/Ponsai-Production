/**
 * Session Model - Session-based Visit Tracking
 * 
 * Tracks unique website sessions with 30-minute expiry for ML analytics
 * 
 * Academic Purpose:
 * - Demonstrates session management for user behavior tracking
 * - Provides data for ML feature engineering (visits per day)
 * - Implements automatic expiration using MongoDB TTL indexes
 */

import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISession extends Document {
  sessionId: string; // Unique session identifier
  ipAddress: string; // Client IP address
  userAgent: string; // Browser/device information
  userId?: mongoose.Types.ObjectId; // Optional: linked user if authenticated
  startTime: Date; // When session started
  lastActivity: Date; // Last interaction time (for 30-min expiry)
  expiresAt: Date; // Automatic expiry (30 minutes after last activity)
  pageViews: number; // Number of pages viewed in this session
  isActive: boolean; // Whether session is currently active
  createdAt: Date;
  updatedAt: Date;
  // Instance methods
  updateActivity(): Promise<this>;
  endSession(): Promise<this>;
}

export interface ISessionModel extends Model<ISession> {
  // Static methods
  findActiveSession(sessionId: string): Promise<ISession | null>;
  countByDateRange(startDate: Date, endDate: Date): Promise<number>;
}

const SessionSchema: Schema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    ipAddress: {
      type: String,
      required: true
    },
    userAgent: {
      type: String,
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now
    },
    lastActivity: {
      type: Date,
      required: true,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true,
      // Default: 30 minutes from now
      default: () => new Date(Date.now() + 30 * 60 * 1000)
    },
    pageViews: {
      type: Number,
      default: 1,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// TTL Index: Automatically delete expired sessions after 1 hour
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

// Compound index for efficient queries
SessionSchema.index({ startTime: 1, isActive: 1 });
SessionSchema.index({ userId: 1, startTime: -1 });

/**
 * Instance method: Update session activity
 * Extends expiration by 30 minutes
 */
SessionSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  this.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  this.pageViews += 1;
  return this.save();
};

/**
 * Instance method: End session
 */
SessionSchema.methods.endSession = function() {
  this.isActive = false;
  this.expiresAt = new Date(); // Expire immediately
  return this.save();
};

/**
 * Static method: Get active session by sessionId
 */
SessionSchema.statics.findActiveSession = function(sessionId: string) {
  return this.findOne({
    sessionId,
    isActive: true,
    expiresAt: { $gt: new Date() }
  });
};

/**
 * Static method: Count sessions for a date range
 */
SessionSchema.statics.countSessionsByDateRange = function(startDate: Date, endDate: Date) {
  return this.countDocuments({
    startTime: {
      $gte: startDate,
      $lte: endDate
    }
  });
};

export default mongoose.model<ISession, ISessionModel>('Session', SessionSchema);
