/**
 * ML Service - Machine Learning API Client
 * 
 * Communicates with backend ML endpoints
 * 
 * Academic Purpose:
 * - Frontend-backend integration for ML operations
 * - Type-safe API communication
 * - Observable-based async operations
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

// Interfaces
export interface TrainingDataPoint {
  date: string;
  visits: number;
  orders: number;
  revenue: number;
  avg_order_value?: number;
  conversion_rate?: number;
  products_sold?: number;
}

export interface ModelMetrics {
  r2Score: number;
  rmse: number;
  mae: number;
  mse?: number;
  trainingSize: number;
  testSize?: number;
}

export interface TrainedModel {
  _id: string;
  modelName: string;
  modelType: 'revenue' | 'orders';
  trainingRange: 3 | 6 | 12;
  trainingStartDate: string;
  trainingEndDate: string;
  algorithm: string;
  features: string[];
  targetVariable: string;
  modelFilePath: string;
  metrics: ModelMetrics;
  trainedBy: string;
  trainedByName: string;
  trainedAt: string;
  usageCount: number;
  lastUsedAt?: string;
  isActive: boolean;
  notes?: string;
}

export interface TrainModelRequest {
  modelName: string;
  modelType: 'revenue' | 'orders';
  trainingRange: 3 | 6 | 12;
}

export interface TrainModelResponse {
  success: boolean;
  message: string;
  data: {
    modelId: string;
    modelName: string;
    modelType: string;
    metrics: ModelMetrics;
    features: string[];
    trainingDataPoints: number;
    trainingRange: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
}

export interface PredictRequest {
  modelId: string;
  inputFeatures: { [key: string]: number };
}

export interface PredictResponse {
  success: boolean;
  data: {
    predictionId: string;
    predictedValue: number;
    confidence?: number;
    modelUsed: {
      id: string;
      name: string;
      type: string;
      metrics: ModelMetrics;
    };
    inputFeatures: { [key: string]: number };
  };
}

export interface Prediction {
  _id: string;
  model: string;
  modelName: string;
  modelType: string;
  inputFeatures: { [key: string]: number };
  predictedValue: number;
  confidence?: number;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  actualValue?: number;
  absoluteError?: number;
  percentageError?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MlService {
  private apiUrl = `${environment.apiUrl}/admin/ml`;

  constructor(private http: HttpClient) {}

  /**
   * Train a new ML model
   */
  trainModel(request: TrainModelRequest): Observable<TrainModelResponse> {
    return this.http.post<TrainModelResponse>(`${this.apiUrl}/train`, request);
  }

  /**
   * Make prediction using a trained model
   */
  predict(request: PredictRequest): Observable<PredictResponse> {
    return this.http.post<PredictResponse>(`${this.apiUrl}/predict`, request);
  }

  /**
   * List all trained models
   */
  listModels(modelType?: 'revenue' | 'orders' | 'product_sales', activeOnly = true): Observable<any> {
    let params: any = {};
    if (modelType) {
      params.modelType = modelType;
    }
    if (activeOnly !== undefined) {
      params.activeOnly = activeOnly.toString();
    }
    
    return this.http.get<any>(`${this.apiUrl}/models`, { params });
  }

  /**
   * Get model details
   */
  getModelDetails(modelId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/models/${modelId}`);
  }

  /**
   * Deactivate a model
   */
  deactivateModel(modelId: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/models/${modelId}/deactivate`, {});
  }

  /**
   * Activate a model
   */
  activateModel(modelId: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/models/${modelId}/activate`, {});
  }

  /**
   * Rename a model
   */
  renameModel(modelId: string, newName: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/models/${modelId}/rename`, { newName });
  }

  /**
   * Save prediction to history
   */
  savePrediction(predictionData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/predictions/save`, predictionData);
  }

  /**
   * Delete a model completely
   */
  deleteModel(modelId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/models/${modelId}`);
  }

  /**
   * Get prediction history
   */
  getPredictionHistory(modelType?: string, limit = 50): Observable<any> {
    let params: any = { limit: limit.toString() };
    if (modelType) {
      params.modelType = modelType;
    }
    
    return this.http.get<any>(`${this.apiUrl}/predictions`, { params });
  }

  /**
   * Get dashboard statistics
   */
  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard-stats`);
  }

  /**
   * Clear all prediction history
   */
  clearPredictionHistory(): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/predictions`);
  }

  /**
   * Generate time series forecast
   */
  generateForecast(params: {
    metric: string;
    forecastDays: number;
    method: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/forecast`, params);
  }
}
