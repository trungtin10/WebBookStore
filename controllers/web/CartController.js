const express = require('express');
const CartService = require('../../services/shop/CartService');

class CartController {
    constructor(cartService = null) {
        this.router = express.Router();
        this.cartService = cartService || new CartService();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get('/cart', this.viewCart.bind(this));
        this.router.post('/cart/add/:id', this.addToCart.bind(this));
        this.router.get('/cart/update/:id', this.updateCart.bind(this));
        this.router.get('/cart/remove/:id', this.removeFromCart.bind(this));
        this.router.get('/cart-data', this.getCartData.bind(this));
    }

    viewCart(req, res) {
        res.render('cart/cart', { error: req.query.error });
    }

    async addToCart(req, res) {
        const quantity = Number(req.body.quantity);
        if (!Number.isInteger(quantity) || quantity <= 0) {
            return res.status(400).json({ success: false, message: "Số lượng phải là số nguyên dương lớn hơn 0" });
        }

        try {
            let cart = req.cart || [];
            const result = await this.cartService.addToCart(cart, req.params.id, quantity);
            if (!result.success) {
                return res.status(result.message.includes('không tồn tại') ? 404 : 400).json({ success: false, message: result.message });
            }

            const cookieName = res.locals.user ? `cart_${res.locals.user.id}` : 'cart_guest';
            res.cookie(cookieName, JSON.stringify(result.cart), { maxAge: 24 * 60 * 60 * 1000, path: '/' });
            const { totalQty } = this.cartService.getCartSummary(result.cart);
            res.json({
                success: true,
                message: 'Thêm vào giỏ hàng thành công!',
                cart: result.cart,
                totalQty
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: "Lỗi server" });
        }
    }

    async updateCart(req, res) {
        const action = req.query.action;
        const wantJson = req.query.format === 'json' || (req.get('Accept') || '').includes('application/json');

        if (action !== 'increase' && action !== 'decrease') {
            if (wantJson) {
                return res.status(400).json({ success: false, message: 'Thao tác không hợp lệ' });
            }
            return res.redirect('/cart?error=' + encodeURIComponent('Thao tác không hợp lệ'));
        }

        let cart = req.cart || [];
        const result = await this.cartService.updateCart(cart, req.params.id, action);

        const cookieName = res.locals.user ? `cart_${res.locals.user.id}` : 'cart_guest';
        res.cookie(cookieName, JSON.stringify(result.cart), { maxAge: 24 * 60 * 60 * 1000, path: '/' });
        const { totalQty } = this.cartService.getCartSummary(result.cart);

        if (wantJson) {
            if (result.error) {
                return res.status(400).json({
                    success: false,
                    message: result.error,
                    cart: await this.cartService.enrichCartLines(result.cart),
                    totalQty
                });
            }
            return res.json({
                success: true,
                cart: await this.cartService.enrichCartLines(result.cart),
                totalQty
            });
        }

        if (result.error) {
            return res.redirect('/cart?error=' + encodeURIComponent(result.error));
        }

        res.redirect('/cart');
    }

    removeFromCart(req, res) {
        let cart = req.cart || [];
        cart = this.cartService.removeFromCart(cart, req.params.id);

        const cookieName = res.locals.user ? `cart_${res.locals.user.id}` : 'cart_guest';
        res.cookie(cookieName, JSON.stringify(cart), { maxAge: 24 * 60 * 60 * 1000, path: '/' });
        res.redirect('/cart');
    }

    async getCartData(req, res) {
        try {
            const cart = req.cart || [];
            const enriched = await this.cartService.enrichCartLines(cart);
            const { totalQty } = this.cartService.getCartSummary(cart);
            res.json({ success: true, cart: enriched, totalQty });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    }
}

module.exports = new CartController().router;
