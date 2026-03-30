package com.bookstore.controller;

import com.bookstore.model.Order;
import com.bookstore.model.User;
import com.bookstore.security.CustomUserDetails;
import com.bookstore.service.OrderService;
import com.bookstore.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Controller
@RequestMapping("/profile")
public class ProfileController {

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private OrderService orderService;

    @GetMapping
    public String viewProfile(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
        if (userDetails == null) return "redirect:/login";
        model.addAttribute("userInfo", userDetails.getUser()); 
        model.addAttribute("orders", orderService.getOrdersByUserId(userDetails.getUser().getId()));
        return "profile";
    }

    @GetMapping("/orders/{id}")
    public String orderDetail(@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable("id") Long id, Model model) {
        if (userDetails == null) return "redirect:/login";
        Order order = orderService.getOrderById(id).orElseThrow();
        if (!order.getUser().getId().equals(userDetails.getUser().getId())) {
            return "redirect:/profile/orders";
        }
        model.addAttribute("order", order);
        return "order_detail";
    }

    @PostMapping("/update")
    public String updateProfile(@AuthenticationPrincipal CustomUserDetails userDetails, 
                                @RequestParam("fullName") String fullName,
                                @RequestParam("email") String email,
                                @RequestParam(name = "phone", required = false) String phone,
                                @RequestParam(name = "address", required = false) String address) {
        if (userDetails == null) return "redirect:/login";
        
        User user = userService.getUserById(userDetails.getUser().getId()).orElseThrow();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPhone(phone);
        user.setAddress(address);
        
        userService.saveUser(user);
        userDetails.setUser(user);
        
        return "redirect:/profile?success=" + URLEncoder.encode("Cập nhật thông tin thành công!", StandardCharsets.UTF_8);
    }

    @PostMapping("/change-password")
    public String changePassword(@AuthenticationPrincipal CustomUserDetails userDetails,
                                 @RequestParam("current_password") String currentPassword,
                                 @RequestParam("new_password") String newPassword,
                                 @RequestParam("confirm_password") String confirmPassword,
                                 Model model) {
        if (userDetails == null) return "redirect:/login";
        
        if (!newPassword.equals(confirmPassword)) {
            return "redirect:/profile?error=" + URLEncoder.encode("Mật khẩu xác nhận không khớp!", StandardCharsets.UTF_8);
        }

        String passwordError = validatePassword(newPassword);
        if (passwordError != null) {
            return "redirect:/profile?error=" + URLEncoder.encode(passwordError, StandardCharsets.UTF_8);
        }

        User user = userService.getUserById(userDetails.getUser().getId()).orElseThrow();
        
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return "redirect:/profile?error=" + URLEncoder.encode("Mật khẩu hiện tại không đúng!", StandardCharsets.UTF_8);
        }
        
        user.setPassword(passwordEncoder.encode(newPassword));
        userService.saveUser(user);
        
        return "redirect:/profile?success=" + URLEncoder.encode("Cập nhật mật khẩu thành công!", StandardCharsets.UTF_8);
    }

    private String validatePassword(String password) {
        if (password.length() < 6) return "Mật khẩu phải có ít nhất 6 ký tự.";
        if (!password.matches(".*[A-Z].*")) return "Mật khẩu phải chứa ít nhất một chữ cái viết hoa.";
        if (!password.matches(".*[a-z].*")) return "Mật khẩu phải chứa ít nhất một chữ cái viết thường.";
        if (!password.matches(".*[!@#$%^&*(),.?\":{}|<>].*")) return "Mật khẩu phải chứa ít nhất một ký tự đặc biệt.";
        return null;
    }
}
