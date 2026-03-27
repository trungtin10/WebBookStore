const express = require('express');
const OrderService = require('../../services/shop/OrderService');
const NotificationService = require('../../services/core/NotificationService');
const { requireLogin } = require('../../middleware/auth.middleware');

class OrderController {
    constructor(orderService = null, notificationService = null) {
        this.router = express.Router();
        this.orderService = orderService || new OrderService();
        this.notificationService = notificationService || new NotificationService();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.post('/checkout', this.processCheckout.bind(this));
        this.router.get('/checkout', this.showCheckout.bind(this));
        this.router.post('/order', this.createOrder.bind(this));
        this.router.get('/order/success/:id', this.showOrderSuccess.bind(this));
        this.router.get('/orders', this.getOrderHistory.bind(this));
        this.router.post('/payment/confirm', this.processPayment.bind(this));
    }

    processCheckout(req, res) {
        if (!res.locals.user) return res.redirect('/?loginError=' + encodeURIComponent('Vui lòng đăng nhập') + '&returnUrl=/cart');

        const selectedIds = req.body.selected_items;
        let cart = req.cart || [];
        if (!selectedIds || selectedIds.length === 0) return res.redirect('/cart');

        const checkoutItems = cart.filter(item => selectedIds.includes(item.id.toString()));
        const totalAmount = checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const productDiscount = parseFloat(req.body.product_discount) || 0;
        const shippingFee = totalAmount > 500000 ? 0 : 30000;

        res.cookie('checkoutData', JSON.stringify({ items: checkoutItems, totalAmount, productDiscount, shippingFee }), { maxAge: 10 * 60 * 1000 });
        res.redirect('/checkout');
    }

    showCheckout(req, res) {
        if (!res.locals.user) return res.redirect('/?loginError=' + encodeURIComponent('Vui lòng đăng nhập') + '&returnUrl=/cart');

        let checkoutData = {};
        if (req.cookies.checkoutData) {
            try { checkoutData = JSON.parse(req.cookies.checkoutData); } catch (e) { }
        }
        if (!checkoutData.items || checkoutData.items.length === 0) return res.redirect('/cart');

        res.render('checkout/checkout', {
            cart: checkoutData.items,
            totalAmount: checkoutData.totalAmount,
            productDiscount: checkoutData.productDiscount,
            shippingFee: checkoutData.shippingFee
        });
    }

    async createOrder(req, res) {
        if (!res.locals.user) return res.redirect('/?loginError=' + encodeURIComponent('Vui lòng đăng nhập'));
        if (res.locals.user.role === 'admin') return res.status(403).send("Admin không thể đặt hàng!");

        let checkoutData = {};
        if (req.cookies.checkoutData) {
            try { checkoutData = JSON.parse(req.cookies.checkoutData); } catch (e) { }
        }
        if (!checkoutData.items || checkoutData.items.length === 0) return res.redirect('/cart');

        const { full_name, phone, email, address, note, payment_method } = req.body;
        const shippingAddress = `${full_name}, ${phone}, ${address} (${note})`;

        try {
            const { orderId, finalTotal, paymentMethod } = await this.orderService.createOrderFromCheckout(
                res.locals.user.id,
                checkoutData,
                shippingAddress,
                payment_method
            );

            let cart = req.cart || [];
            const boughtIds = checkoutData.items.map(item => item.id);
            cart = cart.filter(item => !boughtIds.includes(item.id));
            const cartCookieName = res.locals.user ? `cart_${res.locals.user.id}` : 'cart_guest';
            res.cookie(cartCookieName, JSON.stringify(cart), { maxAge: 24 * 60 * 60 * 1000 });
            res.clearCookie('checkoutData');

            if (paymentMethod === 'MOMO' || paymentMethod === 'VNPAY') {
                return res.render('payments/payment_gateway', { orderId, amount: finalTotal, method: paymentMethod });
            }
            res.redirect(`/order/success/${orderId}`);
        } catch (err) {
            console.error(err);
            res.status(500).send("Lỗi khi đặt hàng");
        }
    }

    showOrderSuccess(req, res) {
        if (!res.locals.user) return res.redirect('/');
        res.render('orders/order_success', { orderId: req.params.id });
    }

    async getOrderHistory(req, res) {
        if (!res.locals.user) return res.redirect('/?loginError=' + encodeURIComponent('Vui lòng đăng nhập'));
        try {
            const orders = await this.orderService.getOrdersByUserId(res.locals.user.id);
            res.render('orders/order_history', { orders });
        } catch (err) {
            console.error(err);
            res.status(500).send("Lỗi lấy lịch sử đơn hàng");
        }
    }

    async processPayment(req, res) {
        const { orderId, status } = req.body;
        const userId = res.locals.user ? res.locals.user.id : null;

        try {
            if (status === 'SUCCESS') {
                if (userId) await this.notificationService.createNotification(userId, 'Đơn hàng đã được xác nhận', `Đơn hàng #${orderId} của bạn đã được hệ thống ghi nhận thành công.`, 'success');
                res.redirect(`/order/success/${orderId}`);
            } else {
                await this.orderService.updateOrderStatus(orderId, 'CANCELLED');
                if (userId) await this.notificationService.createNotification(userId, 'Thanh toán thất bại', `Đơn hàng #${orderId} đã bị hủy do thanh toán thất bại.`, 'danger');
                res.redirect('/?error=' + encodeURIComponent(`Thanh toán thất bại! Đơn hàng #${orderId} đã bị hủy.`));
            }
        } catch (err) {
            console.error(err);
            res.status(500).send("Lỗi xử lý thanh toán");
        }
    }
}

module.exports = new OrderController().router;
