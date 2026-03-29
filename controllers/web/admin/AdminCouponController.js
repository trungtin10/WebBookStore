const express = require('express');
const AdminCouponService = require('../../../services/Admin/AdminCouponService');
const { requireAdmin } = require('../../../middleware/auth.middleware');

class AdminCouponController {
    constructor(adminCouponService = null) {
        this.router = express.Router();
        this.adminCouponService = adminCouponService || new AdminCouponService();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get('/', requireAdmin, this.getList.bind(this));
        this.router.get('/add', requireAdmin, this.getAddForm.bind(this));
        this.router.post('/add', requireAdmin, this.processAdd.bind(this));
        this.router.get('/edit/:id', requireAdmin, this.getEditForm.bind(this));
        this.router.post('/edit/:id', requireAdmin, this.processEdit.bind(this));
        this.router.get('/delete/:id', requireAdmin, this.deleteCoupon.bind(this));
    }

    async getList(req, res) {
        try {
            const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
            const limit = 15;
            const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.trim() : '';
            const filters = { keyword, limit, offset: (page - 1) * limit };
            const [coupons, total] = await Promise.all([
                this.adminCouponService.listCoupons(filters),
                this.adminCouponService.countCoupons({ keyword })
            ]);
            res.render('admin/coupons/coupon_list', {
                coupons,
                query: { keyword },
                currentPage: page,
                totalPages: Math.max(1, Math.ceil(total / limit))
            });
        } catch (err) {
            console.error(err);
            res.status(500).send('Lỗi tải danh sách mã giảm giá');
        }
    }

    getAddForm(req, res) {
        res.render('admin/coupons/coupon_add');
    }

    async processAdd(req, res) {
        try {
            await this.adminCouponService.createCoupon(req.body);
            return res.redirect('/admin/coupons?success=' + encodeURIComponent('Thêm mã giảm giá thành công'));
        } catch (err) {
            console.error(err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.redirect('/admin/coupons/add?error=' + encodeURIComponent('Mã này đã tồn tại.'));
            }
            const msg = err.statusCode === 400 && err.message ? err.message : 'Không thể thêm mã.';
            return res.redirect('/admin/coupons/add?error=' + encodeURIComponent(msg));
        }
    }

    async getEditForm(req, res) {
        try {
            const coupon = await this.adminCouponService.getCouponById(req.params.id);
            if (!coupon) return res.status(404).send('Không tìm thấy mã giảm giá');
            res.render('admin/coupons/coupon_edit', { coupon });
        } catch (err) {
            console.error(err);
            res.status(500).send('Lỗi server');
        }
    }

    async processEdit(req, res) {
        const id = req.params.id;
        try {
            await this.adminCouponService.updateCoupon(id, req.body);
            return res.redirect('/admin/coupons?success=' + encodeURIComponent('Cập nhật mã thành công'));
        } catch (err) {
            console.error(err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.redirect('/admin/coupons/edit/' + id + '?error=' + encodeURIComponent('Mã này đã tồn tại.'));
            }
            const msg = err.statusCode === 400 && err.message ? err.message : 'Không thể cập nhật mã.';
            return res.redirect('/admin/coupons/edit/' + id + '?error=' + encodeURIComponent(msg));
        }
    }

    async deleteCoupon(req, res) {
        try {
            await this.adminCouponService.deleteCoupon(req.params.id);
            return res.redirect('/admin/coupons?success=' + encodeURIComponent('Đã xóa mã giảm giá'));
        } catch (err) {
            console.error(err);
            res.status(500).send('Lỗi khi xóa mã');
        }
    }
}

module.exports = new AdminCouponController().router;
