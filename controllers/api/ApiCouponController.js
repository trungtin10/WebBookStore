const BaseApiController = require('./BaseApiController');
const CouponService = require('../../services/shop/CouponService');

class ApiCouponController extends BaseApiController {
    constructor(couponService = null) {
        super();
        this.couponService = couponService || new CouponService();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get('/coupons', this.wrap(this.getAllCoupons));
        this.router.post('/coupon/check', this.wrap(this.checkCoupon));
    }

    async getAllCoupons(req, res) {
        const coupons = await this.couponService.getAllActiveCoupons();
        const productCoupons = coupons.filter(c => c.type && c.type.toLowerCase() === 'product');
        const shippingCoupons = coupons.filter(c => c.type && c.type.toLowerCase() === 'shipping');
        return this.apiResponse.success(res, { product: productCoupons, shipping: shippingCoupons }, 'Thành công', 200);
    }

    async checkCoupon(req, res) {
        const { code, totalAmount, shippingFee = 30000 } = req.body;
        const coupon = await this.couponService.getCouponByCode(code);
        if (!coupon) return this.apiResponse.error(res, "Mã không hợp lệ hoặc đã hết hạn!", 400);
        if (totalAmount < coupon.min_order_value) {
            return this.apiResponse.error(res, `Đơn hàng phải từ ${Number(coupon.min_order_value).toLocaleString('vi-VN')}đ mới được áp dụng!`, 400);
        }

        let discount = 0;
        let message = "";
        if (coupon.type === 'product') {
            if (coupon.discount_type === 'percent') {
                discount = (totalAmount * coupon.discount_value) / 100;
                if (coupon.max_discount_amount > 0 && discount > coupon.max_discount_amount) discount = coupon.max_discount_amount;
            } else {
                discount = coupon.discount_value;
            }
            if (discount > totalAmount) discount = totalAmount;
            message = "Áp dụng mã giảm giá sản phẩm thành công!";
        } else if (coupon.type === 'shipping') {
            discount = coupon.discount_value;
            if (discount > shippingFee) discount = shippingFee;
            message = "Áp dụng mã Freeship thành công!";
        }

        return this.apiResponse.success(res, { discount, type: coupon.type, code: coupon.code }, message, 200);
    }
}

module.exports = new ApiCouponController().router;
