const express = require('express');
const ProductService = require('../../../services/shop/ProductService');
const CategoryService = require('../../../services/shop/CategoryService');
const { requireAdmin } = require('../../../middleware/auth.middleware');
const { Stock } = require('../../../constants');

class AdminInventoryController {
    constructor(productService = null, categoryService = null) {
        this.router = express.Router();
        this.productService = productService || new ProductService();
        this.categoryService = categoryService || new CategoryService();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get('/', requireAdmin, this.getList.bind(this));
        this.router.post('/import', requireAdmin, this.processImport.bind(this));
        this.router.post('/export', requireAdmin, this.processExport.bind(this));
        this.router.get('/logs/:id', requireAdmin, this.getLogs.bind(this));
    }

    async getList(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const filters = {
                keyword: req.query.keyword || '',
                category_id: req.query.category_id || '',
                stock_status: req.query.stock_status || 'all',
                limit,
                offset: (page - 1) * limit
            };

            const [products, totalProductsFiltered, categories, totalProducts, lowStockProducts, lowStockWarningCount] =
                await Promise.all([
                    this.productService.getAllProductsAdmin(filters),
                    this.productService.countProducts(filters),
                    this.productService.getCategories(),
                    this.productService.getTotalStockQuantity(),
                    this.productService.countProducts({ stock_status: 'low' }),
                    this.productService.countProducts({ stock_status: 'below_threshold' })
                ]);

            res.render('admin/inventory/inventory_list', {
                products,
                categories,
                query: filters,
                currentPage: page,
                totalPages: Math.ceil(totalProductsFiltered / limit),
                totalProducts,
                lowStockProducts,
                lowStockWarningCount,
                stockLowThreshold: Stock.LOW_THRESHOLD
            });
        } catch (err) {
            console.error(err);
            res.status(500).send("Lỗi lấy dữ liệu kho");
        }
    }

    async processImport(req, res) {
        try {
            const { product_id, quantity, note } = req.body;
            await this.productService.importStock(product_id, parseInt(quantity), note);
            return res.redirect('/admin/inventory?success=' + encodeURIComponent('Nhập kho thành công'));
        } catch (err) {
            console.error(err);
            res.status(500).send("Lỗi nhập kho");
        }
    }

    async processExport(req, res) {
        try {
            const { product_id, quantity, note } = req.body;
            await this.productService.exportStock(product_id, parseInt(quantity), note);
            return res.redirect('/admin/inventory?success=' + encodeURIComponent('Xuất kho thành công'));
        } catch (err) {
            console.error(err);
            return res.redirect('/admin/inventory?error=' + encodeURIComponent(err.message || 'Lỗi xuất kho'));
        }
    }

    async getLogs(req, res) {
        try {
            const logs = await this.productService.getInventoryLogs(req.params.id);
            res.json({ success: true, data: logs });
        } catch (err) {
            res.status(500).json({ success: false, message: "Lỗi lấy lịch sử" });
        }
    }
}

module.exports = new AdminInventoryController().router;
