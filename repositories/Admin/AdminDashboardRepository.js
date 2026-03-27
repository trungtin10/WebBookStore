const db = require('../../config/dbConfig');

class AdminDashboardRepository {
    async getTotalRevenue() {
        const [rows] = await db.query("SELECT SUM(final_total) as total FROM orders WHERE status = 'COMPLETED'");
        return rows[0].total || 0;
    }

    async getTotalOrders() {
        const [rows] = await db.query("SELECT COUNT(*) as count FROM orders");
        return rows[0].count || 0;
    }

    async getTotalUsers() {
        const [rows] = await db.query("SELECT COUNT(*) as count FROM users WHERE role != 'admin'");
        return rows[0].count || 0;
    }

    async getLowStockCount() {
        const [rows] = await db.query("SELECT COUNT(*) as count FROM products WHERE quantity < 10");
        return rows[0].count || 0;
    }

    async getOrderStatusStats() {
        const [rows] = await db.query(`
            SELECT status, COUNT(*) as count
            FROM orders
            GROUP BY status
        `);
        return rows;
    }

    async getRecentOrders(limit = 5) {
        const [rows] = await db.query(`
            SELECT o.*, u.full_name
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.order_date DESC LIMIT ?
        `, [limit]);
        return rows;
    }
}

module.exports = AdminDashboardRepository;
