const express = require('express');
const router = express.Router();
const Product = require('../apps/models/product');
const User = require('../apps/models/user');
const { requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

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
        if (mimetype && extname) return cb(null, true);
        cb(new Error("Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif)!"));
    }
});

router.get('/admin', requireAdmin, (req, res) => {
    res.render('admin/index');
});

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
        const authors = await Product.getAuthors();
        const publishers = await Product.getPublishers();
        res.render('admin/product_add', {
            categories: categories,
            authors: authors,
            publishers: publishers
        });
    } catch (err) {
        res.status(500).send("Lỗi lấy dữ liệu danh mục/tác giả");
    }
});

router.post('/admin/products/add', requireAdmin, upload.single('image'), async (req, res) => {
    try {
        const data = req.body;
        if (req.file) data.image_url = req.file.filename;
        else data.image_url = 'default.jpg';

        // Xử lý dữ liệu số an toàn
        data.price = parseInt(data.price) || 0;
        data.quantity = parseInt(data.quantity) || 0;
        data.pages = data.pages ? parseInt(data.pages) : null;
        data.publication_year = data.publication_year ? parseInt(data.publication_year) : null;

        // Quan trọng: Nếu không chọn (value rỗng hoặc 0), gán là NULL để tránh lỗi khóa ngoại
        data.publisher_id = (data.publisher_id && parseInt(data.publisher_id) > 0) ? parseInt(data.publisher_id) : null;
        data.author_id = (data.author_id && parseInt(data.author_id) > 0) ? parseInt(data.author_id) : null;
        data.category_id = (data.category_id && parseInt(data.category_id) > 0) ? parseInt(data.category_id) : null;

        await Product.createProduct(data);
        res.redirect('/admin/products');
    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi khi thêm sản phẩm: " + err.message);
    }
});

router.get('/admin/products/edit/:id', requireAdmin, async (req, res) => {
    try {
        const product = await Product.getProductById(req.params.id);
        const categories = await Product.getCategories();
        const authors = await Product.getAuthors();
        const publishers = await Product.getPublishers();

        if (!product) return res.status(404).send("Không tìm thấy sản phẩm này");

        res.render('admin/product_edit', {
            product: product,
            categories: categories,
            authors: authors,
            publishers: publishers
        });
    } catch (err) {
        res.status(500).send("Lỗi server khi tìm sản phẩm");
    }
});

router.post('/admin/products/edit/:id', requireAdmin, upload.single('image'), async (req, res) => {
    try {
        const data = req.body;
        if (req.file) data.image_url = req.file.filename;
        else data.image_url = req.body.old_image;
        delete data.old_image;

        data.price = parseInt(data.price) || 0;
        data.quantity = parseInt(data.quantity) || 0;
        data.pages = data.pages ? parseInt(data.pages) : null;
        data.publication_year = data.publication_year ? parseInt(data.publication_year) : null;

        // Xử lý khóa ngoại an toàn
        data.publisher_id = (data.publisher_id && parseInt(data.publisher_id) > 0) ? parseInt(data.publisher_id) : null;
        data.author_id = (data.author_id && parseInt(data.author_id) > 0) ? parseInt(data.author_id) : null;
        data.category_id = (data.category_id && parseInt(data.category_id) > 0) ? parseInt(data.category_id) : null;

        await Product.updateProduct(req.params.id, data);
        res.redirect('/admin/products');
    } catch (err) {
        console.error(err);
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