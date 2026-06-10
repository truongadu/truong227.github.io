/* =========================================
   SPRINT 1 - LOGIC XÁC THỰC (Authentication)
   Lưu user & token ở phía client bằng localStorage.
   Đây là bản demo dễ làm, không cần backend.
   ========================================= */

// "Cơ sở dữ liệu" người dùng tạm thời lưu trong localStorage
const DB_KEY = "ctna_users";       // danh sách tài khoản
const SESSION_KEY = "ctna_session"; // token + thông tin đăng nhập hiện tại

// ---- Tiện ích đọc/ghi ----
function getUsers() {
    return JSON.parse(localStorage.getItem(DB_KEY) || "[]");
}
function saveUsers(users) {
    localStorage.setItem(DB_KEY, JSON.stringify(users));
}

// Tạo "JWT token" giả lập (chỉ để minh hoạ luồng lưu token ở client)
function createFakeToken(email) {
    const payload = { email: email, exp: Date.now() + 1000 * 60 * 60 * 24 }; // hết hạn sau 24h
    return "demo." + btoa(unescape(encodeURIComponent(JSON.stringify(payload)))) + ".token";
}

// ---- Quản lý phiên đăng nhập ----
function setSession(user) {
    const session = {
        token: createFakeToken(user.email),
        name: user.name,
        email: user.email,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
function getSession() {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
}
function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

// Chặn truy cập trang yêu cầu đăng nhập
function requireAuth() {
    const session = getSession();
    if (!session || !session.token) {
        window.location.href = "login.html";
        return null;
    }
    return session;
}
// Nếu đã đăng nhập rồi thì không cho vào lại trang login/register
function redirectIfLoggedIn() {
    const session = getSession();
    if (session && session.token) {
        window.location.href = "home.html";
    }
}

// ---- Hiển thị lỗi ----
function showError(el, message) {
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
}
function hideError(el) {
    if (el) el.classList.remove("show");
}

// =========================================
//  XỬ LÝ ĐĂNG KÝ
// =========================================
function handleRegister(event) {
    event.preventDefault();
    const errorEl = document.getElementById("error-msg");
    hideError(errorEl);

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;

    // Kiểm tra dữ liệu nhập
    if (!name || !email || !password) {
        showError(errorEl, "Vui lòng điền đầy đủ thông tin.");
        return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
        showError(errorEl, "Email không hợp lệ.");
        return;
    }
    if (password.length < 6) {
        showError(errorEl, "Mật khẩu phải có ít nhất 6 ký tự.");
        return;
    }
    if (password !== confirm) {
        showError(errorEl, "Mật khẩu nhập lại không khớp.");
        return;
    }

    const users = getUsers();
    if (users.some((u) => u.email === email)) {
        showError(errorEl, "Email này đã được đăng ký.");
        return;
    }

    // Lưu tài khoản mới
    users.push({ name, email, password });
    saveUsers(users);

    // Tự động đăng nhập sau khi đăng ký
    setSession({ name, email });
    window.location.href = "home.html";
}

// =========================================
//  XỬ LÝ ĐĂNG NHẬP
// =========================================
function handleLogin(event) {
    event.preventDefault();
    const errorEl = document.getElementById("error-msg");
    hideError(errorEl);

    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        showError(errorEl, "Vui lòng nhập email và mật khẩu.");
        return;
    }

    const users = getUsers();
    const user = users.find((u) => u.email === email && u.password === password);

    if (!user) {
        showError(errorEl, "Email hoặc mật khẩu không đúng.");
        return;
    }

    setSession(user);
    window.location.href = "home.html";
}

// =========================================
//  ĐĂNG XUẤT
// =========================================
function handleLogout() {
    clearSession();
    window.location.href = "login.html";
}
