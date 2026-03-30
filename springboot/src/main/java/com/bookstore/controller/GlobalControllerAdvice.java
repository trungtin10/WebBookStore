package com.bookstore.controller;

import com.bookstore.model.User;
import com.bookstore.repository.CategoryRepository;
import com.bookstore.security.CustomUserDetails;
import com.bookstore.service.NotificationService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

import java.util.ArrayList;
import java.util.List;

@ControllerAdvice
public class GlobalControllerAdvice {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private NotificationService notificationService;

    @ModelAttribute
    @SuppressWarnings("unchecked")
    public void addGlobalAttributes(Model model, 
                                    @AuthenticationPrincipal CustomUserDetails userDetails,
                                    HttpSession session) {
        try {
            // 1. Categories
            model.addAttribute("categories", categoryRepository.findAll());

            // 2. Cart Count
            int cartCount = 0;
            List<com.bookstore.model.CartItem> cart = (List<com.bookstore.model.CartItem>) session.getAttribute("cart");
            if (cart != null) {
                cartCount = cart.stream().mapToInt(com.bookstore.model.CartItem::getQuantity).sum();
            }
            model.addAttribute("cartCount", cartCount);
            model.addAttribute("cartTotalQty", cartCount);

            // 3. Notifications
            if (userDetails != null && userDetails.getUser() != null) {
                Long userId = userDetails.getUser().getId();
                model.addAttribute("unreadNotifications", notificationService.getUnreadCount(userId));
            } else {
                model.addAttribute("unreadNotifications", 0);
            }

            // 4. Luôn cung cấp một đối tượng User rỗng cho form đăng ký trong popup
            if (!model.containsAttribute("user")) {
                model.addAttribute("user", new User());
            }

        } catch (Exception e) {
            model.addAttribute("categories", new ArrayList<>());
            model.addAttribute("cartCount", 0);
            model.addAttribute("unreadNotifications", 0);
            if (!model.containsAttribute("user")) {
                model.addAttribute("user", new User());
            }
        }
    }
}
