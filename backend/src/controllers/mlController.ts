/**
 * ML Controller - Machine Learning Integration
 * 
 * Handles ML model training, prediction, and management
 * Communicates with Python ML service via HTTP
 * 
 * Academic Purpose:
 * - Demonstrates microservices architecture
 * - Shows integration between Node.js and Python
 * - Implements model lifecycle management
 * 
 * ALL endpoints require admin authentication.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import axios from 'axios';
import TrainedModel from '../models/TrainedModel';
import Prediction from '../models/Prediction';
import dailyMetricsService from '../services/dailyMetricsService';

// ML Service Configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// ============================================
// MODEL TRAINING
// ============================================

/**
 * POST /api/v1/admin/ml/train
 * 
 * Train a new ML model
 * 
 * Body:
 * - modelName: User-friendly name
 * - modelType: 'revenue' | 'orders'
 * - trainingRange: 3 | 6 | 12 (months)
 * 
 * Academic Workflow:
 * 1. Validate request parameters
 * 2. Fetch training data from database
 * 3. Send data to ML service for training
 * 4. Save model metadata to database
 * 5. Return training results
 */
export const trainModel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modelName, modelType, trainingRange } = req.body;
    
    console.log('=== ML TRAINING REQUEST ===');
    console.log('Model Name:', modelName);
    console.log('Model Type:', modelType);
    console.log('Training Range:', trainingRange);
    
    // Validation
    if (!modelName || !modelType || !trainingRange) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: modelName, modelType, trainingRange'
      });
    }
    
    if (!['revenue', 'orders'].includes(modelType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid modelType. Must be: revenue or orders'
      });
    }
    
    if (![3, 6, 12].includes(trainingRange)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid trainingRange. Must be: 3, 6, or 12 months'
      });
    }
    
    // Fetch training data
    const trainingData = await dailyMetricsService.getMLTrainingData(trainingRange);
    
    console.log('Training data fetched:', trainingData.length, 'records');
    console.log('Sample record:', JSON.stringify(trainingData[0]));
    
    if (trainingData.length < 10) {
      return res.status(400).json({
        success: false,
        error: `Insufficient training data. Need at least 10 data points, got ${trainingData.length}`
      });
    }
    
    // Calculate date range
    const trainingStartDate = new Date(trainingData[0].date);
    const trainingEndDate = new Date(trainingData[trainingData.length - 1].date);
    
    console.log('Sending request to ML service...');
    console.log('ML Service URL:', ML_SERVICE_URL);
    
    // Send training request to ML service
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/train`, {
      model_name: modelName,
      model_type: modelType,
      training_data: trainingData,
      test_size: 0.2 // 80% training, 20% testing
    });
    
    console.log('ML service response received successfully');
    
    if (!mlResponse.data.success) {
      throw new Error('ML service training failed');
    }
    
    const mlResult = mlResponse.data;
    
    // Save model metadata to database
    const trainedModel = await TrainedModel.create({
      modelName,
      modelType,
      trainingRange,
      trainingStartDate,
      trainingEndDate,
      algorithm: mlResult.algorithm,
      features: mlResult.features_used,
      targetVariable: mlResult.target_variable,
      modelFilePath: mlResult.model_file,
      scalerFilePath: mlResult.scaler_file,
      metrics: {
        r2Score: mlResult.metrics.r2_score,
        rmse: mlResult.metrics.rmse,
        mae: mlResult.metrics.mae,
        mse: mlResult.metrics.mse,
        trainingSize: mlResult.metrics.training_size,
        testSize: mlResult.metrics.test_size
      },
      trainedBy: req.user!._id,
      trainedByName: req.user!.name || req.user!.email,
      trainedAt: new Date(),
      isActive: true
    });
    
    res.status(201).json({
      success: true,
      message: 'Model trained successfully',
      data: {
        modelId: trainedModel._id,
        modelName: trainedModel.modelName,
        modelType: trainedModel.modelType,
        metrics: trainedModel.metrics,
        features: trainedModel.features,
        trainingDataPoints: trainingData.length,
        trainingRange: trainingRange,
        dateRange: {
          start: trainingStartDate,
          end: trainingEndDate
        }
      }
    });
    
  } catch (error: any) {
    console.error('Model training error:', error);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'ML service is not available. Please ensure it is running on ' + ML_SERVICE_URL
      });
    }
    
    // Handle ML service validation errors (422)
    if (error.response?.status === 422) {
      console.error('ML service validation error:', error.response.data);
      return res.status(400).json({
        success: false,
        error: 'Invalid training data: ' + (error.response.data?.detail?.[0]?.msg || JSON.stringify(error.response.data))
      });
    }
    
    // Handle other axios errors
    if (error.response) {
      console.error('ML service error response:', error.response.data);
      return res.status(500).json({
        success: false,
        error: `ML service error: ${error.response.data?.detail || error.message}`
      });
    }
    
    next(error);
  }
};

// ============================================
// PREDICTION
// ============================================

/**
 * POST /api/v1/admin/ml/predict
 * 
 * Make prediction using a trained model
 * 
 * Body:
 * - modelId: ID of trained model
 * - inputFeatures: { visits: number, orders?: number }
 * 
 * Academic Note:
 * - Uses saved model without retraining
 * - Fast inference (milliseconds)
 * - Stores prediction for future comparison
 */
export const makePrediction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modelId, inputFeatures } = req.body;
    
    if (!modelId || !inputFeatures) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: modelId, inputFeatures'
      });
    }
    
    // Fetch model metadata
    const trainedModel = await TrainedModel.findById(modelId);
    
    if (!trainedModel) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }
    
    if (!trainedModel.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Model is inactive'
      });
    }
    
    // Send prediction request to ML service
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, {
      model_file: trainedModel.modelFilePath,
      input_features: inputFeatures
    });
    
    if (!mlResponse.data.success) {
      throw new Error('ML service prediction failed');
    }
    
    const mlResult = mlResponse.data;
    
    // Don't auto-save - return prediction result
    // User will decide to save via separate endpoint
    res.status(200).json({
      success: true,
      data: {
        modelId: trainedModel._id,
        modelName: trainedModel.modelName,
        modelType: trainedModel.modelType,
        predictedValue: mlResult.predicted_value,
        confidence: mlResult.confidence,
        modelUsed: {
          id: trainedModel._id,
          name: trainedModel.modelName,
          type: trainedModel.modelType,
          metrics: trainedModel.metrics
        },
        inputFeatures: inputFeatures
      }
    });
    
  } catch (error: any) {
    console.error('Prediction error:', error);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'ML service is not available'
      });
    }
    
    next(error);
  }
};

/**
 * POST /api/v1/admin/ml/predictions/save
 * 
 * Save a prediction result to history
 */
export const savePredictionToHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modelId, modelName, modelType, predictedValue, confidence, inputFeatures } = req.body;
    
    if (!modelId || !predictedValue || !inputFeatures) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    // Save prediction to database
    const prediction = await Prediction.create({
      trainedModel: modelId,
      modelName: modelName,
      modelType: modelType,
      inputFeatures: inputFeatures,
      predictedValue: predictedValue,
      confidence: confidence,
      requestedBy: req.user!._id,
      requestedByName: req.user!.name || req.user!.email,
      requestedAt: new Date()
    });
    
    // Update model usage statistics
    const trainedModel = await TrainedModel.findById(modelId);
    if (trainedModel) {
      await trainedModel.incrementUsage();
    }
    
    res.status(200).json({
      success: true,
      data: {
        predictionId: prediction._id,
        message: 'Prediction saved to history successfully'
      }
    });
    
  } catch (error: any) {
    console.error('Save prediction error:', error);
    next(error);
  }
};

// ============================================
// MODEL MANAGEMENT
// ============================================

/**
 * GET /api/v1/admin/ml/models
 *
 * List all trained models
 * Query params:
 * - modelType: Filter by type (optional)
 * - activeOnly: Show only active models (default: true)
 */
export const listModels = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modelType, activeOnly = 'true' } = req.query;
    
    const query: any = {};
    
    if (modelType && ['revenue', 'orders', 'product_sales'].includes(modelType as string)) {
      query.modelType = modelType;
    }
    
    if (activeOnly === 'true') {
      query.isActive = true;
    }
    
    const models = await TrainedModel.find(query)
      .sort({ trainedAt: -1 })
      .select('-__v');
    
    res.status(200).json({
      success: true,
      count: models.length,
      data: models
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/ml/models/:modelId
 * 
 * Get detailed information about a specific model
 */
export const getModelDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modelId } = req.params;
    
    const model = await TrainedModel.findById(modelId);
    
    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }
    
    // Get prediction history for this model
    const predictions = await Prediction.find({ model: modelId })
      .sort({ requestedAt: -1 })
      .limit(10);
    
    res.status(200).json({
      success: true,
      data: {
        model,
        recentPredictions: predictions
      }
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/ml/models/:modelId/deactivate
 * 
 * Deactivate a model (make it unavailable for predictions)
 */
export const deactivateModel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modelId } = req.params;
    
    const model = await TrainedModel.findById(modelId);
    
    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }
    
    await model.deactivate();
    
    res.status(200).json({
      success: true,
      message: 'Model deactivated successfully',
      data: model
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/ml/models/:modelId/activate
 * 
 * Activate a previously deactivated model
 */
export const activateModel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modelId } = req.params;
    
    const model = await TrainedModel.findById(modelId);
    
    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }
    
    model.isActive = true;
    await model.save();
    
    res.status(200).json({
      success: true,
      message: 'Model activated successfully',
      data: model
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/ml/models/:modelId/rename
 * 
 * Rename a model (updates database and optionally renames files)
 */
export const renameModel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modelId } = req.params;
    const { newName } = req.body;
    
    if (!newName || newName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'New model name is required'
      });
    }
    
    const model = await TrainedModel.findById(modelId);
    
    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }
    
    const fs = require('fs');
    const path = require('path');
    
    // Generate new file names
    const timestamp = new Date(model.trainedAt).getTime();
    const sanitizedNewName = newName.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const newModelFileName = `${sanitizedNewName}_${timestamp}.joblib`;
    const newScalerFileName = `${sanitizedNewName}_${timestamp}_scaler.joblib`;
    
    // Rename model file
    const oldModelPath = path.join(__dirname, '../../../ml-service/models', model.modelFilePath);
    const newModelPath = path.join(__dirname, '../../../ml-service/models', newModelFileName);
    
    if (fs.existsSync(oldModelPath)) {
      fs.renameSync(oldModelPath, newModelPath);
      console.log(`Renamed model file: ${model.modelFilePath} -> ${newModelFileName}`);
    }
    
    // Rename scaler file if exists
    let newScalerFilePath = model.scalerFilePath;
    if (model.scalerFilePath) {
      const oldScalerPath = path.join(__dirname, '../../../ml-service/models', model.scalerFilePath);
      const newScalerPath = path.join(__dirname, '../../../ml-service/models', newScalerFileName);
      
      if (fs.existsSync(oldScalerPath)) {
        fs.renameSync(oldScalerPath, newScalerPath);
        newScalerFilePath = newScalerFileName;
        console.log(`Renamed scaler file: ${model.scalerFilePath} -> ${newScalerFileName}`);
      }
    }
    
    // Update model in database
    model.modelName = newName.trim();
    model.modelFilePath = newModelFileName;
    if (newScalerFilePath) {
      model.scalerFilePath = newScalerFilePath;
    }
    await model.save();
    
    res.status(200).json({
      success: true,
      message: 'Model renamed successfully',
      data: model
    });
    
  } catch (error: any) {
    console.error('Rename model error:', error);
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/ml/models/:modelId
 * 
 * Delete a model completely (removes file from ml-service/models and database record)
 */
export const deleteModel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modelId } = req.params;
    
    const model = await TrainedModel.findById(modelId);
    
    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }
    
    // Delete model file from ml-service
    const fs = require('fs');
    const path = require('path');
    const modelFilePath = path.join(__dirname, '../../../ml-service/models', model.modelFilePath);
    
    if (fs.existsSync(modelFilePath)) {
      fs.unlinkSync(modelFilePath);
      console.log(`Deleted model file: ${modelFilePath}`);
    }
    
    // Delete scaler file if exists
    if (model.scalerFilePath) {
      const scalerFilePath = path.join(__dirname, '../../../ml-service/models', model.scalerFilePath);
      if (fs.existsSync(scalerFilePath)) {
        fs.unlinkSync(scalerFilePath);
        console.log(`Deleted scaler file: ${scalerFilePath}`);
      }
    }
    
    // Delete predictions associated with this model
    await Prediction.deleteMany({ trainedModel: modelId });
    
    // Delete model from database
    await TrainedModel.findByIdAndDelete(modelId);
    
    res.status(200).json({
      success: true,
      message: 'Model and associated files deleted successfully'
    });
    
  } catch (error: any) {
    console.error('Delete model error:', error);
    next(error);
  }
};

// ============================================
// ANALYTICS & INSIGHTS
// ============================================

/**
 * GET /api/v1/admin/ml/predictions
 * 
 * Get prediction history with optional filters
 */
export const getPredictionHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modelType, limit = '50' } = req.query;
    
    const query: any = {};
    
    if (modelType && ['revenue', 'orders', 'product_sales'].includes(modelType as string)) {
      query.modelType = modelType;
    }
    
    const predictions = await Prediction.find(query)
      .sort({ requestedAt: -1 })
      .limit(parseInt(limit as string))
      .populate('trainedModel', 'modelName modelType metrics');
    
    res.status(200).json({
      success: true,
      count: predictions.length,
      data: predictions
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/ml/dashboard-stats
 * 
 * Get ML dashboard statistics
 */
export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Count models by type
    const modelStats = await TrainedModel.aggregate([
      {
        $group: {
          _id: '$modelType',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          avgR2Score: { $avg: '$metrics.r2Score' }
        }
      }
    ]);
    
    // Count total predictions
    const totalPredictions = await Prediction.countDocuments();
    
    // Get best models
    const bestRevenueModel = await TrainedModel.findOne({
      modelType: 'revenue',
      isActive: true
    }).sort({ 'metrics.r2Score': -1 });
    
    const bestOrdersModel = await TrainedModel.findOne({
      modelType: 'orders',
      isActive: true
    }).sort({ 'metrics.r2Score': -1 });
    
    res.status(200).json({
      success: true,
      data: {
        modelStats,
        totalPredictions,
        bestModels: {
          revenue: bestRevenueModel,
          orders: bestOrdersModel
        }
      }
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/ml/predictions
 * 
 * Clear all prediction history
 */
export const clearPredictionHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await Prediction.deleteMany({});
    
    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} predictions`,
      data: {
        deletedCount: result.deletedCount
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// ============================================
// TIME SERIES FORECASTING
// ============================================

/**
 * POST /api/v1/admin/ml/forecast
 * 
 * Generate time series forecast
 * 
 * Body:
 * - metric: 'revenue' | 'orders' | 'visits'
 * - forecastDays: 7 | 14 | 30 | 60 | 90
 * - method: 'linear' | 'moving_average' | 'exponential_smoothing'
 * 
 * Academic Concept:
 * - Time series forecasting similar to Excel/Power BI
 * - Linear Regression (Excel FORECAST)
 * - Moving Average (smoothing)
 * - Exponential Smoothing (Power BI style)
 * 
 * Returns:
 * - Historical data
 * - Forecasted values
 * - Metrics (MAE, RMSE, R²)
 */
export const generateForecast = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { metric, forecastDays, method } = req.body;

    // Validate inputs
    if (!metric || !forecastDays) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: metric and forecastDays'
      });
    }

    const validMetrics = ['revenue', 'orders', 'visits'];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({
        success: false,
        error: `Invalid metric. Must be one of: ${validMetrics.join(', ')}`
      });
    }

    const validDays = [7, 14, 30, 60, 90];
    if (!validDays.includes(forecastDays)) {
      return res.status(400).json({
        success: false,
        error: `Invalid forecastDays. Must be one of: ${validDays.join(', ')}`
      });
    }

    const validMethods = ['linear', 'moving_average', 'exponential_smoothing'];
    const forecastMethod = method || 'linear';
    if (!validMethods.includes(forecastMethod)) {
      return res.status(400).json({
        success: false,
        error: `Invalid method. Must be one of: ${validMethods.join(', ')}`
      });
    }

    // Get historical daily metrics (last 6 months for better accuracy)
    const dailyMetrics = await dailyMetricsService.getDailyMetricsForForecast(180);

    if (dailyMetrics.length < 7) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient historical data. Need at least 7 days of data.'
      });
    }

    // Transform data for ML service
    const transformedData = dailyMetrics.map(dm => ({
      date: dm.date.toISOString().split('T')[0],
      totalRevenue: dm.totalRevenue || 0,
      completedOrders: dm.completedOrders || 0,
      totalSessions: dm.totalSessions || 0
    }));

    // Call Python ML service for forecast
    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/forecast`,
      {
        daily_data: transformedData,
        metric: metric,
        forecast_days: forecastDays,
        method: forecastMethod
      },
      {
        timeout: 30000 // 30 second timeout
      }
    );

    if (!mlResponse.data.success) {
      return res.status(500).json({
        success: false,
        error: mlResponse.data.error || 'Forecast generation failed'
      });
    }

    res.status(200).json({
      success: true,
      data: mlResponse.data.data
    });

  } catch (error: any) {
    console.error('Forecast error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'ML service is not available. Please ensure Python ML service is running.'
      });
    }

    next(error);
  }
};

export default {
  trainModel,
  makePrediction,
  savePredictionToHistory,
  listModels,
  getModelDetails,
  deactivateModel,
  activateModel,
  renameModel,
  deleteModel,
  getPredictionHistory,
  getDashboardStats,
  clearPredictionHistory,
  generateForecast
};
