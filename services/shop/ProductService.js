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

    async getProductById(id, options = {}) {
        return this.productRepository.getProductById(id, options);
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

    async getShopCatalogProducts(filters) {
        return this.productRepository.getShopCatalogProducts(filters);
    }

    async countShopCatalogProducts(filters) {
        return this.productRepository.countShopCatalogProducts(filters);
    }

    async getShopCatalogPriceBounds() {
        return this.productRepository.getShopCatalogPriceBounds();
    }

    enrichShopProduct(p) {
        const price = Number(p.price);
        const rawList = p.list_price;
        const list = rawList != null && rawList !== '' ? Number(rawList) : null;
        let discount_percent = null;
        if (list != null && !Number.isNaN(list) && list > price && price >= 0) {
            discount_percent = Math.min(99, Math.max(1, Math.round((1 - price / list) * 100)));
        }
        return {
            ...p,
            list_price: Number.isNaN(list) ? null : list,
            discount_percent,
            has_discount: discount_percent != null
        };
    }

    _resolveImageUrl(fn) {
        if (!fn) return null;
        const s = String(fn).trim();
        if (s.startsWith('http')) return s;
        return '/images/' + s.replace(/^\/+/, '');
    }

    /** Chuẩn hóa phản hồi API trang chi tiết: gallery URL, nhãn tồn kho, giá khuyến mãi */
    enrichProductDetail(raw) {
        if (!raw) return null;
        const base = this.enrichShopProduct(raw);
        const gallery = [];
        const main = this._resolveImageUrl(raw.image_url);
        if (main) gallery.push(main);
        if (raw.gallery_images) {
            try {
                const extra = typeof raw.gallery_images === 'string' ? JSON.parse(raw.gallery_images) : raw.gallery_images;
                if (Array.isArray(extra)) {
                    extra.forEach((fn) => {
                        const u = this._resolveImageUrl(fn);
                        if (u && !gallery.includes(u)) gallery.push(u);
                    });
                }
            } catch (e) {
                /* ignore */
            }
        }
        if (gallery.length === 0) gallery.push(main || '/images/default.jpg');
        const qty = Number(raw.quantity) || 0;
        return {
            ...base,
            gallery,
            stock_label: qty > 0 ? `Còn ${qty} cuốn` : 'Hết hàng'
        };
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

    async restoreProduct(id) {
        return this.adminProductService.restoreProduct(id);
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

