const BaseApiController = require('./BaseApiController');
const ProductService = require('../../services/shop/ProductService');

class ApiProductController extends BaseApiController {
    constructor(productService = null) {
        super();
        this.productService = productService || new ProductService();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get('/', this.wrap(this.getAllProducts));
        this.router.get('/:id/related', this.wrap(this.getRelated));
        this.router.get('/:id/reviews', this.wrap(this.getReviews));
        this.router.get('/:id', this.wrap(this.getProductById));
    }

    async getAllProducts(req, res) {
        const filters = { status: 'visible' };
        const { keyword, category_id, type } = req.query;
        if (keyword) filters.keyword = keyword;
        if (category_id) filters.category_id = category_id;
        if (req.query.limit) filters.limit = req.query.limit;
        if (req.query.offset) filters.offset = req.query.offset;

        let products = [];
        const byType = await this.productService.getProductsByType(type);
        if (byType) {
            products = byType;
        } else if (keyword) {
            products = await this.productService.search(keyword);
        } else {
            products = await this.productService.getAllProducts(filters);
        }

        return this.apiResponse.success(res, products, 'Thành công', 200);
    }

    async getProductById(req, res) {
        const product = await this.productService.getProductById(req.params.id);
        if (!product || product.is_hidden) return this.apiResponse.error(res, "Product not found", 404);
        return this.apiResponse.success(res, product, 'Thành công', 200);
    }

    async getRelated(req, res) {
        const product = await this.productService.getProductById(req.params.id);
        if (!product) return this.apiResponse.error(res, "Product not found", 404);
        const related = await this.productService.getRelatedProducts(req.params.id, product.category_id || 0);
        return this.apiResponse.success(res, related, 'Thành công', 200);
    }

    async getReviews(req, res) {
        const reviews = await this.productService.getReviews(req.params.id);
        return this.apiResponse.success(res, reviews, 'Thành công', 200);
    }
}

module.exports = new ApiProductController().router;
