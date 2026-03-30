package com.bookstore.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class CustomLogoutSuccessHandler implements LogoutSuccessHandler {

    @Override
    public void onLogoutSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException, ServletException {
        
        HttpSession session = request.getSession(false);
        if (session != null) {
            // Chỉ xóa thuộc tính user, giữ lại các thuộc tính khác như giỏ hàng
            session.removeAttribute("user");
        }

        // Xóa cookie JWT nếu có
        jakarta.servlet.http.Cookie jwtCookie = new jakarta.servlet.http.Cookie("jwt", null);
        jwtCookie.setPath("/");
        jwtCookie.setMaxAge(0);
        response.addCookie(jwtCookie);

        // Chuyển hướng về trang chủ
        response.sendRedirect("/");
    }
}
