const AdminProductRepository = require('../../repositories/Admin/AdminProductRepository');
const ProductRepository = require('../../repositories/shop/ProductRepository');

class AdminProductService {
    constructor(adminProductRepository = null, productRepository = null) {
        this.adminProductRepository = adminProductRepository || new AdminProductRepository();
        this.productRepository = productRepository || new ProductRepository();
    }

    async getAllProductsAdmin(filters) {
        return this.productRepository.getAllProducts(filters);
    }

    async countProducts(filters) {
        return this.productRepository.countProducts(filters);
    }

    async getTotalStockQuantity() {
        return this.productRepository.getTotalStockQuantity();
    }

    async createProduct(data) {
        return this.adminProductRepository.createProduct(data);
    }

    async updateProduct(id, data) {
        return this.adminProductRepository.updateProduct(id, data);
    }

    async deleteProduct(id) {
        return this.adminProductRepository.deleteProduct(id);
    }

    async importStock(id, quantityImport, note) {
        return this.adminProductRepository.importStock(id, quantityImport, note);
    }

    async exportStock(id, quantityExport, note) {
        return this.adminProductRepository.exportStock(id, quantityExport, note);
    }

    async getInventoryLogs(productId) {
        return this.adminProductRepository.getInventoryLogs(productId);
    }

    async getAllReviewsForAdmin() {
        return this.adminProductRepository.getAllReviewsForAdmin();
    }

    async updateReviewStatus(id, status) {
        return this.adminProductRepository.updateReviewStatus(id, status);
    }

    async deleteReview(id) {
        return this.adminProductRepository.deleteReview(id);
    }

    async addAdminReply(reviewId, replyText) {
        return this.adminProductRepository.addAdminReply(reviewId, replyText);
    }
}

module.exports = AdminProductService;
