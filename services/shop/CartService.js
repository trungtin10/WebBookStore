const ProductRepository = require('../../repositories/shop/ProductRepository');

class CartService {
    constructor(productRepository = null) {
        this.productRepository = productRepository || new ProductRepository();
    }

    getCartCookieName(userId) {
        return userId ? `cart_${userId}` : 'cart_guest';
    }

    async addToCart(cart, productId, quantity) {
        const product = await this.productRepository.getProductById(productId);
        if (!product) return { success: false, message: "Sản phẩm không tồn tại" };
        const stock = this._stockQty(product);
        if (stock < quantity) return { success: false, message: "Sản phẩm không đủ hàng" };

        const existingItem = cart.find(item => item.id == productId);
        if (existingItem) {
            if (stock < existingItem.quantity + quantity) {
                return { success: false, message: "Sản phẩm không đủ hàng" };
            }
            existingItem.quantity += quantity;
        } else {
            cart.push({ id: product.id, name: product.name, price: product.price, image_url: product.image_url, quantity });
        }
        return { success: true, cart };
    }

    _stockQty(product) {
        return Math.max(0, parseInt(product && product.quantity, 10) || 0);
    }

    async enrichCartLines(cart) {
        const lines = [];
        for (const item of cart) {
            const p = await this.productRepository.getProductById(item.id);
            lines.push({ ...item, max_stock: this._stockQty(p) });
        }
        return lines;
    }

    async updateCart(cart, productId, action) {
        const item = cart.find(item => item.id == productId);
        if (!item) return { cart };

        if (action === 'increase') {
            const product = await this.productRepository.getProductById(productId);
            const stock = this._stockQty(product);
            if (product && item.quantity < stock) {
                item.quantity++;
            } else {
                return { cart, error: 'Sản phẩm không đủ hàng' };
            }
        } else if (action === 'decrease') {
            if (item.quantity <= 1) {
                return {
                    cart,
                    error: 'Số lượng tối thiểu là 1. Nhấn biểu tượng thùng rác nếu muốn xóa sản phẩm khỏi giỏ.'
                };
            }
            item.quantity--;
        }
        return { cart };
    }

    removeFromCart(cart, productId) {
        return cart.filter(item => item.id != productId);
    }

    getCartSummary(cart) {
        const totalQty = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        return { cart, totalQty };
    }
}

module.exports = CartService;

