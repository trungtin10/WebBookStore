const NotificationRepository = require('../../repositories/core/NotificationRepository');

class NotificationService {
    constructor(repository = null) {
        this.repository = repository || new NotificationRepository();
    }

    async createNotification(userId, title, message, type = 'info') {
        return this.repository.createNotification(userId, title, message, type);
    }

    async getUserNotifications(userId) {
        return this.repository.getUserNotifications(userId);
    }

    async getUnreadCount(userId) {
        return this.repository.getUnreadCount(userId);
    }

    async markAllAsRead(userId) {
        return this.repository.markAllAsRead(userId);
    }
}

module.exports = NotificationService;

