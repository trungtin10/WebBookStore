const db = require('../../config/dbConfig');
const { Stock } = require('../../constants');
const vietnameseSearch = require('../../utils/vietnameseSearch');

class ProductRepository {
    _buildProductFilters(filters) {
        const whereClauses = [];
        const queryParams = [];

        if (filters.admin_list) {
            if (filters.show_deleted === '1') whereClauses.push('p.deleted_at IS NOT NULL');
            else whereClauses.push('(p.deleted_at IS NULL)');
        } else {
            whereClauses.push('(p.deleted_at IS NULL)');
        }

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
            if (filters.stock_status === 'below_threshold') {
                whereClauses.push(`p.quantity < ${Stock.LOW_THRESHOLD}`);
            } else {
                const stockConditions = {
                    ok: `p.quantity >= ${Stock.OK_MIN_QUANTITY}`,
                    low: `p.quantity > 0 AND p.quantity < ${Stock.LOW_THRESHOLD}`,
                    out: `p.quantity = 0`
                };
                const cond = stockConditions[filters.stock_status];
                if (cond) whereClauses.push(cond);
            }
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
        const query = `SELECT SUM(quantity) as totalStock FROM products WHERE deleted_at IS NULL`;
        const [rows] = await db.query(query);
        return rows[0].totalStock || 0;
    }

    async getProductById(id, options = {}) {
        const includeDeleted = Boolean(options.includeDeleted);
        const delClause = includeDeleted ? '' : ' AND (p.deleted_at IS NULL)';
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
            WHERE p.id = ?${delClause}
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
            WHERE pc.category_id = ? AND (p.deleted_at IS NULL)
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
            WHERE (p.deleted_at IS NULL)
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
            WHERE (p.deleted_at IS NULL) AND p.is_hidden = 0
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
            WHERE (p.deleted_at IS NULL) AND p.is_hidden = 0
            GROUP BY p.id
            ORDER BY RAND()
            LIMIT 10
        `;
        const [rows] = await db.query(query);
        return rows;
    }

    async searchProducts(keyword) {
        const kw = String(keyword).trim();
        const sqlUnP = vietnameseSearch.mysqlUnaccentExpression('p.name');
        const sqlUnA = vietnameseSearch.mysqlUnaccentExpression('a.name');
        const norm = vietnameseSearch.normalizeSearchKey(kw);
        const query = `
            SELECT
                p.*,
                GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') as author_name
            FROM products p
            LEFT JOIN product_authors pa ON p.id = pa.product_id
            LEFT JOIN authors a ON pa.author_id = a.id
            WHERE (p.deleted_at IS NULL) AND p.is_hidden = 0
              AND ((p.name LIKE ? OR a.name LIKE ?) OR (${sqlUnP} LIKE ? OR ${sqlUnA} LIKE ?))
            GROUP BY p.id
            ORDER BY p.id DESC
        `;
        const searchTerm = `%${kw}%`;
        const normTerm = `%${norm}%`;
        const [rows] = await db.query(query, [searchTerm, searchTerm, normTerm, normTerm]);
        return rows;
    }

    _parseShopPriceBounds(filters) {
        const norm = (raw) => {
            if (raw === undefined || raw === null || String(raw).trim() === '') return NaN;
            return Number(String(raw).trim().replace(/\s/g, '').replace(/,/g, ''));
        };
        let min = norm(filters.price_min);
        let max = norm(filters.price_max);
        if (!Number.isFinite(min) || min < 0) min = null;
        if (!Number.isFinite(max) || max < 0) max = null;
        if (min != null && max != null && min > max) {
            const t = min;
            min = max;
            max = t;
        }
        return { min, max };
    }

    _buildShopCatalogFilters(filters) {
        const whereClauses = ['(p.deleted_at IS NULL)', 'p.is_hidden = 0'];
        const queryParams = [];
        const keyword = filters.keyword?.trim();

        if (keyword) {
            whereClauses.push('(p.name LIKE ? OR a.name LIKE ?)');
            queryParams.push(`%${keyword}%`, `%${keyword}%`);
        }

        let joinCategory = false;
        if (filters.category_id && parseInt(filters.category_id, 10) > 0) {
            joinCategory = true;
            whereClauses.push('pc.category_id = ?');
            queryParams.push(filters.category_id);
        }

        if (filters.type === 'on-sale') {
            whereClauses.push('(p.list_price IS NOT NULL AND p.list_price > p.price)');
        }

        const { min: pMin, max: pMax } = this._parseShopPriceBounds(filters);
        if (pMin != null) {
            whereClauses.push('p.price >= ?');
            queryParams.push(pMin);
        }
        if (pMax != null) {
            whereClauses.push('p.price <= ?');
            queryParams.push(pMax);
        }

        return { whereClauses, queryParams, joinCategory, hasKeyword: Boolean(keyword) };
    }

    /** Min/max giá trong cửa hàng (dùng giới hạn thanh trượt) */
    async getShopCatalogPriceBounds() {
        const [rows] = await db.query(`
            SELECT IFNULL(MIN(price), 0) AS min_price, IFNULL(MAX(price), 0) AS max_price
            FROM products
            WHERE deleted_at IS NULL AND is_hidden = 0
        `);
        const r = rows[0];
        let minP = Number(r.min_price);
        let maxP = Number(r.max_price);
        if (!Number.isFinite(minP) || minP < 0) minP = 0;
        if (!Number.isFinite(maxP) || maxP < minP) maxP = minP;
        if (maxP === 0 && minP === 0) {
            maxP = 500000;
        } else if (maxP === minP) {
            maxP = minP + 1;
        }
        return { min_price: minP, max_price: maxP };
    }

    _shopCatalogOrderBy(filters) {
        const sort = filters.sort;
        if (sort === 'price_asc') return 'p.price ASC, p.id ASC';
        if (sort === 'price_desc') return 'p.price DESC, p.id DESC';
        if (filters.type === 'best-sellers') return 'p.sold_count DESC, p.id DESC';
        if (filters.type === 'new-arrivals') return 'p.created_at DESC, p.id DESC';
        return 'p.id DESC';
    }

    async getShopCatalogProducts(filters = {}) {
        const { whereClauses, queryParams, joinCategory } = this._buildShopCatalogFilters(filters);
        const orderBy = this._shopCatalogOrderBy(filters);
        const limit = Math.min(Math.max(parseInt(filters.limit, 10) || 12, 1), 48);
        const offset = Math.max(parseInt(filters.offset, 10) || 0, 0);

        let query = `
            SELECT p.*, GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') AS author_name
            FROM products p
            LEFT JOIN product_authors pa ON p.id = pa.product_id
            LEFT JOIN authors a ON pa.author_id = a.id
        `;
        if (joinCategory) query += ` JOIN product_categories pc ON p.id = pc.product_id `;
        if (whereClauses.length) query += ` WHERE ${whereClauses.join(' AND ')}`;
        query += ` GROUP BY p.id ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
        const params = [...queryParams, limit, offset];
        const [rows] = await db.query(query, params);
        return rows;
    }

    async countShopCatalogProducts(filters = {}) {
        const { whereClauses, queryParams, joinCategory, hasKeyword } = this._buildShopCatalogFilters(filters);

        let query = `SELECT COUNT(DISTINCT p.id) AS total FROM products p `;
        if (hasKeyword) {
            query += `LEFT JOIN product_authors pa ON p.id = pa.product_id LEFT JOIN authors a ON pa.author_id = a.id `;
        }
        if (joinCategory) query += `JOIN product_categories pc ON p.id = pc.product_id `;
        if (whereClauses.length) query += `WHERE ${whereClauses.join(' AND ')}`;
        const [rows] = await db.query(query, queryParams);
        return rows[0].total;
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
            WHERE pc.category_id = ? AND p.id != ? AND p.is_hidden = 0 AND (p.deleted_at IS NULL)
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

    /**
     * Trừ tồn + tăng đã bán khi đơn được xác nhận. Trả về affectedRows (0 nếu không đủ hàng).
     * @param {import('mysql2/promise').PoolConnection} [connection]
     */
    async decrementStockOnOrderConfirm(productId, quantitySold, connection = null) {
        const exec = connection || db;
        const query = `
            UPDATE products
            SET quantity = quantity - ?, sold_count = sold_count + ?
            WHERE id = ? AND deleted_at IS NULL AND quantity >= ?
        `;
        const [result] = await exec.query(query, [quantitySold, quantitySold, productId, quantitySold]);
        return result.affectedRows;
    }

    /**
     * Hoàn tồn khi hủy đơn đã từng trừ kho (sau khi xác nhận).
     * @param {import('mysql2/promise').PoolConnection} [connection]
     */
    async restoreStockOnOrderCancel(productId, quantityReturned, connection = null) {
        const exec = connection || db;
        const query = `
            UPDATE products
            SET quantity = quantity + ?, sold_count = GREATEST(0, sold_count - ?)
            WHERE id = ? AND deleted_at IS NULL
        `;
        await exec.query(query, [quantityReturned, quantityReturned, productId]);
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

