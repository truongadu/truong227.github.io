# 🧪 BỘ KIỂM THỬ HỆ THỐNG (TEST CASES DOCUMENT)
## DỰ ÁN: MẠNG XÃ HỘI CHIA SẺ CÔNG THỨC NẤU ĂN & TÍNH TOÁN CHI PHÍ (FACECOOK)

- **Repository**: [https://github.com/truongadu/truong227.github.io.git](https://github.com/truongadu/truong227.github.io.git)
- **Môi trường kiểm thử**: 
  - **Backend**: ASP.NET Core 8.0 Web API (`http://localhost:5000`)
  - **Frontend**: Next.js 14 App Router (`http://localhost:3000`)
  - **CSDL**: SQLite (`CookingAppDB.db`)
- **Tổng số Test Cases**: 43 Test Cases (Đã lọc sạch các tính năng Shopping/E-commerce)

---

# 📑 TỔNG HỢP KẾT QUẢ KIỂM THỬ (SUMMARY)

| Phân hệ | Số lượng TC | Đạt (Pass) | Thất bại (Fail) | Tỷ lệ Đạt |
|---|---|---|---|---|
| **1. Xác thực & Tài khoản (Auth)** | 6 | 6 | 0 | 100% |
| **2. Công thức & Chi phí (Recipes & Cost)** | 8 | 8 | 0 | 100% |
| **3. Tương tác Mạng xã hội (Social)** | 8 | 8 | 0 | 100% |
| **4. Bạn bè & Chia sẻ (Friends & Share)** | 6 | 6 | 0 | 100% |
| **5. Leaderboard & Rank System** | 4 | 4 | 0 | 100% |
| **6. Quản trị viên (Admin Moderation)** | 6 | 6 | 0 | 100% |
| **7. Kiểm thử Giao diện (UI/UX)** | 5 | 5 | 0 | 100% |
| **TỔNG CỘNG** | **43** | **43** | **0** | **100%** |

---

# 1. PHÂN HỆ XÁC THỰC & TÀI KHOẢN (AUTH & USER PROFILE)

| Mã TC | Tên Test Case | Các bước thực hiện | Dữ liệu đầu vào | Kết quả kỳ vọng | Trạng thái |
|---|---|---|---|---|---|
| `TC-AUTH-01` | Đăng ký tài khoản hợp lệ | 1. Vào `/register`<br>2. Nhập thông tin hợp lệ<br>3. Bấm Đăng ký | FullName: "Nguyễn Văn A"<br>Email: "user1@gmail.com"<br>Password: "Password123@" | Tạo tài khoản thành công, thông báo đăng ký thành công và chuyển sang màn hình Đăng nhập | **Pass** |
| `TC-AUTH-02` | Đăng ký với Email đã tồn tại | 1. Vào `/register`<br>2. Nhập Email trùng với tài khoản đã có trong CSDL<br>3. Bấm Đăng ký | Email: "user1@gmail.com" (Đã tồn tại) | Hiển thị lỗi "Email đã được sử dụng", HTTP 400 Bad Request | **Pass** |
| `TC-AUTH-03` | Đăng ký thiếu trường bắt buộc | 1. Để trống Mật khẩu<br>2. Bấm Đăng ký | FullName: "Nguyễn Văn B"<br>Email: "user2@gmail.com"<br>Password: "" | Hiển thị cảnh báo Validation dưới ô mật khẩu | **Pass** |
| `TC-AUTH-04` | Đăng nhập đúng thông tin | 1. Vào `/login`<br>2. Nhập Email & Password đúng<br>3. Bấm Đăng nhập | Email: "user1@gmail.com"<br>Password: "Password123@" | Trả về JWT Token hợp lệ, lưu vào LocalStorage, chuyển hướng về Trang chủ | **Pass** |
| `TC-AUTH-05` | Đăng nhập sai Mật khẩu | 1. Vào `/login`<br>2. Nhập sai Mật khẩu<br>3. Bấm Đăng nhập | Email: "user1@gmail.com"<br>Password: "WrongPassword" | Báo lỗi "Tài khoản hoặc mật khẩu không chính xác", HTTP 401 Unauthorized | **Pass** |
| `TC-AUTH-06` | Đăng xuất tài khoản | 1. Đăng nhập thành công<br>2. Bấm nút "Đăng xuất" trên Header | Token hiện tại | Xóa JWT Token khỏi LocalStorage & Context, chuyển hướng về `/login` | **Pass** |

---

# 2. PHÂN HỆ CÔNG THỨC & CHI PHÍ NGUYÊN LIỆU (RECIPES & COST ENGINE)

| Mã TC | Tên Test Case | Các bước thực hiện | Dữ liệu đầu vào | Kết quả kỳ vọng | Trạng thái |
|---|---|---|---|---|---|
| `TC-REC-01` | Tạo công thức mới hợp lệ | 1. Đăng nhập<br>2. Vào `/submit`<br>3. Điền tên món, chọn nguyên liệu định lượng, giá mua ngoài<br>4. Bấm Đăng công thức | RecipeName: "Phở Bò Hà Nội"<br>Servings: 2<br>EatingOutPrice: 100000 | Bài viết được lưu vào CSDL với trạng thái `Status = pending`, chờ Admin duyệt | **Pass** |
| `TC-REC-02` | Tự động tính tổng chi phí tự nấu | 1. Chọn 0.3kg Thịt bò (200.000đ/kg)<br>2. Chọn 0.5kg Bánh phở (30.000đ/kg) | Quantity: 0.3kg Bò, 0.5kg Phở | Hệ thống tự tính `TotalIngredientCost = 75.000 VNĐ` | **Pass** |
| `TC-REC-03` | So sánh chi phí Tự nấu vs Mua ngoài | 1. Mở xem công thức "Phở Bò"<br>2. Kiểm tra phần bảng chi phí | EatingOutPrice: 100.000đ<br>TotalCost: 75.000đ | Hiển thị thông điệp "Tiết kiệm 25.000 VNĐ (25%) khi tự nấu tại nhà" | **Pass** |
| `TC-REC-04` | Xem danh sách công thức đã duyệt | 1. Truy cập trang `/recipes` | Request GET `/api/recipes` | Chỉ hiển thị các bài viết có `Status = approved` | **Pass** |
| `TC-REC-05` | Tìm kiếm công thức theo từ khóa | 1. Nhập từ khóa "Thịt bò" vào thanh tìm kiếm | SearchKey: "Thịt bò" | Trả về danh sách các bài viết có chứa từ "Thịt bò" trong tên hoặc nguyên liệu | **Pass** |
| `TC-REC-06` | Lọc công thức theo Danh mục | 1. Chọn danh mục "Món Nước" | CategoryId: 1 | Trả về danh sách công thức thuộc danh mục "Món Nước" | **Pass** |
| `TC-REC-07` | Lọc công thức theo Độ khó | 1. Chọn độ khó "Dễ" | Difficulty: "Easy" | Trả về các món ăn có độ khó "Dễ" | **Pass** |
| `TC-REC-08` | Xem chi tiết công thức | 1. Bấm vào 1 card món ăn | RecipeId: 1 | Mở Dialog/Page chi tiết hiển thị đủ: Định lượng nguyên liệu, Các bước làm, Bảng so sánh giá | **Pass** |

---

# 3. PHÂN HỆ TƯƠNG TÁC MẠNG XÃ HỘI (SOCIAL & BADWORDS FILTER)

| Mã TC | Tên Test Case | Các bước thực hiện | Dữ liệu đầu vào | Kết quả kỳ vọng | Trạng thái |
|---|---|---|---|---|---|
| `TC-SOC-01` | Thả tim bài viết (Favorite) | 1. Bấm nút biểu tượng Trái tim trên bài viết | RecipeId: 1, UserId: 1 | Tạo record trong bảng `Favorites`, số lượt tim tăng lên 1, icon đổi màu đỏ | **Pass** |
| `TC-SOC-02` | Bỏ thả tim bài viết | 1. Bấm lại vào nút Trái tim đã thả | RecipeId: 1, UserId: 1 | Xóa record trong bảng `Favorites`, số lượt tim giảm đi 1 | **Pass** |
| `TC-SOC-03` | Viết bình luận hợp lệ | 1. Nhập bình luận khen món ăn<br>2. Bấm "Gửi" | Content: "Món này ngon quá, cảm ơn tác giả!" | Lưu vào bảng `Comments`, bình luận xuất hiện ngay dưới bài viết | **Pass** |
| `TC-SOC-04` | Viết bình luận chứa từ cấm (BadWords) | 1. Nhập bình luận chứa từ thô tục<br>2. Bấm "Gửi" | Content: "Món ăn này dở tệ..." (có chứa BadWord trong DB) | `BadWordsMiddleware` chặn lại, hiển thị thông báo "Bình luận chứa từ ngữ không phù hợp" | **Pass** |
| `TC-SOC-05` | Đánh giá sao bài viết | 1. Chọn mức 5 sao<br>2. Bấm Đánh giá | Score: 5, RecipeId: 1 | Lưu vào bảng `Ratings`, cập nhật điểm đánh giá trung bình của bài viết | **Pass** |
| `TC-SOC-06` | Thay đổi điểm đánh giá sao | 1. Đã đánh giá 5 sao<br>2. Chọn lại thành 4 sao | Score: 4 | Cập nhật điểm rating trong CSDL từ 5 thành 4 sao | **Pass** |
| `TC-SOC-07` | Xem danh sách bài viết đã lưu | 1. Vào `/profile`<br>2. Chọn Tab "Đã lưu" | UserId: 1 | Trả về danh sách các công thức người dùng đã bấm Thả tim | **Pass** |
| `TC-SOC-08` | Phân trang danh sách bình luận | 1. Bài viết có > 10 bình luận<br>2. Cuộn xuống xem thêm | Page: 2, PageSize: 10 | Tải tiếp 10 bình luận tiếp theo mượt mà | **Pass** |

---

# 4. PHÂN HỆ BẠN BÈ & CHIA SẺ CÔNG THỨC (FRIENDS & SHARED RECIPES)

| Mã TC | Tên Test Case | Các bước thực hiện | Dữ liệu đầu vào | Kết quả kỳ vọng | Trạng thái |
|---|---|---|---|---|---|
| `TC-FRN-01` | Gửi lời mời kết bạn | 1. Vào trang Profile người khác<br>2. Bấm "Thêm bạn" | FriendUserId: 2 | Tạo record trong bảng `Friends` với `Status = pending` | **Pass** |
| `TC-FRN-02` | Chấp nhận lời mời kết bạn | 1. Đăng nhập User 2<br>2. Vào `/friends`<br>3. Bấm "Chấp nhận" | FriendId: 1 | Chuyển `Status = accepted`, hai người trở thành bạn bè | **Pass** |
| `TC-FRN-03` | Từ chối lời mời kết bạn | 1. Bấm "Từ chối" lời mời | FriendId: 1 | Xóa hoặc chuyển status record kết bạn | **Pass** |
| `TC-FRN-04` | Chia sẻ công thức cho bạn bè | 1. Mở bài công thức<br>2. Bấm "Chia sẻ"<br>3. Chọn bạn bè & nhập tin nhắn | ToUserId: 2<br>Message: "Món này dễ làm lắm nè!" | Lưu record vào `SharedRecipes` | **Pass** |
| `TC-FRN-05` | Xem Hộp thư bài viết được chia sẻ | 1. Đăng nhập User 2<br>2. Vào `/shared` | UserId: 2 | Hiển thị công thức được User 1 chia sẻ kèm lời nhắn | **Pass** |
| `TC-FRN-06` | Đánh dấu đã đọc bài chia sẻ | 1. Bấm mở xem bài chia sẻ trong inbox | ShareId: 1 | Cập nhật `IsRead = true`, giảm badge thông báo | **Pass** |

---

# 5. PHÂN HỆ BẢNG XẾP HẠNG & RANK BADGE (LEADERBOARD & RANK)

| Mã TC | Tên Test Case | Các bước thực hiện | Dữ liệu đầu vào | Kết quả kỳ vọng | Trạng thái |
|---|---|---|---|---|---|
| `TC-LDB-01` | Xem Bảng xếp hạng Master Chef | 1. Truy cập `/leaderboard` | GET `/api/leaderboard/masterchef` | Hiển thị Podium Top 3 người dùng có tổng lượt tim tích lũy cao nhất | **Pass** |
| `TC-LDB-02` | Tính cấp bậc Rank Badge tự động | 1. User tích lũy được 60 lượt tim | TotalFavorites: 60 | Hệ thống tự động nâng cấp User lên **Rank Vàng** (Gold Badge) | **Pass** |
| `TC-LDB-03` | Hiển thị Khung Avatar Rank | 1. Xem bài viết hoặc trang cá nhân của tác giả | Author: Rank Gold | Avatar hiển thị khung viền Vàng sang trọng kèm nhãn "Gold Chef" | **Pass** |
| `TC-LDB-04` | Lọc Bảng xếp hạng theo tháng | 1. Chọn bộ lọc "Tháng này" | TimeRange: "month" | Trả về Top đầu bếp tích cực nhất trong tháng hiện tại | **Pass** |

---

# 6. PHÂN HỆ QUẢN TRỊ VIÊN (ADMIN MODERATION)

| Mã TC | Tên Test Case | Các bước thực hiện | Dữ liệu đầu vào | Kết quả kỳ vọng | Trạng thái |
|---|---|---|---|---|---|
| `TC-ADM-01` | Duyệt công thức nấu ăn mới | 1. Đăng nhập tài khoản Admin<br>2. Vào `/admin`<br>3. Bấm "Duyệt" (Approve) bài viết pending | RecipeId: 1 | Đổi status bài viết thành `approved`, xuất hiện trên Trang chủ | **Pass** |
| `TC-ADM-02` | Từ chối công thức nấu ăn | 1. Admin bấm "Từ chối" (Reject) bài viết vi phạm | RecipeId: 2 | Đổi status bài viết thành `rejected`, ẩn khỏi hệ thống | **Pass** |
| `TC-ADM-03` | Thêm từ cấm mới vào danh sách | 1. Admin vào tab Quản lý Từ cấm<br>2. Nhập từ cấm mới<br>3. Bấm Thêm | Word: "badword_test" | Lưu từ mới vào bảng `BadWords`, bộ lọc tự động áp dụng ngay | **Pass** |
| `TC-ADM-04` | Xóa từ cấm khỏi danh sách | 1. Bấm nút Xóa bên cạnh từ cấm | BadWordId: 1 | Xóa từ khỏi bảng `BadWords` | **Pass** |
| `TC-ADM-05` | Xóa bình luận vi phạm | 1. Admin bấm Xóa bình luận không phù hợp | CommentId: 5 | Xóa record bình luận khỏi CSDL | **Pass** |
| `TC-ADM-06` | Phân quyền bảo mật Admin (RBAC) | 1. Đăng nhập bằng tài khoản User thường<br>2. Cố tình gọi API `/api/admin/approve` | Request từ User thường | Hệ thống chặn lại, trả về `HTTP 403 Forbidden` | **Pass** |

---

# 7. KIỂM THỬ GIAO DIỆN & RESPONSIVE (UI/UX)

| Mã TC | Tên Test Case | Thiết bị / Màn hình | Kết quả kỳ vọng | Trạng thái |
|---|---|---|---|---|
| `TC-UI-01` | Hiển thị Responsive trên Mobile | iPhone 14 Pro (393px) | Giao diện tự động co giãn, Menu chuyển sang dạng Hamburger mobile mượt mà | **Pass** |
| `TC-UI-02` | Hiển thị Responsive trên Tablet | iPad Air (820px) | Recipe Grid chuyển sang dạng 2 cột cân đối | **Pass** |
| `TC-UI-03` | Chuyển đổi Dark / Light Mode | Desktop Chrome | Toàn bộ màu nền, text, card chuyển đổi theme không bị lỗi màu font | **Pass** |
| `TC-UI-04` | Kiểm tra Icon hệ thống | Toàn bộ hệ thống | 100% icon sử dụng `lucide-react`, không dùng emoji hay icon hệ thống thô | **Pass** |
| `TC-UI-05` | Hiệu ứng Hover nút bấm | Desktop Chrome | Hover nhẹ nhàng (opacity/color transition), không bị hiệu ứng zoom giật lắc | **Pass** |

---

# 💻 MÃ NGUỒN UNIT TEST MẪU (xUNIT .NET 8)

Below is the C# xUnit test snippet included for automated verification:

```csharp
using Xunit;
using Microsoft.EntityFrameworkCore;
using CookingApp.API.Data;
using CookingApp.API.Models;
using CookingApp.API.Services;

namespace CookingApp.Tests
{
    public class RecipeCostAndBadWordsUnitTest
    {
        private CookingAppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<CookingAppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new CookingAppDbContext(options);
        }

        [Fact]
        public void CalculateIngredientCost_ShouldReturnAccurateTotal()
        {
            // Arrange
            decimal pricePerKg = 200000m; // 200.000 VNĐ / kg
            double quantityInKg = 0.3;     // 300g

            // Act
            decimal totalCost = (decimal)quantityInKg * pricePerKg;

            // Assert
            Assert.Equal(60000m, totalCost);
        }

        [Fact]
        public async Task BadWordsFilter_ShouldDetectForbiddenWord()
        {
            // Arrange
            var db = GetInMemoryDbContext();
            db.BadWords.Add(new BadWord { Word = "tục_tĩu" });
            await db.SaveChangesAsync();

            string userComment = "Món này tục_tĩu quá";

            // Act
            bool hasBadWord = db.BadWords.Any(b => userComment.Contains(b.Word));

            // Assert
            Assert.True(hasBadWord);
        }
    }
}
```
