const ProductService = require('../services/shop/ProductService');
const NotificationService = require('../services/core/NotificationService');

class AppMiddleware {
    constructor() {
        this.productService = new ProductService();
        this.notificationService = new NotificationService();
    }

    flash(req, res, next) {
        res.locals.success_msg = req.flash('success_msg');
        res.locals.error_msg = req.flash('error_msg');
        res.locals.error = req.flash('error');
        next();
    }

    cart(req, res, next) {
        let cart = [];
        const cartCookieName = res.locals.user ? `cart_${res.locals.user.id}` : 'cart_guest';
        if (req.cookies[cartCookieName]) {
            try {
                cart = JSON.parse(req.cookies[cartCookieName]);
            } catch (e) {}
        }
        req.cart = cart;
        res.locals.cart = cart;
        res.locals.cartCount = cart.length;
        next();
    }

    async webLocals(req, res, next) {
        try {
            res.locals.globalCategories = await this.productService.getCategories();
        } catch (err) {
            res.locals.globalCategories = [];
        }

        if (res.locals.user) {
            try {
                res.locals.unreadNotifications = await this.notificationService.getUnreadCount(res.locals.user.id);
                res.locals.recentNotifications = (await this.notificationService.getUserNotifications(res.locals.user.id)).slice(0, 5);
            } catch (err) {
                res.locals.unreadNotifications = 0;
                res.locals.recentNotifications = [];
            }
        } else {
            res.locals.unreadNotifications = 0;
            res.locals.recentNotifications = [];
        }
        next();
    }
}

const instance = new AppMiddleware();
module.exports = {
    flashMiddleware: instance.flash.bind(instance),
    cartMiddleware: instance.cart.bind(instance),
    webLocalsMiddleware: instance.webLocals.bind(instance),
    AppMiddleware
};
