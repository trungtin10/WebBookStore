const AdminCategoryRepository = require('../../repositories/Admin/AdminCategoryRepository');

class AdminCategoryService {
    constructor(adminCategoryRepository = null) {
        this.adminCategoryRepository = adminCategoryRepository || new AdminCategoryRepository();
    }

    async createCategory(data) {
        return this.adminCategoryRepository.createCategory(data);
    }

    async updateCategory(id, data) {
        return this.adminCategoryRepository.updateCategory(id, data);
    }

    async deleteCategory(id) {
        return this.adminCategoryRepository.deleteCategory(id);
    }
}

module.exports = AdminCategoryService;
