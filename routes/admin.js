const express = require('express');
const router = express.Router();
const Product = require('../apps/models/product');
const User = require('../apps/models/user');
const { requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// --- CẤU HÌNH UPLOAD ẢNH ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif)!"));
    }
});

// --- DASHBOARD ---
router.get('/admin', requireAdmin, (req, res) => {
    res.render('admin/index');
});

// --- QUẢN LÝ SẢN PHẨM ---
router.get('/admin/products', requireAdmin, async (req, res) => {
    try {
        const products = await Product.getAllProducts();
        res.render('admin/product_list', { products: products });
    } catch (err) {
        res.status(500).send("Lỗi lấy dữ liệu");
    }
});

router.get('/admin/products/add', requireAdmin, async (req, res) => {
    try {
        const categories = await Product.getCategories();
        res.render('admin/product_add', { categories: categories });
    } catch (err) {
        res.status(500).send("Lỗi lấy danh mục");
    }
});

router.post('/admin/products/add', requireAdmin, upload.single('image'), async (req, res) => {
    try {
        const data = req.body;
        if (req.file) {
            data.image_url = req.file.filename;
        } else {
            data.image_url = 'default.jpg';
        }
        await Product.createProduct(data);
        res.redirect('/admin/products');
    } catch (err) {
        res.status(500).send("Lỗi khi thêm sản phẩm: " + err.message);
    }
});

router.get('/admin/products/edit/:id', requireAdmin, async (req, res) => {
    try {
        const product = await Product.getProductById(req.params.id);
        const categories = await Product.getCategories();
        if (!product) return res.status(404).send("Không tìm thấy sản phẩm này");
        res.render('admin/product_edit', { product: product, categories: categories });
    } catch (err) {
        res.status(500).send("Lỗi server khi tìm sản phẩm");
    }
});

router.post('/admin/products/edit/:id', requireAdmin, upload.single('image'), async (req, res) => {
    try {
        const data = req.body;
        if (req.file) {
            data.image_url = req.file.filename;
        } else {
            data.image_url = req.body.old_image;
        }
        delete data.old_image;
        await Product.updateProduct(req.params.id, data);
        res.redirect('/admin/products');
    } catch (err) {
        res.status(500).send("Lỗi khi cập nhật: " + err.message);
    }
});

router.get('/admin/products/detail/:id', requireAdmin, async (req, res) => {
    try {
        const product = await Product.getProductById(req.params.id);
        if (!product) return res.status(404).send("Không tìm thấy sản phẩm này");
        res.render('admin/product_detail', { item: product });
    } catch (err) {
        res.status(500).send("Lỗi server khi tìm sản phẩm");
    }
});

router.get('/admin/products/delete/:id', requireAdmin, async (req, res) => {
    try {
        await Product.deleteProduct(req.params.id);
        res.redirect('/admin/products');
    } catch (err) {
        res.status(500).send("Lỗi khi xóa sản phẩm");
    }
});

// --- QUẢN LÝ USER ---
router.get('/admin/user', requireAdmin, async (req, res) => {
    try {
        const users = await User.getAllUsers();
        res.render('admin/user/user_list', { users: users });
    } catch (err) {
        res.status(500).send("Lỗi lấy danh sách user");
    }
});

router.get('/admin/user/add', requireAdmin, (req, res) => {
    res.render('admin/user/add');
});

router.post('/admin/user/add', requireAdmin, async (req, res) => {
    try {
        const existingUser = await User.getUserByUsername(req.body.username);
        if (existingUser) return res.send("Username đã tồn tại!");
        // Hàm addUser đã tự hash mật khẩu
        await User.addUser(req.body);
        res.redirect('/admin/user');
    } catch (err) {
        res.status(500).send("Lỗi khi thêm user");
    }
});

router.get('/admin/user/delete/:id', requireAdmin, async (req, res) => {
    try {
        await User.deleteUser(req.params.id);
        res.redirect('/admin/user');
    } catch (err) {
        res.status(500).send("Lỗi khi xóa user");
    }
});

module.exports = router;