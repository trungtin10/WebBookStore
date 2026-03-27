const db = require('../../config/dbConfig');

class CategoryRepository {
    async getAllCategories(filters = {}) {
        let query = `SELECT * FROM categories`;
        let queryParams = [];
        let whereClauses = [];

        if (filters.keyword && filters.keyword.trim() !== '') {
            whereClauses.push(`name LIKE ?`);
            queryParams.push(`%${filters.keyword}%`);
        }

        if (whereClauses.length > 0) {
            query += ` WHERE ` + whereClauses.join(' AND ');
        }

        query += ` ORDER BY id DESC`;

        if (filters.limit) {
            query += ` LIMIT ? OFFSET ?`;
            queryParams.push(Number(filters.limit), Number(filters.offset) || 0);
        }

        const [rows] = await db.query(query, queryParams);
        return rows;
    }

    async countCategories(filters = {}) {
        let query = `SELECT count(id) as total FROM categories`;
        let queryParams = [];
        let whereClauses = [];

        if (filters.keyword && filters.keyword.trim() !== '') {
            whereClauses.push(`name LIKE ?`);
            queryParams.push(`%${filters.keyword}%`);
        }

        if (whereClauses.length > 0) {
            query += ` WHERE ` + whereClauses.join(' AND ');
        }

        const [rows] = await db.query(query, queryParams);
        return rows[0] ? rows[0].total : 0;
    }

    async getCategoryById(id) {
        const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
        return rows[0];
    }

    async getCategoryName(categoryId) {
        const [rows] = await db.query('SELECT name FROM categories WHERE id = ?', [categoryId]);
        return rows[0] ? rows[0].name : 'Danh mục';
    }
}

module.exports = CategoryRepository;

