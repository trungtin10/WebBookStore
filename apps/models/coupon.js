const db = require('../../db');

module.exports = {
    // Tìm mã giảm giá theo code
    getCouponByCode: async (code) => {
        try {
            const query = `
                SELECT * FROM coupons
                WHERE code = ?
                AND is_active = TRUE
                AND (expiration_date IS NULL OR expiration_date >= CURDATE())
                AND (usage_limit > used_count)
            `;
            const [rows] = await db.query(query, [code]);
            return rows[0];
        } catch (error) {
            console.error("Lỗi lấy coupon:", error);
            return null;
        }
    },

    // Lấy tất cả mã đang hoạt động
    getAllActiveCoupons: async () => {
        try {
            const query = `
                SELECT * FROM coupons
                WHERE is_active = TRUE
                AND (expiration_date IS NULL OR expiration_date >= CURDATE())
                AND (usage_limit > used_count)
                ORDER BY type ASC, discount_value DESC
            `;
            const [rows] = await db.query(query);
            return rows;
        } catch (error) {
            console.error("Lỗi lấy danh sách coupon:", error);
            return [];
        }
    },

    // Cập nhật số lượt dùng
    updateUsage: async (code) => {
        try {
            await db.query('UPDATE coupons SET used_count = used_count + 1 WHERE code = ?', [code]);
        } catch (error) {
            console.error("Lỗi cập nhật coupon:", error);
        }
    }
};