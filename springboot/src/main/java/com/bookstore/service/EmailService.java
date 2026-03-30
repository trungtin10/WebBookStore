package com.bookstore.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendWelcomeEmail(String toEmail, String fullName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("BookTotal Support <" + fromEmail + ">");
            helper.setTo(toEmail);
            helper.setSubject("Chào mừng bạn đến với BookTotal!");

            String htmlContent = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #C92127; text-align: center;">Chào mừng %s!</h2>
                    <p>Cảm ơn bạn đã đăng ký tài khoản tại <b>BookTotal</b>.</p>
                    <p>Tài khoản của bạn đã được tạo thành công.</p>
                </div>
                """.formatted(fullName);

            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }

    @Async
    public void sendResetPasswordEmail(String toEmail, String token) {
        try {
            String resetLink = "http://localhost:8081/reset-password?token=" + token;

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("BookTotal Support <" + fromEmail + ">");
            helper.setTo(toEmail);
            helper.setSubject("Yêu cầu đặt lại mật khẩu");

            String htmlContent = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #C92127; text-align: center;">Đặt lại mật khẩu</h2>
                    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với email này.</p>
                    <p>Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu (Link có hiệu lực trong 1 giờ):</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="%s" style="background-color: #C92127; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">ĐẶT LẠI MẬT KHẨU</a>
                    </div>
                    <p style="color: #777; font-size: 12px;">Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
                </div>
                """.formatted(resetLink);

            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }
}
