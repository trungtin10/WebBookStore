const CategoryRepository = require('../../repositories/shop/CategoryRepository');

class CategoryService {
    constructor(categoryRepository = null) {
        this.categoryRepository = categoryRepository || new CategoryRepository();
    }

    async getAllCategories(filters = {}) {
        return this.categoryRepository.getAllCategories(filters);
    }

    async getCategoryById(id) {
        return this.categoryRepository.getCategoryById(id);
    }

    async countCategories(filters) {
        return this.categoryRepository.countCategories(filters);
    }
}

module.exports = CategoryService;

