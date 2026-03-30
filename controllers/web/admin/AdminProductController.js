const express = require('express');
const path = require('path');
const multer = require('multer');
const ProductService = require('../../../services/shop/ProductService');
const ProductValidator = require('../../../validators/ProductValidator');
const { finalizeProductImage } = require('../../../utils/productImageUpload');
const { requireAdmin } = require('../../../middleware/auth.middleware');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(process.cwd(), 'public', 'images'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = (file.originalname.match(/\.([^.]+)$/) || [])[1] || 'jpg';
        cb(null, 'product-' + uniqueSuffix + '.' + ext);
    }
});
const upload = multer({ storage });

class AdminProductController {
    constructor(productService = null, productValidator = null) {
        this.router = express.Router();
        this.productService = productService || new ProductService();
        this.productValidator = productValidator || new ProductValidator();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get('/', requireAdmin, this.getList.bind(this));
        this.router.get('/add', requireAdmin, this.getAddForm.bind(this));
        this.router.post('/add', requireAdmin, upload.single('image'), this.processAdd.bind(this));
        this.router.get('/edit/:id', requireAdmin, this.getEditForm.bind(this));
        this.router.post('/edit/:id', requireAdmin, upload.single('image'), this.processEdit.bind(this));
        this.router.get('/detail/:id', requireAdmin, this.getDetail.bind(this));
        this.router.get('/delete/:id', requireAdmin, this.deleteProduct.bind(this));
        this.router.get('/restore/:id', requireAdmin, this.restoreProduct.bind(this));
    }

    async getList(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const filters = {
                keyword: req.query.keyword || '',
                category_id: req.query.category_id || '',
                status: req.query.status || 'all',
                admin_list: true,
                show_deleted: req.query.deleted === '1' ? '1' : '0',
                limit,
                offset: (page - 1) * limit
            };

            const [products, totalProducts, categories] = await Promise.all([
                this.productService.getAllProductsAdmin(filters),
                this.productService.countProducts(filters),
                this.productService.getCategories()
            ]);

            res.render('admin/products/product_list', {
                products,
                categories,
                query: { ...filters, deleted: req.query.deleted === '1' ? '1' : '' },
                currentPage: page,
                totalPages: Math.ceil(totalProducts / limit)
            });
        } catch (err) {
            console.error(err);
            res.status(500).send("Lỗi lấy dữ liệu sản phẩm");
        }
    }

    async getAddForm(req, res) {
        try {
            const categories = await this.productService.getCategories();
            res.render('admin/products/product_add', { categories });
        } catch (err) {
            console.error(err);
            res.status(500).send("Lỗi lấy dữ liệu danh mục");
        }
    }

    async processAdd(req, res) {
        try {
            const validation = this.productValidator.validateProductCreate(req.body, !!req.file);
            if (!validation.valid) {
                return res.redirect('/admin/products/add?error=' + encodeURIComponent(validation.message));
            }

            const data = this.productValidator.parseProductData(req.body, null, false);
            if (req.file) data.image_url = await finalizeProductImage(req.file);
            await this.productService.createProduct(data);
            return res.redirect('/admin/products?success=' + encodeURIComponent('Thêm thành công'));
        } catch (err) {
            console.error(err);
            res.status(500).send("Lỗi khi thêm sản phẩm: " + err.message);
        }
    }

    async getEditForm(req, res) {
        try {
            const [product, categories] = await Promise.all([
                this.productService.getProductById(req.params.id, { includeDeleted: true }),
                this.productService.getCategories()
            ]);
            if (!product) return res.status(404).send("Không tìm thấy sản phẩm này");
            res.render('admin/products/product_edit', { product, categories });
        } catch (err) {
            console.error(err);
            res.status(500).send("Lỗi server khi tìm sản phẩm");
        }
    }

    async processEdit(req, res) {
        try {
            const validation = this.productValidator.validateProductUpdate(req.body);
            if (!validation.valid) {
                return res.redirect('/admin/products/edit/' + req.params.id + '?error=' + encodeURIComponent(validation.message));
            }

            const data = this.productValidator.parseProductData(req.body, req.file, true);
            if (req.file) data.image_url = await finalizeProductImage(req.file);
            await this.productService.updateProduct(req.params.id, data);
            return res.redirect('/admin/products?success=' + encodeURIComponent('Cập nhật thành công'));
        } catch (err) {
            console.error(err);
            res.status(500).send("Lỗi khi cập nhật: " + err.message);
        }
    }

    async getDetail(req, res) {
        try {
            const product = await this.productService.getProductById(req.params.id, { includeDeleted: true });
            if (!product) return res.status(404).send("Không tìm thấy sản phẩm này");
            res.render('admin/products/product_detail', { item: product });
        } catch (err) {
            console.error(err);
            res.status(500).send("Lỗi server khi tìm sản phẩm");
        }
    }

    async deleteProduct(req, res) {
        try {
            await this.productService.deleteProduct(req.params.id);
            const msg = encodeURIComponent('Đã ẩn sản phẩm khỏi cửa hàng (xóa mềm). Có thể khôi phục trong mục Đã xóa mềm.');
            return res.redirect('/admin/products?success=' + msg);
        } catch (err) {
            console.error(err);
            res.status(500).send(err.message || 'Lỗi khi xóa sản phẩm');
        }
    }

    async restoreProduct(req, res) {
        try {
            await this.productService.restoreProduct(req.params.id);
            const msg = encodeURIComponent('Đã khôi phục sản phẩm.');
            return res.redirect('/admin/products?deleted=1&success=' + msg);
        } catch (err) {
            console.error(err);
            res.status(500).send(err.message || 'Lỗi khi khôi phục sản phẩm');
        }
    }
}

module.exports = new AdminProductController().router;
