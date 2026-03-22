/**
 * Prediction Model - ML Prediction History
 * 
 * Stores prediction requests and results for audit trail and analysis
 * 
 * Academic Purpose:
 * - Maintains prediction history for model evaluation
 * - Enables comparison of predicted vs actual values over time
 * - Supports model performance monitoring
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IPrediction extends Document {
  // Model Used
  trainedModel: mongoose.Types.ObjectId; // Reference to TrainedModel
  modelName: string; // Denormalized for quick reference
  modelType: 'revenue' | 'orders';
  
  // Input Features (used for prediction)
  inputFeatures: {
    [key: string]: number; // e.g., { visits: 1000, orders: 50 }
  };
  
  // Prediction Results
  predictedValue: number; // The ML model's prediction
  predictedDate?: Date; // What date is being predicted (if applicable)
  confidence?: number; // Confidence score if available (0-1)
  
  // Actual Value (filled in later for comparison)
  actualValue?: number; // Real observed value
  actualRecordedAt?: Date; // When actual value was recorded
  
  // Error Metrics (calculated after actual value is known)
  absoluteError?: number; // |predicted - actual|
  percentageError?: number; // (|predicted - actual| / actual) * 100
  
  // Metadata
  requestedBy: mongoose.Types.ObjectId; // Admin who requested prediction
  requestedByName: string;
  requestedAt: Date;
  
  // Additional Context
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const PredictionSchema: Schema = new Schema(
  {
    // Model Used
    trainedModel: {
      type: Schema.Types.ObjectId,
      ref: 'TrainedModel',
      required: true,
      index: true
    },
    modelName: {
      type: String,
      required: true
    },
    modelType: {
      type: String,
      required: true,
      enum: ['revenue', 'orders'],
      index: true
    },
    
    // Input Features
    inputFeatures: {
      type: Map,
      of: Number,
      required: true
    },
    
    // Prediction Results
    predictedValue: {
      type: Number,
      required: true
    },
    predictedDate: {
      type: Date
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    
    // Actual Value
    actualValue: {
      type: Number
    },
    actualRecordedAt: {
      type: Date
    },
    
    // Error Metrics
    absoluteError: {
      type: Number,
      min: 0
    },
    percentageError: {
      type: Number
    },
    
    // Metadata
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    requestedByName: {
      type: String,
      required: true
    },
    requestedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    
    notes: {
      type: String,
      maxlength: 500
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
PredictionSchema.index({ requestedAt: -1 });
PredictionSchema.index({ trainedModel: 1, requestedAt: -1 });
PredictionSchema.index({ modelType: 1, requestedAt: -1 });

/**
 * Instance method: Record actual value and calculate error
 */
PredictionSchema.methods.recordActualValue = function(actualValue: number) {
  this.actualValue = actualValue;
  this.actualRecordedAt = new Date();
  
  // Calculate error metrics
  this.absoluteError = Math.abs(this.predictedValue - actualValue);
  
  if (actualValue !== 0) {
    this.percentageError = (this.absoluteError / Math.abs(actualValue)) * 100;
  }
  
  return this.save();
};

/**
 * Static method: Get predictions by model
 */
PredictionSchema.statics.getPredictionsByModel = function(modelId: mongoose.Types.ObjectId) {
  return this.find({ trainedModel: modelId }).sort({ requestedAt: -1 });
};

/**
 * Static method: Get prediction accuracy for a model
 */
PredictionSchema.statics.getModelAccuracy = async function(modelId: mongoose.Types.ObjectId) {
  const predictions = await this.find({
    trainedModel: modelId,
    actualValue: { $exists: true, $ne: null }
  });
  
  if (predictions.length === 0) {
    return null;
  }
  
  const avgAbsoluteError = predictions.reduce((sum, p) => sum + (p.absoluteError || 0), 0) / predictions.length;
  const avgPercentageError = predictions.reduce((sum, p) => sum + (p.percentageError || 0), 0) / predictions.length;
  
  return {
    totalPredictions: predictions.length,
    avgAbsoluteError,
    avgPercentageError
  };
};

export default mongoose.model<IPrediction>('Prediction', PredictionSchema);
