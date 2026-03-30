document.addEventListener('DOMContentLoaded', function() {
    updateDeliveryDate();
});

function increaseQty() {
    let input = document.getElementById('qtyInput');
    input.value = parseInt(input.value) + 1;
}

function decreaseQty() {
    let input = document.getElementById('qtyInput');
    if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
    }
}

function addToCart(productId) {
    const quantity = document.getElementById('qtyInput').value;
    const params = new URLSearchParams();
    params.append('productId', productId);
    params.append('quantity', quantity);

    fetch('/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Hiển thị popup thành công ở giữa màn hình
            const popup = document.getElementById('centerSuccessPopup');
            if (popup) {
                popup.classList.add('show');
                setTimeout(() => {
                    popup.classList.remove('show');
                }, 2000);
            } else {
                Swal.fire({
                    icon: 'success',
                    title: 'Thành công',
                    text: 'Đã thêm sản phẩm vào giỏ hàng',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
            
            // Cập nhật số lượng trên header
            if (typeof refreshCartDropdownHeader === 'function') refreshCartDropdownHeader();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: data.message || 'Không thể thêm vào giỏ hàng'
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Lỗi kết nối',
            text: 'Có lỗi xảy ra, vui lòng thử lại sau.'
        });
    });
}

function buyNow(productId) {
    const quantity = document.getElementById('qtyInput').value;
    const params = new URLSearchParams();
    params.append('productId', productId);
    params.append('quantity', quantity);

    fetch('/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            window.location.href = '/cart';
        } else {
            Swal.fire({ 
                icon: 'error', 
                title: 'Lỗi', 
                text: data.message || 'Không thể mua ngay' 
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Lỗi kết nối',
            text: 'Có lỗi xảy ra, vui lòng thử lại sau.'
        });
    });
}

function updateDeliveryDate() {
    const deliveryEl = document.getElementById('deliveryDate');
    if (!deliveryEl) return;

    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 2);

    const options = { weekday: 'long', day: 'numeric', month: 'numeric' };
    const dateString = deliveryDate.toLocaleDateString('vi-VN', options);
    const formattedDate = dateString.replace(/^\w/, (c) => c.toUpperCase());

    deliveryEl.innerText = `Dự kiến giao ${formattedDate}`;
}

// Các hàm xử lý Modal và Địa chỉ (Giữ nguyên hoặc chuyển sang file riêng nếu muốn)
function openLoginModal() {
    // Logic mở modal login...
    // (Để đơn giản, phần này có thể giữ lại trong EJS hoặc chuyển sang file JS chung)
    const loginModalEl = document.getElementById('loginModal');
    if (loginModalEl) {
        const modal = new bootstrap.Modal(loginModalEl);
        modal.show();
    }
}

function setRatingText(text) {
    const ratingTextEl = document.getElementById('ratingText');
    if (ratingTextEl) ratingTextEl.innerText = text;
}

function updateDistricts() {
    const provinceSelect = document.getElementById('provinceSelect');
    const districtSelect = document.getElementById('districtSelect');
    if (!provinceSelect || !districtSelect) return;

    const province = provinceSelect.value;
    districtSelect.innerHTML = '';

    let districts = [];
    if (province === 'Hồ Chí Minh') districts = ['Quận 1', 'Quận 3', 'Thủ Đức', 'Bình Thạnh'];
    else if (province === 'Hà Nội') districts = ['Hoàn Kiếm', 'Ba Đình', 'Cầu Giấy'];
    else districts = ['Quận trung tâm', 'Huyện ngoại thành'];

    districts.forEach(d => {
        const option = document.createElement('option');
        option.value = d;
        option.text = d;
        districtSelect.appendChild(option);
    });
}

function saveAddress() {
    const provinceSelect = document.getElementById('provinceSelect');
    const districtSelect = document.getElementById('districtSelect');
    const currentAddressEl = document.getElementById('currentAddress');
    const addressModalEl = document.getElementById('addressModal');

    if (provinceSelect && districtSelect && currentAddressEl) {
        const province = provinceSelect.value;
        const district = districtSelect.value;
        currentAddressEl.innerText = `${district}, ${province}`;

        if (addressModalEl) {
            const modal = bootstrap.Modal.getInstance(addressModalEl);
            if (modal) modal.hide();
        }
        updateDeliveryDate();
    }
}