const AdminCouponRepository = require('../../repositories/Admin/AdminCouponRepository');

class AdminCouponService {
    constructor(repo = null) {
        this.repo = repo || new AdminCouponRepository();
    }

    async listCoupons(filters) {
        return this.repo.findCoupons(filters);
    }

    async countCoupons(filters) {
        return this.repo.countCoupons(filters);
    }

    async getCouponById(id) {
        return this.repo.findById(id);
    }

    async createCoupon(data) {
        const p = this._normalizePayload(data, false);
        const v = this.validateNormalized(p);
        if (!v.ok) {
            const err = new Error(v.message);
            err.statusCode = 400;
            throw err;
        }
        return this.repo.create(p);
    }

    async updateCoupon(id, data) {
        const p = this._normalizePayload(data, true);
        const v = this.validateNormalized(p);
        if (!v.ok) {
            const err = new Error(v.message);
            err.statusCode = 400;
            throw err;
        }
        return this.repo.update(id, p);
    }

    _normalizePayload(body, isEdit) {
        const code = String(body.code || '').trim().toUpperCase().slice(0, 50);
        const type = (body.type === 'shipping' ? 'shipping' : 'product');
        const discount_type = (body.discount_type === 'percent' ? 'percent' : 'fixed');
        const discount_value = Math.max(0, Math.round(Number(body.discount_value) || 0));
        const max_discount_amount = Math.max(0, Math.round(Number(body.max_discount_amount) || 0));
        const min_order_value = Math.max(0, Math.round(Number(body.min_order_value) || 0));
        let usage_limit = parseInt(body.usage_limit, 10);
        if (!Number.isFinite(usage_limit) || usage_limit < 1) usage_limit = 100;
        if (usage_limit > 999999999) usage_limit = 999999999;

        let expiration_date = null;
        if (body.expiration_date && String(body.expiration_date).trim()) {
            const d = String(body.expiration_date).trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(d)) expiration_date = d;
        }

        const is_active = body.is_active === '1' || body.is_active === 1 || body.is_active === true || body.is_active === 'on' ? 1 : 0;

        return {
            code,
            type,
            discount_type,
            discount_value,
            max_discount_amount,
            min_order_value,
            usage_limit,
            expiration_date,
            is_active
        };
    }

    async deleteCoupon(id) {
        return this.repo.deleteById(id);
    }

    /**
     * @param {object} p — đã normalize
     * @returns {{ ok: boolean, message?: string }}
     */
    validateNormalized(p) {
        if (!p.code || p.code.length < 2) {
            return { ok: false, message: 'Mã phải có ít nhất 2 ký tự.' };
        }
        if (p.type === 'product') {
            if (p.discount_type === 'percent') {
                if (p.discount_value < 1 || p.discount_value > 100) {
                    return { ok: false, message: 'Phần trăm giảm (sản phẩm) phải từ 1 đến 100.' };
                }
            } else if (p.discount_value < 1) {
                return { ok: false, message: 'Số tiền giảm cố định phải lớn hơn 0.' };
            }
        } else {
            if (p.discount_value < 1) {
                return { ok: false, message: 'Giá trị giảm phí vận chuyển phải lớn hơn 0.' };
            }
        }
        return { ok: true };
    }
}

module.exports = AdminCouponService;
