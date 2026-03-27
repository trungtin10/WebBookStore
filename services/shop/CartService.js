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
        if (product.quantity < quantity) return { success: false, message: "Sản phẩm không đủ hàng" };

        const existingItem = cart.find(item => item.id == productId);
        if (existingItem) {
            if (product.quantity < existingItem.quantity + quantity) {
                return { success: false, message: "Sản phẩm không đủ hàng" };
            }
            existingItem.quantity += quantity;
        } else {
            cart.push({ id: product.id, name: product.name, price: product.price, image_url: product.image_url, quantity });
        }
        return { success: true, cart };
    }

    async updateCart(cart, productId, action) {
        const item = cart.find(item => item.id == productId);
        if (!item) return { cart };

        if (action === 'increase') {
            const product = await this.productRepository.getProductById(productId);
            if (product && item.quantity < product.quantity) {
                item.quantity++;
            } else {
                return { cart, error: 'Sản phẩm không đủ hàng' };
            }
        } else if (action === 'decrease') {
            item.quantity--;
            if (item.quantity <= 0) {
                return { cart: cart.filter(i => i.id != productId) };
            }
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

