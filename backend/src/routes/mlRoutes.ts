/**
 * ML Routes - Machine Learning API Endpoints
 * 
 * Provides REST API for ML model training and prediction
 * All routes require admin authentication
 */

import express from 'express';
import mlController from '../controllers/mlController';
import { adminAuth } from '../middleware/auth';

const router = express.Router();

// All ML routes require admin authentication
router.use(adminAuth);

// ============================================
// MODEL TRAINING
// ============================================

/**
 * POST /api/v1/admin/ml/train
 * Train a new ML model
 */
router.post('/train', mlController.trainModel);

// ============================================
// PREDICTION
// ============================================

/**
 * POST /api/v1/admin/ml/predict
 * Make prediction using a trained model
 */
router.post('/predict', mlController.makePrediction);

/**
 * POST /api/v1/admin/ml/predictions/save
 * Save prediction result to history
 */
router.post('/predictions/save', mlController.savePredictionToHistory);

// ============================================
// MODEL MANAGEMENT
// ============================================

/**
 * GET /api/v1/admin/ml/models
 * List all trained models (with optional filters)
 */
router.get('/models', mlController.listModels);

/**
 * GET /api/v1/admin/ml/models/:modelId
 * Get detailed information about a specific model
 */
router.get('/models/:modelId', mlController.getModelDetails);

/**
 * PATCH /api/v1/admin/ml/models/:modelId/deactivate
 * Deactivate a model
 */
router.patch('/models/:modelId/deactivate', mlController.deactivateModel);

/**
 * PATCH /api/v1/admin/ml/models/:modelId/activate
 * Activate a previously deactivated model
 */
router.patch('/models/:modelId/activate', mlController.activateModel);

/**
 * PATCH /api/v1/admin/ml/models/:modelId/rename
 * Rename a model (updates database and file names)
 */
router.patch('/models/:modelId/rename', mlController.renameModel);

/**
 * DELETE /api/v1/admin/ml/models/:modelId
 * Delete a model completely (removes file and database record)
 */
router.delete('/models/:modelId', mlController.deleteModel);

// ============================================
// ANALYTICS & INSIGHTS
// ============================================

/**
 * GET /api/v1/admin/ml/predictions
 * Get prediction history
 */
router.get('/predictions', mlController.getPredictionHistory);

/**
 * DELETE /api/v1/admin/ml/predictions
 * Clear all prediction history
 */
router.delete('/predictions', mlController.clearPredictionHistory);

/**
 * GET /api/v1/admin/ml/dashboard-stats
 * Get ML dashboard statistics
 */
router.get('/dashboard-stats', mlController.getDashboardStats);

// ============================================
// TIME SERIES FORECASTING
// ============================================

/**
 * POST /api/v1/admin/ml/forecast
 * Generate time series forecast (Excel/Power BI style)
 */
router.post('/forecast', mlController.generateForecast);

export default router;
