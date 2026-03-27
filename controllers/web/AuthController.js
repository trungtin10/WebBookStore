const express = require('express');
const AuthService = require('../../services/core/AuthService');
const AuthValidator = require('../../validators/AuthValidator');
const { requireLogin, requireAdmin } = require('../../middleware/auth.middleware');

class AuthController {
    constructor(authService = null) {
        this.router = express.Router();
        this.authService = authService || new AuthService();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.post('/login', this.login.bind(this));
        this.router.post('/register', this.register.bind(this));
        this.router.get('/auth/logout', this.logout.bind(this));
        this.router.get('/profile', requireLogin, this.getProfile.bind(this));
        this.router.post('/profile', requireLogin, this.updateProfile.bind(this));
        this.router.get('/forgot-password', this.showForgotPassword.bind(this));
        this.router.post('/forgot-password', this.processForgotPassword.bind(this));
        this.router.get('/reset-password/:token', this.showResetPassword.bind(this));
        this.router.post('/reset-password/:token', this.processResetPassword.bind(this));
        this.router.get('/admin/profile', requireAdmin, this.getAdminProfile.bind(this));
        this.router.post('/admin/profile', requireAdmin, this.updateAdminProfile.bind(this));
        this.router.get('/admin/change-password', requireAdmin, this.showChangePassword.bind(this));
        this.router.post('/admin/change-password', requireAdmin, this.processChangePassword.bind(this));
    }

    async login(req, res) {
        const username = req.body.username ? req.body.username.trim() : '';
        const { password, returnUrl } = req.body;
        const genericError = encodeURIComponent("Sai tên đăng nhập hoặc mật khẩu!");

        try {
            const result = await this.authService.authenticateUserWeb(username, password);
            if (!result) {
                const qs = `loginError=${genericError}&username=${encodeURIComponent(username)}`;
                return res.redirect(returnUrl ? `${returnUrl}?${qs}` : `/?${qs}`);
            }

            res.cookie('jwt', result.token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, path: '/' });

            // Migrate guest cart -> user cart (avoid keeping guest cart after login)
            try {
                const guestCartRaw = req.cookies?.cart_guest;
                const userCartName = `cart_${result.userId}`;
                const userCartRaw = req.cookies?.[userCartName];
                if (!userCartRaw && guestCartRaw) {
                    const parsed = JSON.parse(guestCartRaw);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        res.cookie(userCartName, JSON.stringify(parsed), { maxAge: 24 * 60 * 60 * 1000, path: '/' });
                    }
                }
                // Always clear guest cart on login (prevents “giỏ vẫn giữ nguyên”)
                res.cookie('cart_guest', '', { maxAge: 1, path: '/' });
            } catch (e) {
                res.cookie('cart_guest', '', { maxAge: 1, path: '/' });
            }

            if (result.role === 'admin') return res.redirect('/admin');
            return res.redirect(returnUrl || '/');
        } catch (err) {
            console.error(err);
            return res.redirect('/?loginError=' + encodeURIComponent("Lỗi hệ thống!"));
        }
    }

    async register(req, res) {
        try {
            const result = await this.authService.registerUserWeb(req.body);
            if (!result.success) {
                return res.redirect(`/?registerError=${encodeURIComponent(result.errors.join(' '))}`);
            }
            return res.redirect('/?registerSuccess=Đăng ký thành công! Vui lòng đăng nhập.');
        } catch (err) {
            console.error('Lỗi đăng ký:', err);
            return res.redirect('/?registerError=Lỗi khi đăng ký!');
        }
    }

    logout(req, res) {
        // Clear carts
        res.cookie('cart_guest', '', { maxAge: 1, path: '/' });
        if (req.cookies?.jwt) {
            try {
                const jwt = require('jsonwebtoken');
                const { JWT_SECRET } = require('../../config');
                const decoded = jwt.verify(req.cookies.jwt, JWT_SECRET);
                if (decoded?.id) {
                    res.cookie(`cart_${decoded.id}`, '', { maxAge: 1, path: '/' });
                }
            } catch (e) {}
        }
        res.cookie('jwt', '', { maxAge: 1, path: '/' });
        res.redirect('/');
    }

    async getProfile(req, res) {
        if (!res.locals.user) return res.redirect('/?loginError=Vui lòng đăng nhập!');
        try {
            const userInfo = await this.authService.getUserById(res.locals.user.id);
            if (userInfo?.role?.trim().toLowerCase() === 'admin') {
                return res.redirect('/admin/profile');
            }
            res.render('account/profile', { userInfo, error: req.query.error, success: req.query.success });
        } catch (err) {
            console.error(err);
            res.redirect('/?loginError=Lỗi lấy thông tin!');
        }
    }

    async updateProfile(req, res) {
        if (!res.locals.user) return res.redirect('/?loginError=Vui lòng đăng nhập!');
        const backURL = req.header('Referer') || '/profile';

        try {
            const result = await this.authService.updateProfile(res.locals.user.id, req.body);
            if (!result.success) {
                return res.redirect(`${backURL}${backURL.includes('?') ? '&' : '?'}error=${encodeURIComponent(result.error)}`);
            }
            res.cookie('jwt', result.token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, path: '/' });
            res.redirect(`${backURL}${backURL.includes('?') ? '&' : '?'}success=${encodeURIComponent('Cập nhật thông tin thành công!')}`);
        } catch (err) {
            console.error(err);
            res.redirect(`${backURL}${backURL.includes('?') ? '&' : '?'}error=${encodeURIComponent('Lỗi khi cập nhật thông tin!')}`);
        }
    }

    showForgotPassword(req, res) {
        res.render('auth/forgot_password');
    }

    async processForgotPassword(req, res) {
        try {
            const result = await this.authService.initiatePasswordReset(req.body.email);
            if (!result.success) {
                return res.render('auth/forgot_password', { error: result.error });
            }
            res.render('auth/forgot_password', { success: `Đã gửi email hướng dẫn đến ${result.email}. Vui lòng kiểm tra hộp thư.` });
        } catch (err) {
            console.error(err);
            res.render('auth/forgot_password', { error: 'Lỗi hệ thống, vui lòng thử lại sau.' });
        }
    }

    async showResetPassword(req, res) {
        try {
            const user = await this.authService.verifyResetToken(req.params.token);
            if (!user) {
                return res.render('auth/reset_password', { error: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.', token: null });
            }
            res.render('auth/reset_password', { token: req.params.token });
        } catch (err) {
            res.render('auth/reset_password', { error: 'Lỗi hệ thống.', token: null });
        }
    }

    async processResetPassword(req, res) {
        const { token } = req.params;
        const { password, confirm_password } = req.body;

        if (password !== confirm_password) {
            return res.render('auth/reset_password', { error: 'Mật khẩu xác nhận không khớp.', token });
        }

        const passwordError = new AuthValidator().validatePassword(password);
        if (passwordError) {
            return res.render('auth/reset_password', { error: passwordError, token });
        }

        try {
            const result = await this.authService.resetPasswordWithToken(token, password);
            if (!result.success) {
                return res.render('auth/reset_password', { error: result.error, token: null });
            }
            res.redirect('/?loginError=Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.');
        } catch (err) {
            console.error(err);
            res.render('auth/reset_password', { error: 'Lỗi khi đặt lại mật khẩu.', token });
        }
    }

    async getAdminProfile(req, res) {
        if (!res.locals.user) return res.redirect('/?loginError=Vui lòng đăng nhập!');
        try {
            const userInfo = await this.authService.getUserById(res.locals.user.id);
            res.render('admin/account/profile', { userInfo, error: req.query.error, success: req.query.success });
        } catch (err) {
            console.error(err);
            res.redirect('/admin?error=Lỗi lấy thông tin!');
        }
    }

    async updateAdminProfile(req, res) {
        if (!res.locals.user) return res.redirect('/?loginError=Vui lòng đăng nhập!');
        const backURL = req.header('Referer') || '/admin/profile';

        try {
            const result = await this.authService.updateProfile(res.locals.user.id, req.body);
            if (!result.success) {
                return res.redirect(`${backURL}${backURL.includes('?') ? '&' : '?'}error=${encodeURIComponent(result.error)}`);
            }
            res.cookie('jwt', result.token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, path: '/' });
            res.redirect(`${backURL}${backURL.includes('?') ? '&' : '?'}success=${encodeURIComponent('Cập nhật thông tin thành công!')}`);
        } catch (err) {
            console.error(err);
            res.redirect(`${backURL}${backURL.includes('?') ? '&' : '?'}error=${encodeURIComponent('Lỗi khi cập nhật thông tin!')}`);
        }
    }

    showChangePassword(req, res) {
        res.render('admin/account/change_password', { error: req.query.error, success: req.query.success });
    }

    async processChangePassword(req, res) {
        if (!res.locals.user) return res.redirect('/?loginError=Vui lòng đăng nhập!');
        const backURL = req.header('Referer') || '/admin/profile';
        const { current_password, new_password, confirm_password } = req.body;

        if (new_password !== confirm_password) {
            return res.redirect(`${backURL}${backURL.includes('?') ? '&' : '?'}error=${encodeURIComponent('Mật khẩu xác nhận không khớp!')}`);
        }

        try {
            const result = await this.authService.changePasswordFromProfile(res.locals.user.id, current_password, new_password);
            if (!result.success) {
                return res.redirect(`${backURL}${backURL.includes('?') ? '&' : '?'}error=${encodeURIComponent(result.error)}`);
            }
            res.redirect(`${backURL}${backURL.includes('?') ? '&' : '?'}success=${encodeURIComponent('Cập nhật mật khẩu thành công!')}`);
        } catch (err) {
            console.error(err);
            res.redirect(`${backURL}${backURL.includes('?') ? '&' : '?'}error=${encodeURIComponent('Lỗi hệ thống khi đổi mật khẩu!')}`);
        }
    }
}

module.exports = new AuthController().router;
