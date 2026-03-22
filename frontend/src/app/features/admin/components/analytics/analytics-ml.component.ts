/**
 * Analytics ML Component - ML-Powered Predictive Analytics Dashboard
 * 
 * Academic Purpose:
 * - Complete ML workflow demonstration
 * - Integration of ML predictions with business analytics
 * - User-friendly interface for model training and predictions
 * 
 * Features:
 * 1. Train ML models with different configurations
 * 2. Make predictions using trained models
 * 3. Visualize actual vs predicted values
 * 4. Model performance metrics display
 * 5. Model management (list, deactivate, reuse)
 */

import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MlService, TrainedModel, Prediction } from '../../services/ml.service';

interface TrainingForm {
  modelName: string;
  modelType: 'revenue' | 'orders';
  trainingRange: 3 | 6 | 12;
}

interface ValidationError {
  field: string;
  message: string;
}

interface PredictionForm {
  selectedModelId: string;
  visits: number;
  orders: number;
}

@Component({
  selector: 'app-analytics-ml',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ml-dashboard">
      <!-- Header -->
      <header class="dashboard-header">
        <div>
          <h1>Machine Learning Analytics</h1>
          <p>Train models, make predictions, and optimize business decisions</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="activeTab.set('train')">
            Train New Model
          </button>
        </div>
      </header>

      <!-- Dashboard Stats -->
      @if (dashboardStats()) {
        <section class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="gi gi-admin-orders" aria-hidden="true"></i>
            </div>
            <div class="stat-content">
              <h3>{{ totalModels() }}</h3>
              <p>Total Models</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="gi gi-ui-trend-up" aria-hidden="true"></i>
            </div>
            <div class="stat-content">
              <h3>{{ activeModels() }}</h3>
              <p>Active Models</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="gi gi-ui-chart" aria-hidden="true"></i>
            </div>
            <div class="stat-content">
              <h3>{{ totalPredictions() }}</h3>
              <p>Predictions Made</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="gi gi-ui-spark" aria-hidden="true"></i>
            </div>
            <div class="stat-content">
              <h3>{{ bestR2Score() }}</h3>
              <p>Best R² Score</p>
            </div>
          </div>
        </section>
      }

      <!-- Tabs -->
      <div class="tabs">
        <button 
          class="tab" 
          [class.active]="activeTab() === 'train'"
          (click)="activeTab.set('train')">
          Train Model
        </button>
        <button 
          class="tab" 
          [class.active]="activeTab() === 'predict'"
          (click)="activeTab.set('predict')">
          Make Prediction
        </button>
        <button 
          class="tab" 
          [class.active]="activeTab() === 'models'"
          (click)="activeTab.set('models')">
          Manage Models
        </button>
        <button 
          class="tab" 
          [class.active]="activeTab() === 'history'"
          (click)="activeTab.set('history')">
          Prediction History
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- TRAIN TAB -->
        @if (activeTab() === 'train') {
          <div class="train-section">
            <h2>Train New ML Model</h2>
            <p class="section-desc">
              Train a machine learning model using historical data. 
              Choose the prediction type, training period, and provide a descriptive name.
            </p>

            <!-- Training Tips -->
            <div class="tips-card" [class.collapsed]="!showTrainingTips()">
              <div class="tips-header" (click)="showTrainingTips.set(!showTrainingTips())">
                <i class="gi gi-info-circle" aria-hidden="true"></i>
                <h3>How to Train an Effective Model</h3>
                <i class="gi gi-ui-chevron-down chevron" aria-hidden="true"></i>
              </div>
              @if (showTrainingTips()) {
                <div class="tips-content">
                  <div class="tip-item">
                  <strong>1. Choose the Right Model Type:</strong>
                  <ul>
                    <li><strong>Revenue Prediction:</strong> Best for forecasting total sales revenue based on website traffic and order patterns</li>
                    <li><strong>Order Count:</strong> Ideal for predicting number of orders from visitor traffic data</li>
                  </ul>
                </div>
                <div class="tip-item">
                  <strong>2. Select Training Window Wisely:</strong>
                  <ul>
                    <li><strong>3 Months:</strong> Use for recent trends and short-term predictions (fast-changing markets)</li>
                    <li><strong>6 Months:</strong> Balanced choice - captures seasonal patterns while staying current</li>
                    <li><strong>12 Months:</strong> Best for long-term trends and annual seasonality (requires stable business)</li>
                  </ul>
                </div>
                <div class="tip-item">
                  <strong>3. Naming Best Practices:</strong>
                  <p>Use descriptive names like: <code>Revenue_6M_v1</code>, <code>Orders_Q4_2024</code></p>
                </div>
                <div class="tip-item">
                  <strong>4. Interpreting Results:</strong>
                  <ul>
                    <li><strong>R² Score ≥ 0.9:</strong> Excellent - model explains 90%+ of variance</li>
                    <li><strong>R² Score 0.7-0.9:</strong> Good - reliable predictions with acceptable accuracy</li>
                    <li><strong>R² Score < 0.7:</strong> Fair - consider more training data or different time window</li>
                  </ul>
                </div>
                </div>
              }
            </div>

            <form class="train-form" (ngSubmit)="handleTrainModel()">
              <!-- Step 1: Select Prediction Type -->
              <div class="form-section">
                <h3>Step 1: Select Prediction Type</h3>
                <div class="radio-group">
                  <label class="radio-card">
                    <input 
                      type="radio" 
                      name="modelType" 
                      value="revenue"
                      [(ngModel)]="trainingForm.modelType"
                      (change)="onModelTypeChange()"
                    />
                    <div class="radio-content">
                      <h4>Revenue Prediction</h4>
                      <p>Predict future revenue based on visits and orders</p>
                    </div>
                  </label>
                  <label class="radio-card">
                    <input 
                      type="radio" 
                      name="modelType" 
                      value="orders"
                      [(ngModel)]="trainingForm.modelType"
                      (change)="onModelTypeChange()"
                    />
                    <div class="radio-content">
                      <h4>Order Count Prediction</h4>
                      <p>Predict number of orders from visitor traffic</p>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Step 2: Training Window -->
              <div class="form-section">
                <h3>Step 2: Select Training Window</h3>
                <div class="button-group">
                  <button 
                    type="button"
                    class="btn-option"
                    [class.selected]="trainingForm.trainingRange === 3"
                    (click)="trainingForm.trainingRange = 3">
                    3 Months
                  </button>
                  <button 
                    type="button"
                    class="btn-option"
                    [class.selected]="trainingForm.trainingRange === 6"
                    (click)="trainingForm.trainingRange = 6">
                    6 Months
                  </button>
                  <button 
                    type="button"
                    class="btn-option"
                    [class.selected]="trainingForm.trainingRange === 12"
                    (click)="trainingForm.trainingRange = 12">
                    12 Months
                  </button>
                </div>
              </div>

              <!-- Step 3: Model Name -->
              <div class="form-section">
                <h3>Step 3: Name Your Model</h3>
                <input 
                  type="text" 
                  class="form-input"
                  [class.error]="validationError()?.field === 'modelName'"
                  placeholder="e.g., Revenue_6M_Linear_v1"
                  [(ngModel)]="trainingForm.modelName"
                  name="modelName"
                  required
                />
                @if (validationError()?.field === 'modelName') {
                  <p class="error-message">{{ validationError()!.message }}</p>
                }
                <p class="input-hint">
                  Choose a descriptive name to identify this model later
                </p>
              </div>

              <!-- Submit Button -->
              <div class="form-actions">
                <button 
                  type="submit" 
                  class="btn-primary btn-large"
                  [disabled]="trainingLoading()">
                  @if (trainingLoading()) {
                    <span class="spinner"></span> Training Model...
                  } @else {
                    Train Model
                  }
                </button>
              </div>
            </form>

            <!-- Training Results -->
            @if (trainingResult()) {
              <div class="result-card success">
                <div class="result-header">
                  <h3>Model Trained Successfully</h3>
                </div>
                <div class="result-content">
                  <div class="result-grid">
                    <div class="result-item">
                      <span class="label">Model Name:</span>
                      <span class="value">{{ trainingResult()!.modelName }}</span>
                    </div>
                    <div class="result-item">
                      <span class="label">Type:</span>
                      <span class="value">{{ trainingResult()!.modelType }}</span>
                    </div>
                    <div class="result-item">
                      <span class="label">Training Data Points:</span>
                      <span class="value">{{ trainingResult()!.trainingDataPoints }}</span>
                    </div>
                    <div class="result-item">
                      <span class="label">Features Used:</span>
                      <span class="value">{{ trainingResult()!.features.join(', ') }}</span>
                    </div>
                  </div>
                  
                  <h4>Performance Metrics</h4>
                  <div class="metrics-grid">
                    <div class="metric-card" [attr.data-quality]="getMetricQuality(trainingResult()!.metrics.r2Score, 'r2')">
                      <div class="metric-label">R² Score</div>
                      <div class="metric-value">{{ trainingResult()!.metrics.r2Score.toFixed(4) }}</div>
                      <div class="metric-desc">{{ getMetricDescription('r2', trainingResult()!.metrics.r2Score) }}</div>
                    </div>
                    <div class="metric-card">
                      <div class="metric-label">RMSE</div>
                      <div class="metric-value">{{ trainingResult()!.metrics.rmse.toFixed(2) }}</div>
                      <div class="metric-desc">Root Mean Squared Error</div>
                    </div>
                    <div class="metric-card">
                      <div class="metric-label">MAE</div>
                      <div class="metric-value">{{ trainingResult()!.metrics.mae.toFixed(2) }}</div>
                      <div class="metric-desc">Mean Absolute Error</div>
                    </div>
                  </div>

                  <button class="btn-secondary" (click)="activeTab.set('predict')">
                    Use This Model for Prediction →
                  </button>
                </div>
              </div>
            }

            @if (trainingError()) {
              <div class="result-card error">
                <h3>Training Failed</h3>
                <p>{{ trainingError() }}</p>
              </div>
            }
          </div>
        }

        <!-- PREDICT TAB -->
        @if (activeTab() === 'predict') {
          <div class="predict-section">
            <h2>Make Prediction</h2>
            <p class="section-desc">
              Use a trained model to predict future values based on input features.
            </p>

            <form class="predict-form" (ngSubmit)="handlePredict()">
              <!-- Select Model -->
              <div class="form-section">
                <h3>Select Trained Model</h3>
                <select 
                  class="form-select"
                  [value]="selectedModelId()"
                  (change)="onModelDropdownChange($event)"
                  name="selectedModel"
                  required>
                  <option value="">-- Choose a model --</option>
                  @for (model of activeModelsList(); track model._id) {
                    <option [value]="model._id">
                      {{ model.modelName }} 
                      ({{ model.modelType | titlecase }} - R²: {{ model.metrics.r2Score.toFixed(3) }})
                    </option>
                  }
                </select>
                
                @if (hasNoActiveModels()) {
                  <p class="hint warning">No active models available. Please activate a model from the Manage Models tab.</p>
                }
              </div>

              <!-- Model Info -->
              @if (selectedModel()) {
                <div class="model-info">
                  <h4>Model Information</h4>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="label">Type:</span>
                      <span class="value">{{ selectedModel()!.modelType }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">Features:</span>
                      <span class="value">{{ selectedModel()!.features.join(', ') }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">R² Score:</span>
                      <span class="value">{{ selectedModel()!.metrics.r2Score.toFixed(4) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">Training Range:</span>
                      <span class="value">{{ selectedModel()!.trainingRange }} months</span>
                    </div>
                  </div>
                </div>
              }

              <!-- Input Features -->
              <div class="form-section">
                <h3>Input Features</h3>
                <div class="input-grid">
                  <!-- Visits - always shown -->
                  <div class="form-group">
                    <label for="visits">Number of Visits</label>
                    <input 
                      type="number" 
                      id="visits"
                      class="form-input"
                      placeholder="e.g., 1000"
                      [value]="predictionVisits()"
                      (input)="predictionVisits.set(+($any($event.target).value))"
                      name="visits"
                      min="0"
                      required
                    />
                  </div>
                  
                  <!-- Orders - only for revenue models -->
                  @if (isRevenueModel()) {
                    <div class="form-group">
                      <label for="orders">Number of Orders</label>
                      <input 
                        type="number" 
                        id="orders"
                        class="form-input"
                        placeholder="e.g., 50"
                        [value]="predictionOrders()"
                        (input)="predictionOrders.set(+($any($event.target).value))"
                        name="orders"
                        min="0"
                        required
                      />
                    </div>
                  }
                </div>
              </div>

              <!-- Submit -->
              <div class="form-actions">
                <button 
                  type="submit" 
                  class="btn-primary btn-large"
                  [disabled]="predictionLoading() || !selectedModelId()">
                  @if (predictionLoading()) {
                    <span class="spinner"></span> Predicting...
                  } @else {
                    Make Prediction
                  }
                </button>
              </div>
            </form>

            <!-- Prediction Result -->
            @if (predictionResult()) {
              <div class="result-card success">
                <div class="result-header">
                  <h3>Prediction Result</h3>
                </div>
                <div class="result-content">
                  <div class="prediction-value">
                    <div class="predicted-label">Predicted {{ selectedModel()!.targetVariable }}:</div>
                    <div class="predicted-number">
                      @if (selectedModel()!.modelType === 'revenue') {
                        £{{ predictionResult()!.predictedValue.toFixed(2) }}
                      } @else {
                        {{ Math.round(predictionResult()!.predictedValue) }}
                      }
                    </div>
                  </div>

                  <div class="input-summary">
                    <h4>Input Features Used:</h4>
                    <ul>
                      @for (feature of Object.keys(predictionResult()!.inputFeatures); track feature) {
                        <li>
                          <strong>{{ feature }}:</strong> 
                          {{ predictionResult()!.inputFeatures[feature] }}
                        </li>
                      }
                    </ul>
                  </div>

                  <div class="model-summary">
                    <h4>Model Performance:</h4>
                    <div class="metrics-mini">
                      <span class="metric">
                        <strong>R²:</strong> {{ predictionResult()!.modelUsed.metrics.r2Score.toFixed(4) }}
                      </span>
                      <span class="metric">
                        <strong>RMSE:</strong> {{ predictionResult()!.modelUsed.metrics.rmse.toFixed(2) }}
                      </span>
                      <span class="metric">
                        <strong>MAE:</strong> {{ predictionResult()!.modelUsed.metrics.mae.toFixed(2) }}
                      </span>
                    </div>
                  </div>
                </div>
                
                <!-- Save to History Button -->
                @if (!predictionSaved()) {
                  <div class="result-actions">
                    <button 
                      class="btn-primary"
                      (click)="savePredictionToHistory()"
                      [disabled]="savingPrediction()">
                      @if (savingPrediction()) {
                        <span class="spinner"></span> Saving...
                      } @else {
                        <i class="gi gi-ui-chart" aria-hidden="true"></i>
                        Save to History
                      }
                    </button>
                  </div>
                } @else {
                  <div class="result-actions">
                    <div class="success-badge">
                      <i class="gi gi-check-circle" aria-hidden="true"></i>
                      Saved to History
                    </div>
                  </div>
                }
              </div>
            }

            @if (predictionError()) {
              <div class="result-card error">
                <h3>Prediction Failed</h3>
                <p>{{ predictionError() }}</p>
              </div>
            }
          </div>
        }

        <!-- MODELS TAB -->
        @if (activeTab() === 'models') {
          <div class="models-section">
            <div class="section-header-with-action">
              <div>
                <h2>Trained Models</h2>
                <p class="section-desc">
                  View and manage all trained ML models. Deactivate old models or select one for predictions.
                </p>
              </div>
              <button class="btn-secondary" (click)="exportModelsExcel()">
                <i class="gi gi-ui-chart" aria-hidden="true"></i>
                Export Models Excel
              </button>
            </div>

            <!-- Filter -->
            <div class="filter-bar">
              <select class="form-select" [(ngModel)]="filterModelType" (change)="loadModels()">
                <option value="">All Types</option>
                <option value="revenue">Revenue Models</option>
                <option value="orders">Order Models</option>
              </select>

              <div class="filter-toggle">
                <label class="toggle-label">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="showInactiveModels"
                    (change)="loadModels()"
                  />
                  <span>Show Inactive Models</span>
                </label>
              </div>
              
              <div class="filter-actions">
                <button class="btn-secondary" (click)="compareModels()" [disabled]="selectedModelsForCompare().length < 2">
                  Compare Selected ({{ selectedModelsForCompare().length }})
                </button>
                <button class="btn-danger" (click)="bulkDeactivateModels()" [disabled]="selectedModelsForCompare().length === 0">
                  Deactivate Selected
                </button>
              </div>
            </div>

            <!-- Models List -->
            @if (modelsLoading()) {
              <div class="loading">
                <div class="spinner"></div>
                <p>Loading models...</p>
              </div>
            } @else if (availableModels().length === 0) {
              <div class="empty-state">
                <div class="empty-icon"><i class="gi gi-ui-lab" aria-hidden="true"></i></div>
                <h3>No Models Found</h3>
                <p>Train your first model to get started with ML predictions.</p>
                <button class="btn-primary" (click)="activeTab.set('train')">
                  Train New Model
                </button>
              </div>
            } @else {
              <div class="models-grid">
                @for (model of availableModels(); track model._id) {
                  <div class="model-card" [class.inactive]="!model.isActive" [class.selected]="isModelSelected(model._id)">
                    @if (!model.isActive) {
                      <div class="inactive-badge">
                        <i class="gi gi-ui-close" aria-hidden="true"></i>
                        Inactive
                      </div>
                    }
                    <div class="model-select">
                      <input 
                        type="checkbox" 
                        [checked]="isModelSelected(model._id)"
                        (change)="toggleModelSelection(model._id)"
                        id="model-{{ model._id }}">
                      <label for="model-{{ model._id }}"></label>
                    </div>
                    <div class="model-header">
                      <h3>{{ model.modelName }}</h3>
                      <span class="model-badge" [attr.data-type]="model.modelType">
                        {{ model.modelType }}
                      </span>
                    </div>
                    <div class="model-body">
                      <div class="model-metrics">
                        <div class="metric-small">
                          <span class="label">R² Score:</span>
                          <span class="value" [attr.data-quality]="getMetricQuality(model.metrics.r2Score, 'r2')">
                            {{ model.metrics.r2Score.toFixed(4) }}
                          </span>
                        </div>
                        <div class="metric-small">
                          <span class="label">RMSE:</span>
                          <span class="value">{{ model.metrics.rmse.toFixed(2) }}</span>
                        </div>
                        <div class="metric-small">
                          <span class="label">MAE:</span>
                          <span class="value">{{ model.metrics.mae.toFixed(2) }}</span>
                        </div>
                      </div>
                      <div class="model-info-small">
                        <p><strong>Features:</strong> {{ model.features.join(', ') }}</p>
                        <p><strong>Training:</strong> {{ model.trainingRange }} months</p>
                        <p><strong>Trained:</strong> {{ formatDate(model.trainedAt) }}</p>
                        <p><strong>Usage:</strong> {{ model.usageCount }} predictions</p>
                      </div>
                    </div>
                    <div class="model-actions">
                      @if (model.isActive) {
                        <button 
                          class="btn-secondary btn-small"
                          (click)="selectModelForPrediction(model)">
                          Use for Prediction
                        </button>
                        <button 
                          class="btn-secondary btn-small"
                          (click)="retrainModel(model)">
                          Retrain
                        </button>
                        <button 
                          class="btn-secondary btn-small"
                          (click)="openRenameModal(model._id, model.modelName)">
                          Rename
                        </button>
                        <button 
                          class="btn-warning btn-small"
                          (click)="deactivateModel(model._id)">
                          Deactivate
                        </button>
                        <button 
                          class="btn-danger btn-small"
                          (click)="deleteModelConfirm(model._id, model.modelName)">
                          Delete
                        </button>
                      } @else {
                        <button 
                          class="btn-secondary btn-small"
                          (click)="activateModel(model._id)">
                          Activate
                        </button>
                        <button 
                          class="btn-secondary btn-small"
                          (click)="openRenameModal(model._id, model.modelName)">
                          Rename
                        </button>
                        <button 
                          class="btn-danger btn-small"
                          (click)="deleteModelConfirm(model._id, model.modelName)">
                          Delete
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- HISTORY TAB -->
        @if (activeTab() === 'history') {
          <div class="history-section">
            <div class="section-header">
              <div>
                <h2>Prediction History</h2>
                <p class="section-desc">
                  View all past predictions and their results.
                </p>
              </div>
              <div class="section-actions">
                <button class="btn-secondary" (click)="exportPredictionHistory()" [disabled]="predictionHistory().length === 0">
                  <i class="gi gi-ui-chart" aria-hidden="true"></i> Export Excel
                </button>
                <button class="btn-danger" (click)="clearPredictionHistory()" [disabled]="predictionHistory().length === 0">
                  Clear History
                </button>
              </div>
            </div>

            @if (predictionHistory().length === 0) {
              <div class="empty-state">
                <div class="empty-icon"><i class="gi gi-ui-chart" aria-hidden="true"></i></div>
                <h3>No Predictions Yet</h3>
                <p>Make your first prediction to see it here.</p>
              </div>
            } @else {
              <div class="history-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Model</th>
                      <th>Type</th>
                      <th>Input</th>
                      <th>Predicted Value</th>
                      <th>Requested By</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (prediction of predictionHistory(); track prediction._id) {
                      <tr>
                        <td>{{ formatDate(prediction.requestedAt) }}</td>
                        <td>{{ prediction.modelName }}</td>
                        <td>
                          <span class="badge" [attr.data-type]="prediction.modelType">
                            {{ prediction.modelType }}
                          </span>
                        </td>
                        <td>
                          @for (key of Object.keys(prediction.inputFeatures); track key) {
                            <div>{{ key }}: {{ prediction.inputFeatures[key] }}</div>
                          }
                        </td>
                        <td class="predicted-value">
                          {{ formatPredictedValue(prediction.predictedValue, prediction.modelType) }}
                        </td>
                        <td>{{ prediction.requestedByName }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }
      </div>

      <!-- Comparison Modal -->
      @if (showComparisonModal()) {
        <div class="modal-overlay" (click)="closeComparisonModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Model Comparison</h2>
              <button class="btn-close" (click)="closeComparisonModal()">
                <i class="gi gi-ui-close" aria-hidden="true"></i>
              </button>
            </div>
            <div class="modal-body">
              <div class="comparison-table-wrapper">
                <table class="comparison-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      @for (model of comparisonData(); track model._id) {
                        <th>{{ model.modelName }}</th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="metric-label">Model Type</td>
                      @for (model of comparisonData(); track model._id) {
                        <td>
                          <span class="badge" [attr.data-type]="model.modelType">
                            {{ model.modelType }}
                          </span>
                        </td>
                      }
                    </tr>
                    <tr>
                      <td class="metric-label">R² Score</td>
                      @for (model of comparisonData(); track model._id) {
                        <td>
                          <span [attr.data-quality]="getMetricQuality(model.metrics.r2Score, 'r2')" class="metric-value">
                            {{ model.metrics.r2Score.toFixed(4) }}
                          </span>
                        </td>
                      }
                    </tr>
                    <tr>
                      <td class="metric-label">RMSE</td>
                      @for (model of comparisonData(); track model._id) {
                        <td>{{ model.metrics.rmse.toFixed(2) }}</td>
                      }
                    </tr>
                    <tr>
                      <td class="metric-label">MAE</td>
                      @for (model of comparisonData(); track model._id) {
                        <td>{{ model.metrics.mae.toFixed(2) }}</td>
                      }
                    </tr>
                    <tr>
                      <td class="metric-label">Usage Count</td>
                      @for (model of comparisonData(); track model._id) {
                        <td>{{ model.usageCount }}</td>
                      }
                    </tr>
                    <tr>
                      <td class="metric-label">Training Range</td>
                      @for (model of comparisonData(); track model._id) {
                        <td>{{ model.trainingRange }} months</td>
                      }
                    </tr>
                    <tr>
                      <td class="metric-label">Trained Date</td>
                      @for (model of comparisonData(); track model._id) {
                        <td>{{ formatDate(model.trainedAt) }}</td>
                      }
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="closeComparisonModal()">Close</button>
            </div>
          </div>
        </div>
      }

      <!-- Confirm Modal -->
      @if (showConfirmModal()) {
        <div class="modal-overlay" (click)="closeConfirmModal()">
          <div class="modal-content modal-confirm" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ confirmModalData()?.title || 'Confirm Action' }}</h2>
              <button class="btn-close" (click)="closeConfirmModal()">
                <i class="gi gi-ui-close" aria-hidden="true"></i>
              </button>
            </div>
            <div class="modal-body">
              <p [innerHTML]="confirmModalData()?.message || ''"></p>
              @if (confirmModalData()?.needsTextConfirm) {
                <div class="form-group" style="margin-top: 20px;">
                  <label>Type "{{ confirmModalData()?.confirmMatch }}" to confirm:</label>
                  <input 
                    type="text" 
                    class="form-input" 
                    [(ngModel)]="confirmInput"
                    placeholder="Type here..."
                    (keyup.enter)="confirmModalAction()">
                </div>
              }
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="closeConfirmModal()">
                {{ confirmModalData()?.cancelButtonText || 'Cancel' }}
              </button>
              <button 
                [ngClass]="{
                  'btn-danger': confirmModalData()?.type === 'danger',
                  'btn-warning': confirmModalData()?.type === 'warning',
                  'btn-primary': confirmModalData()?.type === 'info' || !confirmModalData()?.type
                }"
                (click)="confirmModalAction()"
                [disabled]="confirmModalData()?.needsTextConfirm && confirmInput !== confirmModalData()?.confirmMatch">
                {{ confirmModalData()?.confirmButtonText || 'Confirm' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Rename Modal -->
      @if (showRenameModal()) {
        <div class="modal-overlay" (click)="closeRenameModal()">
          <div class="modal-content modal-rename" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Rename Model</h2>
              <button class="btn-close" (click)="closeRenameModal()">
                <i class="gi gi-ui-close" aria-hidden="true"></i>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>New Model Name:</label>
                <input 
                  type="text" 
                  class="form-input" 
                  [(ngModel)]="renameModelNewName"
                  placeholder="Enter new model name..."
                  (keyup.enter)="confirmRenameModel()">
              </div>
              <p class="hint" style="margin-top: 12px;">
                <strong>Note:</strong> This will update the model name in the database and rename the associated files (.joblib).
              </p>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="closeRenameModal()">Cancel</button>
              <button 
                class="btn-primary" 
                (click)="confirmRenameModel()"
                [disabled]="!renameModelNewName.trim()">
                Rename
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Alert Modal -->
      @if (showAlertModal()) {
        <div class="modal-overlay" (click)="closeAlertModal()">
          <div class="modal-content modal-alert" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ alertModalData()?.title || 'Notice' }}</h2>
              <button class="btn-close" (click)="closeAlertModal()">
                <i class="gi gi-ui-close" aria-hidden="true"></i>
              </button>
            </div>
            <div class="modal-body">
              <p>{{ alertModalData()?.message }}</p>
            </div>
            <div class="modal-footer">
              <button class="btn-primary" (click)="closeAlertModal()">OK</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* Main Layout */
    .ml-dashboard {
      padding: 24px;
      max-width: 1600px;
      margin: 0 auto;
    }

    /* Header */
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .dashboard-header h1 {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0;
    }

    .dashboard-header p {
      color: #666;
      margin: 4px 0 0;
      font-size: 14px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      background: #fff;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      border-color: #153243;
    }

    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #153243 0%, #1f4356 100%);
      border-radius: 12px;
      color: #c3d350;
      flex-shrink: 0;
    }

    .stat-icon i {
      width: 32px;
      height: 32px;
      font-size: 32px;
      display: inline-flex;
    }

    .stat-content h3 {
      font-size: 24px;
      font-weight: 700;
      margin: 0;
      color: #153243;
    }

    .stat-content p {
      color: #666;
      margin: 4px 0 0;
      font-size: 13px;
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 8px;
      border-bottom: 2px solid #e6e6ea;
      margin-bottom: 24px;
    }

    .tab {
      padding: 12px 24px;
      background: none;
      border: none;
      cursor: pointer;
      color: #666;
      font-weight: 600;
      font-size: 14px;
      position: relative;
      transition: all 0.2s;
      border-radius: 8px 8px 0 0;
    }

    .tab:hover {
      color: #153243;
      background: #f8f9fa;
    }

    .tab.active {
      color: #153243;
      background: #fff;
    }

    .tab.active::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      right: 0;
      height: 2px;
      background: #153243;
    }

    /* Tab Content */
    .tab-content {
      background: #fff;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .train-section, .predict-section, .models-section, .history-section {
      max-width: 100%;
    }

    .train-section h2, .predict-section h2, .models-section h2, .history-section h2 {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 700;
      color: #1a1a1a;
    }

    .section-desc {
      color: #666;
      margin-bottom: 24px;
      font-size: 14px;
      line-height: 1.6;
    }

    .section-header-with-action {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      gap: 20px;
    }

    .section-header-with-action h2 {
      margin: 0 0 8px 0;
    }

    .section-header-with-action .section-desc {
      margin-bottom: 0;
    }

    .section-header-with-action button {
      flex-shrink: 0;
      white-space: nowrap;
    }

    /* Tips Card */
    .tips-card {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 2px solid #3b82f6;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 32px;
      transition: all 0.3s ease;
    }

    .tips-card.collapsed {
      background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%);
      padding: 12px 20px;
    }

    .tips-header {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #1e40af;
      cursor: pointer;
      user-select: none;
      transition: all 0.2s;
      margin-bottom: 0;
    }

    .tips-header:hover {
      color: #1e3a8a;
    }

    .tips-card:not(.collapsed) .tips-header {
      margin-bottom: 16px;
    }

    .tips-header i:first-child {
      flex-shrink: 0;
    }

    .tips-header .chevron {
      margin-left: auto;
      transition: transform 0.3s ease;
    }

    .tips-card:not(.collapsed) .tips-header .chevron {
      transform: rotate(180deg);
    }

    .tips-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1e40af;
    }

    .tips-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .tip-item {
      font-size: 14px;
      line-height: 1.6;
      color: #1e3a8a;
    }

    .tip-item strong {
      color: #1e40af;
      display: block;
      margin-bottom: 6px;
    }

    .tip-item ul {
      margin: 8px 0 0 0;
      padding-left: 20px;
    }

    .tip-item li {
      margin: 6px 0;
    }

    .tip-item li strong {
      display: inline;
      color: #2563eb;
    }

    .tip-item p {
      margin: 8px 0 0 0;
    }

    .tip-item code {
      background: #dbeafe;
      padding: 2px 8px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #1e40af;
    }

    /* Forms */
    .train-form, .predict-form {
      max-width: 900px;
    }

    .form-section {
      margin-bottom: 32px;
    }

    .form-section h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 16px 0;
      color: #1a1a1a;
    }

    .radio-group {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .radio-card {
      position: relative;
      cursor: pointer;
    }

    .radio-card input {
      position: absolute;
      opacity: 0;
    }

    .radio-content {
      padding: 20px;
      border: 2px solid #e6e6ea;
      border-radius: 12px;
      transition: all 0.2s;
      background: #fff;
      text-align: center;
    }

    .radio-card:hover .radio-content {
      border-color: #153243;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .radio-card input:checked + .radio-content {
      border-color: #153243;
      background: #f8f9fa;
      box-shadow: 0 4px 12px rgba(21, 50, 67, 0.15);
    }

    .radio-content h4 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .radio-content p {
      margin: 0;
      font-size: 13px;
      color: #666;
      line-height: 1.5;
    }

    .button-group {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
    }

    .btn-option {
      padding: 16px;
      border: 2px solid #e6e6ea;
      background: #fff;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s;
      color: #666;
    }

    .btn-option:hover {
      border-color: #153243;
      color: #153243;
    }

    .btn-option.selected {
      border-color: #153243;
      background: #153243;
      color: #c3d350;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      font-size: 14px;
      color: #333;
    }

    .form-group input, .form-group select, .form-group textarea {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.2s;
    }

    .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
      outline: none;
      border-color: #153243;
    }

    /* Form Inputs & Selects */
    .form-input, .form-select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.2s;
    }

    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: #153243;
    }

    .form-input.error, .form-select.error {
      border-color: #dc3545;
    }

    .error-message {
      color: #dc3545;
      font-size: 13px;
      margin: 6px 0 0 0;
      font-weight: 500;
    }

    .input-hint {
      display: block;
      margin-top: 6px;
      font-size: 12px;
      color: #999;
    }

    .hint {
      display: block;
      margin-top: 6px;
      font-size: 12px;
      color: #999;
    }

    .hint.warning {
      color: #ff9800;
      font-weight: 500;
      margin-top: 8px;
    }

    .input-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    /* Buttons */
    .btn-primary, .btn-secondary, .btn-danger, .btn-warning {
      padding: 10px 20px;
      border: 2px solid transparent;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #153243;
      color: #fff;
      border-color: #153243;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0d1f29;
      border-color: #0d1f29;
    }

    .btn-secondary {
      background: #fff;
      color: #153243;
      border-color: #e6e6ea;
    }

    .btn-secondary:hover {
      background: #e6e6ea;
      border-color: #153243;
    }

    .btn-warning {
      background: #fff;
      color: #ff9800;
      border-color: #ff9800;
    }

    .btn-warning:hover:not(:disabled) {
      background: #ff9800;
      color: #fff;
      border-color: #ff9800;
    }

    .btn-danger {
      background: #fff;
      color: #dc3545;
      border-color: #dc3545;
    }

    .btn-danger:hover {
      background: #dc3545;
      color: #fff;
    }

    .btn-large {
      padding: 14px 28px;
      font-size: 16px;
    }

    .btn-small {
      padding: 8px 16px;
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .btn-primary:disabled,
    .btn-secondary:disabled,
    .btn-danger:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }

    .form-actions {
      margin-top: 24px;
    }

    /* Result Cards */
    .result-card {
      margin-top: 24px;
      border-radius: 12px;
      padding: 20px;
      border: 2px solid;
    }

    .result-card.success {
      background: #f0fff4;
      border-color: #48bb78;
    }

    .result-card.error {
      background: #fff5f5;
      border-color: #fc8181;
    }

    .result-header h3 {
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .result-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .result-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .result-item .label {
      font-size: 13px;
      color: #666;
    }

    .result-item .value {
      font-weight: 600;
      font-size: 16px;
      color: #1a1a1a;
    }

    /* Metrics */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin: 16px 0;
    }

    .metric-card {
      background: #fff;
      padding: 16px;
      border-radius: 12px;
      border: 2px solid #e6e6ea;
      transition: all 0.2s;
    }

    .metric-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .metric-card[data-quality="excellent"] {
      border-color: #48bb78;
      background: #f0fff4;
    }

    .metric-card[data-quality="good"] {
      border-color: #4299e1;
      background: #ebf8ff;
    }

    .metric-card[data-quality="fair"] {
      border-color: #ed8936;
      background: #fffaf0;
    }

    .metric-label {
      font-size: 13px;
      color: #666;
      margin-bottom: 6px;
    }

    .metric-value {
      font-size: 24px;
      font-weight: 700;
      color: #153243;
    }

    .metric-desc {
      font-size: 12px;
      color: #999;
      margin-top: 6px;
    }

    /* Prediction Result */
    .prediction-value {
      text-align: center;
      padding: 32px;
      background: #f8f9fa;
      border-radius: 12px;
      margin-bottom: 20px;
      border: 2px solid #e6e6ea;
    }

    .predicted-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .predicted-number {
      font-size: 48px;
      font-weight: 700;
      color: #153243;
    }

    /* Models Grid */
    .models-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
      animation: fadeIn 0.4s ease-in-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .model-card {
      background: #fff;
      border: 2px solid #e6e6ea;
      border-radius: 12px;
      padding: 20px;
      transition: all 0.3s ease;
      position: relative;
      min-height: 280px;
      display: flex;
      flex-direction: column;
    }

    .model-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      border-color: #153243;
      transform: translateY(-2px);
    }

    .model-card.inactive {
      opacity: 0.75;
      background: linear-gradient(135deg, #f8f9fa 0%, #f0f0f0 100%);
      border-style: dashed;
    }

    .model-card.inactive:hover {
      opacity: 1;
    }

    .model-card.selected {
      border-color: #153243;
      background: #f0f7ff;
    }

    .inactive-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: #ff6b6b;
      color: white;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      z-index: 5;
      box-shadow: 0 2px 6px rgba(255, 107, 107, 0.3);
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.8;
      }
    }

    .inactive-badge i {
      width: 14px;
      height: 14px;
      font-size: 14px;
      display: inline-flex;
    }

    .model-select {
      position: absolute;
      top: 16px;
      left: 16px;
      z-index: 10;
    }

    .model-select input[type="checkbox"] {
      width: 20px;
      height: 20px;
      cursor: pointer;
      accent-color: #153243;
      margin-top: 4px;
    }

    .model-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      margin-left: 32px;
      gap: 12px;
    }

    .model-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
      line-height: 1.4;
      flex: 1;
      word-break: break-word;
    }

    .model-card.inactive .model-header h3 {
      color: #666;
    }

    .model-badge, .badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .model-badge[data-type="revenue"], .badge[data-type="revenue"] {
      background: #153243;
      color: #c3d350;
      flex-shrink: 0;
    }

    .model-badge[data-type="orders"], .badge[data-type="orders"] {
      background: #153243;
      color: #c3d350;
      flex-shrink: 0;
    }

    .model-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .model-metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 12px;
    }

    .metric-small {
      font-size: 13px;
    }

    .metric-small .label {
      color: #666;
      display: block;
      margin-bottom: 4px;
    }

    .metric-small .value {
      font-weight: 600;
      color: #153243;
      font-size: 16px;
    }

    .metric-small .value[data-quality="excellent"] {
      color: #38a169;
    }

    .metric-small .value[data-quality="good"] {
      color: #3182ce;
    }

    .model-info-small p {
      margin: 8px 0;
      font-size: 13px;
      color: #666;
      word-break: break-word;
      line-height: 1.6;
    }

    .model-info-small strong {
      color: #153243;
      font-weight: 600;
    }

    .model-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e6e6ea;
      flex-wrap: wrap;
    }

    .model-actions .btn-secondary,
    .model-actions .btn-warning,
    .model-actions .btn-danger {
      flex: 1;
      min-width: 100px;
      justify-content: center;
      white-space: nowrap;
      font-size: 12px;
      padding: 8px 12px;
    }

    .model-actions .btn-secondary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(21, 50, 67, 0.15);
    }

    .model-actions .btn-warning:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(255, 152, 0, 0.25);
    }

    .model-actions .btn-danger:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(220, 53, 69, 0.15);
    }

    /* Table */
    .history-table {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
    }

    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e6e6ea;
    }

    th {
      background: #f8f9fa;
      font-weight: 600;
      color: #666;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    td {
      color: #333;
      font-size: 14px;
    }

    .predicted-value {
      font-weight: 600;
      color: #153243;
    }

    /* Loading & Empty States */
    .loading, .empty-state {
      text-align: center;
      padding: 60px 20px;
      animation: fadeIn 0.3s ease-in-out;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f0f0f0;
      border-top-color: #153243;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }

    .empty-icon i {
      width: 1em;
      height: 1em;
      vertical-align: middle;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #1a1a1a;
      font-size: 18px;
    }

    .empty-state p {
      color: #666;
      margin-bottom: 20px;
      font-size: 14px;
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .filter-bar {
        flex-direction: column;
        align-items: stretch;
      }
      
      .filter-toggle {
        order: 1;
        width: 100%;
      }
      
      .filter-actions {
        order: 2;
        width: 100%;
        justify-content: stretch;
      }
      
      .filter-actions button {
        flex: 1;
      }
    }

    @media (max-width: 768px) {
      .ml-dashboard {
        padding: 16px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .radio-group, .button-group {
        grid-template-columns: 1fr;
      }

      .models-grid {
        grid-template-columns: 1fr;
      }

      .tabs {
        overflow-x: auto;
        white-space: nowrap;
      }
      
      .model-actions {
        flex-direction: column;
      }
      
      .model-actions .btn-secondary,
      .model-actions .btn-danger {
        width: 100%;
      }
      
      .filter-actions {
        flex-direction: column;
      }
      
      .model-metrics {
        grid-template-columns: 1fr;
      }
    }

    /* New feature styles */
    .filter-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      margin-bottom: 28px;
      flex-wrap: wrap;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 12px;
      border: 2px solid #e6e6ea;
    }

    .filter-toggle {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 200px;
    }

    .toggle-label {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      font-size: 14px;
      color: #333;
      user-select: none;
      position: relative;
      padding: 8px 12px;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .toggle-label input[type="checkbox"] {
      margin-top: 14px;
      appearance: none;
      -webkit-appearance: none;
      width: 48px;
      height: 26px;
      background: #ddd;
      border-radius: 18px;
      position: relative;
      cursor: pointer;
      transition: all 0.3s ease;
      outline: none;
      border: 2px solid #ccc;
    }

    .toggle-label input[type="checkbox"]:checked {
      background: #153243;
      border-color: #153243;
    }

    .toggle-label input[type="checkbox"]::before {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: white;
      top: 1px;
      left: 2px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .toggle-label input[type="checkbox"]:checked::before {
      left: 22px;
      background: #c3d350;
    }

    .toggle-label span {
      font-weight: 600;
      color: #153243;
    }

    .filter-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .section-actions {
      display: flex;
      gap: 12px;
    }

    .model-info, .input-summary, .model-summary {
      margin-top: 20px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .model-info h4, .input-summary h4, .model-summary h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .info-item {
      font-size: 13px;
    }

    .info-item .label {
      color: #666;
      display: block;
      margin-bottom: 4px;
    }

    .info-item .value {
      font-weight: 600;
      color: #153243;
    }

    .input-summary ul {
      margin: 0;
      padding-left: 20px;
    }

    .input-summary li {
      margin: 8px 0;
      font-size: 14px;
      color: #333;
    }

    .metrics-mini {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    .metrics-mini .metric {
      font-size: 13px;
      color: #666;
    }

    .metrics-mini .metric strong {
      color: #153243;
    }

    /* Result Actions */
    .result-actions {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 2px solid #e6e6ea;
      display: flex;
      justify-content: center;
    }

    .result-actions .btn-primary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      font-size: 15px;
      font-weight: 600;
    }

    .result-actions .btn-primary svg,
    .result-actions .btn-primary i {
      flex-shrink: 0;
      width: 18px;
      height: 18px;
    }

    .result-actions .btn-primary i {
      font-size: 18px;
      display: inline-flex;
    }

    .success-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #48bb78;
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
    }

    .success-badge svg,
    .success-badge i {
      flex-shrink: 0;
      width: 18px;
      height: 18px;
    }

    .success-badge i {
      font-size: 18px;
      display: inline-flex;
    }

    .inactive-label {
      color: #999;
      font-size: 13px;
      font-weight: 600;
      text-align: center;
      padding: 8px;
      background: #f0f0f0;
      border-radius: 6px;
      width: 100%;
    }

    .form-select {
      min-width: 200px;
      height: 42px;
      font-weight: 500;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal-content {
      background: #fff;
      border-radius: 12px;
      max-width: 1000px;
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      border-bottom: 2px solid #e6e6ea;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: #153243;
    }

    .btn-close {
      background: none;
      border: none;
      padding: 8px;
      cursor: pointer;
      color: #666;
      border-radius: 6px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-close i {
      width: 20px;
      height: 20px;
      font-size: 20px;
      display: inline-flex;
    }

    .btn-close:hover {
      background: #f8f9fa;
      color: #153243;
    }

    .modal-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 2px solid #e6e6ea;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .comparison-table-wrapper {
      overflow-x: auto;
    }

    .comparison-table {
      width: 100%;
      border-collapse: collapse;
    }

    .comparison-table th,
    .comparison-table td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #e6e6ea;
    }

    .comparison-table th {
      background: #f8f9fa;
      font-weight: 600;
      color: #153243;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      position: sticky;
      top: 0;
    }

    .comparison-table .metric-label {
      font-weight: 600;
      color: #666;
      background: #f8f9fa;
    }

    .comparison-table .metric-value[data-quality="excellent"] {
      color: #38a169;
      font-weight: 700;
    }

    .comparison-table .metric-value[data-quality="good"] {
      color: #3182ce;
      font-weight: 700;
    }

    .comparison-table .metric-value[data-quality="fair"] {
      color: #d69e2e;
      font-weight: 700;
    }

    /* Confirm Modal Styles */
    .modal-confirm {
      max-width: 500px;
    }

    .modal-confirm .modal-body p {
      font-size: 14px;
      line-height: 1.6;
      color: #333;
    }

    /* Rename Modal Styles */
    .modal-rename {
      max-width: 500px;
    }

    /* Alert Modal Styles */
    .modal-alert {
      max-width: 450px;
    }

    .modal-alert .modal-body p {
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      margin: 0;
    }
  `]
})
export class AnalyticsMlComponent implements OnInit {
  Math = Math;
  Object = Object;

  // Services
  private mlService = inject(MlService);

  // State
  activeTab = signal<'train' | 'predict' | 'models' | 'history'>('train');
  trainingLoading = signal(false);
  predictionLoading = signal(false);
  modelsLoading = signal(false);
  
  // Data
  availableModels = signal<TrainedModel[]>([]);
  allModels = signal<TrainedModel[]>([]); // All models including inactive for stats
  predictionHistory = signal<Prediction[]>([]);
  dashboardStats = signal<any>(null);
  
  // Forms
  trainingForm: TrainingForm = {
    modelName: '',
    modelType: 'revenue',
    trainingRange: 6
  };
  
  // Prediction form as signals for reactive computed
  selectedModelId = signal<string>('');
  predictionVisits = signal<number>(0);
  predictionOrders = signal<number>(0);
  
  // Legacy form object for template compatibility
  get predictionForm() {
    return {
      selectedModelId: this.selectedModelId(),
      visits: this.predictionVisits(),
      orders: this.predictionOrders()
    };
  }
  
  set predictionForm(value: PredictionForm) {
    this.selectedModelId.set(value.selectedModelId);
    this.predictionVisits.set(value.visits);
    this.predictionOrders.set(value.orders);
  }
  
  // Results
  trainingResult = signal<any>(null);
  trainingError = signal<string | null>(null);
  validationError = signal<ValidationError | null>(null);
  predictionResult = signal<any>(null);
  predictionError = signal<string | null>(null);
  predictionSaved = signal<boolean>(false); // Track if current prediction is saved
  savingPrediction = signal<boolean>(false); // Track save operation
  
  // Filter
  filterModelType = '';
  showInactiveModels = false;
  
  // Model selection for compare/bulk actions
  selectedModelsForCompare = signal<string[]>([]);
  
  // Comparison modal
  showComparisonModal = signal(false);
  comparisonData = signal<TrainedModel[]>([]);
  
  // Confirmation modal
  showConfirmModal = signal(false);
  confirmModalData = signal<{
    title: string;
    message: string;
    confirmText?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    type?: 'danger' | 'warning' | 'info';
    needsTextConfirm?: boolean;
    confirmMatch?: string;
    onConfirm?: () => void;
  } | null>(null);
  confirmInput = '';
  
  // Rename modal
  showRenameModal = signal(false);
  renameModelId = '';
  renameModelNewName = '';
  
  // Alert modal  
  showAlertModal = signal(false);
  alertModalData = signal<{
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info';
  } | null>(null);
  
  // Tips visibility
  showTrainingTips = signal(false);
  
  // Computed
  selectedModel = computed(() => {
    const modelId = this.selectedModelId(); // Use signal
    if (!modelId) return null;
    
    // Search in all models (not just filtered ones)
    const model = this.allModels().find(m => m._id === modelId) || 
           this.availableModels().find(m => m._id === modelId) || 
           null;
    
    return model;
  });
  
  isRevenueModel = computed(() => {
    const model = this.selectedModel();
    return model?.modelType === 'revenue';
  });
  
  totalModels = computed(() => {
    return this.allModels().length;
  });
  
  activeModels = computed(() => {
    return this.availableModels().filter(m => m.isActive).length;
  });

  activeModelsList = computed(() => {
    return this.availableModels().filter(m => m.isActive);
  });

  hasNoActiveModels = computed(() => {
    return this.availableModels().filter(m => m.isActive).length === 0;
  });
  
  totalPredictions = computed(() => {
    return this.dashboardStats()?.totalPredictions || 0;
  });
  
  bestR2Score = computed(() => {
    const stats = this.dashboardStats();
    if (!stats) return 'N/A';
    
    const revenueR2 = stats.bestModels?.revenue?.metrics?.r2Score || 0;
    const ordersR2 = stats.bestModels?.orders?.metrics?.r2Score || 0;
    const best = Math.max(revenueR2, ordersR2);
    
    return best > 0 ? best.toFixed(4) : 'N/A';
  });

  ngOnInit() {
    this.loadInitialData();
  }

  async loadInitialData() {
    this.loadModels();
    this.loadDashboardStats();
    this.loadPredictionHistory();
  }

  loadModels() {
    this.modelsLoading.set(true);
    const modelType = this.filterModelType as any;
    const activeOnly = !this.showInactiveModels;
    
    // Load filtered models for display
    this.mlService.listModels(modelType || undefined, activeOnly).subscribe({
      next: (response: any) => {
        this.availableModels.set(response.data);
        this.modelsLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading models:', error);
        this.modelsLoading.set(false);
      }
    });
    
    // Load all models (no filter) for stats card
    this.mlService.listModels(undefined, false).subscribe({
      next: (response: any) => {
        this.allModels.set(response.data);
      },
      error: (error: any) => {
        console.error('Error loading all models:', error);
      }
    });
  }

  loadDashboardStats() {
    this.mlService.getDashboardStats().subscribe({
      next: (response: any) => {
        this.dashboardStats.set(response.data);
      },
      error: (error: any) => {
        console.error('Error loading dashboard stats:', error);
      }
    });
  }

  loadPredictionHistory() {
    this.mlService.getPredictionHistory(undefined, 50).subscribe({
      next: (response: any) => {
        this.predictionHistory.set(response.data);
      },
      error: (error: any) => {
        console.error('Error loading prediction history:', error);
      }
    });
  }

  onModelTypeChange() {
    // Clear validation errors
    this.validationError.set(null);
  }

  handleTrainModel() {
    // Clear previous errors
    this.validationError.set(null);
    this.trainingError.set(null);

    // Validation
    if (!this.trainingForm.modelName || !this.trainingForm.modelType || !this.trainingForm.trainingRange) {
      if (!this.trainingForm.modelName) {
        this.validationError.set({
          field: 'modelName',
          message: 'Please enter a name for your model'
        });
      }
      return;
    }

    this.trainingLoading.set(true);
    this.trainingResult.set(null);
    this.trainingError.set(null);

    this.mlService.trainModel(this.trainingForm).subscribe({
      next: (response: any) => {
        this.trainingResult.set(response.data);
        this.trainingLoading.set(false);
        this.loadModels(); // Refresh models list
        this.loadDashboardStats();
      },
      error: (error: any) => {
        this.trainingError.set(error.error?.error || 'Training failed. Please try again.');
        this.trainingLoading.set(false);
      }
    });
  }

  handlePredict() {
    if (!this.selectedModelId() || !this.predictionVisits()) {
      return;
    }

    this.predictionLoading.set(true);
    this.predictionResult.set(null);
    this.predictionError.set(null);
    this.predictionSaved.set(false); // Reset saved status

    const inputFeatures: any = {
      visits: this.predictionVisits()
    };

    if (this.selectedModel()?.features.includes('orders')) {
      inputFeatures.orders = this.predictionOrders();
    }

    this.mlService.predict({
      modelId: this.selectedModelId(),
      inputFeatures
    }).subscribe({
      next: (response: any) => {
        this.predictionResult.set(response.data);
        this.predictionLoading.set(false);
        // Don't auto-load history - let user decide to save
      },
      error: (error: any) => {
        this.predictionError.set(error.error?.error || 'Prediction failed. Please try again.');
        this.predictionLoading.set(false);
      }
    });
  }

  savePredictionToHistory() {
    if (!this.predictionResult() || this.predictionSaved()) {
      return;
    }

    this.savingPrediction.set(true);

    // Call API to save prediction
    this.mlService.savePrediction(this.predictionResult()).subscribe({
      next: () => {
        this.savingPrediction.set(false);
        
        // Show success message
        this.showAlert('Success', 'Prediction saved to history successfully', 'success');
        
        // Refresh history and stats
        this.loadPredictionHistory();
        this.loadDashboardStats();
        
        // Reset form for next prediction
        setTimeout(() => {
          this.predictionResult.set(null);
          this.predictionError.set(null);
          this.predictionSaved.set(false);
          this.selectedModelId.set('');
          this.predictionVisits.set(0);
          this.predictionOrders.set(0);
        }, 1500); // Wait 1.5s so user can see success message
      },
      error: (error: any) => {
        this.savingPrediction.set(false);
        this.showAlert('Error', error.error?.error || 'Failed to save prediction', 'error');
      }
    });
  }

  onModelDropdownChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedModelId.set(select.value);
    this.onModelSelectionChange();
  }

  selectModelForPrediction(model: TrainedModel) {
    // Switch to predict tab
    this.activeTab.set('predict');
    
    // Set model and reset form values
    setTimeout(() => {
      this.selectedModelId.set(model._id);
      this.predictionVisits.set(0);
      this.predictionOrders.set(0);
      
      // Clear previous results
      this.predictionResult.set(null);
      this.predictionError.set(null);
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }

  onModelSelectionChange() {
    // Reset input values when model changes
    this.predictionVisits.set(0);
    this.predictionOrders.set(0);
    
    // Clear previous results
    this.predictionResult.set(null);
    this.predictionError.set(null);
  }

  deactivateModel(modelId: string) {
    this.showConfirmDialog(
      'Deactivate Model',
      'Are you sure you want to deactivate this model? It will no longer be available for predictions.',
      () => {
        this.mlService.deactivateModel(modelId).subscribe({
          next: () => {
            this.loadModels();
            this.showAlert('Success', 'Model deactivated successfully', 'success');
          },
          error: (error: any) => {
            console.error('Error deactivating model:', error);
            this.showAlert('Error', 'Failed to deactivate model', 'error');
          }
        });
      },
      'warning',
      'Deactivate',
      'Cancel'
    );
  }

  activateModel(modelId: string) {
    this.showConfirmDialog(
      'Activate Model',
      'Are you sure you want to activate this model? It will be available for making predictions.',
      () => {
        this.mlService.activateModel(modelId).subscribe({
          next: () => {
            this.loadModels();
            this.showAlert('Success', 'Model activated successfully', 'success');
          },
          error: (error: any) => {
            console.error('Error activating model:', error);
            this.showAlert('Error', 'Failed to activate model', 'error');
          }
        });
      },
      'info',
      'Activate',
      'Cancel'
    );
  }

  deleteModelConfirm(modelId: string, modelName: string) {
    this.showConfirmDialog(
      'Delete Model',
      `Are you sure you want to <strong>DELETE</strong> model "<strong>${modelName}</strong>"?<br><br>This will:<br>- Delete the model file from server<br>- Remove all prediction history<br>- <strong>Cannot be undone</strong>`,
      () => {
        this.mlService.deleteModel(modelId).subscribe({
          next: () => {
            this.showAlert('Success', 'Model deleted successfully', 'success');
            this.loadModels();
            this.loadDashboardStats();
          },
          error: (error: any) => {
            console.error('Error deleting model:', error);
            this.showAlert('Error', 'Failed to delete model: ' + (error.error?.error || 'Unknown error'), 'error');
          }
        });
      },
      'danger',
      'Delete',
      'Cancel',
      true,
      'DELETE'
    );
  }

  getMetricQuality(value: number, type: 'r2' | 'rmse' | 'mae'): string {
    if (type === 'r2') {
      if (value >= 0.9) return 'excellent';
      if (value >= 0.7) return 'good';
      return 'fair';
    }
    return '';
  }

  getMetricDescription(type: string, value: number): string {
    if (type === 'r2') {
      if (value >= 0.9) return 'Excellent fit';
      if (value >= 0.7) return 'Good fit';
      if (value >= 0.5) return 'Moderate fit';
      return 'Poor fit';
    }
    return '';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatPredictedValue(value: number, modelType: string): string {
    if (modelType === 'revenue') {
      return `£${value.toFixed(2)}`;
    }
    return Math.round(value).toString();
  }

  // New methods for added features
  
  toggleModelSelection(modelId: string) {
    const selected = this.selectedModelsForCompare();
    const index = selected.indexOf(modelId);
    
    if (index > -1) {
      this.selectedModelsForCompare.set(selected.filter(id => id !== modelId));
    } else {
      this.selectedModelsForCompare.set([...selected, modelId]);
    }
  }

  isModelSelected(modelId: string): boolean {
    return this.selectedModelsForCompare().includes(modelId);
  }

  compareModels() {
    const selectedIds = this.selectedModelsForCompare();
    if (selectedIds.length < 2) {
      this.showAlert('Selection Required', 'Please select at least 2 models to compare', 'info');
      return;
    }

    const selectedModels = this.availableModels().filter(m => selectedIds.includes(m._id));
    this.comparisonData.set(selectedModels);
    this.showComparisonModal.set(true);
  }

  closeComparisonModal() {
    this.showComparisonModal.set(false);
  }

  bulkDeactivateModels() {
    const selectedIds = this.selectedModelsForCompare();
    if (selectedIds.length === 0) {
      this.showAlert('Selection Required', 'Please select models to deactivate', 'info');
      return;
    }

    this.showConfirmDialog(
      'Deactivate Multiple Models',
      `Are you sure you want to deactivate ${selectedIds.length} model(s)?`,
      () => {
        let completed = 0;
        selectedIds.forEach(modelId => {
          this.mlService.deactivateModel(modelId).subscribe({
            next: () => {
              completed++;
              if (completed === selectedIds.length) {
                this.selectedModelsForCompare.set([]);
                this.loadModels();
                this.showAlert('Success', `Successfully deactivated ${completed} model(s)`, 'success');
              }
            },
            error: (error: any) => {
              console.error('Error deactivating model:', error);
            }
          });
        });
      },
      'warning'
    );
  }

  retrainModel(model: TrainedModel) {
    this.showConfirmDialog(
      'Retrain Model',
      `Retrain model "<strong>${model.modelName}</strong>"?<br><br>This will create a new version with updated data.`,
      () => {
        // Copy model config to training form
        this.trainingForm = {
          modelName: `${model.modelName}_v2`,
          modelType: model.modelType,
          trainingRange: model.trainingRange
        };

        this.activeTab.set('train');
      },
      'info',
      'Retrain',
      'Cancel'
    );
  }

  exportPredictionHistory() {
    const predictions = this.predictionHistory();
    if (predictions.length === 0) {
      this.showAlert('No Data', 'No predictions to export', 'info');
      return;
    }

    // Prepare data for Excel
    const excelData = predictions.map((p: any) => ({
      'Date': this.formatDate(p.requestedAt),
      'Model Name': p.modelName,
      'Type': p.modelType,
      'Input Features': Object.entries(p.inputFeatures).map(([k, v]) => `${k}:${v}`).join('; '),
      'Predicted Value': this.formatPredictedValue(p.predictedValue, p.modelType),
      'Requested By': p.requestedByName || 'Unknown'
    }));

    import('xlsx').then(XLSX => {
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Predictions');
      XLSX.writeFile(wb, `ml_predictions_${new Date().toISOString().split('T')[0]}.xlsx`);
    });
  }

  exportModelsExcel() {
    const models = this.allModels(); // Export all models including inactive
    if (models.length === 0) {
      this.showAlert('No Data', 'No models to export', 'info');
      return;
    }

    // Prepare data for Excel
    const excelData = models.map((m: any) => ({
      'Model Name': m.modelName,
      'Type': m.modelType,
      'Status': m.isActive ? 'Active' : 'Inactive',
      'Algorithm': m.algorithm,
      'Training Range (months)': m.trainingRange,
      'R² Score': parseFloat(m.metrics.r2Score.toFixed(4)),
      'RMSE': parseFloat(m.metrics.rmse.toFixed(2)),
      'MAE': parseFloat(m.metrics.mae.toFixed(2)),
      'Features': m.features.join('; '),
      'Trained By': m.trainedByName || 'Unknown',
      'Trained At': this.formatDate(m.trainedAt),
      'Usage Count': m.usageCount || 0
    }));

    import('xlsx').then(XLSX => {
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'ML Models');
      XLSX.writeFile(wb, `ml_models_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      this.showAlert('Success', `Exported ${models.length} model(s) to Excel`, 'success');
    });
  }

  clearPredictionHistory() {
    this.showConfirmDialog(
      'Clear Prediction History',
      'Are you sure you want to clear <strong>all prediction history</strong>?<br><br>This action <strong>cannot be undone</strong>.',
      () => {
        this.mlService.clearPredictionHistory().subscribe({
          next: () => {
            this.predictionHistory.set([]);
            this.showAlert('Success', 'Prediction history cleared successfully', 'success');
          },
          error: (error: any) => {
            console.error('Error clearing prediction history:', error);
            this.showAlert('Error', 'Failed to clear prediction history. Please try again.', 'error');
          }
        });
      },
      'danger',
      'Clear All',
      'Cancel',
      true,
      'CLEAR'
    );
  }

  // Modal Helper Methods
  showConfirmDialog(
    title: string,
    message: string,
    onConfirm: () => void,
    type: 'danger' | 'warning' | 'info' = 'info',
    confirmButtonText = 'Confirm',
    cancelButtonText = 'Cancel',
    needsTextConfirm = false,
    confirmMatch = ''
  ) {
    this.confirmModalData.set({
      title,
      message,
      confirmButtonText,
      cancelButtonText,
      type,
      needsTextConfirm,
      confirmMatch,
      onConfirm
    });
    this.confirmInput = '';
    this.showConfirmModal.set(true);
  }

  closeConfirmModal() {
    this.showConfirmModal.set(false);
    this.confirmModalData.set(null);
    this.confirmInput = '';
  }

  confirmModalAction() {
    const data = this.confirmModalData();
    if (!data) return;

    if (data.needsTextConfirm && this.confirmInput !== data.confirmMatch) {
      return; // Don't proceed if text confirmation doesn't match
    }

    if (data.onConfirm) {
      data.onConfirm();
    }

    this.closeConfirmModal();
  }

  showAlert(title: string, message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.alertModalData.set({ title, message, type });
    this.showAlertModal.set(true);
  }

  closeAlertModal() {
    this.showAlertModal.set(false);
    this.alertModalData.set(null);
  }

  // Rename Modal Methods
  openRenameModal(modelId: string, currentName: string) {
    this.renameModelId = modelId;
    this.renameModelNewName = currentName;
    this.showRenameModal.set(true);
  }

  closeRenameModal() {
    this.showRenameModal.set(false);
    this.renameModelId = '';
    this.renameModelNewName = '';
  }

  confirmRenameModel() {
    if (!this.renameModelNewName.trim()) {
      return;
    }

    this.mlService.renameModel(this.renameModelId, this.renameModelNewName.trim()).subscribe({
      next: () => {
        this.showAlert('Success', 'Model renamed successfully', 'success');
        this.loadModels();
        this.closeRenameModal();
      },
      error: (error: any) => {
        console.error('Error renaming model:', error);
        this.showAlert('Error', 'Failed to rename model: ' + (error.error?.error || 'Unknown error'), 'error');
      }
    });
  }
}
