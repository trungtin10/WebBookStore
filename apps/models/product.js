const db = require('../../db'); 

module.exports = {
    // Sửa lại query để JOIN qua bảng nối product_categories
    getAllProducts: async () => {
        const query = `
            SELECT
                p.*,
                GROUP_CONCAT(c.name SEPARATOR ', ') as category_name
            FROM products p
            LEFT JOIN product_categories pc ON p.id = pc.product_id
            LEFT JOIN categories c ON pc.category_id = c.id
            GROUP BY p.id
            ORDER BY p.id DESC
        `;
        const [rows] = await db.query(query);
        return rows;
    },

    // Sửa lại query để JOIN đúng
    getProductById: async (id) => {
        const query = `
            SELECT
                p.*,
                pub.name as publisher_name,
                GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') as category_name,
                GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') as author_name
            FROM products p
            LEFT JOIN publishers pub ON p.publisher_id = pub.id
            LEFT JOIN product_categories pc ON p.id = pc.product_id
            LEFT JOIN categories c ON pc.category_id = c.id
            LEFT JOIN product_authors pa ON p.id = pa.product_id
            LEFT JOIN authors a ON pa.author_id = a.id
            WHERE p.id = ?
            GROUP BY p.id
        `;
        const [rows] = await db.query(query, [id]);
        return rows[0]; 
    },

    // Sửa lại query tìm kiếm
    searchProducts: async (keyword) => {
        const query = `
            SELECT
                p.*,
                GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') as category_name
            FROM products p
            LEFT JOIN product_categories pc ON p.id = pc.product_id
            LEFT JOIN categories c ON pc.category_id = c.id
            LEFT JOIN product_authors pa ON p.id = pa.product_id
            LEFT JOIN authors a ON pa.author_id = a.id
            WHERE p.name LIKE ? OR a.name LIKE ?
            GROUP BY p.id
            ORDER BY p.id DESC
        `;
        const searchTerm = `%${keyword}%`;
        const [rows] = await db.query(query, [searchTerm, searchTerm]);
        return rows;
    },

    createProduct: async (data) => {
        const { name, price, description, image_url, quantity, publisher_id, publication_year, pages, cover_type, category_id, author_id } = data;

        const productQuery = `
            INSERT INTO products (name, price, description, image_url, quantity, publisher_id, publication_year, pages, cover_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(productQuery, [name, price, description, image_url, quantity, publisher_id, publication_year, pages, cover_type]);
        const productId = result.insertId;

        if (category_id) {
            await db.query('INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)', [productId, category_id]);
        }

        if (author_id) {
            await db.query('INSERT INTO product_authors (product_id, author_id) VALUES (?, ?)', [productId, author_id]);
        }

        return result;
    },

    updateProduct: async (id, data) => {
        const { name, price, description, image_url, quantity, publisher_id, publication_year, pages, cover_type, category_id, author_id } = data;

        const productQuery = `
            UPDATE products SET
            name = ?, price = ?, description = ?, image_url = ?, quantity = ?, publisher_id = ?,
            publication_year = ?, pages = ?, cover_type = ?
            WHERE id = ?
        `;
        await db.query(productQuery, [name, price, description, image_url, quantity, publisher_id, publication_year, pages, cover_type, id]);

        if (category_id) {
            await db.query('DELETE FROM product_categories WHERE product_id = ?', [id]);
            await db.query('INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)', [id, category_id]);
        }
        if (author_id) {
            await db.query('DELETE FROM product_authors WHERE product_id = ?', [id]);
            await db.query('INSERT INTO product_authors (product_id, author_id) VALUES (?, ?)', [id, author_id]);
        }
    },

    deleteProduct: async (id) => {
        const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);
        return result;
    },

    getCategories: async () => {
        const [rows] = await db.query('SELECT * FROM categories');
        return rows;
    },

    // Sửa: Chỉ cập nhật quantity và sold_count
    updateStock: async (id, quantitySold) => {
        const query = `UPDATE products SET quantity = quantity - ?, sold_count = sold_count + ? WHERE id = ?`;
        const [result] = await db.query(query, [quantitySold, quantitySold, id]);
        return result;
    },

    getReviews: async (productId) => {
        const query = `
            SELECT reviews.*, users.full_name
            FROM reviews
            JOIN users ON reviews.user_id = users.id
            WHERE reviews.product_id = ?
            ORDER BY reviews.created_at DESC
        `;
        const [rows] = await db.query(query, [productId]);
        return rows;
    },

    addReview: async (userId, productId, rating, comment) => {
        const query = `INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)`;
        const [result] = await db.query(query, [userId, productId, rating, comment]);
        return result;
    },

    hasPurchased: async (userId, productId) => {
        try {
            const query = `
                SELECT COUNT(*) as count
                FROM orders o
                JOIN order_details od ON o.id = od.order_id
                WHERE o.user_id = ? AND od.product_id = ? AND o.status = 'COMPLETED'
            `;
            const [rows] = await db.query(query, [userId, productId]);
            return rows[0].count > 0;
        } catch (error) {
            return false;
        }
    }
};