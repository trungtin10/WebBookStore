const express = require('express');
const ProductService = require('../../services/shop/ProductService');

class ProductController {
    constructor(productService = null) {
        this.router = express.Router();
        this.productService = productService || new ProductService();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get('/search', this.search.bind(this));
        this.router.get('/product/:id', this.getProductDetail.bind(this));
        this.router.post('/product/:id/review', this.addReview.bind(this));
        this.router.get('/category/:id', this.getByCategory.bind(this));
        this.router.get('/best-sellers', this.getBestSellers.bind(this));
        this.router.get('/new-arrivals', this.getNewArrivals.bind(this));
        this.router.get('/on-sale', this.getOnSale.bind(this));
    }

    search(req, res) {
        const keyword = req.query.q || "";
        res.render('products/product', { pageType: 'search', title: keyword ? `Kết quả tìm kiếm: "${keyword}"` : "Tất cả sản phẩm", keyword });
    }

    getProductDetail(req, res) {
        const productId = req.params.id;
        const canReview = res.locals.user && res.locals.user.role !== 'admin';
        res.render('products/product_detail', { productId, canReview });
    }

    async addReview(req, res) {
        if (!res.locals.user) return res.redirect('/?loginError=' + encodeURIComponent('Vui lòng đăng nhập để đánh giá'));
        if (res.locals.user.role === 'admin') return res.status(403).send("Admin không thể đánh giá!");

        try {
            const { rating, comment } = req.body;
            await this.productService.addReview(res.locals.user.id, req.params.id, rating, comment);
            return res.redirect('/product/' + req.params.id + '?success=' + encodeURIComponent('Đánh giá đã gửi và đang chờ duyệt!'));
        } catch (err) {
            console.error(err);
            res.status(500).send("Lỗi khi gửi đánh giá");
        }
    }

    getByCategory(req, res) {
        res.render('products/product', { pageType: 'category', categoryId: req.params.id, title: 'Danh mục' });
    }

    getBestSellers(req, res) {
        res.render('products/product', { pageType: 'best-sellers', title: 'Sách Bán Chạy Nhất' });
    }

    getNewArrivals(req, res) {
        res.render('products/product', { pageType: 'new-arrivals', title: 'Sách Mới Phát Hành' });
    }

    getOnSale(req, res) {
        res.render('products/product', { pageType: 'on-sale', title: 'Sách Đang Khuyến Mãi' });
    }
}

module.exports = new ProductController().router;
