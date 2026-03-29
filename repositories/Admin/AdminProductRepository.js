const db = require('../../config/dbConfig');

class AdminProductRepository {
    async getOrCreateAuthor(authorName) {
        if (!authorName) return null;
        const [rows] = await db.query('SELECT id FROM authors WHERE name = ?', [authorName.trim()]);
        if (rows.length > 0) return rows[0].id;
        const [result] = await db.query('INSERT INTO authors (name) VALUES (?)', [authorName.trim()]);
        return result.insertId;
    }

    async getOrCreatePublisher(publisherName) {
        if (!publisherName) return null;
        const [rows] = await db.query('SELECT id FROM publishers WHERE name = ?', [publisherName.trim()]);
        if (rows.length > 0) return rows[0].id;
        const [result] = await db.query('INSERT INTO publishers (name) VALUES (?)', [publisherName.trim()]);
        return result.insertId;
    }

    async getOrCreateSupplier(supplierName) {
        if (!supplierName) return null;
        const [rows] = await db.query('SELECT id FROM suppliers WHERE name = ?', [supplierName.trim()]);
        if (rows.length > 0) return rows[0].id;
        const [result] = await db.query('INSERT INTO suppliers (name) VALUES (?)', [supplierName.trim()]);
        return result.insertId;
    }

    async createProduct(data) {
        const authorId = await this.getOrCreateAuthor(data.author_name);
        const publisherId = await this.getOrCreatePublisher(data.publisher_name);
        const supplierId = await this.getOrCreateSupplier(data.supplier_name);

        const { name, price, list_price, description, image_url, gallery_images, quantity, publication_year, pages, cover_type, color, category_id, language, dimensions, is_hidden } = data;
        const hiddenStatus = is_hidden ? 1 : 0;

        const productQuery = `
            INSERT INTO products (name, price, list_price, description, image_url, gallery_images, quantity, is_hidden, publisher_id, supplier_id, publication_year, pages, cover_type, color, language, dimensions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(productQuery, [name, price, list_price, description, image_url, gallery_images, quantity, hiddenStatus, publisherId, supplierId, publication_year, pages, cover_type, color, language, dimensions]);
        const productId = result.insertId;

        if (category_id) await db.query('INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)', [productId, category_id]);
        if (authorId) await db.query('INSERT INTO product_authors (product_id, author_id) VALUES (?, ?)', [productId, authorId]);

        return result;
    }

    async updateProduct(id, data) {
        const authorId = await this.getOrCreateAuthor(data.author_name);
        const publisherId = await this.getOrCreatePublisher(data.publisher_name);
        const supplierId = await this.getOrCreateSupplier(data.supplier_name);

        const { name, price, list_price, description, image_url, gallery_images, quantity, publication_year, pages, cover_type, color, category_id, language, dimensions, is_hidden } = data;
        const hiddenStatus = is_hidden ? 1 : 0;

        const productQuery = `
            UPDATE products SET
            name = ?, price = ?, list_price = ?, description = ?, image_url = ?, gallery_images = ?, quantity = ?, is_hidden = ?, publisher_id = ?, supplier_id = ?,
            publication_year = ?, pages = ?, cover_type = ?, color = ?, language = ?, dimensions = ?
            WHERE id = ?
        `;
        const [upd] = await db.query(productQuery, [name, price, list_price, description, image_url, gallery_images, quantity, hiddenStatus, publisherId, supplierId, publication_year, pages, cover_type, color, language, dimensions, id]);
        if (upd.affectedRows === 0) throw new Error('Không cập nhật được (không tìm thấy sản phẩm).');

        if (category_id) {
            await db.query('DELETE FROM product_categories WHERE product_id = ?', [id]);
            await db.query('INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)', [id, category_id]);
        }
        if (authorId) {
            await db.query('DELETE FROM product_authors WHERE product_id = ?', [id]);
            await db.query('INSERT INTO product_authors (product_id, author_id) VALUES (?, ?)', [id, authorId]);
        }
    }

    async deleteProduct(id) {
        const [result] = await db.query(
            'UPDATE products SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
            [id]
        );
        if (result.affectedRows === 0) {
            throw new Error('Không thể ẩn sản phẩm (không tồn tại hoặc đã được chuyển vào thùng rác).');
        }
        return result;
    }

    async restoreProduct(id) {
        const [result] = await db.query(
            'UPDATE products SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL',
            [id]
        );
        if (result.affectedRows === 0) {
            throw new Error('Không thể khôi phục (sản phẩm không tồn tại hoặc chưa bị xóa mềm).');
        }
        return result;
    }



    async importStock(id, quantityImport, note) {
        const updateQuery = `UPDATE products SET quantity = quantity + ? WHERE id = ? AND deleted_at IS NULL`;
        const [r] = await db.query(updateQuery, [quantityImport, id]);
        if (r.affectedRows === 0) throw new Error('Không nhập kho được (sản phẩm không tồn tại hoặc đã xóa mềm).');
        const logQuery = `INSERT INTO inventory_logs (product_id, quantity, note) VALUES (?, ?, ?)`;
        await db.query(logQuery, [id, quantityImport, note]);
    }

    async exportStock(id, quantityExport, note) {
        const updateQuery = `UPDATE products SET quantity = quantity - ? WHERE id = ? AND quantity >= ? AND deleted_at IS NULL`;
        const [result] = await db.query(updateQuery, [quantityExport, id, quantityExport]);
        if (result.affectedRows === 0) {
            throw new Error('Số lượng tồn kho không đủ để xuất');
        }
        const logQuery = `INSERT INTO inventory_logs (product_id, quantity, note) VALUES (?, ?, ?)`;
        await db.query(logQuery, [id, -quantityExport, note]);
    }

    async getInventoryLogs(productId) {
        const query = `SELECT * FROM inventory_logs WHERE product_id = ? ORDER BY created_at DESC`;
        const [rows] = await db.query(query, [productId]);
        return rows;
    }

    async getAllReviewsForAdmin() {
        const query = `
            SELECT r.*, u.username, p.name as product_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            JOIN products p ON r.product_id = p.id
            ORDER BY r.created_at DESC
        `;
        const [rows] = await db.query(query);
        return rows;
    }

    async updateReviewStatus(id, status) {
        await db.query('UPDATE reviews SET status = ? WHERE id = ?', [status, id]);
    }

    async deleteReview(id) {
        await db.query('DELETE FROM reviews WHERE id = ?', [id]);
    }

    async addAdminReply(reviewId, replyText) {
        const query = `UPDATE reviews SET admin_reply = ?, replied_at = NOW() WHERE id = ?`;
        await db.query(query, [replyText, reviewId]);
    }
}

module.exports = AdminProductRepository;
