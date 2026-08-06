# Sprint Plan — Facecook

---

## Sprint 1: Nền tảng & Xác thực (Foundation & Auth) ✅
**Trạng thái:** ✅ Hoàn thành

### PM/UI-UX
- [x] Thiết kế UI auth pages (login, register)
- [x] SiteHeader + SiteFooter
- [x] Color system, typography, dark theme
- [x] Responsive layout
- [x] User flow diagrams → `/user-flow`

### Backend 1
- [x] Tạo project ASP.NET Core Web API
- [x] Cấu hình DbContext + SQLite
- [x] Migration, seeding dữ liệu mẫu (categories, ingredients)

### Backend 2
- [x] AuthController (register / login)
- [x] JwtService + JWT middleware
- [x] User model + UsersController

### Frontend 1
- [x] Tạo Next.js project (App Router)
- [x] Cấu hình Tailwind CSS + shadcn/ui
- [x] AuthProvider (context + localStorage)
- [x] API client (`lib/api.ts`)

### Frontend 2
- [x] Trang Login
- [x] Trang Register
- [x] AuthShell component
- [x] SiteHeader component
- [x] SiteFooter component

---

## Sprint 2: Công thức & Danh mục (Recipe Core) ✅

### PM/UI-UX
- [x] RecipeCard component
- [x] Recipe detail dialog layout
- [x] Recipe detail standalone page
- [x] Recipe grid layout
- [x] Submit recipe form UI
- [x] Category badges
- [x] Skeleton loading states
- [x] Comment section + Star rating

### Backend 1
- [x] Recipe model + RecipesController (CRUD, filter, search, approve/reject)
- [x] RecipeIngredientsController
- [x] CommentsController (CRUD + pagination, edit/delete ownership)
- [x] RatingsController (average + count)
- [x] FavoritesController (toggle + count)

### Backend 2
- [x] CategoriesController
- [x] IngredientsController
- [x] BadWordsController
- [x] RecipeSteps model

### Frontend 1
- [x] Trang Recipes listing (`/recipes`) — catalog + search + category filter
- [x] RecipeCard component + RecipeGrid component
- [x] RecipeDetailDialog (full tabs: ingredients, steps, nutrition)

### Frontend 2
- [x] Trang Recipe Detail standalone (`/recipe/[id]`)
- [x] CommentSection, StarRating, Favorites button
- [x] Trang Submit recipe form (`/submit`)

---

## Sprint 3: Người dùng & Tiện ích (User & Utilities) ✅

### PM/UI-UX
- [x] Profile page layout (avatar, rank card, stats, tabs)
- [x] Friends list + invitations layout
- [x] Shared recipes inbox layout
- [x] Shopping list layout
- [x] Price comparison card
- [x] Notification badge

### Backend 1
- [x] UsersController (update profile, avatar, change password, getUserRank)
- [x] FriendsController (request/accept/reject/remove)
- [x] SharedRecipesController (inbox/send/read)
- [x] NotificationsController (count requests + unread shares)

### Backend 2
- [x] ShoppingListsController (CRUD lists + items)
- [x] `POST /api/recipes/{id}/calculate-cost`
- [x] Seed 119 ingredients với giá

### Frontend 1
- [x] Trang Profile (`/profile`) — avatar, rank card, stats, own recipes, favorites tab, edit profile
- [x] Trang Friends (`/friends`) — list + pending + search + send request
- [x] NotificationBadge (friend req + unread shares)

### Frontend 2
- [x] Trang Shared Recipes (`/shared`) — inbox
- [x] Trang Shopping Lists (`/shopping-list`) — tạo list, thêm ingredient, đánh dấu đã mua
- [x] Price comparison trong detail dialog + standalone page

---

## Sprint 4: Chợ & Quản trị (Marketplace & Admin) ✅

### PM/UI-UX
- [x] Admin dashboard layout (6 tabs)
- [x] Seller/Buyer panels
- [x] Order workflow UI
- [x] Bank account form + QR code display
- [x] Payment proof input
- [x] Product card

### Backend 1
- [x] ProductsController (CRUD, rank Bạch Kim gate ≥200 likes, bank account check)
- [x] OrdersController (workflow: pending→confirmed→delivering→completed/cancelled)

### Backend 2
- [x] OrdersController (paymentStatus, PaymentProofUrl, update proof)
- [x] BankAccountsController (CRUD + public GET + QrCodeUrl)
- [x] AdminController (dashboard stats + manage recipes/users/comments)

### Frontend 1
- [x] Admin dashboard (`/admin`) — stats, pending moderation, user management, bad words
- [x] Manage products (create/edit/delete)

### Frontend 2
- [x] Trang Marketplace (`/marketplace`) — browse + ProductCard
- [x] SellerPanel + CompactSellerPanel
- [x] Trang Orders (`/orders`) — tab "Đã mua" / "Đã bán"
- [x] PaymentProof input, SellerBankInfo (QR + STK)

---

## Sprint 5: Xếp hạng & Hoàn thiện (Rank & Polish) ✅

### PM/UI-UX
- [x] Leaderboard podium layout (top 3)
- [x] 4 tab layout (ratings, favorites, best-selling, master-chef)
- [x] RankBadge component (màu sắc + label theo rank)
- [x] RankAvatarFrame (khung rank cho avatar)
- [x] Profile rank layout
- [x] Trang ERD + User Flow

### Backend 1
- [x] LeaderboardController — 4 endpoints (ratings, favorites, best-selling, master-chef)
- [x] `GET /api/recipes` bổ sung `hasActiveProduct` + `sellerRank`

### Backend 2
- [x] Rank system logic (Đồng ≥0, Bạc ≥10, Vàng ≥50, Bạch Kim ≥200, Kim Cương ≥500)
- [x] Swagger docs (Swashbuckle)

### Frontend 1
- [x] Trang Leaderboard (`/leaderboard`) — podium + 4 tab + period filter + master chef avatar
- [x] RankBadge component
- [x] RecipeCard badge "Đang bán" theo rank seller

### Frontend 2
- [x] Trang ERD (`/erd`)
- [x] Trang User Flow (`/user-flow`)
- [x] Deploy production lên VPS

---

## Còn lại (Todo)

- [ ] Fix lỗi `useSearchParams()` cần Suspense boundary ở `/submit`
- [ ] UI input nutritionInfo trong submit form
- [ ] Seed dữ liệu mẫu thêm (recipes, orders, products)
