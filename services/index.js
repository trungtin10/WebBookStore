module.exports = {
    ProductService: require('./shop/ProductService'),
    CategoryService: require('./shop/CategoryService'),
    AuthService: require('./core/AuthService'),
    OrderService: require('./shop/OrderService'),
    CouponService: require('./shop/CouponService'),
    UserService: require('./core/UserService'),
    CartService: require('./shop/CartService'),
    NotificationService: require('./core/NotificationService'),
    AdminDashboardService: require('./core/AdminDashboardService'),
    AdminProductService: require('./Admin/AdminProductService'),
    AdminCategoryService: require('./Admin/AdminCategoryService'),
    AdminUserService: require('./Admin/AdminUserService'),
    AdminOrderService: require('./Admin/AdminOrderService')
};
