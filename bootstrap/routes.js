const ApiAuthController = require('../controllers/api/ApiAuthController');
const ApiProductController = require('../controllers/api/ApiProductController');
const ApiCategoryController = require('../controllers/api/ApiCategoryController');
const apiAdminRouter = require('../controllers/api/admin');
const ApiCouponController = require('../controllers/api/ApiCouponController');
const ApiOrderController = require('../controllers/api/ApiOrderController');
const CartController = require('../controllers/web/CartController');
const webRouter = require('../controllers/web');

class RoutesBootstrap {
    constructor({ app }) {
        this.app = app;
    }

    register() {
        const app = this.app;
        app.get('/favicon.ico', (req, res) => res.redirect('/icons/favicon.svg'));
        app.use("/api/auth", ApiAuthController);
        app.use("/api/products", ApiProductController);
        app.use("/api/categories", ApiCategoryController);
        app.use("/api/admin", apiAdminRouter);
        app.use("/api", ApiCouponController);
        app.use("/api", ApiOrderController);
        app.use("/api", CartController);
        app.use(webRouter);
    }
}

function registerRoutes(app) {
    new RoutesBootstrap({ app }).register();
}

module.exports = { registerRoutes, RoutesBootstrap };
