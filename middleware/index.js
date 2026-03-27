const { checkUser, requireLogin, requireAdmin } = require('./auth.middleware');
const { flashMiddleware, cartMiddleware, webLocalsMiddleware } = require('./app.middleware');
const { verifyApiToken } = require('./jwt.middleware');

module.exports = {
    checkUser,
    requireLogin,
    requireAdmin,
    verifyApiToken,
    flashMiddleware,
    cartMiddleware,
    webLocalsMiddleware
};
