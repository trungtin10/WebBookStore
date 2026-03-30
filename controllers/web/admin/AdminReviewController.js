const express = require('express');
const ProductService = require('../../../services/shop/ProductService');
const { requireAdmin } = require('../../../middleware/auth.middleware');

class AdminReviewController {
    constructor(productService = null) {
        this.router = express.Router();
        this.productService = productService || new ProductService();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get('/', requireAdmin, this.getList.bind(this));
        this.router.get('/approve/:id', requireAdmin, this.approve.bind(this));
        this.router.post('/reply', requireAdmin, this.processReply.bind(this));
        this.router.get('/delete-reply/:id', requireAdmin, this.deleteReply.bind(this));
        this.router.get('/delete/:id', requireAdmin, this.deleteReview.bind(this));
    }

    async getList(req, res) {
        try {
            const reviews = await this.productService.getAllReviewsForAdmin();
            res.render('admin/reviews/review_list', { reviews });
        } catch (err) {
            res.status(500).send("Lỗi lấy danh sách đánh giá");
        }
    }

    async approve(req, res) {
        try {
            await this.productService.updateReviewStatus(req.params.id, 'APPROVED');
            return res.redirect('/admin/reviews?success=' + encodeURIComponent('Duyệt đánh giá thành công'));
        } catch (err) {
            res.status(500).send("Lỗi duyệt đánh giá");
        }
    }

    async processReply(req, res) {
        try {
            const { review_id, reply_content } = req.body;
            await this.productService.addAdminReply(review_id, reply_content);
            return res.redirect('/admin/reviews?success=' + encodeURIComponent('Trả lời đánh giá thành công'));
        } catch (err) {
            res.status(500).send("Lỗi khi trả lời đánh giá");
        }
    }

    async deleteReply(req, res) {
        try {
            await this.productService.addAdminReply(req.params.id, null);
            return res.redirect('/admin/reviews?success=' + encodeURIComponent('Xóa trả lời thành công'));
        } catch (err) {
            res.status(500).send("Lỗi khi xóa trả lời");
        }
    }

    async deleteReview(req, res) {
        try {
            await this.productService.deleteReview(req.params.id);
            return res.redirect('/admin/reviews?success=' + encodeURIComponent('Xóa đánh giá thành công'));
        } catch (err) {
            res.status(500).send("Lỗi xóa đánh giá");
        }
    }
}

module.exports = new AdminReviewController().router;
