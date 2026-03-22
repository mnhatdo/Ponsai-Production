# E-Commerce ML Service

Machine Learning service for e-commerce predictive analytics.

## Overview

This Python FastAPI service provides ML capabilities for the e-commerce platform:
- Revenue prediction
- Order count prediction

## Technology Stack

- **FastAPI**: Modern Python web framework
- **scikit-learn**: Machine learning library
- **pandas**: Data manipulation
- **numpy**: Numerical computations
- **joblib**: Model serialization

## Setup

### 1. Create Virtual Environment

```bash
cd ml-service
python -m venv venv
```

### 2. Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run Service

```bash
python main.py
```

Server will start on `http://localhost:8000`

## API Documentation

Once running, visit:
- **Interactive Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## Endpoints

### POST /train
Train a new ML model

**Request Body:**
```json
{
  "model_name": "Revenue_6M_Linear_v1",
  "model_type": "revenue",
  "training_data": [
    {
      "date": "2026-01-01",
      "visits": 1000,
      "orders": 50,
      "revenue": 5000.0
    }
  ],
  "test_size": 0.2
}
```

**Response:**
```json
{
  "success": true,
  "model_file": "Revenue_6M_Linear_v1_abc123.joblib",
  "metrics": {
    "r2_score": 0.95,
    "rmse": 250.5,
    "mae": 180.2
  },
  "features_used": ["visits", "orders"],
  "target_variable": "revenue"
}
```

### POST /predict
Make prediction using trained model

**Request Body:**
```json
{
  "model_file": "Revenue_6M_Linear_v1_abc123.joblib",
  "input_features": {
    "visits": 1200,
    "orders": 60
  }
}
```

**Response:**
```json
{
  "success": true,
  "predicted_value": 6000.0,
  "input_features": {
    "visits": 1200,
    "orders": 60
  }
}
```

### GET /models
List all trained models

### GET /health
Health check

## Academic Notes

### Linear Regression

The service uses Linear Regression for predictions:

**Formula:** `y = b₀ + b₁x₁ + b₂x₂ + ... + bₙxₙ`

Where:
- `y` = predicted value (revenue, orders, etc.)
- `b₀` = intercept (baseline value)
- `b₁, b₂, ..., bₙ` = coefficients (feature weights)
- `x₁, x₂, ..., xₙ` = input features (visits, orders, etc.)

### Model Evaluation Metrics

1. **R² Score (Coefficient of Determination)**
   - Range: 0 to 1 (higher is better)
   - Measures how well model explains variance
   - 0.95 = model explains 95% of variance

2. **RMSE (Root Mean Squared Error)**
   - Lower is better
   - Same units as target variable
   - Penalizes large errors more

3. **MAE (Mean Absolute Error)**
   - Lower is better
   - Average absolute difference
   - More robust to outliers than RMSE

### Why Linear Regression?

✅ **Advantages:**
- Simple and interpretable
- Fast training and prediction
- Works well with linear relationships
- No hyperparameter tuning needed
- Good for academic demonstrations

⚠️ **Limitations:**
- Assumes linear relationship
- Sensitive to outliers
- May underfit complex patterns

## File Structure

```
ml-service/
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
├── README.md           # This file
└── models/             # Saved model files (.joblib)
```

## Development

### Run Tests

```bash
pytest
```

### Format Code

```bash
black main.py
```

## Integration with Backend

The Node.js backend communicates with this service via HTTP:

1. Backend sends training request to `POST /train`
2. ML service trains model and returns metrics
3. Backend stores model metadata in MongoDB
4. For predictions, backend calls `POST /predict`

## Production Deployment

For production, consider:
- Use `gunicorn` or `uvicorn` with multiple workers
- Add authentication (API keys)
- Implement rate limiting
- Use model versioning
- Monitor model performance drift
- Set up logging and error tracking

## License

MIT
