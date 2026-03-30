const express = require('express');

const PageController = require('./PageController');
const AuthController = require('./AuthController');
const ProductController = require('./ProductController');
const CartController = require('./CartController');
const OrderController = require('./OrderController');
const NotificationController = require('./NotificationController');
const adminRouter = require('./admin');

const router = express.Router();

router.use(PageController);
router.use(AuthController);
router.use(ProductController);
router.use(CartController);
router.use(OrderController);
router.use(NotificationController);
router.use(adminRouter);

module.exports = router;
