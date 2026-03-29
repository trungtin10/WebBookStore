const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const UserRepository = require('../repositories/core/UserRepository');

const userRepository = new UserRepository();

class AuthMiddleware {
    checkUser(req, res, next) {
        const token = req.cookies.jwt;
        if (token) {
            jwt.verify(token, JWT_SECRET, (err, decodedToken) => {
                if (err) {
                    res.locals.user = null;
                    return next();
                }
                (async () => {
                    try {
                        const active = await userRepository.isUserActive(decodedToken.id);
                        if (!active) {
                            res.cookie('jwt', '', { maxAge: 1, path: '/' });
                            res.locals.user = null;
                            return next();
                        }
                    } catch (e) {
                        /* Cột is_active chưa có hoặc lỗi DB: không chặn request */
                    }
                    res.locals.user = decodedToken;
                    next();
                })();
            });
        } else {
            res.locals.user = null;
            next();
        }
    }

    requireLogin(req, res, next) {
        const token = req.cookies.jwt;
        if (token) {
            jwt.verify(token, JWT_SECRET, (err, decodedToken) => {
                if (err) {
                    res.redirect('/?loginError=Phiên đăng nhập hết hạn');
                } else {
                    next();
                }
            });
        } else {
            res.redirect('/?loginError=Vui lòng đăng nhập');
        }
    }

    requireAdmin(req, res, next) {
        const token = req.cookies.jwt;
        if (token) {
            jwt.verify(token, JWT_SECRET, (err, decodedToken) => {
                if (err) {
                    res.redirect('/');
                } else {
                    if (decodedToken.role && decodedToken.role.toLowerCase() === 'admin') {
                        next();
                    } else {
                        res.status(403).send("Bạn không có quyền truy cập trang này!");
                    }
                }
            });
        } else {
            res.redirect('/');
        }
    }
}

const instance = new AuthMiddleware();
module.exports = {
    checkUser: instance.checkUser.bind(instance),
    requireLogin: instance.requireLogin.bind(instance),
    requireAdmin: instance.requireAdmin.bind(instance),
    AuthMiddleware
};
