const db = require('../../config/dbConfig');
const { OrderStatus, RevenueStats } = require('../../constants');

class AdminOrderRepository {
    async getAllOrders() {
        const query = `
            SELECT o.*, u.full_name
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.order_date DESC
        `;
        const [rows] = await db.query(query);
        return rows;
    }

    async getFilteredOrders(filters) {
        let query = `
            SELECT DISTINCT o.*, u.full_name, u.phone 
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN order_details od ON o.id = od.order_id
            WHERE 1=1
        `;
        const queryParams = [];

        if (filters.keyword) {
            query += ` AND (
                o.id LIKE ? OR
                u.full_name LIKE ? OR 
                u.phone LIKE ? OR 
                o.shipping_address LIKE ?
            )`;
            const likeKeyword = `%${filters.keyword}%`;
            queryParams.push(likeKeyword, likeKeyword, likeKeyword, likeKeyword);
        }

        if (filters.status && filters.status !== 'all') {
            query += ` AND o.status = ?`;
            queryParams.push(filters.status);
        }

        if (filters.payment_status && filters.payment_status !== 'all') {
            query += ` AND o.payment_status = ?`;
            queryParams.push(filters.payment_status);
        }

        query += ` ORDER BY o.order_date DESC`;

        const [rows] = await db.query(query, queryParams);
        return rows;
    }



    async updatePaymentStatus(id, status) {
        await db.query('UPDATE orders SET payment_status = ? WHERE id = ?', [status, id]);
    }

    async deleteOrder(id) {
        await db.query('DELETE FROM order_details WHERE order_id = ?', [id]);
        await db.query('DELETE FROM orders WHERE id = ?', [id]);
    }

    async getRevenueStats() {
        const query = `
            SELECT
                DATE(order_date) as date,
                SUM(final_total) as revenue
            FROM orders
            WHERE status = ?
            AND order_date >= DATE(NOW()) - INTERVAL ? DAY
            GROUP BY DATE(order_date)
            ORDER BY date ASC
        `;
        const [rows] = await db.query(query, [OrderStatus.COMPLETED, RevenueStats.DAYS_LOOKBACK]);
        return rows;
    }

    /**
     * Chuỗi doanh thu theo ngày hoặc tháng (chỉ đơn COMPLETED), trong [dateFrom, dateTo] (YYYY-MM-DD).
     */
    async getRevenueSeriesByRange(dateFrom, dateTo, groupBy = 'day') {
        const status = OrderStatus.COMPLETED;
        if (groupBy === 'month') {
            const [rows] = await db.query(
                `
                SELECT
                    DATE_FORMAT(order_date, '%Y-%m-01') AS period_date,
                    SUM(final_total) AS revenue,
                    COUNT(*) AS order_count
                FROM orders
                WHERE status = ?
                  AND DATE(order_date) >= ?
                  AND DATE(order_date) <= ?
                GROUP BY DATE_FORMAT(order_date, '%Y-%m')
                ORDER BY period_date ASC
                `,
                [status, dateFrom, dateTo]
            );
            return rows.map((r) => ({
                period_date: r.period_date,
                revenue: Number(r.revenue) || 0,
                order_count: Number(r.order_count) || 0
            }));
        }

        const [rows] = await db.query(
            `
            SELECT
                DATE(order_date) AS period_date,
                SUM(final_total) AS revenue,
                COUNT(*) AS order_count
            FROM orders
            WHERE status = ?
              AND DATE(order_date) >= ?
              AND DATE(order_date) <= ?
            GROUP BY DATE(order_date)
            ORDER BY period_date ASC
            `,
            [status, dateFrom, dateTo]
        );
        return rows.map((r) => ({
            period_date: r.period_date,
            revenue: Number(r.revenue) || 0,
            order_count: Number(r.order_count) || 0
        }));
    }

    /** Tổng doanh thu và số đơn hoàn thành trong khoảng ngày (YYYY-MM-DD). */
    async getCompletedTotalsInRange(dateFrom, dateTo) {
        const [rows] = await db.query(
            `
            SELECT
                COALESCE(SUM(final_total), 0) AS total_revenue,
                COUNT(*) AS total_orders
            FROM orders
            WHERE status = ?
              AND DATE(order_date) >= ?
              AND DATE(order_date) <= ?
            `,
            [OrderStatus.COMPLETED, dateFrom, dateTo]
        );
        return {
            totalRevenue: Number(rows[0].total_revenue) || 0,
            totalOrders: Number(rows[0].total_orders) || 0
        };
    }
}

module.exports = AdminOrderRepository;
