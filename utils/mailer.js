const nodemailer = require('nodemailer');
require('dotenv').config();

class MailerService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    async sendWelcomeEmail(toEmail, fullName) {
        const mailOptions = {
            from: `"BookTotal" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: 'Chào mừng bạn đến với BookTotal',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #C92127; text-align: center;">Chào mừng ${fullName || 'bạn'}!</h2>
                    <p>Cảm ơn bạn đã đăng ký tài khoản tại BookTotal.</p>
                    <p>Bạn có thể đăng nhập và bắt đầu mua sắm ngay bây giờ.</p>
                    <p style="color: #777; font-size: 12px;">Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email.</p>
                </div>
            `
        };
        try {
            await this.transporter.sendMail(mailOptions);
            console.log('Email chào mừng đã gửi đến:', toEmail);
        } catch (error) {
            console.error('Error sending welcome email:', error);
        }
    }

    async sendResetPasswordEmail(toEmail, token) {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const resetLink = `${baseUrl}/reset-password/${token}`;

        const mailOptions = {
            from: `"BookTotal Support" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: 'Yêu cầu đặt lại mật khẩu',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #C92127; text-align: center;">Đặt lại mật khẩu</h2>
                    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                    <p>Vui lòng nhấn vào nút bên dưới để tiến hành thay đổi mật khẩu:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #C92127; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">ĐẶT LẠI MẬT KHẨU</a>
                    </div>
                    <p style="color: #777; font-size: 12px;">Link này có hiệu lực trong 1 giờ. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
                </div>
            `
        };
        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`Email reset đã được gửi qua link: ${resetLink}`);
        } catch (error) {
            console.error('Error sending reset email:', error);
        }
    }
}

module.exports = MailerService;
