/**
 * TrainedModel Model - ML Model Metadata Storage
 * 
 * Stores metadata for trained ML models (actual model files stored on disk)
 * 
 * Academic Purpose:
 * - Demonstrates ML model versioning and management
 * - Tracks model performance metrics for comparison
 * - Enables model reusability without retraining
 * 
 * Model Lifecycle:
 * 1. Admin triggers training with parameters
 * 2. ML service trains model and saves to disk
 * 3. Metadata stored in this collection
 * 4. Admin can reuse model for predictions
 */

import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ITrainedModel extends Document {
  // Model Identity
  modelName: string; // User-friendly name (e.g., "Revenue_6M_Linear_v1")
  modelType: 'revenue' | 'orders'; // What does it predict?
  
  // Training Parameters
  trainingRange: 3 | 6 | 12; // Months of data used for training
  trainingStartDate: Date; // Data range start
  trainingEndDate: Date; // Data range end
  
  // ML Algorithm Details
  algorithm: 'linear_regression' | 'multiple_linear_regression' | 'polynomial_regression';
  features: string[]; // Feature names used (e.g., ['visits', 'orders'])
  targetVariable: string; // What was predicted (e.g., 'revenue')
  
  // Model Storage
  modelFilePath: string; // Relative path to .joblib file (e.g., 'models/revenue_model_123.joblib')
  scalerFilePath?: string; // Path to feature scaler if used
  
  // Performance Metrics
  metrics: {
    r2Score: number; // Coefficient of determination (0 to 1, higher is better)
    rmse: number; // Root Mean Squared Error (lower is better)
    mae: number; // Mean Absolute Error (lower is better)
    mse?: number; // Mean Squared Error
    trainingSize: number; // Number of samples used for training
    testSize?: number; // Number of samples used for testing
  };
  
  // Instance methods
  incrementUsage(): Promise<this>;
  deactivate(): Promise<this>;
  
  // Metadata
  trainedBy: mongoose.Types.ObjectId; // Admin user who trained it
  trainedByName: string; // Admin name for quick reference
  trainedAt: Date; // When training completed
  
  // Usage Tracking
  usageCount: number; // How many times used for prediction
  lastUsedAt?: Date; // Last prediction time
  
  // Status
  isActive: boolean; // Whether model is available for use
  notes?: string; // Admin notes about this model
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ITrainedModelModel extends Model<ITrainedModel> {
  // Static methods
  getModelsByType(modelType: string): Promise<ITrainedModel[]>;
  getBestModel(modelType: string): Promise<ITrainedModel | null>;
}

const TrainedModelSchema: Schema = new Schema(
  {
    modelName: {
      type: String,
      required: true,
      trim: true
    },
    modelType: {
      type: String,
      required: true,
      enum: ['revenue', 'orders'],
      index: true // For filtering by type
    },
    
    // Training Parameters
    trainingRange: {
      type: Number,
      required: true,
      enum: [3, 6, 12]
    },
    trainingStartDate: {
      type: Date,
      required: true
    },
    trainingEndDate: {
      type: Date,
      required: true
    },
    
    // Algorithm Details
    algorithm: {
      type: String,
      required: true,
      enum: ['linear_regression', 'multiple_linear_regression', 'polynomial_regression'],
      default: 'linear_regression'
    },
    features: {
      type: [String],
      required: true
    },
    targetVariable: {
      type: String,
      required: true
    },
    
    // Model Storage
    modelFilePath: {
      type: String,
      required: true,
      unique: true
    },
    scalerFilePath: {
      type: String
    },
    
    // Performance Metrics
    metrics: {
      r2Score: {
        type: Number,
        required: true,
        min: -1,
        max: 1
      },
      rmse: {
        type: Number,
        required: true,
        min: 0
      },
      mae: {
        type: Number,
        required: true,
        min: 0
      },
      mse: {
        type: Number,
        min: 0
      },
      trainingSize: {
        type: Number,
        required: true,
        min: 1
      },
      testSize: {
        type: Number,
        min: 0
      }
    },
    
    // Metadata
    trainedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    trainedByName: {
      type: String,
      required: true
    },
    trainedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    
    // Usage Tracking
    usageCount: {
      type: Number,
      default: 0,
      min: 0
    },
    lastUsedAt: {
      type: Date
    },
    
    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true
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

// Compound indexes for efficient queries
TrainedModelSchema.index({ modelType: 1, isActive: 1, trainedAt: -1 });
TrainedModelSchema.index({ trainedBy: 1, trainedAt: -1 });

/**
 * Instance method: Increment usage counter
 */
TrainedModelSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  return this.save();
};

/**
 * Instance method: Deactivate model
 */
TrainedModelSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

/**
 * Static method: Get models by type
 */
TrainedModelSchema.statics.getModelsByType = function(
  modelType: 'revenue' | 'orders',
  activeOnly = true
) {
  const query: any = { modelType };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query).sort({ trainedAt: -1 });
};

/**
 * Static method: Get best model by type (highest R² score)
 */
TrainedModelSchema.statics.getBestModel = function(
  modelType: 'revenue' | 'orders' | 'product_sales'
) {
  return this.findOne({
    modelType,
    isActive: true
  }).sort({ 'metrics.r2Score': -1 });
};

export default mongoose.model<ITrainedModel, ITrainedModelModel>('TrainedModel', TrainedModelSchema);
