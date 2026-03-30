package com.bookstore.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class CustomAuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                        AuthenticationException exception) throws IOException, ServletException {

        String username = request.getParameter("username");
        String referer = request.getHeader("Referer");
        String redirectUrl = (referer != null ? referer : "/");

        // Mặc định là lỗi chung
        String failureUrl = UriComponentsBuilder.fromUriString(redirectUrl)
                .queryParam("loginError", "true").build().toUriString();

        // Nếu là lỗi sai mật khẩu (tức là username đúng)
        if (exception instanceof BadCredentialsException) {
            failureUrl = UriComponentsBuilder.fromUriString(redirectUrl)
                    .queryParam("loginError", "true")
                    .queryParam("username", URLEncoder.encode(username, StandardCharsets.UTF_8))
                    .build().toUriString();
        }

        // Lưu URL thất bại và gọi handler mặc định để chuyển hướng
        getRedirectStrategy().sendRedirect(request, response, failureUrl);
    }
}
