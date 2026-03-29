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

    async sendResetPasswordEmail(toEmail, token, validMinutes = 15) {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const resetLink = `${baseUrl}/reset-password/${token}`;

        const mailOptions = {
            from: `"BookTotal Support" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: `[BookTotal] Mã xác nhận đặt lại mật khẩu (${validMinutes} phút)`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #C92127; text-align: center;">Khôi phục mật khẩu</h2>
                    <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản BookTotal.</p>
                    <p><strong>Mã xác nhận của bạn</strong> (dùng kèm liên kết bên dưới, có hiệu lực <strong>${validMinutes} phút</strong>):</p>
                    <div style="background: #f8f9fa; border: 1px dashed #ccc; border-radius: 8px; padding: 14px 16px; margin: 16px 0; word-break: break-all; font-family: Consolas, monospace; font-size: 13px; color: #111;">${token}</div>
                    <p>Nhấn nút để mở trang đặt lại mật khẩu (mã đã được gắn sẵn trong liên kết):</p>
                    <div style="text-align: center; margin: 24px 0;">
                        <a href="${resetLink}" style="background-color: #C92127; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">ĐẶT LẠI MẬT KHẨU</a>
                    </div>
                    <p style="color: #555; font-size: 13px;">Nếu nút không hoạt động, sao chép liên kết sau vào trình duyệt:</p>
                    <p style="font-size: 12px; word-break: break-all; color: #666;">${resetLink}</p>
                    <p style="color: #777; font-size: 12px; margin-top: 20px;">Sau <strong>${validMinutes} phút</strong>, mã và liên kết sẽ hết hạn. Nếu bạn không yêu cầu khôi phục, hãy bỏ qua email này.</p>
                </div>
            `
        };
        await this.transporter.sendMail(mailOptions);
        console.log('Email đặt lại mật khẩu đã gửi tới:', toEmail);
    }

    /**
     * Thông báo khách khi trạng thái đơn hàng thay đổi (admin xử lý đơn).
     */
    async sendOrderStatusEmail(toEmail, { orderId, customerName, statusLabel }) {
        if (!toEmail || !String(toEmail).includes('@')) return;
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Order status email skipped: chưa cấu hình EMAIL_USER / EMAIL_PASS.');
            return;
        }

        const baseUrl = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
        const orderLink = `${baseUrl}/orders/${orderId}`;

        const mailOptions = {
            from: `"BookTotal" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: `[BookTotal] Đơn hàng #${orderId} — ${statusLabel}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #C92127;">Cập nhật đơn hàng</h2>
                    <p>Xin chào <strong>${customerName || 'Quý khách'}</strong>,</p>
                    <p>Đơn hàng <strong>#${orderId}</strong> của bạn vừa được cập nhật trạng thái:</p>
                    <p style="font-size: 18px; margin: 20px 0;"><strong style="color: #084298;">${statusLabel}</strong></p>
                    <p>Bạn có thể xem chi tiết đơn hàng tại liên kết sau (vui lòng đăng nhập bằng tài khoản đã đặt hàng):</p>
                    <div style="text-align: center; margin: 24px 0;">
                        <a href="${orderLink}" style="background-color: #C92127; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Xem đơn hàng</a>
                    </div>
                    <p style="font-size: 12px; color: #666;">Nếu nút không hoạt động, mở: <a href="${orderLink}">${orderLink}</a></p>
                    <p style="color: #777; font-size: 12px; margin-top: 24px;">Trân trọng,<br>BookTotal</p>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log('Email cập nhật đơn hàng đã gửi tới:', toEmail);
        } catch (error) {
            console.error('Error sending order status email:', error);
        }
    }
}

module.exports = MailerService;
