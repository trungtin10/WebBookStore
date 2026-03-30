const db = require('../../config/dbConfig');
const { OrderStatus, RevenueStats } = require('../../constants');

class OrderRepository {
    async createOrder(data) {
        const { user_id, total_money, shipping_fee, discount_amount, final_total, shipping_address, status, payment_method } = data;
        const query = `
            INSERT INTO orders (user_id, total_money, shipping_fee, discount_amount, final_total, shipping_address, status, payment_method)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(query, [user_id, total_money, shipping_fee, discount_amount, final_total, shipping_address, status, payment_method]);
        return result.insertId;
    }

    async addOrderDetail(orderId, productId, price, quantity) {
        const query = `INSERT INTO order_details (order_id, product_id, price_at_purchase, quantity) VALUES (?, ?, ?, ?)`;
        await db.query(query, [orderId, productId, price, quantity]);
    }

    async getOrderById(id) {
        const query = `
            SELECT o.*, u.full_name, u.phone, u.email
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.id = ?
        `;
        const [rows] = await db.query(query, [id]);
        return rows[0];
    }

    async getOrderItems(orderId) {
        const query = `
            SELECT od.*, p.name, p.image_url
            FROM order_details od
            JOIN products p ON od.product_id = p.id
            WHERE od.order_id = ?
        `;
        const [rows] = await db.query(query, [orderId]);
        return rows;
    }

    async getOrdersByUserId(userId) {
        const [orders] = await db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY order_date DESC', [userId]);
        if (orders.length === 0) return orders;

        const orderIds = orders.map(o => o.id);
        const placeholders = orderIds.map(() => '?').join(',');
        const [allItems] = await db.query(
            `SELECT od.*, p.name, p.image_url FROM order_details od
             JOIN products p ON od.product_id = p.id WHERE od.order_id IN (${placeholders})`,
            orderIds
        );

        const itemsByOrderId = allItems.reduce((acc, item) => {
            const orderId = item.order_id;
            if (!acc[orderId]) acc[orderId] = [];
            acc[orderId].push(item);
            return acc;
        }, {});

        orders.forEach(order => { order.items = itemsByOrderId[order.id] || []; });
        return orders;
    }

    async updateOrderStatus(id, status) {
        await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    }
}

module.exports = OrderRepository;

