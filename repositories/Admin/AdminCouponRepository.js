const db = require('../../config/dbConfig');

class AdminCouponRepository {
    async countCoupons(filters = {}) {
        const { keyword } = filters;
        let sql = 'SELECT COUNT(*) as c FROM coupons WHERE 1=1';
        const params = [];
        if (keyword && String(keyword).trim()) {
            sql += ' AND code LIKE ?';
            params.push(`%${String(keyword).trim()}%`);
        }
        const [[row]] = await db.query(sql, params);
        return row.c;
    }

    async findCoupons(filters = {}) {
        const { keyword, limit = 20, offset = 0 } = filters;
        let sql = 'SELECT * FROM coupons WHERE 1=1';
        const params = [];
        if (keyword && String(keyword).trim()) {
            sql += ' AND code LIKE ?';
            params.push(`%${String(keyword).trim()}%`);
        }
        sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
        params.push(Number(limit), Number(offset));
        const [rows] = await db.query(sql, params);
        return rows;
    }

    async findById(id) {
        const [rows] = await db.query('SELECT * FROM coupons WHERE id = ?', [id]);
        return rows[0];
    }

    async create(data) {
        const {
            code,
            type,
            discount_type,
            discount_value,
            max_discount_amount,
            min_order_value,
            usage_limit,
            expiration_date,
            is_active
        } = data;
        const query = `
            INSERT INTO coupons (
                code, type, discount_type, discount_value, max_discount_amount,
                min_order_value, usage_limit, used_count, expiration_date, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
        `;
        const [result] = await db.query(query, [
            code,
            type,
            discount_type,
            discount_value,
            max_discount_amount,
            min_order_value,
            usage_limit,
            expiration_date,
            is_active
        ]);
        return result;
    }

    async update(id, data) {
        const {
            code,
            type,
            discount_type,
            discount_value,
            max_discount_amount,
            min_order_value,
            usage_limit,
            expiration_date,
            is_active
        } = data;
        const query = `
            UPDATE coupons SET
                code = ?, type = ?, discount_type = ?, discount_value = ?,
                max_discount_amount = ?, min_order_value = ?, usage_limit = ?,
                expiration_date = ?, is_active = ?
            WHERE id = ?
        `;
        const [result] = await db.query(query, [
            code,
            type,
            discount_type,
            discount_value,
            max_discount_amount,
            min_order_value,
            usage_limit,
            expiration_date,
            is_active,
            id
        ]);
        return result;
    }

    async deleteById(id) {
        const [result] = await db.query('DELETE FROM coupons WHERE id = ?', [id]);
        return result;
    }
}

module.exports = AdminCouponRepository;
