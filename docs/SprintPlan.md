# 📑 KẾ HOẠCH PHÂN CÔNG CÔNG VIỆC CHI TIẾT TRÊN GITHUB (SPRINT PLAN)
## DỰ ÁN: FACECOOK PROJECT (truongadu / Projects / FaceCook Project)

- **Repository**: [https://github.com/truongadu/truong227.github.io.git](https://github.com/truongadu/truong227.github.io.git)
- **GitHub Project Board**: FaceCook Project

---

## 👥 PHÂN CÔNG VAI TRÒ CHÍNH (5 MEMBERS)

| STT | GitHub Username | Vai trò | Trách nhiệm chính |
|---|---|---|---|
| 1 | **`ngynfet`** | **PM / UI-UX** | Quản lý tiến độ dự án, Thiết kế Wireframe, Prototype, Design System (`#16`) |
| 2 | **`khuatduychithanh`** | **Backend 1** | CSDL Core, EF Core DbContext, Recipes API, Cost Calculation & Admin (`#17`) |
| 3 | **`Tientran1511`** | **Backend 2** | Auth JWT API, User Profile, Social APIs (Comments, Ratings, Favorites, BadWords) (`#18`) |
| 4 | **`hoangnamtq0309-boop`** | **Frontend 1** | Setup Next.js 14, Catalog Công thức, Search, Filter & Leaderboard UI (`#19`) |
| 5 | **`truongadu`** *(Leader)* | **Frontend 2** | Form Đăng bài `/submit`, Recipe Detail Dialog, Social UI & Admin Dashboard (`#20`) |

---

# 🏃 PHÂN CÔNG CHI TIẾT THEO TỪNG VAI TRÒ QUA 5 SPRINTS

## 🟢 SPRINT 1: NỀN TẢNG & XÁC THỰC (FOUNDATION & AUTH) [DONE 100%]

- **🎨 `ngynfet` (PM/UI-UX)**:
  - [x] Thiết kế Design System (Dark/Light Mode Theme, Palette màu, Typography)
  - [x] Thiết kế Wireframe & Layout Auth Pages (`/login`, `/register`)
  - [x] Xây dựng User Flow Xác thực tài khoản

- **⚙️ `khuatduychithanh` (Backend 1)**:
  - [x] Khởi tạo dự án ASP.NET Core 8 Web API
  - [x] Cấu hình DbContext + Entity Framework Core + CSDL SQLite (`CookingAppDB.db`)
  - [x] Tạo Migration & Seed dữ liệu danh mục chuẩn (`Categories`) và nguyên liệu mẫu (`Ingredients`)

- **⚙️ `Tientran1511` (Backend 2)**:
  - [x] Xây dựng `AuthController` (`/api/auth/register`, `/api/auth/login`)
  - [x] Xây dựng `JwtService` & `JwtMiddleware` cấp phát và kiểm tra JWT Token
  - [x] Xây dựng Model `User` & `UsersController` (Profile cơ bản)

- **💻 `hoangnamtq0309-boop` (Frontend 1)**:
  - [x] Khởi tạo dự án Next.js 14 (App Router) với TypeScript
  - [x] Cấu hình Tailwind CSS & cài đặt thư viện `shadcn/ui`
  - [x] Tạo `AuthProvider` (Context API + LocalStorage) & API Client (`lib/api.ts`)

- **💻 `truongadu` (Frontend 2)**:
  - [x] Xây dựng giao diện màn hình Đăng nhập (`/login`)
  - [x] Xây dựng giao diện màn hình Đăng ký (`/register`)
  - [x] Xây dựng các linh kiện khung `SiteHeader`, `SiteFooter`, `AuthShell`

---

## 🟢 SPRINT 2: QUẢN LÝ CÔNG THỨC & CHI PHÍ NGUYÊN LIỆU (RECIPE CORE & COST) [DONE 100%]

- **🎨 `ngynfet` (PM/UI-UX)**:
  - [x] Thiết kế UI RecipeCard & RecipeGrid layout
  - [x] Thiết kế Recipe Detail Dialog (Tabs: Nguyên liệu, Các bước làm, Chi phí)
  - [x] Thiết kế Form Đăng công thức nấu ăn (`/submit`)

- **⚙️ `khuatduychithanh` (Backend 1)**:
  - [x] Model `Recipe` & `RecipesController` (CRUD, Filter theo danh mục/độ khó, Search)
  - [x] `RecipeIngredientsController` liên kết nguyên liệu với công thức
  - [x] Xây dựng logic tự động tính toán tổng chi phí nguyên liệu tự nấu (`TotalIngredientCost`)

- **⚙️ `Tientran1511` (Backend 2)**:
  - [x] `CategoriesController` (Lấy danh sách danh mục món ăn)
  - [x] `IngredientsController` (Danh sách & đơn giá nguyên liệu)
  - [x] Model `RecipeStep` & API quản lý các bước thực hiện món ăn

- **💻 `hoangnamtq0309-boop` (Frontend 1)**:
  - [x] Trang Danh sách công thức (`/recipes`) — Catalog + Tìm kiếm + Lọc danh mục
  - [x] Phát triển component `RecipeCard` & `RecipeGrid` responsive
  - [x] Tích hợp thanh tìm kiếm và bộ lọc độ khó

- **💻 `truongadu` (Frontend 2)**:
  - [x] Trang Chi tiết công thức standalone (`/recipe/[id]`)
  - [x] Phát triển `RecipeDetailDialog` (Hiển thị các bước làm, bảng phân tích chi phí Tự nấu vs. Mua ngoài)
  - [x] Trang Đăng công thức nấu ăn (`/submit`)

---

## 🟡 SPRINT 3: TƯƠNG TÁC XÃ HỘI & BẠN BÈ (SOCIAL & FRIENDS) [IN PROGRESS]

- **🎨 `ngynfet` (PM/UI-UX)**:
  - [ ] Thiết kế giao diện Khung bình luận (Comment Section) & Star Rating
  - [ ] Thiết kế trang Quản lý bạn bè (Danh sách bạn bè, Lời mời kết bạn)
  - [ ] Thiết kế Hộp thư Công thức được chia sẻ (Shared Recipes Inbox)

- **⚙️ `khuatduychithanh` (Backend 1)**:
  - [ ] `FavoritesController` (Toggle Thả tim / Bỏ thả tim & Đếm tổng lượt tim)
  - [ ] `RatingsController` (Chấm điểm 1-5 sao & Tính điểm trung bình)

- **⚙️ `Tientran1511` (Backend 2)**:
  - [ ] `CommentsController` (CRUD bình luận + Phân trang)
  - [ ] `BadWordsController` & `BadWordsMiddleware` (Kiểm tra và chặn từ cấm tự động)
  - [ ] `FriendsController` (Gửi lời mời, Chấp nhận, Từ chối, Hủy kết bạn)
  - [ ] `SharedRecipesController` (Chia sẻ công thức tới bạn bè & Hộp thư nhận)

- **💻 `hoangnamtq0309-boop` (Frontend 1)**:
  - [ ] Trang Bạn bè (`/friends`) — Danh sách bạn bè + Lời mời chờ duyệt + Tìm kiếm bạn mới
  - [ ] Trang Công thức được chia sẻ (`/shared`) — Hộp thư nhận bài viết từ bạn bè
  - [ ] Component `NotificationBadge` (Thông báo lời mời & bài viết mới chia sẻ)

- **💻 `truongadu` (Frontend 2)**:
  - [ ] Tích hợp `CommentSection` dưới bài viết (Xử lý cảnh báo từ cấm `BadWords`)
  - [ ] Tích hợp linh kiện `StarRating` (Đánh giá số sao real-time)
  - [ ] Nút `Favorite` (Thả tim) tương tác cập nhật lượt tim tức thì

---

## 🔵 SPRINT 4: BẢNG XẾP HẠNG DANH VỌNG & RANK BADGE (LEADERBOARD & RANK)

- **🎨 `ngynfet` (PM/UI-UX)**:
  - [ ] Thiết kế Podium Top 3 Master Chef (Hạng 1, Hạng 2, Hạng 3)
  - [ ] Thiết kế 5 cấp bậc Rank Badge (Đồng, Bạc, Vàng, Bạch Kim, Kim Cương)
  - [ ] Thiết kế Khung Avatar Rank (`RankAvatarFrame`) cho tác giả

- **⚙️ `khuatduychithanh` (Backend 1)**:
  - [ ] `LeaderboardController` — Xây dựng 4 Endpoints vinh danh (Yêu thích nhất, Đánh giá cao nhất, Master Chef)
  - [ ] Tối ưu hóa câu lệnh truy vấn SQL cho Bảng xếp hạng

- **⚙️ `Tientran1511` (Backend 2)**:
  - [ ] Xây dựng logic tính toán Rank danh vọng dựa trên tổng lượt tim tích lũy (Đồng ≥0, Bạc ≥10, Vàng ≥50, Bạch Kim ≥200, Kim Cương ≥500)
  - [ ] Tích hợp thông tin Rank và Thống kê bài đăng vào `UsersController` (Profile API)

- **💻 `hoangnamtq0309-boop` (Frontend 1)**:
  - [ ] Trang Bảng xếp hạng Master Chef (`/leaderboard`) — Podium Top 3 + Bảng Top 10 + Bộ lọc thời gian
  - [ ] Xây dựng Component `RankBadge` (Màu sắc & Label theo cấp bậc)

- **💻 `truongadu` (Frontend 2)**:
  - [ ] Trang Hồ sơ cá nhân (`/profile`) — Avatar, Thẻ Rank danh vọng, Thống kê cá nhân, Tab bài viết của tôi & bài viết đã lưu
  - [ ] Gắn `RankAvatarFrame` và `RankBadge` lên bài viết công thức

---

## 🟣 SPRINT 5: QUẢN TRỊ VIÊN & POLISH HỆ THỐNG (ADMIN MODERATION & DEPLOY)

- **🎨 `ngynfet` (PM/UI-UX)**:
  - [ ] Thiết kế Bảng điều khiển Quản trị viên Admin Dashboard (Thống kê, Tab Duyệt bài, Tab Từ cấm, Tab Quản lý User)

- **⚙️ `khuatduychithanh` (Backend 1)**:
  - [ ] `AdminController` — API Thống kê Dashboard (Số lượng User, Công thức, Lượt tương tác)
  - [ ] `AdminController` — API Duyệt công thức (`Approve`) và Từ chối (`Reject`)

- **⚙️ `Tientran1511` (Backend 2)**:
  - [ ] `AdminController` — API Quản lý danh sách từ cấm (`BadWords`) & Xóa bình luận vi phạm
  - [ ] Cấu hình Phân quyền Authorization (RBAC: Chặn User thường truy cập API Admin - HTTP 403)

- **💻 `hoangnamtq0309-boop` (Frontend 1)**:
  - [ ] Trang Admin Dashboard (`/admin`) — Tab Duyệt bài chờ, Tab Thống kê hệ thống

- **💻 `truongadu` (Frontend 2)**:
  - [ ] Admin Tab Quản lý từ cấm (`BadWords`) & Tab Quản lý bình luận
  - [ ] Kiểm thử toàn bộ hệ thống (End-to-End Testing) & Đóng gói Deploy Production
