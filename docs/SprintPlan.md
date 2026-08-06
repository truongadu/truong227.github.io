# 📑 KẾ HOẠCH PHÂN CÔNG CÔNG VIỆC (SPRINT PLAN & PROJECT BACKLOG)
## DỰ ÁN: FACECOOK PROJECT (truongadu / Projects / FaceCook Project)

- **Repository**: [https://github.com/truongadu/truong227.github.io.git](https://github.com/truongadu/truong227.github.io.git)
- **GitHub Project Board**: FaceCook Project

---

## 👥 DANH SÁCH THÀNH VIÊN VÀ VAI TRÒ CHUẨN (5 MEMBERS)

| STT | GitHub Username | Vai trò | Phân công nhiệm vụ trên GitHub Projects |
|---|---|---|---|
| 1 | **`ngynfet`** | **PM / UI-UX** | Quản lý dự án, Thiết kế Wireframe, Prototype & Design System (`#16`) |
| 2 | **`khuatduychithanh`** | **Backend 1** | Xây dựng CSDL Core, EF Core DbContext, API Recipes, Ingredients & Admin (`#17`) |
| 3 | **`Tientran1511`** | **Backend 2** | Auth JWT API, Users Profile, Social API (Comments, Ratings, Favorites, BadWords) (`#18`) |
| 4 | **`hoangnamtq0309-boop`** | **Frontend 1** | Setup Next.js 14, Catalog Công thức, Search, Filter & Leaderboard UI (`#19`) |
| 5 | **`truongadu`** *(Leader)* | **Frontend 2** | Submit Recipe Form, Recipe Detail Dialog, Social Interaction UI & Admin Dashboard (`#20`) |

---

## 📋 PROJECT BACKLOG THEO MÃ NGUỒN THỰC TẾ (5 SPRINTS)

### 🟢 SPRINT 1: NỀN TẢNG & XÁC THỰC TÀI KHOẢN (FOUNDATION & AUTH) [DONE 100%]
- [x] `US01`: Đăng ký tài khoản mới với mã hóa Mật khẩu (`Auth API`)
- [x] `US02`: Đăng nhập cấp phát JWT Token & Phân quyền User / Admin
- [x] `US03`: Thiết kế giao diện Auth (`/login`, `/register`) & Khung App Header/Footer

---

### 🟢 SPRINT 2: QUẢN LÝ CÔNG THỨC & TÍNH CHI PHÍ NGUYÊN LIỆU (RECIPE CORE & COST) [DONE 100%]
- [x] `US04`: Đăng bài công thức kèm chọn nguyên liệu & định lượng (`/submit`)
- [x] `US05`: Tự động tính toán tổng chi phí nguyên liệu tự nấu (`TotalIngredientCost`)
- [x] `US06`: Tìm kiếm công thức theo từ khóa & Lọc theo Danh mục / Độ khó
- [x] `US07`: Xem chi tiết công thức & So sánh chi phí Tự nấu vs. Mua ngoài hàng (`EatingOutPrice`)

---

### 🟡 SPRINT 3: TƯƠNG TÁC XÃ HỘI & BẠN BÈ (SOCIAL & FRIENDS) [IN PROGRESS]
- [ ] `US08`: Thả tim bài viết công thức (`Favorites`)
- [ ] `US09`: Đánh giá chất lượng món ăn 1–5 sao (`Ratings`)
- [ ] `US10`: Viết bình luận bài viết kèm Bộ lọc tự động từ cấm (`Comments & BadWords Filter`)
- [ ] `US11`: Gửi lời mời kết bạn, Chấp nhận / Hủy kết bạn (`Friends`)
- [ ] `US12`: Chia sẻ công thức trực tiếp tới Hộp thư bạn bè (`Shared Recipes`)

---

### 🔵 SPRINT 4: BẢNG XẾP HẠNG DANH VỌNG & RANK BADGE (LEADERBOARD & RANK)
- [ ] `US13`: Bảng xếp hạng Top 3 Master Chef & Top 10 Tác giả xuất sắc nhất (`/leaderboard`)
- [ ] `US14`: Hệ thống phân cấp 5 Rank Badge (Đồng ➔ Bạc ➔ Vàng ➔ Bạch Kim ➔ Kim Cương) theo lượt tim tích lũy
- [ ] `US15`: Khung Avatar Rank (`RankAvatarFrame`) hiển thị trên Hồ sơ cá nhân (`/profile`) và bài viết

---

### 🟣 SPRINT 5: QUẢN TRỊ VIÊN & POLISH HỆ THỐNG (ADMIN MODERATION & DEPLOY)
- [ ] `US16`: Admin duyệt bài công thức nấu ăn mới (`Approve` / `Reject`)
- [ ] `US17`: Admin quản lý danh sách từ cấm (`BadWords`) & Xóa bình luận vi phạm
- [ ] `US18`: Admin Dashboard xem thống kê hệ thống (Số User, Số Công thức, Lượt tương tác)
- [ ] `US19`: Kiểm thử toàn bộ hệ thống (E2E Testing) & Đóng gói Deploy Production
