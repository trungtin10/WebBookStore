const AdminOrderRepository = require('../../repositories/Admin/AdminOrderRepository');

class AdminOrderService {
    constructor(adminOrderRepository = null) {
        this.adminOrderRepository = adminOrderRepository || new AdminOrderRepository();
    }

    async getFilteredOrders(filters) {
        return this.adminOrderRepository.getFilteredOrders(filters);
    }

    async updatePaymentStatus(orderId, status) {
        return this.adminOrderRepository.updatePaymentStatus(orderId, status);
    }

    async deleteOrder(orderId) {
        return this.adminOrderRepository.deleteOrder(orderId);
    }

    async bulkDeleteOrders(orderIds) {
        for (const id of orderIds) {
            await this.adminOrderRepository.deleteOrder(id);
        }
    }

    async getRevenueStats() {
        return this.adminOrderRepository.getRevenueStats();
    }
}

module.exports = AdminOrderService;
