const express = require('express');
const CategoryService = require('../../../services/shop/CategoryService');
const AdminCategoryService = require('../../../services/Admin/AdminCategoryService');
const CategoryValidator = require('../../../validators/CategoryValidator');
const { requireAdmin } = require('../../../middleware/auth.middleware');

class AdminCategoryController {
    constructor(categoryService = null, adminCategoryService = null, categoryValidator = null) {
        this.router = express.Router();
        this.categoryService = categoryService || new CategoryService();
        this.adminCategoryService = adminCategoryService || new AdminCategoryService();
        this.categoryValidator = categoryValidator || new CategoryValidator();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get('/', requireAdmin, this.getList.bind(this));
        this.router.get('/add', requireAdmin, this.getAddForm.bind(this));
        this.router.post('/add', requireAdmin, this.processAdd.bind(this));
        this.router.get('/edit/:id', requireAdmin, this.getEditForm.bind(this));
        this.router.post('/edit/:id', requireAdmin, this.processEdit.bind(this));
        this.router.get('/delete/:id', requireAdmin, this.deleteCategory.bind(this));
    }

    async getList(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const filters = {
                keyword: req.query.keyword || '',
                limit,
                offset: (page - 1) * limit
            };

            const [categories, totalCategories] = await Promise.all([
                this.categoryService.getAllCategories(filters),
                this.categoryService.countCategories(filters)
            ]);

            res.render('admin/categories/category_list', {
                categories,
                query: filters,
                currentPage: page,
                totalPages: Math.ceil(totalCategories / limit)
            });
        } catch (err) {
            console.error(err);
            res.status(500).send("Lỗi lấy dữ liệu danh mục");
        }
    }

    getAddForm(req, res) {
        res.render('admin/categories/category_add');
    }

    async processAdd(req, res) {
        try {
            const validation = this.categoryValidator.validateName(req.body.name);
            if (!validation.valid) {
                return res.redirect('/admin/categories/add?error=' + encodeURIComponent(validation.message));
            }
            await this.adminCategoryService.createCategory(req.body);
            return res.redirect('/admin/categories?success=' + encodeURIComponent('Thêm danh mục thành công'));
        } catch (err) {
            console.error(err);
            res.status(500).send("Lỗi khi thêm danh mục: " + err.message);
        }
    }

    async getEditForm(req, res) {
        try {
            const category = await this.categoryService.getCategoryById(req.params.id);
            if (!category) return res.status(404).send("Không tìm thấy danh mục này");
            res.render('admin/categories/category_edit', { category });
        } catch (err) {
            console.error(err);
            res.status(500).send("Lỗi server khi tìm danh mục");
        }
    }

    async processEdit(req, res) {
        try {
            const validation = this.categoryValidator.validateName(req.body.name);
            if (!validation.valid) {
                return res.redirect('/admin/categories/edit/' + req.params.id + '?error=' + encodeURIComponent(validation.message));
            }
            await this.adminCategoryService.updateCategory(req.params.id, req.body);
            return res.redirect('/admin/categories?success=' + encodeURIComponent('Cập nhật danh mục thành công'));
        } catch (err) {
            console.error(err);
            res.status(500).send("Lỗi khi cập nhật danh mục: " + err.message);
        }
    }

    async deleteCategory(req, res) {
        try {
            await this.adminCategoryService.deleteCategory(req.params.id);
            return res.redirect('/admin/categories?success=' + encodeURIComponent('Xóa danh mục thành công'));
        } catch (err) {
            console.error(err);
            if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.redirect('/admin/categories?error=' + encodeURIComponent('Không thể xóa danh mục này vì đang có sản phẩm thuộc danh mục.'));
            } else {
                res.status(500).send("Lỗi khi xóa danh mục");
            }
        }
    }
}

module.exports = new AdminCategoryController().router;
