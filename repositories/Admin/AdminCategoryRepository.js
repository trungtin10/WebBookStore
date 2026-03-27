const db = require('../../config/dbConfig');

class AdminCategoryRepository {
    async createCategory(data) {
        const { name } = data;
        const query = `INSERT INTO categories (name) VALUES (?)`;
        const [result] = await db.query(query, [name]);
        return result;
    }

    async updateCategory(id, data) {
        const { name } = data;
        const query = `UPDATE categories SET name = ? WHERE id = ?`;
        const [result] = await db.query(query, [name, id]);
        return result;
    }

    async deleteCategory(id) {
        const [result] = await db.query('DELETE FROM categories WHERE id = ?', [id]);
        return result;
    }
}

module.exports = AdminCategoryRepository;
