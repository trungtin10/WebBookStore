package com.bookstore.controller;

import com.bookstore.model.User;
import com.bookstore.service.EmailService;
import com.bookstore.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Optional;

@Controller
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @GetMapping("/login")
    public String showLoginForm(HttpServletRequest request) {
        String referer = request.getHeader("Referer");
        String redirectUrl = (referer != null ? referer : "/");
        // Thêm tham số lỗi để JS có thể bắt và mở popup
        return "redirect:" + UriComponentsBuilder.fromUriString(redirectUrl).queryParam("loginError", "true").build().toUriString();
    }

    @PostMapping("/register")
    public String registerUser(@Valid User user, BindingResult bindingResult, RedirectAttributes redirectAttributes, HttpServletRequest request) {
        String referer = request.getHeader("Referer");
        String redirectUrl = (referer != null ? referer : "/");

        if (bindingResult.hasErrors()) {
            redirectAttributes.addFlashAttribute("org.springframework.validation.BindingResult.user", bindingResult);
            redirectAttributes.addFlashAttribute("user", user);
            return "redirect:" + UriComponentsBuilder.fromUriString(redirectUrl).queryParam("registerError", "true").build().toUriString();
        }
        if (userService.existsByUsername(user.getUsername())) {
            redirectAttributes.addFlashAttribute("registerErrorMsg", "Tên đăng nhập đã tồn tại.");
            return "redirect:" + UriComponentsBuilder.fromUriString(redirectUrl).queryParam("registerError", "true").build().toUriString();
        }
        
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole("user");
        userService.saveUser(user);
        
        redirectAttributes.addFlashAttribute("registerSuccess", "Đăng ký thành công! Vui lòng đăng nhập.");
        return "redirect:" + redirectUrl;
    }
}
