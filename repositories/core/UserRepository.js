const db = require('../../config/dbConfig');
const bcrypt = require('bcrypt');

class UserRepository {
    async getUserByUsername(username) {
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        return rows[0];
    }

    async getUserById(id) {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0];
    }

    async updateUser(id, userData) {
        const phone = userData.phone != null ? String(userData.phone).trim() : null;
        const address = userData.address != null ? String(userData.address).trim() : null;

        if (userData.password && userData.password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            await db.query(
                'UPDATE users SET email = ?, full_name = ?, role = ?, phone = ?, address = ?, password = ? WHERE id = ?',
                [userData.email, userData.full_name, userData.role, phone || null, address || null, hashedPassword, id]
            );
            return;
        }

        await db.query(
            'UPDATE users SET email = ?, full_name = ?, role = ?, phone = ?, address = ? WHERE id = ?',
            [userData.email, userData.full_name, userData.role, phone || null, address || null, id]
        );
    }

    async getUserByEmail(email) {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    async addUser(user) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const role = user.role || 'user';
        const query = `INSERT INTO users (username, password, email, full_name, role) VALUES (?, ?, ?, ?, ?)`;
        await db.query(query, [user.username, hashedPassword, user.email, user.full_name, role]);
    }

    async isUserActive(id) {
        try {
            const [rows] = await db.query('SELECT is_active FROM users WHERE id = ?', [id]);
            if (!rows.length) return false;
            return Number(rows[0].is_active) !== 0;
        } catch (e) {
            if (e && e.code === 'ER_BAD_FIELD_ERROR' && String(e.message || '').includes('is_active')) {
                return true;
            }
            throw e;
        }
    }

    async login(username, password) {
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        const user = rows.find(u => u.username.toLowerCase() === (username || '').toLowerCase());
        if (!user) return null;
        const match = await bcrypt.compare(password, user.password);
        if (!match) return null;
        if (Number(user.is_active) === 0) return { locked: true };
        return user;
    }

    async saveResetToken(email, token, expiry) {
        await db.query('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?', [token, expiry, email]);
    }

    async getUserByResetToken(token) {
        const [rows] = await db.query('SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()', [token]);
        return rows[0];
    }

    async resetPassword(userId, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?', [hashedPassword, userId]);
    }
}

module.exports = UserRepository;

