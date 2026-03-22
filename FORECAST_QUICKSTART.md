# 📊 Time Series Forecasting - Quick Start Guide

## ✅ Implementation Complete!

Hệ thống forecast chuỗi thời gian đã được tích hợp hoàn chỉnh vào dashboard admin.

## 🚀 Cách Sử Dụng

### 1. Start Backend (Node.js)
```bash
cd backend
npm run dev
```

### 2. Start ML Service (Python)
```bash
cd ml-service
python main.py
```

### 3. Start Frontend (Angular)
```bash
cd frontend
npm start
```

### 4. Truy Cập Forecast
```
http://localhost:4200/admin/forecast
```

## 📋 Các Tính Năng

### 🎯 Chọn Metric
- **Revenue**: Dự đoán doanh thu
- **Orders**: Dự đoán đơn hàng
- **Visits**: Dự đoán lượt truy cập

### 📅 Chọn Khoảng Thời Gian
- 7 ngày (1 tuần)
- 14 ngày (2 tuần)
- 30 ngày (1 tháng)
- 60 ngày (2 tháng)
- 90 ngày (3 tháng)

### 🔬 Chọn Phương Pháp Forecast

#### 1. **Linear Regression** (Excel FORECAST)
```
✅ Best for: Clear upward/downward trends
✅ Similar to: Excel FORECAST function
✅ Formula: y = mx + b
✅ Returns: R² Score, Slope, Intercept
```

#### 2. **Moving Average**
```
✅ Best for: Stable, consistent data
✅ Similar to: Excel AVERAGE with rolling window
✅ Formula: MA = (y₁ + y₂ + ... + yₙ) / n
✅ Returns: Window size, Average value
```

#### 3. **Exponential Smoothing** (Power BI)
```
✅ Best for: Most accurate predictions
✅ Similar to: Power BI Forecast
✅ Formula: S_t = α * y_t + (1-α) * S_{t-1}
✅ Returns: Alpha, Trend
```

## 📊 Hiển Thị Kết Quả

### 1. **Summary Cards**
- Historical Data: Số ngày dữ liệu quá khứ
- Forecast Period: Số ngày dự đoán
- Trend: Xu hướng tăng/giảm (📈/📉)
- Forecast Average: Giá trị dự đoán trung bình

### 2. **Interactive Chart**
- **Blue Line**: Historical data (dữ liệu thực tế)
- **Orange Dashed Line**: Forecast data (dự đoán)
- Hover để xem chi tiết từng điểm
- Responsive chart tự động scale

### 3. **Performance Metrics**
- **MAE** (Mean Absolute Error): Sai số trung bình
- **RMSE** (Root Mean Squared Error): Sai số bình phương
- **R² Score**: Độ chính xác (chỉ có ở Linear Regression)

### 4. **Key Insights**
- Historical Range: Min/Max của dữ liệu quá khứ
- Forecast Method: Giải thích phương pháp đang dùng
- Accuracy Note: Lưu ý về độ chính xác

## 🔧 API Endpoints

### POST `/api/v1/admin/ml/forecast`

**Request:**
```json
{
  "metric": "revenue",
  "forecastDays": 30,
  "method": "linear"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "metric": "revenue",
    "method": "linear",
    "forecast_days": 30,
    "historical_count": 180,
    "historical_data": [
      {"date": "2026-01-01", "value": 1000, "type": "historical"},
      ...
    ],
    "forecast_data": [
      {"date": "2026-02-01", "value": 1500, "type": "forecast"},
      ...
    ],
    "metrics": {
      "mae": 123.45,
      "rmse": 234.56,
      "r2_score": 0.85,
      "slope": 15.5,
      "intercept": 950.0
    },
    "summary": {
      "historical_avg": 1200.5,
      "historical_min": 800.0,
      "historical_max": 1600.0,
      "forecast_avg": 1550.3,
      "forecast_trend": "up"
    }
  }
}
```

## 📚 So Sánh Excel/Power BI

### Excel FORECAST Function
```excel
=FORECAST(x, known_y's, known_x's)

Tương đương với:
Method: Linear Regression
Metric: Bất kỳ
Forecast Days: Bất kỳ
```

### Power BI Forecast
```
Power BI Forecast = Exponential Smoothing + Auto Seasonality

Tương đương với:
Method: Exponential Smoothing
Metric: Bất kỳ
Forecast Days: Bất kỳ
```

## 🎓 Academic Learning Points

### 1. **Time Series Analysis**
- Hiểu khái niệm chuỗi thời gian
- Trend detection (phát hiện xu hướng)
- Forecasting methods (phương pháp dự đoán)

### 2. **Linear Regression**
- Least Squares Method
- Slope & Intercept calculation
- R² Score interpretation

### 3. **Smoothing Techniques**
- Moving Average for noise reduction
- Exponential Smoothing for trend following
- Alpha parameter tuning

### 4. **Model Evaluation**
- MAE: Sai số tuyệt đối trung bình
- RMSE: Sai số bình phương trung bình
- R²: Hệ số xác định (0-1)

## 💡 Tips & Best Practices

### ✅ Khi Nào Dùng Linear Regression?
- Dữ liệu có xu hướng tăng/giảm rõ ràng
- Muốn công thức đơn giản (y = mx + b)
- Cần R² score để đánh giá

### ✅ Khi Nào Dùng Moving Average?
- Dữ liệu ổn định, ít biến động
- Muốn làm mượt nhiễu
- Baseline comparison

### ✅ Khi Nào Dùng Exponential Smoothing?
- Cần độ chính xác cao nhất
- Dữ liệu có trend phức tạp
- Production environment

### ⚠️ Lưu Ý
- Cần ít nhất **7 ngày** dữ liệu lịch sử
- Forecast càng xa càng kém chính xác
- Nên dùng forecast để **planning**, không phải **guarantees**

## 🐛 Troubleshooting

### Error: "ML service is not available"
```bash
# Check Python ML service is running
cd ml-service
python main.py

# Should see: "Starting FastAPI server on http://localhost:8000"
```

### Error: "Insufficient historical data"
```bash
# Check DailyMetric collection has data
# Need at least 7 days of data

# Run seed script if needed
cd backend
npm run seed
```

### Chart Not Rendering
```bash
# Clear browser cache
# Hard refresh: Ctrl + Shift + R

# Check console for errors
F12 -> Console
```

## 📁 File Structure

```
backend/
├── src/
│   ├── controllers/
│   │   └── mlController.ts         # Added generateForecast()
│   ├── routes/
│   │   └── mlRoutes.ts              # Added POST /forecast
│   └── services/
│       └── dailyMetricsService.ts   # Added getDailyMetricsForForecast()

ml-service/
├── forecast_service.py              # ⭐ NEW - Forecast algorithms
├── main.py                          # Added /forecast endpoint
└── FORECAST_GUIDE.md                # ⭐ NEW - Documentation

frontend/
└── src/app/features/admin/
    ├── components/
    │   ├── analytics/
    │   │   ├── analytics-forecast.component.ts     # ⭐ NEW
    │   │   ├── analytics-forecast.component.html   # ⭐ NEW
    │   │   └── analytics-forecast.component.scss   # ⭐ NEW
    │   └── layout/
    │       └── admin-layout.component.ts    # Updated menu
    ├── services/
    │   └── ml.service.ts                    # Added generateForecast()
    └── admin.routes.ts                      # Added /forecast route
```

## ✨ Next Steps

Sau khi forecast cơ bản hoạt động, bạn có thể mở rộng:

1. **Seasonality Detection**: Phát hiện mùa vụ (tuần/tháng/năm)
2. **Confidence Intervals**: 95% prediction band
3. **Auto Method Selection**: Tự động chọn method tốt nhất
4. **Model Comparison**: So sánh 3 methods cùng lúc
5. **Save Forecasts**: Lưu forecast để theo dõi accuracy

## 🎯 Demo Workflow

1. Login admin: `http://localhost:4200/admin/login`
2. Click **"📊 Forecast"** trong sidebar
3. Chọn **Metric**: Revenue
4. Chọn **Forecast Days**: 30
5. Chọn **Method**: Linear Regression
6. Click **"🚀 Generate Forecast"**
7. Xem chart, metrics, insights
8. Try different methods và compare!

---

**Tác giả**: AI Assistant
**Ngày tạo**: January 24, 2026
**Version**: 1.0.0
**Status**: ✅ Production Ready
