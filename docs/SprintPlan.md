# 📑 KẾ HOẠCH PHÂN CÔNG CÔNG VIỆC (SPRINT PLAN - GITHUB PROJECTS)
## DỰ ÁN: FACECOOK PROJECT (truongadu / Projects / FaceCook Project)

- **Repository**: [https://github.com/truongadu/truong227.github.io.git](https://github.com/truongadu/truong227.github.io.git)
- **GitHub Project Board**: FaceCook Project

---

## 👥 DANH SÁCH THÀNH VIÊN VÀ PHÂN CÔNG VAI TRÒ (5 MEMBERS)

| STT | GitHub Username | Vai trò trong dự án | Nhiệm vụ chính |
|---|---|---|---|
| 1 | **`ngynfet`** | **PM / UI-UX** | Quản lý tiến độ dự án, Thiết kế Wireframe, Prototype & Design System |
| 2 | **`khuatduychithanh`** | **Backend 1** | Xây dựng CSDL Core, EF Core DbContext, API Recipes, Ingredients & Admin |
| 3 | **`Tientran1511`** | **Backend 2** | Auth JWT API, Users Profile, Social API (Comments, Ratings, Favorites, Friends) |
| 4 | **`hoangnamtq0309-boop`** | **Frontend 1** | Setup Next.js 14, UI Catalog Công thức, Search, Filter & Leaderboard |
| 5 | **`truongadu`** | **Frontend 2 (Leader)** | Submit Recipe Form, Recipe Detail Dialog, Social UI Components & Admin Dashboard |

---

## 🏃 DANH SÁCH USER STORIES & SPRINTS TRÊN GITHUB PROJECT

### 🟢 SPRINT 1 (#11) — Foundation & Authentication [100% Done]
- [x] `#16` **PM/UI-UX** (`ngynfet`): Khởi tạo dự án, thiết kế Design System & Auth Flows
- [x] `#17` **Backend 1** (`khuatduychithanh`): Cấu hình ASP.NET Core 8, DbContext SQLite & Seed data
- [x] `#18` **Backend 2** (`Tientran1511`): Xây dựng `AuthController` (Register/Login) & `JwtService`
- [x] `#19` **Frontend 1** (`hoangnamtq0309-boop`): Setup Next.js 14 App Router, Tailwind CSS, `shadcn/ui` & `AuthProvider`
- [x] `#20` **Frontend 2** (`truongadu`): Xây dựng trang Đăng nhập (`/login`), Đăng ký (`/register`), Header & Footer

---

### 🟢 SPRINT 2 (#12) — Recipe Management & Cost Calculation [100% Done]
- [x] `#21` **PM/UI-UX** (`ngynfet`): Thiết kế UI RecipeCard, Recipe Detail Dialog & Submit Form
- [x] `#22` **Backend 1** (`khuatduychithanh`): `RecipesController` (CRUD, Search, Filter) & Logic tự động tính `TotalIngredientCost`
- [x] `#23` **Backend 2** (`Tientran1511`): `CategoriesController`, `IngredientsController` & API quản lý các bước nấu
- [x] `#24` **Frontend 1** (`hoangnamtq0309-boop`): Trang Danh sách công thức (`/recipes`), Tìm kiếm & Lọc danh mục
- [x] `#25` **Frontend 2** (`truongadu`): Trang Chi tiết công thức (`/recipe/[id]`) & Form Đăng bài (`/submit`)

---

### 🟡 SPRINT 3 — Social Interactions & Community [In Progress]
- [ ] `#6` **US06: Lưu món yêu thích** (`Favorites`)
- [ ] `#7` **US07: Tạo thực đơn tuần** (`Weekly Menu Planner`)
- [ ] `#8` **US08: Tìm kiếm món ăn** (`Advanced Recipe Search`)
- [ ] `#9` **US09: Đánh giá món ăn** (`Ratings & Comments`)
- [ ] `#10` **US10: Quản lý cơ sở dữ liệu món ăn** (`Ingredients & Recipes DB`)

---

### 🔵 SPRINT 4 — Leaderboard & Rank System
- [ ] **PM/UI-UX** (`ngynfet`): Thiết kế Podium Top 3 Master Chef & Badge 5 cấp bậc Rank
- [ ] **Backend 1** (`khuatduychithanh`): `LeaderboardController` — API Vinh danh Top Master Chef
- [ ] **Backend 2** (`Tientran1511`): Logic tính điểm Rank danh vọng dựa trên lượt tim tích lũy
- [ ] **Frontend 1** (`hoangnamtq0309-boop`): Trang Bảng xếp hạng Master Chef (`/leaderboard`)
- [ ] **Frontend 2** (`truongadu`): Tích hợp `RankBadge` & `RankAvatarFrame` vào Profile cá nhân

---

### 🟣 SPRINT 5 — Admin Moderation & Deployment
- [ ] **PM/UI-UX** (`ngynfet`): Layout Admin Dashboard & Giao diện kiểm duyệt
- [ ] **Backend 1** (`khuatduychithanh`): `AdminController` (API Duyệt/Từ chối công thức, Thống kê Dashboard)
- [ ] **Backend 2** (`Tientran1511`): `BadWordsMiddleware` (Lọc từ cấm) & Phân quyền RBAC Admin
- [ ] **Frontend 1** (`hoangnamtq0309-boop`): Trang Admin Dashboard (`/admin`) — Tab Duyệt bài & Thống kê
- [ ] **Frontend 2** (`truongadu`): Tab Quản lý từ cấm & Bình luận; Kiểm thử E2E & Deploy Production
