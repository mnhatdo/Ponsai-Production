# Design Info – PONSAI Project

Tài liệu này tổng hợp thông tin thiết kế theo bố cục ảnh mẫu, gồm 3 phần chính:
- Typography
- Color Library
- Icons

Dữ liệu được trích từ source thực tế trong dự án (frontend styles + docs màu sắc + icon manifest), không dùng giá trị giả định.

---

## 1) Typography

### Font Family (Current)
- **Primary font**: `Inter`
- Import: Google Fonts `Inter` (400, 500, 600, 700, 800)

### Headlines

#### Desktop (explicit values found in code)
- **Hero Headline (H1 lớn)**: `700`, `54px` (>= 1400px)
- **Navbar Brand**: `600`, `32px`
- **Section/Title phổ biến**: `600`, `16px`
- **Price emphasis**: `800`, `18px`

#### Mobile / Smaller Breakpoints
- Không có bộ token headline mobile riêng dạng `H1..H5` trong một file design token dedicated.
- Dự án đang dùng kết hợp:
  - CSS responsive cục bộ theo component/page
  - Kích thước mặc định theo stylesheet hiện hành

### Body
- **Body base (global app)**: `Inter`, `16px`, `line-height: 1.6`
- **Legacy template body**: `14px`, `line-height: 28px` (được giữ trong stylesheet template)
- **Text secondary tone**: `#6c757d` / `#6a6a6a` tùy context kế thừa template hoặc theme

### Button / Link
- **Button common**: `font-weight: 600`, padding `12px 30px`, radius `30px`
- **Link (global)**: dùng màu interactive token, transition `0.3s`

### Fields
- Input/Textarea/Select dùng `font-family: inherit`
- Placeholder phổ biến: `14px`
- Focus state ưu tiên brand tokens (border/focus ring theo primary palette)

> Ghi chú: ảnh mẫu dùng **Montserrat**, nhưng codebase hiện tại chuẩn hóa theo **Inter**.

---

## 2) Color Library

### Core Brand Palette

| Name | HEX | RGB | HSL | Primary Usage |
|---|---|---|---|---|
| Deep Space Blue | `#153243` | `rgba(21, 50, 67, 1)` | `hsla(202, 52%, 17%, 1)` | Primary brand, header, navigation, primary actions |
| Yale Blue | `#284b63` | `rgba(40, 75, 99, 1)` | `hsla(204, 42%, 27%, 1)` | Secondary brand, supporting surfaces |
| Lemon Lime | `#c3d350` | `rgba(195, 211, 80, 1)` | `hsla(67, 60%, 57%, 1)` | Accent, CTA, interactive highlight |
| Alabaster Grey | `#e6e6ea` | `rgba(230, 230, 234, 1)` | `hsla(240, 9%, 91%, 1)` | Neutral background, divider zones |

### Semantic / Functional Colors
- **Text**: `#2f2f2f`, `#6c757d`, `#adb5bd`
- **Backgrounds**: `#ffffff`, `#e6e6ea`, `#f8f9fa`
- **Borders**: `#dee2e6`, `#ced4da`, `#adb5bd`
- **Status**:
  - Success: `#28a745`
  - Warning: `#ffc107`
  - Error: `#c1121f`

### Color Token Availability
- Có sẵn ở cả:
  - **SCSS variables** (`$brand-primary`, `$brand-accent`, ...)
  - **CSS custom properties** (`--deep-space-blue`, `--lemon-lime`, ...)
- Có gradient presets (directional + radial) dưới dạng SCSS và CSS variables.

---

## 3) Icons

### Icon System Overview
- Dự án dùng cơ chế bridge qua `griddy-icons` để map nhiều class style cũ sang SVG token thống nhất.
- Selector được hỗ trợ:
  - `.bi.bi-{token}` (Bootstrap-like classes)
  - `.fa.fa-{token}` (Font Awesome-like classes)
  - `.gi.gi-{token}` (generic token classes)
  - `.icon-cross` (legacy utility)

### Current Icon Library Size
- **Total generated icon tokens**: **86**
- Nguồn file: `frontend/src/assets/griddy-icons/*.svg`
- Mapping source: `frontend/src/assets/griddy-icons/manifest.json`

### Icon Groups (theo token prefix)
- **Navigation / Actions**: `arrow-*`, `chevron-*`, `x-lg`, `list`, `trash`, `lock`, `shop`, ...
- **Commerce / Checkout**: `cart-plus`, `cart-x`, `credit-card`, `receipt`, `piggy-bank`, `truck`, ...
- **Status / Feedback**: `check-circle*`, `exclamation-*`, `info-circle`, `star*`, ...
- **Social / Footer bridge**: `fa-facebook-f`, `fa-twitter`, `fa-instagram`, `fa-linkedin`, `fa-paper-plane`
- **Admin set**: `admin-*` (dashboard, products, orders, users, analytics, forecast, settings, ...)
- **UI utility set**: `ui-*` (edit, play, pause, warning, trend-up, trend-down, chart, book, calendar, ...)

### Usage Pattern
- HTML class usage hiện tại trong app:
  - `<i class="bi bi-cart-x"></i>`
  - `<span class="fa fa-twitter"></span>`
  - `<i class="gi gi-ui-chart"></i>`

---

## Source of Truth (files reviewed)

- `frontend/src/styles.scss`
- `frontend/src/assets/styles/style.css`
- `frontend/src/assets/styles/_colors.scss`
- `frontend/src/assets/styles/_theme.scss`
- `frontend/src/assets/styles/_index.scss`
- `frontend/src/assets/styles/_griddy-icons.scss`
- `frontend/scripts/generate-griddy-icons.cjs`
- `frontend/src/assets/griddy-icons/manifest.json`
- `docs/COLOR_SYSTEM.md`
