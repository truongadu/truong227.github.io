// ==========================================
// 1. BIẾN TOÀN CỤC (Quản lý trạng thái)
// ==========================================
let cart = [];
let tongTienGioHang = 0; 
let tienGiamTuMa = 0;    
let maDaApDung = false;  
let shouldReloadAfterAlert = false; 

// ==========================================
// 2. QUẢN LÝ ẨN/HIỆN POPUP (Dùng class .show cực gọn)
// ==========================================
function toggleCart() {
    document.getElementById("cart-overlay").classList.toggle("show");
}

function openCheckout() {
    if (cart.length === 0) { 
        showCustomAlert("Trống!", "Giỏ hàng của bạn đang trống!", "🛒"); 
        return; 
    }
    document.getElementById("cart-overlay").classList.remove("show"); // Đóng giỏ
    document.getElementById("checkout-overlay").classList.add("show"); // Mở thanh toán
    updateCheckoutUI();
}

function closeCheckout() {
    document.getElementById("checkout-overlay").classList.remove("show");
    document.getElementById("cart-overlay").classList.add("show"); // Bật lại giỏ hàng
}

// ==========================================
// 3. THÊM VÀ SỬA SỐ LƯỢNG GIỎ HÀNG
// ==========================================
function addToCart(itemName, itemPrice, idKho, btnElement) {
    let price = Number(itemPrice) || 0; 
    let theKho = document.getElementById(idKho);
    let soLuongKho = parseInt(theKho.innerText);

    if (soLuongKho <= 0) {
        showCustomAlert("Hết hàng!", "Món này đang chờ nhập hàng, vui lòng đợi vài giây!", "📦");
        return; 
    }

    theKho.innerText = soLuongKho - 1; // Giảm kho giao diện

    let existingItem = cart.find(item => item.name === itemName);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name: itemName, price: price, quantity: 1, idKho: idKho });
    }
    
    updateCartUI();
    showToast(`Đã thêm ${itemName} vào giỏ hàng!`);
}

function changeQuantity(itemName, delta) {
    let itemIndex = cart.findIndex(i => i.name === itemName);
    if (itemIndex === -1) return;

    let item = cart[itemIndex];
    let theKho = document.getElementById(item.idKho);
    let currentStock = parseInt(theKho.innerText);

    if (delta > 0) {
        if (currentStock <= 0) return showCustomAlert("Hết hàng!", "Đã hết trong kho!", "📦");
        item.quantity += 1;
        theKho.innerText = currentStock - 1;
    } else {
        item.quantity -= 1;
        theKho.innerText = currentStock + 1;
        if (item.quantity === 0) cart.splice(itemIndex, 1); // Xóa nếu số lượng = 0
    }
    
    updateCartUI();
    if (document.getElementById("checkout-overlay").classList.contains("show")) {
        updateCheckoutUI(); 
    }
}

function clearCart() {
    if (cart.length === 0) return;
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?")) {
        cart.forEach(item => {
            let theKho = document.getElementById(item.idKho);
            if(theKho) theKho.innerText = parseInt(theKho.innerText) + item.quantity; // Trả lại kho
        });
        cart = [];
        tienGiamTuMa = 0; 
        maDaApDung = false;
        updateCartUI();
    }
}

// ==========================================
// 4. RENDER GIAO DIỆN (Đã chuyển style sang CSS)
// ==========================================
function updateCartUI() {
    let cartList = document.getElementById("cart-list");
    let tamTinh = 0; let tongSoMon = 0;
    cartList.innerHTML = ""; 

    if(cart.length === 0) {
        cartList.innerHTML = `<div style="text-align: center; margin-top: 60px; color: #999;">
            <div style="font-size: 50px; margin-bottom: 10px; opacity: 0.5;">🛒</div>
            <h3>Giỏ hàng trống</h3>
        </div>`;
    }

    cart.forEach(item => {
        tamTinh += item.price * item.quantity;
        tongSoMon += item.quantity;
        
        // Sử dụng class CSS thay vì viết style trực tiếp, code sạch hơn 80%
        cartList.innerHTML += `
        <div class="cart-card">
            <div class="cart-card-header">
                <span class="cart-card-name">${item.name}</span>
                <span class="cart-card-price">${(item.price * item.quantity).toLocaleString()} đ</span>
            </div>
            <div class="cart-card-body">
                <span class="cart-card-unit">Đơn giá: ${item.price.toLocaleString()}đ</span>
                <div class="qty-control">
                    <button class="qty-btn" onclick="changeQuantity('${item.name}', -1)">-</button>
                    <span class="qty-num">${item.quantity}</span>
                    <button class="qty-btn" onclick="changeQuantity('${item.name}', 1)">+</button>
                </div>
            </div>
        </div>`;
    });

    tongTienGioHang = tamTinh;
    document.getElementById("total-price").innerText = tongTienGioHang.toLocaleString();
    document.getElementById("cart-badge").innerText = tongSoMon;
}

function updateCheckoutUI() {
    let chkList = document.getElementById("checkout-item-list");
    chkList.innerHTML = "";
    
    if(cart.length === 0) return closeCheckout();

    cart.forEach(item => {
        chkList.innerHTML += `
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #e0e0e0;">
            <span><b style="color: #ea2b2b; width: 25px; display: inline-block;">${item.quantity}x</b> ${item.name}</span>
            <span style="font-weight: bold;">${(item.price * item.quantity).toLocaleString()} đ</span>
        </div>`;
    });

    document.getElementById("chk-subtotal").innerText = tongTienGioHang.toLocaleString() + " đ";
    document.getElementById("chk-discount").innerText = "- " + tienGiamTuMa.toLocaleString() + " đ";
    let finalPay = Math.max(0, tongTienGioHang - tienGiamTuMa);
    document.getElementById("chk-final-total").innerText = finalPay.toLocaleString() + " đ";
}

// ==========================================
// 5. MÃ GIẢM GIÁ & THANH TOÁN
// ==========================================
function applyPromo() {
    if (maDaApDung) return showCustomAlert("Cảnh báo", "Chỉ được dùng 1 mã giảm giá!", "⚠️"); 
    
    let code = document.getElementById("promo-code").value.trim().toUpperCase();
    
    switch(code) {
        case "GIAM10K":
            tienGiamTuMa = 10000; maDaApDung = true;
            showCustomAlert("Thành công!", "Áp dụng mã GIAM10K (-10.000đ)", "🎉");
            break;
        case "FREESHIP":
            tienGiamTuMa = 15000; maDaApDung = true;
            showCustomAlert("Thành công!", "Áp dụng FREESHIP (-15.000đ)", "🛵");
            break;
            case "ANCUNGNHOMLUA": 
        if (tongTienGioHang >= 100000) {
            tienGiamTuMa = 50000; maDaApDung = true;
            showCustomAlert("Tuyệt vời!", "Áp dụng mã GIAM50K (-50.000đ)", "🔥");
        } else {
            showCustomAlert("Từ chối", "Đơn hàng phải từ 100.000đ trở lên mới được áp dụng!", "❌");
        }
        break;
        case "SIEUTIEC":
            if (tongTienGioHang >= 100000) {
                tienGiamTuMa = tongTienGioHang * 0.2; maDaApDung = true;
                showCustomAlert("Đại tiệc!", `Giảm 20% (Tiết kiệm ${tienGiamTuMa.toLocaleString()}đ)`, "🎊");
            } else {
                showCustomAlert("Từ chối", "Đơn hàng phải trên 100.000đ", "❌");
            }
            break;
        case "":
            showCustomAlert("Quên kìa!", "Bạn chưa nhập mã!", "🤔");
            break;
        default:
            showCustomAlert("Lỗi!", "Mã không hợp lệ hoặc hết hạn!", "❌");
    }
    updateCheckoutUI();
}

function confirmOrder() {
    showCustomAlert("Đặt hàng thành công!", "Đơn hàng đang được xử lý.", "🥰", true);
}

// ==========================================
// 6. THÔNG BÁO (TOAST & CUSTOM ALERT)
// ==========================================
function showCustomAlert(title, message, icon = '✅', reloadPageOnClose = false) {
    shouldReloadAfterAlert = reloadPageOnClose;
    document.getElementById("custom-alert-title").innerText = title;
    document.getElementById("custom-alert-message").innerText = message;
    document.getElementById("custom-alert-icon").innerText = icon;
    document.getElementById("custom-alert-overlay").classList.add("show");
}

function closeCustomAlert() {
    document.getElementById("custom-alert-overlay").classList.remove("show");
    if (shouldReloadAfterAlert) setTimeout(() => window.location.reload(), 300);
}

function showToast(message) {
    let container = document.getElementById("toast-container");
    let toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = message;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 400); 
    }, 2500);
}