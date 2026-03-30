/**
 * Bản sao giỏ hàng trên trình duyệt (bổ sung cookie phía server — không mất khi F5).
 * Server vẫn là nguồn dữ liệu khi checkout; localStorage dùng để đồng bộ UI nhanh.
 */
(function () {
    var STORAGE_KEY = 'booktotal_cart_mirror_v1';

    window.booktotalCartMirror = {
        save: function (cart, totalQty) {
            try {
                if (!cart || !Array.isArray(cart) || cart.length === 0) {
                    localStorage.removeItem(STORAGE_KEY);
                    return;
                }
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({ cart: cart, totalQty: totalQty || 0, savedAt: Date.now() })
                );
            } catch (e) {
                /* quota / private mode */
            }
        },
        load: function () {
            try {
                var raw = localStorage.getItem(STORAGE_KEY);
                return raw ? JSON.parse(raw) : null;
            } catch (e) {
                return null;
            }
        }
    };
})();
