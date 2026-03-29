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
        this.router.get('/meta/price-range', this.wrap(this.getShopPriceRange));
        this.router.get('/:id/related', this.wrap(this.getRelated));
        this.router.get('/:id/reviews', this.wrap(this.getReviews));
        this.router.get('/:id', this.wrap(this.getProductById));
    }

    async getAllProducts(req, res) {
        const pageSize = Math.min(Math.max(parseInt(req.query.page_size, 10) || parseInt(req.query.limit, 10) || 12, 1), 48);
        let offset = parseInt(req.query.offset, 10);
        if (!Number.isFinite(offset) || offset < 0) {
            const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
            offset = (page - 1) * pageSize;
        }

        const sort = req.query.sort === 'price_asc' || req.query.sort === 'price_desc' ? req.query.sort : '';
        const keyword = req.query.keyword || '';
        const category_id = req.query.category_id || '';
        const type = req.query.type || '';
        const price_min = req.query.price_min;
        const price_max = req.query.price_max;

        const filters = {
            keyword: keyword.trim(),
            category_id,
            type,
            sort,
            limit: pageSize,
            offset,
            price_min,
            price_max
        };

        const [rows, total] = await Promise.all([
            this.productService.getShopCatalogProducts(filters),
            this.productService.countShopCatalogProducts(filters)
        ]);

        const items = rows.map((p) => this.productService.enrichShopProduct(p));
        const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
        const currentPage = Math.floor(offset / pageSize) + 1;

        return this.apiResponse.success(
            res,
            {
                items,
                total,
                page: currentPage,
                pageSize,
                totalPages,
                hasMore: offset + items.length < total
            },
            'Thành công',
            200
        );
    }

    async getShopPriceRange(req, res) {
        const bounds = await this.productService.getShopCatalogPriceBounds();
        return this.apiResponse.success(res, bounds, 'Thành công', 200);
    }

    async getProductById(req, res) {
        const raw = await this.productService.getProductById(req.params.id);
        if (!raw || raw.is_hidden) return this.apiResponse.error(res, "Product not found", 404);
        const product = this.productService.enrichProductDetail(raw);
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
