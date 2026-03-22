# OpenStreetMap Setup Guide (Leaflet)

## ✅ Đã chuyển sang OpenStreetMap - KHÔNG CẦN API KEY!

Tính năng chỉ đường giờ sử dụng **OpenStreetMap** với **Leaflet** - hoàn toàn miễn phí, không cần đăng ký API key.

## Ưu điểm

✅ **Miễn phí 100%** - Không giới hạn số lượng request
✅ **Không cần API key** - Không cần đăng ký Google Cloud
✅ **Không có quota** - Sử dụng không giới hạn
✅ **Open source** - Cộng đồng phát triển và bảo trì
✅ **Nhanh và ổn định** - Hiệu năng tốt

## Cấu hình địa chỉ Shop

Mở file: `frontend/src/app/features/checkout/checkout.component.ts`

Tìm và cập nhật `SHOP_LOCATION` (khoảng dòng 76-80):

```typescript
private readonly SHOP_LOCATION = {
  lat: 51.5074,  // Thay bằng latitude của shop
  lng: -0.1278,  // Thay bằng longitude của shop
  address: '123 Furniture Street, London, UK'  // Địa chỉ shop
};
```

### Cách lấy Coordinates (Lat/Lng):

1. Truy cập: https://www.openstreetmap.org/
2. Tìm địa chỉ shop của bạn
3. Click chuột phải vào vị trí → "Show address"
4. Copy Latitude và Longitude

## Cách hoạt động

1. User click "Sử dụng vị trí của tôi" trong checkout
2. Lấy GPS coordinates của user
3. Tự động điền địa chỉ vào form
4. Hiển thị modal bản đồ với:
   - 🗺️ OpenStreetMap tiles
   - 📍 Marker vị trí user và shop
   - 🛣️ Route tự động tính toán
   - 📏 Khoảng cách và thời gian

## Tính năng

✅ **Tự động điền địa chỉ** từ vị trí GPS
✅ **Hiển thị bản đồ** với directions từ user đến shop
✅ **Tính khoảng cách** (km) và thời gian di chuyển (phút)
✅ **Responsive design** - Mobile friendly
✅ **Custom markers** và popup

## Dependencies đã cài đặt

```json
{
  "leaflet": "^1.9.x",
  "leaflet-routing-machine": "^3.2.x",
  "@types/leaflet": "^1.9.x"
}
```

## Test tính năng

1. Restart Angular dev server (nếu đang chạy)
2. Mở: http://localhost:4200/checkout
3. Click nút "Sử dụng vị trí của tôi"
4. Cho phép truy cập vị trí khi trình duyệt hỏi
5. Modal bản đồ sẽ hiển thị với route

## Troubleshooting

**Marker không hiển thị**
- Đã copy marker images vào `frontend/src/assets/`
- Kiểm tra: marker-icon.png, marker-icon-2x.png, marker-shadow.png

**Map không load**
- Kiểm tra internet connection
- Mở Console (F12) để xem lỗi
- Hard refresh (Ctrl+F5)

**Routing không xuất hiện**
- Kiểm tra coordinates hợp lệ
- Đảm bảo routing service available (OpenStreetMap OSRM)

## So sánh với Google Maps

| Feature | Google Maps | OpenStreetMap |
|---------|-------------|---------------|
| API Key | ✗ Cần đăng ký | ✅ Không cần |
| Chi phí | $200/tháng miễn phí, sau đó tính phí | ✅ Hoàn toàn miễn phí |
| Quota | Giới hạn 28,500/tháng | ✅ Không giới hạn |
| Billing | Cần thiết lập | ✅ Không cần |
| Độ chính xác | Rất cao | Cao |
| Cộng đồng | Closed source | ✅ Open source |

## Nguồn tham khảo

- Leaflet: https://leafletjs.com/
- OpenStreetMap: https://www.openstreetmap.org/
- Leaflet Routing Machine: https://www.liedman.net/leaflet-routing-machine/

## Support

Nếu gặp vấn đề, liên hệ support@furni.vn
