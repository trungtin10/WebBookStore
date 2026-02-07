const db = require('../../db');

module.exports = {
    // Đơn giản hóa hàm tạo đơn hàng
    createOrder: async (data) => {
        const { user_id, total_money, shipping_address, status } = data;
        const query = `
            INSERT INTO orders (user_id, total_money, shipping_address, status)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await db.query(query, [user_id, total_money, shipping_address, status]);
        return result.insertId;
    },

    addOrderDetail: async (orderId, productId, price, quantity, totalPrice) => {
        const query = `
            INSERT INTO order_details (order_id, product_id, price, quantity, total_price)
            VALUES (?, ?, ?, ?, ?)
        `;
        await db.query(query, [orderId, productId, price, quantity, totalPrice]);
    }
};