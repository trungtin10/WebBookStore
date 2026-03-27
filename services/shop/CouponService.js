const CouponRepository = require('../../repositories/shop/CouponRepository');

class CouponService {
    constructor(couponRepository = null) {
        this.couponRepository = couponRepository || new CouponRepository();
    }

    async getAllActiveCoupons() {
        return this.couponRepository.getAllActiveCoupons();
    }

    async getCouponByCode(code) {
        return this.couponRepository.getCouponByCode(code);
    }
}

module.exports = CouponService;

