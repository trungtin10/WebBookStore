const express = require('express');
const UserService = require('../../../services/core/UserService');
const { requireAdmin } = require('../../../middleware/auth.middleware');

class AdminUserController {
    constructor(userService = null) {
        this.router = express.Router();
        this.userService = userService || new UserService();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get('/', requireAdmin, this.getList.bind(this));
        this.router.get('/add', requireAdmin, this.getAddForm.bind(this));
        this.router.post('/add', requireAdmin, this.processAdd.bind(this));
        this.router.get('/edit/:id', requireAdmin, this.getEditForm.bind(this));
        this.router.post('/edit/:id', requireAdmin, this.processEdit.bind(this));
        this.router.get('/delete/:id', requireAdmin, this.deleteUser.bind(this));
        this.router.get('/toggle-active/:id', requireAdmin, this.toggleUserActive.bind(this));
    }

    async getList(req, res) {
        try {
            const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
            const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
            const pageSize = 10;
            const total = await this.userService.countUsers(q);
            const users = await this.userService.getUsersPaginated({ page, pageSize, search: q });
            const totalPages = Math.max(Math.ceil(total / pageSize), 1);

            res.render('admin/user/user_list', {
                users,
                q,
                page,
                pageSize,
                total,
                totalPages,
                error: req.query.error,
                success: req.query.success
            });
        } catch (err) {
            console.error(err);
            res.status(500).send("Lỗi lấy danh sách user");
        }
    }

    async toggleUserActive(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            if (!Number.isFinite(id)) {
                return res.redirect('/admin/user?error=' + encodeURIComponent('Mã người dùng không hợp lệ'));
            }
            if (res.locals.user && Number(res.locals.user.id) === id) {
                return res.redirect('/admin/user?error=' + encodeURIComponent('Bạn không thể khóa/mở tài khoản của chính mình.'));
            }

            const userRow = await this.userService.getUserById(id);
            if (!userRow) {
                return res.redirect('/admin/user?error=' + encodeURIComponent('Không tìm thấy người dùng.'));
            }

            const role = (userRow.role || '').trim().toLowerCase();
            if (role === 'admin') {
                return res.redirect('/admin/user?error=' + encodeURIComponent('Không thể khóa tài khoản quản trị viên.'));
            }

            const currentlyActive = Number(userRow.is_active) !== 0;
            await this.userService.setUserActive(id, !currentlyActive);
            const msg = currentlyActive ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.';
            const page = parseInt(req.query.page, 10) || 1;
            const q = typeof req.query.q === 'string' ? req.query.q : '';
            const qs = new URLSearchParams();
            if (page > 1) qs.set('page', String(page));
            if (q) qs.set('q', q);
            qs.set('success', msg);
            res.redirect('/admin/user?' + qs.toString());
        } catch (err) {
            console.error(err);
            const msg =
                err && err.code === 'SCHEMA_MISSING_IS_ACTIVE'
                    ? err.message
                    : 'Lỗi khi cập nhật trạng thái tài khoản.';
            res.redirect('/admin/user?error=' + encodeURIComponent(msg));
        }
    }

    getAddForm(req, res) {
        res.render('admin/user/add', {
            errors: req.flash('errors'),
            formData: req.flash('formData')[0] || {}
        });
    }

    async processAdd(req, res) {
        try {
            const errors = {};
            const existingUser = await this.userService.getUserByUsername(req.body.username);
            if (existingUser) errors.username = "Tên đăng nhập đã tồn tại!";

            if (Object.keys(errors).length > 0) {
                req.flash('errors', errors);
                req.flash('formData', req.body);
                return res.redirect('/admin/user/add');
            }

            await this.userService.addUser(req.body);
            return res.redirect('/admin/user?success=' + encodeURIComponent('Thêm người dùng thành công'));
        } catch (err) {
            console.error(err);
            if (err.code === 'ER_DUP_ENTRY') {
                const errors = {};
                if (err.message.includes('email')) errors.email = "Email đã được sử dụng!";
                if (err.message.includes('username')) errors.username = "Tên đăng nhập đã tồn tại!";
                req.flash('errors', errors);
                req.flash('formData', req.body);
                return res.redirect('/admin/user/add');
            }
            res.status(500).send("Lỗi khi thêm user: " + err.message);
        }
    }

    async getEditForm(req, res) {
        try {
            const user = await this.userService.getUserById(req.params.id);
            if (!user) return res.status(404).send("Người dùng không tồn tại");
            res.render('admin/user/edit', {
                userRow: user,
                errors: req.flash('errors'),
                formData: req.flash('formData')[0] || user
            });
        } catch (err) {
            res.status(500).send("Lỗi lấy thông tin user: " + err.message);
        }
    }

    async processEdit(req, res) {
        try {
            await this.userService.updateUser(req.params.id, req.body);
            return res.redirect('/admin/user?success=' + encodeURIComponent('Cập nhật thông tin thành công'));
        } catch (err) {
            console.error(err);
            if (err.code === 'ER_DUP_ENTRY') {
                const errors = { email: "Email đã được sử dụng!" };
                req.flash('errors', errors);
                req.flash('formData', req.body);
                return res.redirect(`/admin/user/edit/${req.params.id}`);
            }
            res.status(500).send("Lỗi khi cập nhật user: " + err.message);
        }
    }

    async deleteUser(req, res) {
        try {
            const id = req.params.id;
            if (res.locals.user && res.locals.user.id == id) {
                return res.redirect('/admin/user?error=' + encodeURIComponent('Bạn không thể tự xóa tài khoản của chính mình!'));
            }
            await this.userService.deleteUser(id);
            return res.redirect('/admin/user?success=' + encodeURIComponent('Xóa người dùng thành công'));
        } catch (err) {
            console.error(err);
            if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.redirect('/admin/user?error=' + encodeURIComponent('Không thể xóa người dùng này vì họ đã có đơn hàng hoặc dữ liệu liên quan khác!'));
            }
            res.redirect('/admin/user?error=' + encodeURIComponent('Đã xảy ra lỗi khi xóa người dùng!'));
        }
    }
}

module.exports = new AdminUserController().router;
