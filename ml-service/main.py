"""
ML Service - Machine Learning API for E-Commerce Predictions

Academic Purpose:
- Demonstrates separation of ML services from main web application
- Shows proper ML workflow: data preprocessing, training, evaluation, persistence
- Implements RESTful API for ML operations

Technology Stack:
- FastAPI: Modern Python web framework
- scikit-learn: ML library for regression models
- pandas: Data manipulation and analysis
- joblib: Model serialization
- numpy: Numerical computations

Endpoints:
- POST /train: Train new ML model
- POST /predict: Make predictions using trained model
- GET /models: List available models
- GET /models/{model_id}/metrics: Get model performance metrics
- GET /health: Health check

Author: E-Commerce ML System
Date: January 2026
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
from sklearn.preprocessing import StandardScaler
import joblib
import os
from datetime import datetime
import uuid

app = FastAPI(
    title="E-Commerce ML Service",
    description="Machine Learning API for revenue, orders, and product sales predictions",
    version="1.0.0"
)

# CORS Configuration (allow Node.js backend to access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4200"],  # Backend and Frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create models directory if not exists
MODELS_DIR = "models"
os.makedirs(MODELS_DIR, exist_ok=True)

# ==========================================
# PYDANTIC MODELS (Request/Response Schemas)
# ==========================================

class TrainingDataPoint(BaseModel):
    """Single data point for ML training"""
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    visits: int = Field(..., ge=0, description="Number of visits/sessions")
    orders: int = Field(..., ge=0, description="Number of orders")
    revenue: float = Field(..., ge=0, description="Total revenue")
    avg_order_value: Optional[float] = Field(None, ge=0)
    conversion_rate: Optional[float] = Field(None, ge=0, le=100)
    products_sold: Optional[int] = Field(None, ge=0)

class TrainModelRequest(BaseModel):
    """Request to train a new ML model"""
    model_name: str = Field(..., description="User-friendly model name")
    model_type: Literal["revenue", "orders"] = Field(..., description="What to predict")
    training_data: List[TrainingDataPoint] = Field(..., min_items=10, description="Historical data for training")
    test_size: float = Field(0.2, ge=0.1, le=0.4, description="Proportion of data for testing (default 20%)")

class PredictRequest(BaseModel):
    """Request to make a prediction"""
    model_file: str = Field(..., description="Path to trained model file (e.g., 'revenue_model_abc123.joblib')")
    input_features: Dict[str, float] = Field(..., description="Input features for prediction (e.g., {'visits': 1000, 'orders': 50})")

class ModelMetrics(BaseModel):
    """Model performance metrics"""
    r2_score: float = Field(..., description="Coefficient of determination (0-1, higher is better)")
    rmse: float = Field(..., description="Root Mean Squared Error (lower is better)")
    mae: float = Field(..., description="Mean Absolute Error (lower is better)")
    mse: float = Field(..., description="Mean Squared Error")
    training_size: int = Field(..., description="Number of training samples")
    test_size: int = Field(..., description="Number of test samples")

class TrainModelResponse(BaseModel):
    """Response after training a model"""
    success: bool
    model_file: str = Field(..., description="Path to saved model file")
    scaler_file: Optional[str] = Field(None, description="Path to saved scaler file")
    metrics: ModelMetrics
    features_used: List[str] = Field(..., description="Feature names used in model")
    target_variable: str = Field(..., description="What the model predicts")
    algorithm: str = Field(default="linear_regression")

class PredictResponse(BaseModel):
    """Response after making a prediction"""
    success: bool
    predicted_value: float
    confidence: Optional[float] = Field(None, description="Prediction confidence (0-1)")
    input_features: Dict[str, float]

# ==========================================
# ML HELPER FUNCTIONS
# ==========================================

def prepare_training_data(
    data: List[TrainingDataPoint],
    model_type: Literal["revenue", "orders"]
) -> tuple:
    """
    Prepare data for ML training
    
    Returns:
        X (features), y (target), feature_names, target_name
    
    Academic Note:
    - Feature selection is crucial for model performance
    - Linear regression assumes linear relationship between features and target
    - More features != better model (curse of dimensionality)
    """
    df = pd.DataFrame([d.dict() for d in data])
    
    # Define features and target based on model type
    if model_type == "revenue":
        # Predicting revenue from visits and orders
        feature_cols = ["visits", "orders"]
        target_col = "revenue"
    elif model_type == "orders":
        # Predicting orders from visits
        feature_cols = ["visits"]
        target_col = "orders"
    else:
        raise ValueError(f"Unknown model_type: {model_type}")
    
    # Extract features (X) and target (y)
    X = df[feature_cols].values
    y = df[target_col].values
    
    return X, y, feature_cols, target_col


def train_linear_regression(
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray
) -> tuple:
    """
    Train a Linear Regression model
    
    Academic Explanation:
    - Linear Regression finds the best-fit line: y = mx + b
    - For multiple features: y = b0 + b1*x1 + b2*x2 + ...
    - Minimizes squared error between predicted and actual values
    - Simple, interpretable, and fast
    
    Returns:
        model, metrics_dict
    """
    # Initialize model
    model = LinearRegression()
    
    # Train model (fit to training data)
    model.fit(X_train, y_train)
    
    # Make predictions on test set
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    
    # Calculate performance metrics
    # R² Score: Proportion of variance explained (1.0 = perfect, 0.0 = bad)
    r2 = r2_score(y_test, y_pred_test)
    
    # Mean Squared Error: Average squared difference
    mse = mean_squared_error(y_test, y_pred_test)
    
    # Root Mean Squared Error: MSE in original units
    rmse = np.sqrt(mse)
    
    # Mean Absolute Error: Average absolute difference
    mae = mean_absolute_error(y_test, y_pred_test)
    
    metrics = {
        "r2_score": float(r2),
        "rmse": float(rmse),
        "mae": float(mae),
        "mse": float(mse),
        "training_size": len(X_train),
        "test_size": len(X_test)
    }
    
    return model, metrics


def save_model(model, model_name: str) -> str:
    """
    Save trained model to disk using joblib
    
    Academic Note:
    - joblib is more efficient than pickle for numpy arrays
    - Model persistence allows reuse without retraining
    - File format: .joblib
    """
    model_id = str(uuid.uuid4())[:8]
    filename = f"{model_name}_{model_id}.joblib"
    filepath = os.path.join(MODELS_DIR, filename)
    
    joblib.dump(model, filepath)
    
    return filename


def load_model(model_file: str):
    """Load trained model from disk"""
    filepath = os.path.join(MODELS_DIR, model_file)
    
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Model file not found: {model_file}")
    
    return joblib.load(filepath)


# ==========================================
# API ENDPOINTS
# ==========================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "E-Commerce ML Service",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }


@app.post("/train", response_model=TrainModelResponse)
async def train_model(request: TrainModelRequest):
    """
    Train a new ML model
    
    Academic Workflow:
    1. Data Validation: Check data quality and quantity
    2. Feature Engineering: Select relevant features
    3. Data Splitting: Split into train/test sets
    4. Model Training: Fit model to training data
    5. Model Evaluation: Calculate performance metrics
    6. Model Persistence: Save model to disk
    
    Returns:
        Model metadata and performance metrics
    """
    try:
        # Step 1: Prepare data
        X, y, feature_names, target_name = prepare_training_data(
            request.training_data,
            request.model_type
        )
        
        # Step 2: Split data into training and testing sets
        # Academic Note: Train/test split prevents overfitting
        # - Training set: Used to fit the model
        # - Test set: Used to evaluate model on unseen data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=request.test_size,
            random_state=42  # For reproducibility
        )
        
        # Step 3: Train model
        model, metrics = train_linear_regression(X_train, y_train, X_test, y_test)
        
        # Step 4: Save model to disk
        model_file = save_model(model, request.model_name)
        
        # Step 5: Return results
        return TrainModelResponse(
            success=True,
            model_file=model_file,
            metrics=ModelMetrics(**metrics),
            features_used=feature_names,
            target_variable=target_name,
            algorithm="linear_regression"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    """
    Make prediction using a trained model
    
    Academic Note:
    - Uses saved model coefficients to compute prediction
    - Input features must match training features (same order, same scale)
    - No retraining required (fast inference)
    
    Returns:
        Predicted value
    """
    try:
        # Step 1: Load trained model
        model = load_model(request.model_file)
        
        # Step 2: Prepare input features (must be in correct order)
        # Convert dict to numpy array in correct order
        feature_values = list(request.input_features.values())
        X_input = np.array([feature_values])
        
        # Step 3: Make prediction
        prediction = model.predict(X_input)
        
        # Step 4: Calculate confidence (based on R² score from training)
        # Note: For more accurate confidence, use prediction intervals
        confidence = None  # Can be enhanced with statistical methods
        
        return PredictResponse(
            success=True,
            predicted_value=float(prediction[0]),
            confidence=confidence,
            input_features=request.input_features
        )
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.get("/models")
async def list_models():
    """
    List all available trained models
    
    Returns:
        List of model files with metadata
    """
    try:
        model_files = [
            f for f in os.listdir(MODELS_DIR)
            if f.endswith('.joblib')
        ]
        
        models_info = []
        for filename in model_files:
            filepath = os.path.join(MODELS_DIR, filename)
            file_stat = os.stat(filepath)
            
            models_info.append({
                "filename": filename,
                "size_bytes": file_stat.st_size,
                "created_at": datetime.fromtimestamp(file_stat.st_ctime).isoformat(),
                "modified_at": datetime.fromtimestamp(file_stat.st_mtime).isoformat()
            })
        
        return {
            "success": True,
            "count": len(models_info),
            "models": models_info
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list models: {str(e)}")


@app.get("/models/{model_file}")
async def get_model_info(model_file: str):
    """
    Get detailed information about a specific model
    
    Returns:
        Model coefficients and parameters
    """
    try:
        model = load_model(model_file)
        
        # Extract model information
        info = {
            "filename": model_file,
            "algorithm": "Linear Regression",
            "coefficients": model.coef_.tolist() if hasattr(model, 'coef_') else None,
            "intercept": float(model.intercept_) if hasattr(model, 'intercept_') else None,
            "n_features": model.n_features_in_ if hasattr(model, 'n_features_in_') else None
        }
        
        return {
            "success": True,
            "model": info
        }
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get model info: {str(e)}")


# ==========================================
# TIME SERIES FORECASTING
# ==========================================

from forecast_service import forecast_service
from pydantic import BaseModel, Field
from typing import List, Dict, Any

class ForecastRequest(BaseModel):
    """Request model for time series forecasting"""
    daily_data: List[Dict[str, Any]] = Field(..., description="Historical daily metrics")
    metric: str = Field(..., description="Metric to forecast: revenue, orders, or visits")
    forecast_days: int = Field(..., ge=1, le=90, description="Number of days to forecast")
    method: str = Field(default="linear", description="Forecast method: linear, moving_average, or exponential_smoothing")

class ForecastResponse(BaseModel):
    """Response model for forecast"""
    success: bool
    data: Dict[str, Any] = None
    error: str = None

@app.post("/forecast", response_model=ForecastResponse)
async def generate_forecast(request: ForecastRequest):
    """
    Generate time series forecast
    
    Academic Purpose:
    - Demonstrates time series analysis similar to Excel/Power BI
    - Implements Linear Regression (Excel FORECAST)
    - Shows Moving Average and Exponential Smoothing
    
    Methods:
    - linear: Linear Regression (Excel-style)
    - moving_average: Simple moving average
    - exponential_smoothing: Exponential smoothing with trend (Power BI-style)
    
    Returns:
    - Historical data
    - Forecasted values for future days
    - Metrics: MAE, RMSE, R² (for linear)
    """
    try:
        result = forecast_service.forecast(
            daily_data=request.daily_data,
            metric=request.metric,
            forecast_days=request.forecast_days,
            method=request.method
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Forecast error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Forecast failed: {str(e)}")


# ==========================================
# RUN SERVER
# ==========================================

if __name__ == "__main__":
    import uvicorn
    
    print("=" * 60)
    print("E-COMMERCE ML SERVICE")
    print("=" * 60)
    print("Starting FastAPI server on http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    print("=" * 60)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True  # Auto-reload on code changes (development only)
    )
