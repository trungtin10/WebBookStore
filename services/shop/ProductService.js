const ProductRepository = require('../../repositories/shop/ProductRepository');
const CategoryRepository = require('../../repositories/shop/CategoryRepository');
const AdminProductService = require('../Admin/AdminProductService');

class ProductService {
    constructor(productRepository = null, categoryRepository = null, adminProductService = null) {
        this.productRepository = productRepository || new ProductRepository();
        this.categoryRepository = categoryRepository || new CategoryRepository();
        this.adminProductService = adminProductService || new AdminProductService();
    }

    async getAllProducts(filters = {}) {
        return this.productRepository.getAllProducts(filters);
    }

    async getProductById(id) {
        return this.productRepository.getProductById(id);
    }

    async getProductDetails(productId) {
        const product = await this.productRepository.getProductById(productId);
        if (!product) {
            throw new Error("Sản phẩm không tồn tại");
        }

        const relatedProducts = await this.productRepository.getProductsByCategory(product.category_id || 1);
        const reviews = await this.productRepository.getReviews(productId);

        return {
            product,
            relatedProducts,
            reviews
        };
    }

    async search(keyword) {
        if (!keyword || keyword.trim() === "") {
            throw new Error("Vui lòng nhập từ khóa để tìm kiếm");
        }
        return this.productRepository.searchProducts(keyword.trim());
    }

    async getProductsByType(type) {
        if (type === 'best-sellers') return this.productRepository.getBestSellers();
        if (type === 'new-arrivals') return this.productRepository.getNewArrivals();
        if (type === 'on-sale') return this.productRepository.getOnSaleProducts();
        return null;
    }

    async getProductsByCategory(categoryId) {
        const products = await this.productRepository.getProductsByCategory(categoryId);
        const categoryName = await this.categoryRepository.getCategoryName(categoryId);

        return {
            categoryName,
            products
        };
    }

    async getRelatedProducts(productId, categoryId) {
        return this.productRepository.getRelatedProducts(productId, categoryId || 0);
    }

    async getReviews(productId) {
        return this.productRepository.getReviews(productId);
    }

    async addReview(userId, productId, rating, comment) {
        if (!rating || rating < 1 || rating > 5) {
            throw new Error("Đánh giá không hợp lệ");
        }
        return this.productRepository.addReview(userId, productId, rating, comment);
    }

    async getCategories() {
        return this.productRepository.getCategories();
    }

    // ===== Admin features (proxy to AdminProductService) =====
    async getAllProductsAdmin(filters = {}) {
        return this.adminProductService.getAllProductsAdmin(filters);
    }

    async countProducts(filters = {}) {
        return this.adminProductService.countProducts(filters);
    }

    async getTotalStockQuantity() {
        return this.adminProductService.getTotalStockQuantity();
    }

    async createProduct(data) {
        return this.adminProductService.createProduct(data);
    }

    async updateProduct(id, data) {
        return this.adminProductService.updateProduct(id, data);
    }

    async deleteProduct(id) {
        return this.adminProductService.deleteProduct(id);
    }

    async importStock(id, quantityImport, note) {
        return this.adminProductService.importStock(id, quantityImport, note);
    }

    async exportStock(id, quantityExport, note) {
        return this.adminProductService.exportStock(id, quantityExport, note);
    }

    async getInventoryLogs(productId) {
        return this.adminProductService.getInventoryLogs(productId);
    }

    async getAllReviewsForAdmin() {
        return this.adminProductService.getAllReviewsForAdmin();
    }

    async updateReviewStatus(id, status) {
        return this.adminProductService.updateReviewStatus(id, status);
    }

    async deleteReview(id) {
        return this.adminProductService.deleteReview(id);
    }

    async addAdminReply(reviewId, replyText) {
        return this.adminProductService.addAdminReply(reviewId, replyText);
    }
}

module.exports = ProductService;

