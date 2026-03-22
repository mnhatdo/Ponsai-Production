# 🚀 QUICK START: Train ML Model

> **Dành cho Admin:** Bạn chỉ cần vào web và click button, KHÔNG CẦN chạy terminal!  
> **Dành cho Developer:** Setup ban đầu cần chạy services (xem phần A)

---

## 📋 Phân biệt 2 vai trò

| Vai trò | Làm gì | Cần terminal? |
|---------|--------|---------------|
| **Developer** | Setup hệ thống lần đầu | ✅ Có (1 lần duy nhất) |
| **Admin/User** | Train model hàng ngày | ❌ KHÔNG - chỉ cần vào web |

---

# 👨‍💼 HƯỚNG DẪN CHO ADMIN (SỬ DỤNG HÀNG NGÀY)

> ⚠️ **Điều kiện:** Developer đã setup hệ thống sẵn (services đang chạy)

## Bước 1: Vào website

Mở browser và truy cập: **http://localhost:4200**

## Bước 2: Login Admin

## Bước 2: Login Admin

1. Click **"Login"** ở góc trên bên phải
2. Nhập thông tin:
   ```
   Email: admin@bonsai.com
   Password: Admin123!
   ```
3. Click **"Sign In"**

## Bước 3: Vào ML Analytics Page

1. Sau khi login, click menu **"Admin"** (góc trên)
2. Click tab **"Analytics"**
3. Click tab **"ML Analytics"**

## Bước 4: Train Model (KHÔNG CẦN TERMINAL!)

Bạn sẽ thấy màn hình với tips box màu xanh hướng dẫn. Làm theo:

### ① Chọn loại prediction
Click vào card **"Revenue Prediction"**

### ② Chọn thời gian training
Click button **"6 Months"**

### ③ Đặt tên model
Nhập: `My_First_Revenue_Model`

### ④ Click "Train Model"

**CHỈ CẦN CLICK NÚT - HỆ THỐNG TỰ ĐỘNG:**
- ✅ Lấy dữ liệu từ database
- ✅ Gọi Python ML service
- ✅ Train model
- ✅ Lưu model file
- ✅ Hiển thị kết quả

⏳ **Chờ 5-10 giây...**

## Bước 5: Xem kết quả

Màn hình sẽ hiển thị:

```
✅ Model Trained Successfully

Model Name: My_First_Revenue_Model
Type: revenue
Training Data Points: ~180
Features Used: visits, orders

Performance Metrics:
R² Score: 0.XXXX (Excellent/Good/Fair)
RMSE: XXX.XX
MAE: XXX.XX
```

## Bước 6: Test Prediction

1. Click button **"Use This Model for Prediction →"**
2. Nhập số liệu:
   - Number of Visits: `1000`
   - Number of Orders: `50`
3. Click **"Make Prediction"**

⏳ **Chờ 1-2 giây...**

Kết quả:
```
✅ Predicted revenue: £2,XXX.XX
```

---

## 🎉 Xong!

**Bạn đã train ML model mà KHÔNG CẦN chạm vào terminal!**

Mọi thứ diễn ra tự động qua giao diện web:
- ✅ Click button → Hệ thống train
- ✅ Click button → Hệ thống predict
- ✅ Click button → Xem history
- ✅ Click button → Export CSV

---

# 👨‍💻 HƯỚNG DẪN CHO DEVELOPER (SETUP BAN ĐẦU)

> ⚠️ **Chỉ cần làm 1 lần khi setup hệ thống**

## A. Cài đặt & Khởi động Services

### A1. MongoDB
```powershell
# Cài MongoDB và chạy như Windows Service
# Hoặc: mongod --dbpath "path/to/data"
```

### A2. Backend (Node.js)
```powershell
# Terminal 1
cd "d:\TMĐT HK7\4.Advanced web dev\advanced_webdev\backend"
npm install  # Lần đầu
npm run dev  # Chạy mỗi khi cần
```
✅ Port 3000

### A3. ML Service (Python)
```powershell
# Terminal 2
cd "d:\TMĐT HK7\4.Advanced web dev\advanced_webdev\ml-service"
python -m venv venv  # Lần đầu
.\venv\Scripts\activate
pip install -r requirements.txt  # Lần đầu
python main.py  # Chạy mỗi khi cần
```
✅ Port 8000

### A4. Frontend (Angular)
```powershell
# Terminal 3
cd "d:\TMĐT HK7\4.Advanced web dev\advanced_webdev\frontend"
npm install  # Lần đầu
ng serve  # Chạy mỗi khi cần
```
✅ Port 4200

## B. Tạo dữ liệu test (1 lần)

```powershell
# Terminal 4
cd backend
node scripts/generate-test-data.js
```

## C. Xong! Admin có thể vào web sử dụng

Sau khi setup xong, admin chỉ cần:
1. Vào http://localhost:4200
2. Login
3. Click buttons để train/predict

**KHÔNG CẦN chạy terminal nữa!**

---

## 🔍 Explore More Features (Admin - qua Web UI)

**Tất cả làm qua web, KHÔNG CẦN terminal:**

### View All Models
Click tab **"Manage Models"** để:
- ✅ Xem tất cả models đã train
- ✅ Chọn nhiều models → Click "Compare Selected"
- ✅ Chọn models → Click "Deactivate Selected"
- ✅ Click "Retrain" trên model bất kỳ

### View Prediction History
Click tab **"Prediction History"** để:
- ✅ Xem tất cả predictions
- ✅ Click "Export CSV" → Download file
- ✅ Click "Clear History" → Xóa tất cả

### Train More Models
Quay lại **TRAIN TAB**, chọn configs khác, click "Train Model"

**Ví dụ:**
```
Model 2: Order Count Prediction
- Type: Orders
- Window: 3 Months
- Click "Train Model"

Model 3: Long-term Revenue
- Type: Revenue  
- Window: 12 Months
- Click "Train Model"
```

**Mọi thứ tự động, chỉ cần click!**

---

## 🎯 Làm rõ: Admin KHÔNG CẦN làm gì với Terminal

### ❌ Admin KHÔNG CẦN:
- ❌ Mở VSCode
- ❌ Chạy terminal commands
- ❌ Biết Python/Node.js
- ❌ Biết database queries
- ❌ Chạm vào code

### ✅ Admin CHỈ CẦN:
- ✅ Vào website (http://localhost:4200)
- ✅ Login
- ✅ Click buttons
- ✅ Nhập thông tin vào forms
- ✅ Xem kết quả trên màn hình

### 🔧 Hệ thống tự động làm tất cả:

**Khi admin click "Train Model":**
```
Browser (localhost:4200)
   ↓ HTTP POST request
Backend (localhost:3000)
   ↓ Fetch data from MongoDB
   ↓ HTTP POST to Python
ML Service (localhost:8000)
   ↓ Train model
   ↓ Save .joblib file
   ↓ Return metrics
Backend
   ↓ Save to database
   ↓ Return results
Browser
   ↓ Display success message
Admin sees result ✅
```

**Tất cả diễn ra tự động trong vài giây!**

---

## 🐛 Troubleshooting

### Lỗi: "ML service is not available"

**Nguyên nhân:** Python ML service chưa chạy

**Giải pháp:**
```powershell
# Kiểm tra Python service
# Mở browser: http://localhost:8000/docs
# Nếu không mở được → Python service chưa chạy

# Start lại Python service
cd ml-service
.\venv\Scripts\activate
python main.py
```

### Lỗi: "Insufficient training data"

**Nguyên nhân:** Database chưa có dữ liệu

**Giải pháp:**
```powershell
cd backend
node scripts/generate-test-data.js
```

### Lỗi: "Training failed"

**Nguyên nhân:** Có thể backend không kết nối được Python service

**Giải pháp:**
1. Check backend `.env` file có dòng:
   ```
   ML_SERVICE_URL=http://localhost:8000
   ```
2. Restart backend server
3. Thử lại

### Frontend không load được

**Giải pháp:**
```powershell
# Hard refresh browser: Ctrl + Shift + R
# Hoặc clear cache rồi reload
```

---

## 📊 Understanding ML Metrics

### R² Score (Coefficient of Determination)
**Ý nghĩa:** Model giải thích được bao nhiêu % biến động của dữ liệu

- **1.0** = Perfect (100% accurate - rất hiếm)
- **0.9+** = Excellent (90%+ accurate - rất tốt)
- **0.7-0.9** = Good (70-90% accurate - tốt)
- **0.5-0.7** = Fair (50-70% accurate - trung bình)
- **< 0.5** = Poor (< 50% accurate - kém)

**Ví dụ:**
- R² = 0.85 → Model predict đúng 85% cases

### RMSE (Root Mean Squared Error)
**Ý nghĩa:** Sai số trung bình, càng thấp càng tốt

**Đơn vị:** Giống target variable (£ for revenue, số for orders)

**Ví dụ:**
- Revenue model RMSE = £50
- → Trung bình prediction sai lệch ±£50

### MAE (Mean Absolute Error)
**Ý nghĩa:** Sai số tuyệt đối trung bình, càng thấp càng tốt

**Khác RMSE:** MAE ít bị ảnh hưởng bởi outliers

**Ví dụ:**
- MAE = 30 orders
- → Trung bình prediction sai lệch ±30 orders

---

## 🎯 Best Practices

### Khi nào nên retrain model?

1. **Mỗi tháng:** Train model mới với data mới nhất
2. **Khi R² giảm:** Model cũ không còn accurate
3. **Sau major events:** Sale lớn, thay đổi giá, marketing campaign
4. **Khi business thay đổi:** Thêm sản phẩm mới, đổi chiến lược

### Model naming convention

```
{Type}_{Window}_{Purpose}_{Version}

Ví dụ:
- Revenue_6M_General_v1
- Revenue_6M_General_v2 (retrain)
- Orders_3M_Holiday_v1
- Revenue_12M_LongTerm_v1
```

### So sánh models

Train nhiều models với configs khác nhau:
```
Model A: Revenue_3M_v1 (R² = 0.75)
Model B: Revenue_6M_v1 (R² = 0.85) ← Better!
Model C: Revenue_12M_v1 (R² = 0.80)
```

Chọn model có R² cao nhất cho production use.

---

**Happy Training! 🚀**
