-- SQLite
-- admin
UPDATE Users SET Role = 'admin' WHERE UserId = 7;
-- Quản lý User
-- Xem tất cả users
SELECT UserId, FullName, Email, Role FROM Users;

-- Tìm user theo tên
SELECT * FROM Users WHERE FullName LIKE '%keyword%';

-- Đổi mật khẩu (cần hash, không làm trực tiếp thường)
-- Xoá user
DELETE FROM Users WHERE UserId = ?;
-- Quản lý Recipe
-- Xem tất cả recipes
SELECT RecipeId, RecipeName, UserId, Status FROM Recipes;

-- Duyệt recipe (chuyển status)
UPDATE Recipes SET Status = 'Approved' WHERE RecipeId = ?;
UPDATE Recipes SET Status = 'Rejected' WHERE RecipeId = ?;

-- Xoá recipe
DELETE FROM Recipes WHERE RecipeId = ?;
-- Quản lý Comment
-- Xem comments của recipe nào đó
SELECT c.CommentId, c.Content, u.FullName, c.CreatedAt
FROM Comments c
JOIN Users u ON c.UserId = u.UserId
WHERE c.RecipeId = ?;

-- Xoá spam comment
DELETE FROM Comments WHERE CommentId = ?;
-- Thống kê nhanh
-- Đếm recipes theo category
SELECT cat.CategoryName, COUNT(r.RecipeId) AS Total
FROM Categories cat
LEFT JOIN Recipes r ON cat.CategoryId = r.CategoryId
GROUP BY cat.CategoryName;

-- Top recipes nhiều lượt yêu thích nhất
SELECT r.RecipeName, COUNT(f.FavoriteId) AS Likes
FROM Recipes r
LEFT JOIN Favorites f ON r.RecipeId = f.RecipeId
GROUP BY r.RecipeId
ORDER BY Likes DESC
LIMIT 10;

-- Users tích cực nhất (nhiều recipe)
SELECT u.FullName, u.Email, COUNT(r.RecipeId) AS TotalRecipes
FROM Users u
LEFT JOIN Recipes r ON u.UserId = r.UserId
GROUP BY u.UserId
ORDER BY TotalRecipes DESC;
Bad Words (từ cấm)
-- Xem danh sách từ cấm
SELECT * FROM BadWords;

-- Thêm từ cấm
INSERT INTO BadWords (Word, CreatedAt) VALUES ('badword', datetime('now'));
-- Shopping List
-- Xem danh sách mua của user
SELECT sl.ListName, i.IngredientName, sli.Quantity, sli.IsPurchased
FROM ShoppingLists sl
JOIN ShoppingListItems sli ON sl.ShoppingListId = sli.ShoppingListId
LEFT JOIN Ingredients i ON sli.IngredientId = i.IngredientId
WHERE sl.UserId = ?;