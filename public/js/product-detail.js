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

// Hàm thêm vào giỏ hàng bằng AJAX
function addToCart(productId) {
    const quantity = document.getElementById('qtyInput').value;

    fetch(`/cart/add/${productId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: quantity })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Hiện Toast thành công
            document.getElementById('toastMessage').innerText = data.message;
            const toast = new bootstrap.Toast(document.getElementById('cartToast'));
            toast.show();

            // Cập nhật số lượng trên icon giỏ hàng (nếu có)
            const badge = document.querySelector('.cart-badge');
            if (badge) badge.innerText = data.totalQty;
        } else {
            // Hiện Toast lỗi (Hết hàng)
            document.getElementById('errorMessage').innerText = data.message;
            const toast = new bootstrap.Toast(document.getElementById('errorToast'));
            toast.show();
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Hàm mua ngay (Thêm vào giỏ rồi chuyển hướng)
function buyNow(productId) {
    const quantity = document.getElementById('qtyInput').value;

    fetch(`/cart/add/${productId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: quantity })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = '/cart';
        } else {
            document.getElementById('errorMessage').innerText = data.message;
            const toast = new bootstrap.Toast(document.getElementById('errorToast'));
            toast.show();
        }
    });
}