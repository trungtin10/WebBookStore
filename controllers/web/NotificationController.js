const express = require('express');
const NotificationService = require('../../services/core/NotificationService');
const { requireLogin } = require('../../middleware/auth.middleware');

class NotificationController {
    constructor(notificationService = null) {
        this.router = express.Router();
        this.notificationService = notificationService || new NotificationService();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get('/notifications', requireLogin, this.getNotifications.bind(this));
    }

    async getNotifications(req, res) {
        if (!res.locals.user) return res.redirect('/?loginError=Vui lòng đăng nhập!');
        try {
            const notifications = await this.notificationService.getUserNotifications(res.locals.user.id);
            await this.notificationService.markAllAsRead(res.locals.user.id);
            res.render('notification/notifications', { notifications });
        } catch (err) {
            console.error(err);
            res.status(500).send("Lỗi lấy thông báo");
        }
    }
}

module.exports = new NotificationController().router;
