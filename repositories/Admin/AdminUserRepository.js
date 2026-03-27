const db = require('../../config/dbConfig');
const bcrypt = require('bcrypt');

class AdminUserRepository {
    async getAllUsers() {
        const [rows] = await db.query('SELECT * FROM users');
        return rows;
    }



    async deleteUser(id) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            await connection.query('DELETE FROM notifications WHERE user_id = ?', [id]);
            await connection.query('DELETE FROM reviews WHERE user_id = ?', [id]);

            const [orders] = await connection.query('SELECT id FROM orders WHERE user_id = ?', [id]);
            for (const order of orders) {
                await connection.query('DELETE FROM order_details WHERE order_id = ?', [order.id]);
                await connection.query('DELETE FROM orders WHERE id = ?', [order.id]);
            }

            await connection.query('DELETE FROM users WHERE id = ?', [id]);

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = AdminUserRepository;
