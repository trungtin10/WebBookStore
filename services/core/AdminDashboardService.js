const AdminDashboardRepository = require('../../repositories/Admin/AdminDashboardRepository');
const OrderRepository = require('../../repositories/shop/OrderRepository');

class AdminDashboardService {
    constructor(adminDashboardRepository = null, orderRepository = null) {
        this.adminDashboardRepository = adminDashboardRepository || new AdminDashboardRepository();
        this.orderRepository = orderRepository || new OrderRepository();
    }

    async getDashboardStats() {
        const totalRevenue = await this.adminDashboardRepository.getTotalRevenue();
        const totalOrders = await this.adminDashboardRepository.getTotalOrders();
        const totalUsers = await this.adminDashboardRepository.getTotalUsers();
        const lowStock = await this.adminDashboardRepository.getLowStockCount();

        const revenueStats = await this.orderRepository.getRevenueStats();
        const recentOrders = await this.adminDashboardRepository.getRecentOrders(5);

        return {
            stats: {
                revenue: totalRevenue,
                orders: totalOrders,
                users: totalUsers,
                lowStock: lowStock
            },
            revenueChart: revenueStats,
            recentOrders
        };
    }

    async getStatsPage() {
        const totalRevenue = await this.adminDashboardRepository.getTotalRevenue();
        const totalOrders = await this.adminDashboardRepository.getTotalOrders();

        const statusStats = await this.adminDashboardRepository.getOrderStatusStats();
        const orderStats = { PENDING: 0, CONFIRMED: 0, SHIPPING: 0, COMPLETED: 0, CANCELLED: 0 };
        statusStats.forEach(stat => {
            if (stat.status) {
                orderStats[stat.status.toUpperCase()] = stat.count;
            }
        });

        const revenueChartData = await this.orderRepository.getRevenueStats();
        const labels = revenueChartData.map(item => item.date instanceof Date ? item.date.toLocaleDateString('vi-VN') : item.date);
        const data = revenueChartData.map(item => item.revenue);

        const recentOrders = await this.adminDashboardRepository.getRecentOrders(20);

        return {
            totalRevenue,
            totalOrders,
            orderStats,
            labels,
            data,
            recentOrders
        };
    }
}

module.exports = AdminDashboardService;

