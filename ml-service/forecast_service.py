"""
Time Series Forecasting Service
Provides forecast functionality similar to Excel/Power BI

Supports:
- Linear Regression (Excel-style)
- Moving Average
- Exponential Smoothing (Power BI-style)
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error
import logging

logger = logging.getLogger(__name__)


class ForecastService:
    """Time series forecasting service"""
    
    def __init__(self):
        self.supported_metrics = ['revenue', 'orders', 'visits']
        self.supported_methods = ['linear', 'moving_average', 'exponential_smoothing']
    
    def prepare_data(
        self,
        daily_data: List[Dict],
        metric: str
    ) -> pd.DataFrame:
        """
        Prepare time series data for forecasting
        
        Args:
            daily_data: List of daily metrics [{date, totalRevenue, completedOrders, totalSessions}]
            metric: Metric to forecast ('revenue', 'orders', 'visits')
        
        Returns:
            DataFrame with columns: date, value, day_index
        """
        # Convert to DataFrame
        df = pd.DataFrame(daily_data)
        
        # Map metric to column name
        metric_mapping = {
            'revenue': 'totalRevenue',
            'orders': 'completedOrders',
            'visits': 'totalSessions'
        }
        
        if metric not in metric_mapping:
            raise ValueError(f"Metric must be one of: {self.supported_metrics}")
        
        column_name = metric_mapping[metric]
        
        # Prepare data
        df['date'] = pd.to_datetime(df['date'])
        df = df[['date', column_name]].copy()
        df.columns = ['date', 'value']
        
        # Sort by date
        df = df.sort_values('date').reset_index(drop=True)
        
        # Add day index (for regression)
        df['day_index'] = range(len(df))
        
        return df
    
    def linear_regression_forecast(
        self,
        df: pd.DataFrame,
        forecast_days: int
    ) -> Tuple[pd.DataFrame, Dict]:
        """
        Linear Regression Forecast (Excel FORECAST style)
        
        Formula: y = mx + b
        
        Args:
            df: DataFrame with columns [date, value, day_index]
            forecast_days: Number of days to forecast
        
        Returns:
            forecast_df: DataFrame with forecasted values
            metrics: Dict with model metrics
        """
        # Prepare features
        X = df[['day_index']].values
        y = df['value'].values
        
        # Train linear regression
        model = LinearRegression()
        model.fit(X, y)
        
        # Calculate metrics on historical data
        y_pred_historical = model.predict(X)
        mae = mean_absolute_error(y, y_pred_historical)
        rmse = np.sqrt(mean_squared_error(y, y_pred_historical))
        r2 = model.score(X, y)
        
        # Generate future dates
        last_date = df['date'].iloc[-1]
        last_index = df['day_index'].iloc[-1]
        
        future_dates = [last_date + timedelta(days=i+1) for i in range(forecast_days)]
        future_indices = [last_index + i + 1 for i in range(forecast_days)]
        
        # Forecast
        X_future = np.array(future_indices).reshape(-1, 1)
        y_forecast = model.predict(X_future)
        
        # Ensure non-negative values
        y_forecast = np.maximum(y_forecast, 0)
        
        # Create forecast DataFrame
        forecast_df = pd.DataFrame({
            'date': future_dates,
            'forecasted_value': y_forecast,
            'method': 'linear_regression'
        })
        
        metrics = {
            'mae': float(mae),
            'rmse': float(rmse),
            'r2_score': float(r2),
            'slope': float(model.coef_[0]),
            'intercept': float(model.intercept_),
            'method': 'linear_regression'
        }
        
        return forecast_df, metrics
    
    def moving_average_forecast(
        self,
        df: pd.DataFrame,
        forecast_days: int,
        window: int = 7
    ) -> Tuple[pd.DataFrame, Dict]:
        """
        Moving Average Forecast
        
        Simple moving average of last N days
        
        Args:
            df: DataFrame with columns [date, value]
            forecast_days: Number of days to forecast
            window: Window size for moving average (default: 7 days)
        
        Returns:
            forecast_df: DataFrame with forecasted values
            metrics: Dict with model metrics
        """
        # Calculate moving average
        df['ma'] = df['value'].rolling(window=window).mean()
        
        # Use last moving average as forecast
        last_ma = df['ma'].iloc[-1]
        
        # Calculate metrics
        df_with_ma = df.dropna(subset=['ma'])
        mae = mean_absolute_error(df_with_ma['value'], df_with_ma['ma'])
        rmse = np.sqrt(mean_squared_error(df_with_ma['value'], df_with_ma['ma']))
        
        # Generate future dates
        last_date = df['date'].iloc[-1]
        future_dates = [last_date + timedelta(days=i+1) for i in range(forecast_days)]
        
        # Forecast (constant value)
        forecast_df = pd.DataFrame({
            'date': future_dates,
            'forecasted_value': [last_ma] * forecast_days,
            'method': 'moving_average'
        })
        
        metrics = {
            'mae': float(mae),
            'rmse': float(rmse),
            'window_size': window,
            'average_value': float(last_ma),
            'method': 'moving_average'
        }
        
        return forecast_df, metrics
    
    def exponential_smoothing_forecast(
        self,
        df: pd.DataFrame,
        forecast_days: int,
        alpha: float = 0.3
    ) -> Tuple[pd.DataFrame, Dict]:
        """
        Exponential Smoothing Forecast (Power BI style)
        
        Formula: S_t = α * y_t + (1 - α) * S_{t-1}
        
        Args:
            df: DataFrame with columns [date, value]
            forecast_days: Number of days to forecast
            alpha: Smoothing factor (0-1), higher = more weight on recent data
        
        Returns:
            forecast_df: DataFrame with forecasted values
            metrics: Dict with model metrics
        """
        values = df['value'].values
        
        # Initialize
        smoothed = [values[0]]
        
        # Calculate exponential smoothing
        for i in range(1, len(values)):
            s_t = alpha * values[i] + (1 - alpha) * smoothed[i-1]
            smoothed.append(s_t)
        
        # Calculate metrics
        mae = mean_absolute_error(values[1:], smoothed[1:])
        rmse = np.sqrt(mean_squared_error(values[1:], smoothed[1:]))
        
        # Forecast (use last smoothed value with trend adjustment)
        last_smoothed = smoothed[-1]
        
        # Calculate trend
        recent_values = values[-7:]  # Last 7 days
        trend = (recent_values[-1] - recent_values[0]) / len(recent_values)
        
        # Generate future dates
        last_date = df['date'].iloc[-1]
        future_dates = [last_date + timedelta(days=i+1) for i in range(forecast_days)]
        
        # Forecast with trend
        forecast_values = []
        for i in range(forecast_days):
            forecast_value = last_smoothed + (trend * (i + 1))
            forecast_value = max(forecast_value, 0)  # Non-negative
            forecast_values.append(forecast_value)
        
        forecast_df = pd.DataFrame({
            'date': future_dates,
            'forecasted_value': forecast_values,
            'method': 'exponential_smoothing'
        })
        
        metrics = {
            'mae': float(mae),
            'rmse': float(rmse),
            'alpha': alpha,
            'trend': float(trend),
            'last_smoothed_value': float(last_smoothed),
            'method': 'exponential_smoothing'
        }
        
        return forecast_df, metrics
    
    def forecast(
        self,
        daily_data: List[Dict],
        metric: str,
        forecast_days: int,
        method: str = 'linear'
    ) -> Dict:
        """
        Main forecast function
        
        Args:
            daily_data: Historical daily metrics
            metric: Metric to forecast ('revenue', 'orders', 'visits')
            forecast_days: Number of days to forecast
            method: Forecast method ('linear', 'moving_average', 'exponential_smoothing')
        
        Returns:
            Dict with historical data, forecast, and metrics
        """
        try:
            # Validate inputs
            if method not in self.supported_methods:
                raise ValueError(f"Method must be one of: {self.supported_methods}")
            
            if forecast_days < 1 or forecast_days > 90:
                raise ValueError("Forecast days must be between 1 and 90")
            
            if len(daily_data) < 7:
                raise ValueError("Need at least 7 days of historical data")
            
            # Prepare data
            df = self.prepare_data(daily_data, metric)
            
            # Forecast based on method
            if method == 'linear':
                forecast_df, metrics = self.linear_regression_forecast(df, forecast_days)
            elif method == 'moving_average':
                forecast_df, metrics = self.moving_average_forecast(df, forecast_days)
            else:  # exponential_smoothing
                forecast_df, metrics = self.exponential_smoothing_forecast(df, forecast_days)
            
            # Prepare response
            historical = df[['date', 'value']].copy()
            historical['date'] = historical['date'].dt.strftime('%Y-%m-%d')
            historical['type'] = 'historical'
            
            forecast_df['date'] = forecast_df['date'].dt.strftime('%Y-%m-%d')
            forecast_df['type'] = 'forecast'
            forecast_df.rename(columns={'forecasted_value': 'value'}, inplace=True)
            
            return {
                'success': True,
                'data': {
                    'metric': metric,
                    'method': method,
                    'forecast_days': forecast_days,
                    'historical_count': len(historical),
                    'historical_data': historical.to_dict('records'),
                    'forecast_data': forecast_df[['date', 'value', 'type']].to_dict('records'),
                    'metrics': metrics,
                    'summary': {
                        'historical_avg': float(df['value'].mean()),
                        'historical_min': float(df['value'].min()),
                        'historical_max': float(df['value'].max()),
                        'forecast_avg': float(forecast_df['value'].mean()),
                        'forecast_trend': 'up' if forecast_df['value'].iloc[-1] > forecast_df['value'].iloc[0] else 'down'
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Forecast error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


# Initialize service
forecast_service = ForecastService()
