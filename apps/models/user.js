const db = require('../../db');
const bcrypt = require('bcrypt');

const getUserByUsername = async (username) => {
    try {
        const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
        return rows[0];
    } catch (error) {
        throw error;
    }
};

const User = {
    getAllUsers: async () => {
        try {
            const [rows] = await db.query("SELECT * FROM users ORDER BY id DESC");
            return rows;
        } catch (error) {
            throw error;
        }
    },

    getUserByUsername: getUserByUsername,

    getUserById: async (id) => {
        try {
            const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    addUser: async (data) => {
        try {
            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash(data.password, salt);

            const sql = "INSERT INTO users (username, password, email, full_name, role) VALUES (?, ?, ?, ?, ?)";
            const params = [data.username, hashedPassword, data.email, data.full_name, data.role];
            const [result] = await db.execute(sql, params);
            return result;
        } catch (error) {
            throw error;
        }
    },

    updateUser: async (id, data) => {
        try {
            const oldUser = await User.getUserById(id);
            let passwordToSave = oldUser.password;

            if (data.password && data.password !== oldUser.password) {
                const salt = await bcrypt.genSalt();
                passwordToSave = await bcrypt.hash(data.password, salt);
            }

            const sql = "UPDATE users SET username = ?, password = ?, email = ?, full_name = ?, role = ? WHERE id = ?";
            const params = [data.username, passwordToSave, data.email, data.full_name, data.role, id];
            const [result] = await db.execute(sql, params);
            return result;
        } catch (error) {
            throw error;
        }
    },

    deleteUser: async (id) => {
        try {
            const [result] = await db.execute("DELETE FROM users WHERE id = ?", [id]);
            return result;
        } catch (error) {
            throw error;
        }
    },

    login: async (username, password) => {
        try {
            const user = await getUserByUsername(username);
            if (user) {
                const auth = await bcrypt.compare(password, user.password);
                if (auth) {
                    return user;
                }
            }
            return null;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = User;