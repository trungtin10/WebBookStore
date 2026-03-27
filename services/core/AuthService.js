const UserRepository = require('../../repositories/core/UserRepository');
const AuthValidator = require('../../validators/AuthValidator');
const MailerService = require('../../utils/mailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { JWT_SECRET } = require('../../config');
const { Token } = require('../../constants');

class AuthService {
    constructor(userRepository = null, authValidator = null, mailer = null) {
        this.userRepository = userRepository || new UserRepository();
        this.authValidator = authValidator || new AuthValidator();
        this.mailer = mailer || new MailerService();
    }

    createToken(id, username, role, full_name, email) {
        return jwt.sign({ id, username, role, full_name, email }, JWT_SECRET, { expiresIn: Token.JWT_EXPIRY });
    }

    async authenticateUser(username, password) {
        const user = await this.userRepository.login(username, password);
        if (!user) throw new Error("Sai tên đăng nhập hoặc mật khẩu!");

        const role = user.role ? user.role.trim().toLowerCase() : 'user';
        const token = this.createToken(user.id, user.username, role, user.full_name, user.email);
        const { password: _, reset_token, reset_token_expiry, ...safeUser } = user;
        return { user: safeUser, token, role };
    }

    async authenticateUserWeb(username, password) {
        const user = await this.userRepository.login(username, password);
        if (!user) return null;

        const role = user.role ? user.role.trim().toLowerCase() : 'user';
        const token = this.createToken(user.id, user.username, role, user.full_name, user.email);
        return { token, role, userId: user.id };
    }

    async registerUser(userData) {
        const { username, email, full_name, password } = userData;

        const existingUser = await this.userRepository.getUserByUsername(username);
        if (existingUser) throw new Error("Tên đăng nhập đã tồn tại!");

        const existingEmail = await this.userRepository.getUserByEmail(email);
        if (existingEmail) throw new Error("Email đã được sử dụng!");

        await this.userRepository.addUser(userData);
        this.mailer.sendWelcomeEmail(email, full_name || username).catch(err => console.error("Error sending welcome email:", err));
        return { message: "Đăng ký thành công." };
    }

    validateRegistrationWeb(data) {
        return this.authValidator.validateRegistrationWeb(data);
    }

    async registerUserWeb(data) {
        const validation = this.authValidator.validateRegistrationWeb(data);
        if (!validation.isValid) return { success: false, errors: validation.errors };

        const [existingUser, existingEmail] = await Promise.all([
            this.userRepository.getUserByUsername(data.username),
            this.userRepository.getUserByEmail(data.email)
        ]);
        if (existingUser) return { success: false, errors: ['Tên đăng nhập đã tồn tại.'] };
        if (existingEmail) return { success: false, errors: ['Email đã được sử dụng.'] };

        await this.userRepository.addUser(data);
        this.mailer.sendWelcomeEmail(data.email, data.full_name || data.username).catch(err => console.error("Error sending welcome email:", err));
        return { success: true };
    }

    async initiatePasswordReset(email) {
        const user = await this.userRepository.getUserByEmail(email);
        if (!user) return { success: false, error: 'Email không tồn tại trong hệ thống!' };

        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + Token.RESET_EXPIRY_MS);
        await this.userRepository.saveResetToken(user.email, token, expiry);
        await this.mailer.sendResetPasswordEmail(user.email, token);
        return { success: true, email: user.email };
    }

    async verifyResetToken(token) {
        const user = await this.userRepository.getUserByResetToken(token);
        if (!user) return null;
        return user;
    }

    async resetPasswordWithToken(token, password) {
        const user = await this.userRepository.getUserByResetToken(token);
        if (!user) return { success: false, error: 'Link không hợp lệ.' };
        await this.userRepository.resetPassword(user.id, password);
        return { success: true };
    }

    async getUserById(id) {
        return this.userRepository.getUserById(id);
    }

    async updateProfile(userId, { email, full_name }) {
        if (!this.authValidator.validateEmail(email)) return { success: false, error: 'Email không hợp lệ!' };

        const user = await this.userRepository.getUserById(userId);
        if (!user) return { success: false, error: 'Tài khoản không tồn tại!' };

        await this.userRepository.updateUser(userId, { email, full_name, role: user.role });
        const role = user.role ? user.role.trim().toLowerCase() : 'user';
        const newToken = this.createToken(user.id, user.username, role, full_name, email);
        return { success: true, token: newToken };
    }

    async changePasswordFromProfile(userId, currentPassword, newPassword) {
        const passwordError = this.authValidator.validatePassword(newPassword);
        if (passwordError) return { success: false, error: passwordError };

        const user = await this.userRepository.getUserById(userId);
        if (!user) return { success: false, error: 'Tài khoản không tồn tại!' };

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return { success: false, error: 'Mật khẩu hiện tại không đúng!' };

        await this.userRepository.resetPassword(userId, newPassword);
        return { success: true };
    }
}

module.exports = AuthService;

