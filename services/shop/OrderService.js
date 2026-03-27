const OrderRepository = require('../../repositories/shop/OrderRepository');
const ProductRepository = require('../../repositories/shop/ProductRepository');
const CouponRepository = require('../../repositories/shop/CouponRepository');
const NotificationRepository = require('../../repositories/core/NotificationRepository');

const { OrderStatus, Shipping } = require('../../constants');
const AdminOrderService = require('../Admin/AdminOrderService');

class OrderService {
    constructor(orderRepository = null, productRepository = null, couponRepository = null, notificationRepository = null, adminOrderService = null) {
        this.orderRepository = orderRepository || new OrderRepository();
        this.productRepository = productRepository || new ProductRepository();
        this.couponRepository = couponRepository || new CouponRepository();
        this.notificationRepository = notificationRepository || new NotificationRepository();
        this.adminOrderService = adminOrderService || new AdminOrderService();
    }

    async _validateAndEnrichItems(items) {
        if (!items?.length) throw new Error("Không có sản phẩm trong đơn hàng");

        let totalAmount = 0;
        for (const item of items) {
            const product = await this.productRepository.getProductById(item.id);
            if (!product) throw new Error(`Sản phẩm ${item.id} không tồn tại`);
            if (product.quantity < item.quantity) throw new Error(`Sản phẩm ${product.name} không đủ số lượng`);
            item.price = product.price;
            totalAmount += product.price * item.quantity;
        }
        return totalAmount;
    }

    _calculateShippingFee(totalAmount) {
        return totalAmount >= Shipping.FREE_SHIPPING_THRESHOLD ? 0 : Shipping.DEFAULT_FEE;
    }

    async _calculateCouponDiscount(couponCode, totalAmount) {
        if (!couponCode) return 0;

        const coupon = await this.couponRepository.getCouponByCode(couponCode);
        if (!coupon) throw new Error("Mã giảm giá không hợp lệ hoặc đã hết hạn!");
        if (totalAmount < coupon.min_order_value) {
            throw new Error(`Đơn hàng phải từ ${Number(coupon.min_order_value)}đ mới được áp dụng mã!`);
        }

        if (coupon.type !== 'product') return 0;

        let discount = coupon.discount_type === 'percent'
            ? (totalAmount * coupon.discount_value) / 100
            : coupon.discount_value;

        if (coupon.max_discount_amount > 0 && discount > coupon.max_discount_amount) {
            discount = coupon.max_discount_amount;
        }
        return Math.min(discount, totalAmount);
    }

    async _persistOrderAndItems(userId, totalAmount, shippingFee, productDiscount, shippingAddress, paymentMethod, items, couponCode) {
        const finalTotal = totalAmount + shippingFee - productDiscount;
        const orderData = {
            user_id: userId,
            total_money: totalAmount,
            shipping_fee: shippingFee,
            discount_amount: productDiscount,
            final_total: finalTotal,
            shipping_address: shippingAddress,
            status: OrderStatus.PENDING,
            payment_method: paymentMethod
        };

        const orderId = await this.orderRepository.createOrder(orderData);

        await Promise.all([
            ...items.map(item => this.orderRepository.addOrderDetail(orderId, item.id, item.price, item.quantity)),
            ...items.map(item => this.productRepository.updateStock(item.id, item.quantity))
        ]);

        if (couponCode) await this.couponRepository.updateUsage(couponCode);
        await this.notificationRepository.createNotification(userId, 'Đặt hàng thành công', `Đơn hàng #${orderId} của bạn đã được ghi nhận.`, 'success');

        return { orderId, finalTotal, paymentMethod };
    }

    async createOrder(userId, shippingAddress, paymentMethod, items, couponCode = null) {
        const totalAmount = await this._validateAndEnrichItems(items);
        const shippingFee = this._calculateShippingFee(totalAmount);
        const productDiscount = await this._calculateCouponDiscount(couponCode, totalAmount);

        return this._persistOrderAndItems(userId, totalAmount, shippingFee, productDiscount, shippingAddress, paymentMethod, items, couponCode);
    }

    async getOrderById(id) {
        return this.orderRepository.getOrderById(id);
    }

    async getOrderItems(orderId) {
        return this.orderRepository.getOrderItems(orderId);
    }

    async createOrderFromCheckout(userId, { items, totalAmount, shippingFee, productDiscount }, shippingAddress, paymentMethod) {
        await this._validateAndEnrichItems(items);
        return this._persistOrderAndItems(userId, totalAmount, shippingFee, productDiscount, shippingAddress, paymentMethod, items, null);
    }

    async getOrdersByUserId(userId) {
        return this.orderRepository.getOrdersByUserId(userId);
    }

    async updateOrderStatus(orderId, status) {
        await this.orderRepository.updateOrderStatus(orderId, status);
    }

    // ===== Admin features (proxy to AdminOrderService) =====
    async getFilteredOrders(filters = {}) {
        return this.adminOrderService.getFilteredOrders(filters);
    }

    async updatePaymentStatus(orderId, status) {
        return this.adminOrderService.updatePaymentStatus(orderId, status);
    }

    async deleteOrder(orderId) {
        return this.adminOrderService.deleteOrder(orderId);
    }

    async bulkDeleteOrders(orderIds) {
        return this.adminOrderService.bulkDeleteOrders(orderIds);
    }
}

module.exports = OrderService;

