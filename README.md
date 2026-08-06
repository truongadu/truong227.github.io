# 🍳 Facecook — Mạng Xã Hội Chia Sẻ Công Thức Nấu Ăn & Tính Toán Chi Phí Thông Minh

<p align="center">
  <strong>Nền tảng kết nối cộng đồng yêu bếp, tính toán chi phí nguyên liệu tự nấu và vinh danh Đầu bếp Master Chef.</strong>
</p>

<p align="center">
  <a href="https://github.com/truongadu/truong227.github.io"><strong>Repository Link</strong></a>
</p>

---

## 📌 Giới thiệu dự án

**Facecook (Cooking Application)** là ứng dụng mạng xã hội chuyên biệt dành cho những người đam mê ẩm thực và nấu ăn tại nhà. Ứng dụng không chỉ giúp người dùng dễ dàng tìm kiếm, học tập các công thức nấu ăn ngon mà còn hỗ trợ **tự động tính toán chi phí nguyên liệu**, so sánh giữa việc **Tự nấu tại nhà vs. Mua ngoài hàng**, từ đó giúp tiết kiệm ngân sách gia đình một cách hiệu quả.

---

## ✨ Tính năng nổi bật

### 1. 🔐 Xác thực & Người dùng (Auth & Profile)
- Đăng ký / Đăng nhập an toàn với **JWT (JSON Web Token)**.
- Quản lý hồ sơ cá nhân, Avatar, xem danh hiệu và điểm tích lũy.

### 2. 📖 Quản lý Công thức Nấu ăn (Recipe Core)
- Đăng tải công thức nấu ăn mới gồm: Thông tin món, danh sách nguyên liệu có định lượng và các bước thực hiện chi tiết.
- Tìm kiếm món ăn theo từ khóa, lọc theo danh mục (Món nước, Món xào, Món chay...) và độ khó.
- **Tự động tính toán chi phí tự nấu**: Hệ thống tự nhân định lượng nguyên liệu với đơn giá chuẩn để đưa ra tổng chi phí.
- **So sánh chi phí ăn ngoài hàng**: Hiển thị con số tiết kiệm cụ thể khi tự nấu tại nhà.

### 3. 💬 Tương tác Mạng xã hội (Social)
- **Thả tim (Favorite)** bài viết yêu thích.
- **Bình luận (Comment)** trao đổi kinh nghiệm (Áp dụng bộ lọc tự động che từ cấm `BadWords Filter`).
- **Đánh giá sao (Rating 1 - 5 sao)** chất lượng món ăn.
- **Kết bạn (Friends)** và **Chia sẻ công thức (Shared Recipes)** trực tiếp tới tin nhắn bạn bè.

### 4. 🏆 Bảng xếp hạng & Danh vọng (Leaderboard & Rank System)
- Vinh danh Top 3 Master Chef và Top 10 người dùng xuất sắc theo các tiêu chí: Bài viết được yêu thích nhất, Đánh giá cao nhất, Đầu bếp tích cực nhất.
- Hệ thống danh hiệu Rank Badge: **Đồng ➔ Bạc ➔ Vàng ➔ Bạch Kim ➔ Kim Cương**.

### 🛡️ 5. Quản trị viên (Admin Moderation)
- Bảng điều khiển thống kê (Dashboard).
- Kiểm duyệt bài đăng công thức (Approve / Reject).
- Quản lý danh sách từ cấm (`BadWords`) và xóa bình luận vi phạm.

---

## 🛠️ Công nghệ sử dụng

### Backend (API Engine)
- **Framework**: ASP.NET Core 8.0 Web API
- **Database**: SQLite (`CookingAppDB.db`) / Entity Framework Core 8.0
- **Security**: JWT Bearer Authentication, Password Hashing
- **Documentation**: Swagger / Swashbuckle UI

### Frontend (User Interface)
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide Icons (`lucide-react`)
- **State Management**: React Context API

---

## 📁 Cấu trúc dự án

```
dmm/
├── Backend/                    # Mã nguồn Backend ASP.NET Core 8 API
│   ├── Controllers/            # REST API Controllers (Recipes, Auth, Comments...)
│   ├── Data/                   # DbContext & Database Configurations
│   ├── Middleware/             # BadWords Filter & JWT Middlewares
│   ├── Models/                 # EF Core Entities (User, Recipe, Comment...)
│   ├── Services/               # JwtService, LeaderboardService...
│   └── Program.cs              # API Entry Point & Dependency Injection
│
├── app/                        # Mã nguồn Frontend Next.js (App Router)
│   ├── (auth)/                 # Sub-routes Xác thực (login, register)
│   ├── (platform)/             # Sub-routes Nền tảng (feed, profile...)
│   ├── admin/                  # Dashboard Quản trị viên
│   ├── leaderboard/            # Trang Bảng xếp hạng Master Chef
│   ├── recipe/[id]/            # Trang Chi tiết công thức nấu ăn
│   ├── recipes/                # Trang Danh sách & Tìm kiếm công thức
│   └── submit/                 # Trang Đăng bài công thức mới
│
├── components/                 # Các UI Components tái sử dụng (Header, Footer, RecipeCard...)
├── docs/                       # Tài liệu thiết kế & Sprint Plan
├── lib/                        # API Client, Helper Functions
└── public/                     # Static Assets & Images
```

---

## ⚙️ Hướng dẫn cài đặt & Chạy dự án

### Điều kiện tiên quyết
- **.NET 8.0 SDK**
- **Node.js** (v18.x trở lên) & **npm** / **pnpm**

---

### Bước 1: Khởi chạy Backend API

```bash
# 1. Di chuyển vào thư mục Backend
cd Backend

# 2. Khôi phục các gói phụ thuộc (NuGet Packages)
dotnet restore

# 3. Chạy cập nhật Database (EF Core Migration)
dotnet ef database update

# 4. Khởi chạy Backend API Server
dotnet run
```
📌 Backend API sẽ chạy tại địa chỉ: `http://localhost:5000` (Swagger UI: `http://localhost:5000/swagger`)

---

### Bước 2: Khởi chạy Frontend Next.js

```bash
# 1. Khai báo biến môi trường (nếu cần) hoặc chạy trực tiếp
# Trong thư mục gốc dự án:
npm install
# hoặc: pnpm install

# 2. Khởi chạy môi trường phát triển (Development Server)
npm run dev
# hoặc: pnpm dev
```
📌 Frontend sẽ chạy tại địa chỉ: `http://localhost:3000`

---

## 🌿 Quy trình phát triển (Git Flow & Conventional Commits)

Dự án tuân thủ nghiêm ngặt chuẩn **Conventional Commits** trong mọi giao dịch commit:

```bash
# Định dạng Commit chuẩn:
type(scope): Description

# Ví dụ commit hợp lệ:
git commit -m "feat(auth): Thêm API đăng ký tài khoản với mã hóa JWT"
git commit -m "fix(social): Khắc phục lỗi kiểm tra từ cấm trong bình luận"
git commit -m "docs(readme): Cập nhật tài liệu hướng dẫn chạy dự án"
```

---

## 👥 Thành viên thực hiện (5 Members)

| STT | GitHub Username | Vai trò | Phân công nhiệm vụ trên GitHub Projects |
|---|---|---|---|
| 1 | **`khuatduychithanh`** *(Leader)* | **Backend 1 / Leader** | CSDL Core, EF Core DbContext, Recipes API, Cost Calculation & Admin (`#17`) |
| 2 | **`ngynfet`** | **PM / UI-UX** | Quản lý tiến độ dự án, Thiết kế Wireframe, Prototype, Design System (`#16`) |
| 3 | **`Tientran1511`** | **Backend 2** | Auth JWT API, User Profile, Social APIs (Comments, Ratings, Favorites, BadWords) (`#18`) |
| 4 | **`hoangnamtq0309-boop`** | **Frontend 1** | Setup Next.js 14, Catalog Công thức, Search, Filter & Leaderboard UI (`#19`) |
| 5 | **`truongadu`** | **Frontend 2** | Form Đăng bài `/submit`, Recipe Detail Dialog, Social UI & Admin Dashboard (`#20`) |

---

<p align="center">
  <em>Đồ án môn học Phân tích & Thiết kế Hệ thống Thông tin — 2026</em>
</p>
