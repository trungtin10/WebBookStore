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

    createToken(id, username, role, full_name, email, phone, address) {
        const payload = {
            id,
            username,
            role,
            full_name,
            email,
            phone: phone != null ? phone : '',
            address: address != null ? address : ''
        };
        return jwt.sign(payload, JWT_SECRET, { expiresIn: Token.JWT_EXPIRY });
    }

    async authenticateUser(username, password) {
        const result = await this.userRepository.login(username, password);
        if (result && result.locked) throw new Error('Tài khoản đã bị khóa. Liên hệ quản trị viên.');
        if (!result) throw new Error("Sai tên đăng nhập hoặc mật khẩu!");
        const user = result;

        const role = user.role ? user.role.trim().toLowerCase() : 'user';
        const token = this.createToken(user.id, user.username, role, user.full_name, user.email, user.phone, user.address);
        const { password: _, reset_token, reset_token_expiry, ...safeUser } = user;
        return { user: safeUser, token, role };
    }

    async authenticateUserWeb(username, password) {
        const result = await this.userRepository.login(username, password);
        if (result && result.locked) return { locked: true };
        if (!result) return null;
        const user = result;

        const role = user.role ? user.role.trim().toLowerCase() : 'user';
        const token = this.createToken(user.id, user.username, role, user.full_name, user.email, user.phone, user.address);
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
        const raw = typeof email === 'string' ? email.trim() : '';
        if (!raw) return { success: false, error: 'Vui lòng nhập email.' };

        const user = await this.userRepository.getUserByEmail(raw);
        if (!user) return { success: false, error: 'Email không tồn tại trong hệ thống. Vui lòng kiểm tra lại địa chỉ email.' };

        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + Token.RESET_EXPIRY_MS);
        await this.userRepository.saveResetToken(user.email, token, expiry);
        const validMinutes = Math.round(Token.RESET_EXPIRY_MS / 60000);
        await this.mailer.sendResetPasswordEmail(user.email, token, validMinutes);
        return { success: true, email: user.email, validMinutes };
    }

    async verifyResetToken(token) {
        const user = await this.userRepository.getUserByResetToken(token);
        if (!user) return null;
        return user;
    }

    async resetPasswordWithToken(token, password) {
        const user = await this.userRepository.getUserByResetToken(token);
        if (!user) return { success: false, error: 'Mã xác nhận không hợp lệ hoặc đã hết hạn. Vui lòng gửi lại yêu cầu từ trang quên mật khẩu.' };
        await this.userRepository.resetPassword(user.id, password);
        return { success: true };
    }

    async getUserById(id) {
        return this.userRepository.getUserById(id);
    }

    async updateProfile(userId, body) {
        const email = body.email != null ? String(body.email).trim() : '';
        const full_name = body.full_name != null ? String(body.full_name).trim() : '';

        if (!full_name) return { success: false, error: 'Vui lòng nhập họ và tên.' };
        if (!this.authValidator.validateEmail(email)) return { success: false, error: 'Email không hợp lệ!' };

        const user = await this.userRepository.getUserById(userId);
        if (!user) return { success: false, error: 'Tài khoản không tồn tại!' };

        const roleNorm = user.role ? user.role.trim().toLowerCase() : 'user';
        const isCustomer = roleNorm !== 'admin';

        const phoneInBody = Object.prototype.hasOwnProperty.call(body, 'phone');
        const addrInBody = Object.prototype.hasOwnProperty.call(body, 'address');
        let phone = phoneInBody ? String(body.phone ?? '').trim() : String(user.phone || '').trim();
        let address = addrInBody ? String(body.address ?? '').trim() : String(user.address || '').trim();

        if (isCustomer) {
            const digits = phone.replace(/\D/g, '');
            if (digits.length < 8 || digits.length > 15) {
                return { success: false, error: 'Vui lòng nhập số điện thoại hợp lệ (8–15 chữ số).' };
            }
            if (address.length < 5) {
                return { success: false, error: 'Vui lòng nhập địa chỉ giao hàng (ít nhất 5 ký tự).' };
            }
            if (address.length > 500) {
                return { success: false, error: 'Địa chỉ không được vượt quá 500 ký tự.' };
            }
        }

        await this.userRepository.updateUser(userId, {
            email,
            full_name,
            role: user.role,
            phone: phone || null,
            address: address || null
        });

        const newToken = this.createToken(user.id, user.username, roleNorm, full_name, email, phone || '', address || '');
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

