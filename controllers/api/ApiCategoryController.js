const BaseApiController = require('./BaseApiController');
const CategoryService = require('../../services/shop/CategoryService');

class ApiCategoryController extends BaseApiController {
    constructor(categoryService = null) {
        super();
        this.categoryService = categoryService || new CategoryService();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get('/', this.wrap(this.getAll));
        this.router.get('/:id', this.wrap(this.getById));
    }

    async getAll(req, res) {
        const categories = await this.categoryService.getAllCategories({});
        return this.apiResponse.success(res, categories, 'Thành công', 200);
    }

    async getById(req, res) {
        const category = await this.categoryService.getCategoryById(req.params.id);
        if (!category) return this.apiResponse.error(res, "Category not found", 404);
        return this.apiResponse.success(res, category, 'Thành công', 200);
    }
}

module.exports = new ApiCategoryController().router;
