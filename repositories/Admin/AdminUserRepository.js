const db = require('../../config/dbConfig');
const bcrypt = require('bcrypt');

/** Map hàng DB → object admin (không trả password); is_active mặc định 1 nếu cột chưa có */
function mapUserRowForAdmin(r) {
    if (!r) return r;
    return {
        id: r.id,
        username: r.username,
        full_name: r.full_name,
        email: r.email,
        role: r.role,
        is_active:
            r.is_active !== undefined && r.is_active !== null ? Number(r.is_active) : 1
    };
}

/** mysql2: errno 1054 / sqlState 42S22 = unknown column */
function isMissingIsActiveError(err) {
    if (!err) return false;
    const msg = `${err.message || ''} ${err.sqlMessage || ''}`;
    if (!msg.includes('is_active')) return false;
    return (
        err.code === 'ER_BAD_FIELD_ERROR' ||
        err.errno === 1054 ||
        err.sqlState === '42S22'
    );
}

class AdminUserRepository {
    async getAllUsers() {
        const [rows] = await db.query('SELECT * FROM users ORDER BY id DESC');
        return rows.map(mapUserRowForAdmin);
    }

    async countUsers(search) {
        let sql = 'SELECT COUNT(*) AS total FROM users WHERE 1=1';
        const params = [];
        if (search && String(search).trim()) {
            const t = `%${String(search).trim()}%`;
            sql += ' AND (full_name LIKE ? OR email LIKE ? OR username LIKE ?)';
            params.push(t, t, t);
        }
        const [[row]] = await db.query(sql, params);
        return Number(row.total) || 0;
    }

    async getUsersPaginated({ page = 1, pageSize = 10, search = '' } = {}) {
        const limit = Math.min(Math.max(Number(pageSize) || 10, 1), 100);
        const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;
        let sql = 'SELECT * FROM users WHERE 1=1';
        const params = [];
        if (search && String(search).trim()) {
            const t = `%${String(search).trim()}%`;
            sql += ' AND (full_name LIKE ? OR email LIKE ? OR username LIKE ?)';
            params.push(t, t, t);
        }
        sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        const [rows] = await db.query(sql, params);
        return rows.map(mapUserRowForAdmin);
    }

    async setUserActive(id, isActive) {
        try {
            await db.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
        } catch (e) {
            if (isMissingIsActiveError(e)) {
                const err = new Error(
                    'Thiếu cột is_active trong bảng users. Chạy: ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;'
                );
                err.code = 'SCHEMA_MISSING_IS_ACTIVE';
                throw err;
            }
            throw e;
        }
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
