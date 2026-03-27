const db = require('../../config/dbConfig');
const { Stock } = require('../../constants');

class ProductRepository {
    _buildProductFilters(filters) {
        const whereClauses = [];
        const queryParams = [];

        if (filters.keyword?.trim()) {
            whereClauses.push(`(p.name LIKE ? OR a.name LIKE ?)`);
            queryParams.push(`%${filters.keyword.trim()}%`, `%${filters.keyword.trim()}%`);
        }

        if (filters.category_id && parseInt(filters.category_id) > 0) {
            whereClauses.push(`pc.category_id = ?`);
            queryParams.push(filters.category_id);
        }

        if (filters.status && filters.status !== 'all') {
            whereClauses.push(filters.status === 'visible' ? `p.is_hidden = 0` : `p.is_hidden = 1`);
        }

        if (filters.stock_status && filters.stock_status !== 'all') {
            const stockConditions = {
                ok: `p.quantity >= ${Stock.OK_MIN_QUANTITY}`,
                low: `p.quantity > 0 AND p.quantity < ${Stock.LOW_THRESHOLD}`,
                out: `p.quantity = 0`
            };
            whereClauses.push(stockConditions[filters.stock_status]);
        }

        return { whereClauses, queryParams };
    }

    async getAllProducts(filters = {}) {
        const { whereClauses, queryParams } = this._buildProductFilters(filters);

        let query = `
            SELECT p.*, GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') as author_name
            FROM products p
            LEFT JOIN product_authors pa ON p.id = pa.product_id
            LEFT JOIN authors a ON pa.author_id = a.id
        `;
        if (filters.category_id && parseInt(filters.category_id) > 0) query += ` JOIN product_categories pc ON p.id = pc.product_id `;
        if (whereClauses.length > 0) query += ` WHERE ` + whereClauses.join(' AND ');
        query += ` GROUP BY p.id ORDER BY p.id DESC `;
        if (filters.limit) {
            query += ` LIMIT ? OFFSET ?`;
            queryParams.push(Number(filters.limit), Number(filters.offset) || 0);
        }

        const [rows] = await db.query(query, queryParams);
        return rows;
    }

    async countProducts(filters = {}) {
        const { whereClauses, queryParams } = this._buildProductFilters(filters);

        let query = `SELECT count(DISTINCT p.id) as total FROM products p `;
        if (filters.keyword?.trim()) query += `LEFT JOIN product_authors pa ON p.id = pa.product_id LEFT JOIN authors a ON pa.author_id = a.id `;
        if (filters.category_id && parseInt(filters.category_id) > 0) query += `JOIN product_categories pc ON p.id = pc.product_id `;
        if (whereClauses.length > 0) query += `WHERE ` + whereClauses.join(' AND ');

        const [rows] = await db.query(query, queryParams);
        return rows[0].total;
    }

    async getTotalStockQuantity() {
        const query = `SELECT SUM(quantity) as totalStock FROM products`;
        const [rows] = await db.query(query);
        return rows[0].totalStock || 0;
    }

    async getProductById(id) {
        const query = `
            SELECT
                p.*,
                pub.name as publisher_name,
                sup.name as supplier_name,
                GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') as category_name,
                GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') as author_name,
                (SELECT category_id FROM product_categories WHERE product_id = p.id LIMIT 1) as category_id,
                (SELECT author_id FROM product_authors WHERE product_id = p.id LIMIT 1) as author_id
            FROM products p
            LEFT JOIN publishers pub ON p.publisher_id = pub.id
            LEFT JOIN suppliers sup ON p.supplier_id = sup.id
            LEFT JOIN product_categories pc ON p.id = pc.product_id
            LEFT JOIN categories c ON pc.category_id = c.id
            LEFT JOIN product_authors pa ON p.id = pa.product_id
            LEFT JOIN authors a ON pa.author_id = a.id
            WHERE p.id = ?
            GROUP BY p.id
        `;
        const [rows] = await db.query(query, [id]);
        return rows[0];
    }

    async getProductsByCategory(categoryId) {
        const query = `
            SELECT
                p.*,
                GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') as author_name
            FROM products p
            JOIN product_categories pc ON p.id = pc.product_id
            LEFT JOIN product_authors pa ON p.id = pa.product_id
            LEFT JOIN authors a ON pa.author_id = a.id
            WHERE pc.category_id = ?
            GROUP BY p.id
            ORDER BY p.id DESC
        `;
        const [rows] = await db.query(query, [categoryId]);
        return rows;
    }

    async getBestSellers() {
        const query = `
            SELECT
                p.*,
                GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') as author_name
            FROM products p
            LEFT JOIN product_authors pa ON p.id = pa.product_id
            LEFT JOIN authors a ON pa.author_id = a.id
            GROUP BY p.id
            ORDER BY p.sold_count DESC
            LIMIT 10
        `;
        const [rows] = await db.query(query);
        return rows;
    }

    async getNewArrivals() {
        const query = `
            SELECT
                p.*,
                GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') as author_name
            FROM products p
            LEFT JOIN product_authors pa ON p.id = pa.product_id
            LEFT JOIN authors a ON pa.author_id = a.id
            GROUP BY p.id
            ORDER BY p.created_at DESC
            LIMIT 10
        `;
        const [rows] = await db.query(query);
        return rows;
    }

    async getOnSaleProducts() {
        const query = `
            SELECT
                p.*,
                GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') as author_name
            FROM products p
            LEFT JOIN product_authors pa ON p.id = pa.product_id
            LEFT JOIN authors a ON pa.author_id = a.id
            GROUP BY p.id
            ORDER BY RAND()
            LIMIT 10
        `;
        const [rows] = await db.query(query);
        return rows;
    }

    async searchProducts(keyword) {
        const query = `
            SELECT
                p.*,
                GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') as author_name
            FROM products p
            LEFT JOIN product_authors pa ON p.id = pa.product_id
            LEFT JOIN authors a ON pa.author_id = a.id
            WHERE p.name LIKE ? OR a.name LIKE ?
            GROUP BY p.id
            ORDER BY p.id DESC
        `;
        const searchTerm = `%${keyword}%`;
        const [rows] = await db.query(query, [searchTerm, searchTerm]);
        return rows;
    }

    async getRelatedProducts(productId, categoryId) {
        const query = `
            SELECT
                p.*,
                GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') as author_name
            FROM products p
            JOIN product_categories pc ON p.id = pc.product_id
            LEFT JOIN product_authors pa ON p.id = pa.product_id
            LEFT JOIN authors a ON pa.author_id = a.id
            WHERE pc.category_id = ? AND p.id != ? AND p.is_hidden = 0
            GROUP BY p.id
            ORDER BY RAND()
            LIMIT 5
        `;
        const [rows] = await db.query(query, [categoryId, productId]);
        return rows;
    }

    async getCategories() {
        const [rows] = await db.query('SELECT * FROM categories');
        return rows;
    }

    async updateStock(id, quantitySold) {
        const query = `UPDATE products SET quantity = quantity - ?, sold_count = sold_count + ? WHERE id = ?`;
        const [result] = await db.query(query, [quantitySold, quantitySold, id]);
        return result;
    }

    async getAuthors() {
        const [rows] = await db.query('SELECT * FROM authors');
        return rows;
    }

    async getPublishers() {
        const [rows] = await db.query('SELECT * FROM publishers');
        return rows;
    }

    async getReviews(productId) {
        const query = `
            SELECT reviews.*, users.full_name
            FROM reviews
            JOIN users ON reviews.user_id = users.id
            WHERE reviews.product_id = ? AND reviews.status = 'APPROVED'
            ORDER BY reviews.created_at DESC
        `;
        const [rows] = await db.query(query, [productId]);
        return rows;
    }

    async addReview(userId, productId, rating, comment) {
        const query = `INSERT INTO reviews (user_id, product_id, rating, comment, status) VALUES (?, ?, ?, ?, 'PENDING')`;
        const [result] = await db.query(query, [userId, productId, rating, comment]);
        return result;
    }
}

module.exports = ProductRepository;

