module.exports = {
    ProductRepository: require('./shop/ProductRepository'),
    CategoryRepository: require('./shop/CategoryRepository'),
    UserRepository: require('./core/UserRepository'),
    OrderRepository: require('./shop/OrderRepository'),
    NotificationRepository: require('./core/NotificationRepository'),
    CouponRepository: require('./shop/CouponRepository'),
    LocationRepository: require('./core/LocationRepository'),
    // Admin Repositories
    AdminProductRepository: require('./Admin/AdminProductRepository'),
    AdminUserRepository: require('./Admin/AdminUserRepository'),
    AdminOrderRepository: require('./Admin/AdminOrderRepository'),
    AdminCategoryRepository: require('./Admin/AdminCategoryRepository'),
    AdminDashboardRepository: require('./Admin/AdminDashboardRepository')
};
