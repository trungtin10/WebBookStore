const express = require('express');
const adminController = require('./adminController');
const AdminProductController = require('./AdminProductController');
const AdminCategoryController = require('./AdminCategoryController');
const AdminOrderController = require('./AdminOrderController');
const AdminUserController = require('./AdminUserController');
const AdminInventoryController = require('./AdminInventoryController');
const AdminReviewController = require('./AdminReviewController');

const router = express.Router();

router.use(adminController);
router.use('/admin/products', AdminProductController);
router.use('/admin/orders', AdminOrderController);
router.use('/admin/user', AdminUserController);
router.use('/admin/inventory', AdminInventoryController);
router.use('/admin/reviews', AdminReviewController);
router.use('/admin/categories', AdminCategoryController);

module.exports = router;
