/**
 * Analytics Forecast Component
 * 
 * Time Series Forecasting similar to Excel/Power BI
 * 
 * Features:
 * - Forecast Revenue, Orders, or Visits
 * - Multiple methods: Linear Regression, Moving Average, Exponential Smoothing
 * - Interactive chart with historical + forecasted data
 * - Performance metrics: MAE, RMSE, R²
 * 
 * Academic Purpose:
 * - Demonstrates time series analysis
 * - Shows integration with ML service
 * - Implements data visualization best practices
 */

import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MlService } from '../../services/ml.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics-forecast',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Analytics Forecast Component -->
    <div class="analytics-forecast-container">
      
      <!-- Header -->
      <div class="forecast-header">
        <h2><i class="gi gi-ui-chart title-icon" aria-hidden="true"></i> Time Series Forecast</h2>
        <p class="subtitle">Predict future trends similar to Excel/Power BI forecast functions</p>
      </div>
      
      <!-- Forecast Configuration Form -->
      <div class="forecast-form-card">
        <h3>Forecast Configuration</h3>
        
        <div class="form-grid">
          <!-- Metric Selection -->
          <div class="form-group">
            <label for="metric">
              <span class="label-icon"><i class="gi gi-ui-target" aria-hidden="true"></i></span>
              Metric to Forecast
            </label>
            <select 
              id="metric" 
              [(ngModel)]="forecastForm.metric"
              class="form-control">
              @for (option of metricOptions; track option.value) {
                <option [value]="option.value">
                  {{ option.label }}
                </option>
              }
            </select>
            <small class="form-hint">Select the business metric you want to predict</small>
          </div>
          
          <!-- Forecast Days Selection -->
          <div class="form-group">
            <label for="forecastDays">
              <span class="label-icon"><i class="gi gi-ui-calendar" aria-hidden="true"></i></span>
              Forecast Period
            </label>
            <select 
              id="forecastDays" 
              [(ngModel)]="forecastForm.forecastDays"
              class="form-control">
              @for (option of forecastDaysOptions; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>
            <small class="form-hint">How many days ahead to forecast</small>
          </div>
          
          <!-- Method Selection -->
          <div class="form-group full-width">
            <label>
              <span class="label-icon"><i class="gi gi-ui-lab" aria-hidden="true"></i></span>
              Forecast Method
            </label>
            
            <div class="method-selector">
              @for (option of methodOptions; track option.value) {
                <div 
                  class="method-card"
                  [class.selected]="forecastForm.method === option.value"
                  (click)="forecastForm.method = option.value">
                  
                  <div class="method-header">
                    <span class="method-name">{{ option.label }}</span>
                    <span class="method-badge">{{ option.badge }}</span>
                  </div>
                  
                  <p class="method-desc">{{ option.description }}</p>
                  
                  <div class="method-indicator">
                    @if (forecastForm.method === option.value) {
                      <span class="checkmark"><i class="gi gi-ui-success" aria-hidden="true"></i></span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="form-actions">
          <button 
            class="btn-primary"
            (click)="generateForecast()"
            [disabled]="loading()">
            @if (loading()) {
              <span class="spinner"></span>
              Generating Forecast...
            } @else {
              <span class="btn-icon"><i class="gi gi-ui-rocket" aria-hidden="true"></i></span>
              Generate Forecast
            }
          </button>
          
          @if (hasResult()) {
            <button 
              class="btn-secondary"
              (click)="resetForecast()">
              <span class="btn-icon"><i class="gi gi-ui-reset" aria-hidden="true"></i></span>
              Reset
            </button>
          }
        </div>
      </div>
      
      <!-- Error Message -->
      @if (error()) {
        <div class="alert alert-error">
          <span class="alert-icon"><i class="gi gi-ui-warning" aria-hidden="true"></i></span>
          <div class="alert-content">
            <strong>Error:</strong> {{ error() }}
          </div>
        </div>
      }
      
      <!-- Forecast Results -->
      @if (hasResult()) {
        <div class="forecast-results">
          
          <!-- Summary Stats -->
          <div class="summary-cards">
            <div class="summary-card">
              <div class="card-icon"><i class="gi gi-ui-chart" aria-hidden="true"></i></div>
              <div class="card-content">
                <h4>Historical Data</h4>
                <p class="card-value">{{ forecastResult().historical_count }} days</p>
                <small>{{ forecastResult().historical_data[0].date }} to {{ forecastResult().historical_data[forecastResult().historical_count - 1].date }}</small>
              </div>
            </div>
            
            <div class="summary-card">
              <div class="card-icon"><i class="gi gi-ui-forecast" aria-hidden="true"></i></div>
              <div class="card-content">
                <h4>Forecast Period</h4>
                <p class="card-value">{{ forecastForm.forecastDays }} days</p>
                <small>{{ forecastResult().forecast_data[0].date }} to {{ forecastResult().forecast_data[forecastForm.forecastDays - 1].date }}</small>
              </div>
            </div>
            
            <div class="summary-card">
              <div class="card-icon"><i class="gi" [class]="getTrendIcon()" aria-hidden="true"></i></div>
              <div class="card-content">
                <h4>Trend</h4>
                <p class="card-value" [ngClass]="getTrendClass()">{{ getTrendText() }}</p>
                <small>Based on forecast data</small>
              </div>
            </div>
            
            <div class="summary-card">
              <div class="card-icon"><i class="gi gi-ui-trend-up" aria-hidden="true"></i></div>
              <div class="card-content">
                <h4>Forecast Average</h4>
                <p class="card-value">{{ formatValue(forecastResult().summary.forecast_avg, forecastForm.metric) }}</p>
                <small>vs Historical: {{ formatValue(forecastResult().summary.historical_avg, forecastForm.metric) }}</small>
              </div>
            </div>
          </div>
          
          <!-- Chart -->
          <div class="chart-card">
            <div class="chart-container">
              <canvas id="forecastChart"></canvas>
            </div>
          </div>
          
          <!-- Performance Metrics -->
          <div class="metrics-section">
            <h3><i class="gi gi-ui-trend-down" aria-hidden="true"></i> Model Performance Metrics</h3>
            <p class="metrics-intro">
              These metrics measure how well the forecast model fits historical data. 
              Lower values indicate better accuracy.
            </p>
            
            <div class="metrics-grid">
              <!-- MAE -->
              <div class="metric-card">
                <div class="metric-header">
                  <h4>MAE</h4>
                  <span class="metric-badge">Mean Absolute Error</span>
                </div>
                <p class="metric-value">{{ forecastResult().metrics.mae.toFixed(2) }}</p>
                <small class="metric-desc">
                  Average prediction error. Lower is better.
                </small>
              </div>
              
              <!-- RMSE -->
              <div class="metric-card">
                <div class="metric-header">
                  <h4>RMSE</h4>
                  <span class="metric-badge">Root Mean Squared Error</span>
                </div>
                <p class="metric-value">{{ forecastResult().metrics.rmse.toFixed(2) }}</p>
                <small class="metric-desc">
                  Penalizes larger errors more. Lower is better.
                </small>
              </div>
              
              <!-- R² Score (only for linear regression) -->
              @if (forecastResult().metrics.r2_score !== undefined) {
                <div class="metric-card">
                  <div class="metric-header">
                    <h4>R² Score</h4>
                    <span class="metric-badge">Coefficient of Determination</span>
                  </div>
                  <p class="metric-value">{{ forecastResult().metrics.r2_score.toFixed(4) }}</p>
                  <small class="metric-desc">
                    Model fit quality (0-1). Higher is better.
                  </small>
                </div>
              }
              
              <!-- Method-specific info -->
              <div class="metric-card info-card">
                <div class="metric-header">
                  <h4>Method Details</h4>
                  <span class="metric-badge">{{ selectedMethodInfo()?.badge }}</span>
                </div>
                
                @if (forecastForm.method === 'linear') {
                  <div class="method-details">
                    <p><strong>Slope:</strong> {{ forecastResult().metrics.slope.toFixed(4) }}</p>
                    <p><strong>Intercept:</strong> {{ forecastResult().metrics.intercept.toFixed(2) }}</p>
                  </div>
                }
                
                @if (forecastForm.method === 'moving_average') {
                  <div class="method-details">
                    <p><strong>Window:</strong> {{ forecastResult().metrics.window_size }} days</p>
                    <p><strong>Average:</strong> {{ forecastResult().metrics.average_value.toFixed(2) }}</p>
                  </div>
                }
                
                @if (forecastForm.method === 'exponential_smoothing') {
                  <div class="method-details">
                    <p><strong>Alpha:</strong> {{ forecastResult().metrics.alpha }}</p>
                    <p><strong>Trend:</strong> {{ forecastResult().metrics.trend.toFixed(2) }}</p>
                  </div>
                }
              </div>
            </div>
          </div>
          
          <!-- Data Insights -->
          <div class="insights-section">
            <h3><i class="gi gi-ui-spark" aria-hidden="true"></i> Key Insights</h3>
            
            <div class="insights-grid">
              <div class="insight-card">
                <span class="insight-icon"><i class="gi gi-ui-chart" aria-hidden="true"></i></span>
                <div class="insight-content">
                  <h4>Historical Range</h4>
                  <p>
                    Min: {{ formatValue(forecastResult().summary.historical_min, forecastForm.metric) }}
                    <br>
                    Max: {{ formatValue(forecastResult().summary.historical_max, forecastForm.metric) }}
                  </p>
                </div>
              </div>
              
              <div class="insight-card">
                <span class="insight-icon"><i class="gi gi-ui-target" aria-hidden="true"></i></span>
                <div class="insight-content">
                  <h4>Forecast Method</h4>
                  <p>{{ selectedMethodInfo()?.description }}</p>
                </div>
              </div>
              
              <div class="insight-card">
                <span class="insight-icon"><i class="gi gi-ui-warning" aria-hidden="true"></i></span>
                <div class="insight-content">
                  <h4>Accuracy Note</h4>
                  <p>Forecasts become less accurate further into the future. Use for planning, not guarantees.</p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      }
      
      <!-- Info Box (when no results) -->
      @if (!hasResult() && !loading() && !error()) {
        <div class="info-box">
          <div class="info-icon"><i class="gi gi-ui-book" aria-hidden="true"></i></div>
          <div class="info-content">
            <h3>How to Use Forecast</h3>
            <ol>
              <li><strong>Select Metric:</strong> Choose Revenue, Orders, or Visits</li>
              <li><strong>Choose Period:</strong> Select how many days to forecast (7-90 days)</li>
              <li><strong>Pick Method:</strong>
                <ul>
                  <li><strong>Linear Regression:</strong> Best for data with clear upward/downward trends</li>
                  <li><strong>Moving Average:</strong> Good for stable, consistent data</li>
                  <li><strong>Exponential Smoothing:</strong> Most accurate for complex patterns</li>
                </ul>
              </li>
              <li><strong>Generate:</strong> Click "Generate Forecast" to see predictions</li>
            </ol>
            
            <div class="comparison-note">
              <h4><i class="gi gi-ui-chart" aria-hidden="true"></i> Similar to Excel/Power BI:</h4>
              <p>
                <strong>Linear Regression</strong> works like Excel's FORECAST function<br>
                <strong>Exponential Smoothing</strong> is similar to Power BI's forecast feature
              </p>
            </div>
          </div>
        </div>
      }
      
    </div>
  `,
  styles: [`
    /* Analytics Forecast Component - Consistent Design System */

    .analytics-forecast-container {
      padding: 20px 32px;
      max-width: 1600px;
      margin: 0 auto;
      background: #f5f6fa;
      min-height: 100vh;
    }

    /* ============================================
       HEADER SECTION
       ============================================ */

    .forecast-header {
      margin-bottom: 24px;
    }
    
    .forecast-header h2 {
      font-size: 28px;
      font-weight: 700;
      color: #153243;
      margin: 0 0 6px 0;
    }
    
    .forecast-header .subtitle {
      font-size: 13px;
      color: #6c757d;
      margin: 0;
    }

    /* ============================================
       FORECAST FORM CARD
       ============================================ */

    .forecast-form-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      margin-bottom: 20px;
    }
    
    .forecast-form-card h3 {
      font-size: 17px;
      font-weight: 600;
      color: #153243;
      margin: 0 0 20px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .forecast-form-card h3:before {
      content: '';
      width: 3px;
      height: 20px;
      background: #c3d350;
      border-radius: 2px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .form-grid .full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      display: block;
      font-weight: 600;
      color: #153243;
      margin-bottom: 8px;
      font-size: 13px;
    }
    
    .form-group label .label-icon {
      margin-right: 6px;
      font-size: 14px;
    }
    
    .form-group .form-control {
      width: 100%;
      padding: 10px 14px;
      border: 2px solid #e6e6ea;
      border-radius: 8px;
      font-size: 13px;
      transition: all 0.2s ease;
      background: white;
      color: #153243;
    }
    
    .form-group .form-control:hover {
      border-color: #c3d350;
    }
    
    .form-group .form-control:focus {
      outline: none;
      border-color: #c3d350;
      box-shadow: 0 0 0 3px rgba(195, 211, 80, 0.1);
    }
    
    .form-group .form-hint {
      display: block;
      margin-top: 6px;
      font-size: 11px;
      color: #6c757d;
      padding-left: 2px;
    }

    /* Method Selector */
    .method-selector {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 14px;
    }

    .method-card {
      position: relative;
      padding: 18px;
      border: 2px solid #e6e6ea;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: #f8f9fa;
    }
    
    .method-card:hover {
      border-color: #c3d350;
      background: #fff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    
    .method-card.selected {
      border-color: #c3d350;
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      box-shadow: 0 0 0 3px rgba(195, 211, 80, 0.15);
    }
    
    .method-card.selected .method-indicator .checkmark {
      opacity: 1;
    }
    
    .method-card .method-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .method-card .method-header .method-name {
      font-weight: 600;
      color: #153243;
      font-size: 14px;
    }
    
    .method-card .method-header .method-badge {
      background: #153243;
      color: white;
      padding: 4px 8px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .method-card.selected .method-header .method-badge {
      background: #c3d350;
      color: #153243;
    }
    
    .method-card .method-desc {
      font-size: 12px;
      color: #6c757d;
      margin: 0;
      line-height: 1.6;
    }
    
    .method-card .method-indicator {
      position: absolute;
      top: 14px;
      right: 14px;
    }
    
    .method-card .method-indicator .checkmark {
      display: inline-block;
      width: 22px;
      height: 22px;
      background: #c3d350;
      color: #153243;
      border-radius: 50%;
      text-align: center;
      line-height: 22px;
      font-weight: 700;
      font-size: 12px;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    /* Form Actions */
    .form-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    
    .form-actions button {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    
    .form-actions button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .form-actions .btn-primary {
      background: linear-gradient(135deg, #c3d350 0%, #a8b841 100%);
      color: #153243;
    }
    
    .form-actions .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #d4e176 0%, #c3d350 100%);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(195, 211, 80, 0.4);
    }
    
    .form-actions .btn-secondary {
      background: white;
      color: #153243;
      border: 2px solid #153243;
    }
    
    .form-actions .btn-secondary:hover {
      background: #153243;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(21, 50, 67, 0.3);
    }
    
    .form-actions .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(21, 50, 67, 0.2);
      border-top-color: #153243;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ============================================
       ALERTS
       ============================================ */

    .alert {
      padding: 14px 18px;
      border-radius: 10px;
      margin-bottom: 20px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      border-left: 3px solid;
    }
    
    .alert .alert-icon {
      font-size: 20px;
    }
    
    .alert .alert-content {
      flex: 1;
    }
    
    .alert .alert-content strong {
      display: block;
      margin-bottom: 4px;
      font-weight: 600;
    }
    
    .alert.alert-error {
      background: linear-gradient(135d, #fff3cd 0%, #ffffff 100%);
      border-left-color: #c1121f;
      color: #990e18;
    }

    /* ============================================
       FORECAST RESULTS
       ============================================ */

    .forecast-results {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Summary Cards */
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }

    .summary-card {
      background: white;
      border-radius: 12px;
      padding: 18px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border-left: 3px solid #153243;
      display: flex;
      align-items: center;
      gap: 14px;
      transition: all 0.3s;
    }

    .summary-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }
    
    .summary-card .card-icon {
      font-size: 32px;
      line-height: 1;
    }
    
    .summary-card .card-content {
      flex: 1;
    }
    
    .summary-card .card-content h4 {
      font-size: 11px;
      font-weight: 600;
      color: #6c757d;
      margin: 0 0 6px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .summary-card .card-content .card-value {
      font-size: 22px;
      font-weight: 700;
      color: #153243;
      margin: 0 0 4px 0;
    }
    
    .summary-card .card-content .card-value.trend-up {
      color: #28a745;
    }
    
    .summary-card .card-content .card-value.trend-down {
      color: #c1121f;
    }
    
    .summary-card .card-content small {
      font-size: 11px;
      color: #6c757d;
    }

    /* Chart Card */
    .chart-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .chart-container {
      position: relative;
      height: 450px;
      width: 100%;
    }

    /* Metrics Section */
    .metrics-section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
    
    .metrics-section h3 {
      font-size: 17px;
      font-weight: 600;
      color: #153243;
      margin: 0 0 14px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .metrics-section h3:before {
      content: '';
      width: 3px;
      height: 20px;
      background: #c3d350;
      border-radius: 2px;
    }
    
    .metrics-section .metrics-intro {
      color: #6c757d;
      margin-bottom: 20px;
      font-size: 13px;
      padding: 10px 14px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 3px solid #c3d350;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
    }

    .metric-card {
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border-radius: 10px;
      padding: 20px;
      border: 2px solid #e6e6ea;
      transition: all 0.3s;
    }

    .metric-card:hover {
      background: #ffffff;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
    }
    
    .metric-card .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    
    .metric-card .metric-header h4 {
      font-size: 15px;
      font-weight: 700;
      color: #153243;
      margin: 0;
    }
    
    .metric-card .metric-header .metric-badge {
      background: #153243;
      color: white;
      padding: 4px 8px;
      border-radius: 10px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .metric-card .metric-value {
      font-size: 28px;
      font-weight: 700;
      color: #c3d350;
      margin: 10px 0;
    }
    
    .metric-card .metric-desc {
      font-size: 12px;
      color: #6c757d;
    }
    
    .metric-card.info-card {
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      border-color: #c3d350;
      border-top: 3px solid #c3d350;
    }
    
    .metric-card.info-card .metric-badge {
      background: #c3d350;
      color: #153243;
    }
    
    .metric-card .method-details {
      margin-top: 12px;
    }
    
    .metric-card .method-details p {
      margin: 6px 0;
      font-size: 13px;
      color: #153243;
    }
    
    .metric-card .method-details p strong {
      color: #153243;
      font-weight: 600;
    }

    /* Insights Section */
    .insights-section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
    
    .insights-section h3 {
      font-size: 17px;
      font-weight: 600;
      color: #153243;
      margin: 0 0 18px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .insights-section h3:before {
      content: '';
      width: 3px;
      height: 20px;
      background: #c3d350;
      border-radius: 2px;
    }

    .insights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 14px;
    }

    .insight-card {
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border-radius: 10px;
      padding: 18px;
      display: flex;
      align-items: flex-start;
      gap: 14px;
      border-left: 3px solid #153243;
      transition: all 0.2s;
    }

    .insight-card:hover {
      transform: translateX(3px);
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
    }
    
    .insight-card .insight-icon {
      font-size: 28px;
      line-height: 1;
    }
    
    .insight-card .insight-content {
      flex: 1;
    }
    
    .insight-card .insight-content h4 {
      font-size: 14px;
      font-weight: 600;
      color: #153243;
      margin: 0 0 8px 0;
    }
    
    .insight-card .insight-content p {
      font-size: 12px;
      color: #6c757d;
      margin: 0;
      line-height: 1.6;
    }

    /* ============================================
       INFO BOX (Initial State)
       ============================================ */

    .info-box {
      background: white;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      display: flex;
      gap: 28px;
      align-items: flex-start;
    }
    
    .info-box .info-icon {
      font-size: 56px;
      line-height: 1;
    }
    
    .info-box .info-content {
      flex: 1;
    }
    
    .info-box .info-content h3 {
      font-size: 20px;
      font-weight: 700;
      color: #153243;
      margin-bottom: 18px;
    }
    
    .info-box .info-content ol {
      margin: 0 0 20px 0;
      padding-left: 20px;
    }
    
    .info-box .info-content ol li {
      margin-bottom: 14px;
      line-height: 1.6;
      color: #153243;
      font-size: 13px;
    }
    
    .info-box .info-content ol li strong {
      color: #153243;
      font-weight: 600;
    }
    
    .info-box .info-content ol li ul {
      margin-top: 8px;
      padding-left: 20px;
    }
    
    .info-box .info-content ol li ul li {
      margin-bottom: 6px;
      font-size: 12px;
      color: #6c757d;
    }
    
    .info-box .info-content .comparison-note {
      background: linear-gradient(135deg, #fff8e1 0%, #ffffff 100%);
      border-left: 3px solid #c3d350;
      padding: 14px 18px;
      border-radius: 8px;
    }
    
    .info-box .info-content .comparison-note h4 {
      font-size: 14px;
      font-weight: 600;
      color: #153243;
      margin: 0 0 8px 0;
    }
    
    .info-box .info-content .comparison-note p {
      margin: 0;
      font-size: 13px;
      color: #6c757d;
      line-height: 1.8;
    }

    /* ============================================
       RESPONSIVE DESIGN
       ============================================ */

    @media (max-width: 768px) {
      .analytics-forecast-container {
        padding: 12px 16px;
      }

      .forecast-header h2 {
        font-size: 22px;
      }

      .forecast-header .subtitle {
        font-size: 12px;
      }
      
      .forecast-form-card {
        padding: 18px;
      }
      
      .form-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      
      .method-selector {
        grid-template-columns: 1fr;
      }
      
      .summary-cards {
        grid-template-columns: 1fr;
      }
      
      .metrics-grid {
        grid-template-columns: 1fr;
      }
      
      .insights-grid {
        grid-template-columns: 1fr;
      }
      
      .chart-container {
        height: 320px;
      }
      
      .info-box {
        flex-direction: column;
        padding: 20px;
        gap: 16px;
      }
      
      .info-box .info-icon {
        font-size: 42px;
      }

      .form-actions {
        flex-direction: column;
      }

      .form-actions button {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class AnalyticsForecastComponent implements OnInit {
  
  // ============================================
  // FORM STATE
  // ============================================
  
  forecastForm = {
    metric: 'revenue',
    forecastDays: 30,
    method: 'linear'
  };
  
  // Dropdown options
  metricOptions = [
    { value: 'revenue', label: 'Revenue' },
    { value: 'orders', label: 'Orders' },
    { value: 'visits', label: 'Visits' }
  ];
  
  forecastDaysOptions = [
    { value: 7, label: '7 days (1 week)' },
    { value: 14, label: '14 days (2 weeks)' },
    { value: 30, label: '30 days (1 month)' },
    { value: 60, label: '60 days (2 months)' },
    { value: 90, label: '90 days (3 months)' }
  ];
  
  methodOptions = [
    { 
      value: 'linear', 
      label: 'Linear Regression',
      description: 'Excel FORECAST style - Best for clear trends',
      badge: 'Excel'
    },
    { 
      value: 'moving_average', 
      label: 'Moving Average',
      description: 'Smoothing technique - Best for stable data',
      badge: 'Simple'
    },
    { 
      value: 'exponential_smoothing', 
      label: 'Exponential Smoothing',
      description: 'Power BI style - Best for accuracy',
      badge: 'Power BI'
    }
  ];
  
  // ============================================
  // DATA STATE
  // ============================================
  
  forecastResult = signal<any>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Chart
  chart: Chart | null = null;
  
  // Computed values
  hasResult = computed(() => this.forecastResult() !== null);
  
  selectedMetricInfo = computed(() => {
    const metric = this.forecastForm.metric;
    return this.metricOptions.find(m => m.value === metric);
  });
  
  selectedMethodInfo = computed(() => {
    const method = this.forecastForm.method;
    return this.methodOptions.find(m => m.value === method);
  });
  
  // ============================================
  // LIFECYCLE
  // ============================================
  
  constructor(private mlService: MlService) {}
  
  ngOnInit(): void {
    // Component initialized
  }
  
  // ============================================
  // FORECAST ACTIONS
  // ============================================
  
  generateForecast(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.mlService.generateForecast(this.forecastForm).subscribe({
      next: (response) => {
        if (response.success) {
          this.forecastResult.set(response.data);
          this.renderChart(response.data);
        } else {
          this.error.set(response.error || 'Forecast generation failed');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Forecast error:', error);
        this.error.set(error.error?.error || 'Failed to generate forecast. Please try again.');
        this.loading.set(false);
      }
    });
  }
  
  resetForecast(): void {
    this.forecastResult.set(null);
    this.error.set(null);
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
  
  // ============================================
  // CHART RENDERING
  // ============================================
  
  renderChart(data: any): void {
    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
    }
    
    // Prepare data
    const historical = data.historical_data || [];
    const forecast = data.forecast_data || [];
    
    // All dates for x-axis
    const allDates = [
      ...historical.map((d: any) => d.date),
      ...forecast.map((d: any) => d.date)
    ];
    
    // Historical values (with nulls for forecast period)
    const historicalValues = [
      ...historical.map((d: any) => d.value),
      ...new Array(forecast.length).fill(null)
    ];
    
    // Forecast values (with nulls for historical period, then actual forecasts)
    const forecastValues = [
      ...new Array(historical.length - 1).fill(null),
      historical[historical.length - 1]?.value, // Connect to last historical point
      ...forecast.map((d: any) => d.value)
    ];
    
    // Get metric label
    const metricLabel = this.selectedMetricInfo()?.label || 'Value';
    
    // Create chart
    const canvas = document.getElementById('forecastChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: allDates,
        datasets: [
          {
            label: `Historical ${metricLabel}`,
            data: historicalValues,
            borderColor: '#153243',
            backgroundColor: 'rgba(21, 50, 67, 0.1)',
            borderWidth: 3,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 6,
            tension: 0.2
          },
          {
            label: `Forecasted ${metricLabel}`,
            data: forecastValues,
            borderColor: '#ff9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            borderWidth: 3,
            borderDash: [8, 4],
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointStyle: 'circle',
            tension: 0.2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `${metricLabel} Forecast - ${data.method?.replace('_', ' ').toUpperCase()}`,
            font: {
              size: 18,
              weight: 'bold'
            },
            padding: 20,
            color: '#153243'
          },
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                size: 13
              },
              padding: 15,
              usePointStyle: true
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(21, 50, 67, 0.95)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#ff9800',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: (context: any) => {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += this.formatValue(context.parsed.y, this.forecastForm.metric);
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Date',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              font: {
                size: 11
              }
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: metricLabel,
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            beginAtZero: true,
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              callback: (value: any) => {
                return this.formatValue(value, this.forecastForm.metric);
              }
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });
  }
  
  // ============================================
  // HELPER METHODS
  // ============================================
  
  formatValue(value: number, metric: string): string {
    if (metric === 'revenue') {
      return `${value.toLocaleString('en-US', { maximumFractionDigits: 0 })} VND`;
    } else if (metric === 'orders') {
      return `${Math.round(value)} orders`;
    } else {
      return `${Math.round(value)} visits`;
    }
  }
  
  getTrendIcon(): string {
    const result = this.forecastResult();
    if (!result || !result.summary) return '';
    
    return result.summary.forecast_trend === 'up' ? 'gi-ui-trend-up' : 'gi-ui-trend-down';
  }
  
  getTrendText(): string {
    const result = this.forecastResult();
    if (!result || !result.summary) return '';
    
    return result.summary.forecast_trend === 'up' ? 'Upward Trend' : 'Downward Trend';
  }
  
  getTrendClass(): string {
    const result = this.forecastResult();
    if (!result || !result.summary) return '';
    
    return result.summary.forecast_trend === 'up' ? 'trend-up' : 'trend-down';
  }
}
