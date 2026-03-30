package com.bookstore.controller.admin;

import com.bookstore.repository.CategoryRepository;
import com.bookstore.repository.OrderRepository;
import com.bookstore.repository.ProductRepository;
import com.bookstore.repository.ReviewRepository;
import com.bookstore.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.bookstore.security.CustomUserDetails;
import com.bookstore.service.UserService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping({ "", "/" })
    public String dashboard(Model model) {
        model.addAttribute("title", "Dashboard");
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("users", userRepository.count());
        stats.put("products", productRepository.count());
        stats.put("orders", orderRepository.count());
        stats.put("categories", categoryRepository.count());
        stats.put("reviews", reviewRepository.count());
        Double revenue = orderRepository.getTotalRevenue();
        stats.put("revenue", revenue != null ? revenue : 0.0);
        
        model.addAttribute("stats", stats);
        
        model.addAttribute("pendingOrders", orderRepository.findAllByOrderByOrderDateDesc().stream()
                .filter(o -> "PENDING".equals(o.getStatus()))
                .limit(5)
                .toList());

        return "admin/index";
    }

    @GetMapping("/stats")
    public String stats(Model model) {
        model.addAttribute("title", "Thống kê chi tiết");
        
        Double totalRevenue = orderRepository.getTotalRevenue();
        model.addAttribute("totalRevenue", totalRevenue != null ? totalRevenue : 0.0);
        model.addAttribute("totalOrders", orderRepository.count());
        
        Map<String, Long> orderStats = new HashMap<>();
        orderStats.put("PENDING", orderRepository.countByStatus("PENDING"));
        orderStats.put("CONFIRMED", orderRepository.countByStatus("CONFIRMED"));
        orderStats.put("PROCESSING", orderRepository.countByStatus("PROCESSING"));
        orderStats.put("DELIVERING", orderRepository.countByStatus("DELIVERING"));
        orderStats.put("COMPLETED", orderRepository.countByStatus("COMPLETED"));
        orderStats.put("CANCELLED", orderRepository.countByStatus("CANCELLED"));
        model.addAttribute("orderStats", orderStats);

        model.addAttribute("recentOrders", orderRepository.findAllByOrderByOrderDateDesc().stream()
                .limit(10)
                .toList());

        List<Object[]> dailyRevenue = orderRepository.getRevenueByDay();
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("dd/MM");
        model.addAttribute("chartLabels", dailyRevenue.stream()
                .map(row -> {
                    if (row[0] instanceof java.sql.Date) {
                        return ((java.sql.Date) row[0]).toLocalDate().format(formatter);
                    } else if (row[0] instanceof java.time.LocalDate) {
                        return ((java.time.LocalDate) row[0]).format(formatter);
                    }
                    return row[0].toString();
                }).toList());
        
        model.addAttribute("chartData", dailyRevenue.stream()
                .map(row -> {
                    if (row[1] instanceof java.math.BigDecimal) {
                        return ((java.math.BigDecimal) row[1]).doubleValue();
                    } else if (row[1] instanceof Number) {
                        return ((Number) row[1]).doubleValue();
                    }
                    return 0.0;
                }).toList());

        return "admin/stats";
    }

    @GetMapping("/profile")
    public String profile(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
        com.bookstore.model.User user = userService.getUserByUsername(userDetails.getUsername()).orElseThrow();
        model.addAttribute("userInfo", user);
        return "admin/profile";
    }

    @PostMapping("/profile")
    public String updateProfile(@AuthenticationPrincipal CustomUserDetails userDetails,
                                @RequestParam("fullName") String fullName,
                                @RequestParam("email") String email,
                                RedirectAttributes redirectAttributes) {
        com.bookstore.model.User user = userService.getUserByUsername(userDetails.getUsername()).orElseThrow();
        user.setFullName(fullName);
        user.setEmail(email);
        userService.saveUser(user);
        redirectAttributes.addFlashAttribute("successMessage", "Cập nhật hồ sơ thành công");
        return "redirect:/admin/profile";
    }

    @GetMapping("/change-password")
    public String changePasswordForm() {
        return "admin/change_password";
    }

    @PostMapping("/change-password")
    public String changePassword(@AuthenticationPrincipal CustomUserDetails userDetails,
                                 @RequestParam("current_password") String currentPassword,
                                 @RequestParam("new_password") String newPassword,
                                 @RequestParam("confirm_password") String confirmPassword,
                                 RedirectAttributes redirectAttributes) {
        com.bookstore.model.User user = userService.getUserByUsername(userDetails.getUsername()).orElseThrow();
        
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            redirectAttributes.addAttribute("error", "Mật khẩu hiện tại không đúng");
            return "redirect:/admin/change-password";
        }
        
        if (!newPassword.equals(confirmPassword)) {
            redirectAttributes.addAttribute("error", "Mật khẩu xác nhận không khớp");
            return "redirect:/admin/change-password";
        }
        
        String passwordError = validatePassword(newPassword);
        if (passwordError != null) {
            redirectAttributes.addAttribute("error", passwordError);
            return "redirect:/admin/change-password";
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userService.saveUser(user);
        
        redirectAttributes.addFlashAttribute("successMessage", "Đổi mật khẩu thành công");
        return "redirect:/admin/change-password";
    }

    private String validatePassword(String password) {
        if (password.length() < 6) return "Mật khẩu phải có ít nhất 6 ký tự.";
        if (!password.matches(".*[A-Z].*")) return "Mật khẩu phải chứa ít nhất một chữ cái viết hoa.";
        if (!password.matches(".*[a-z].*")) return "Mật khẩu phải chứa ít nhất một chữ cái viết thường.";
        if (!password.matches(".*[!@#$%^&*(),.?\":{}|<>].*")) return "Mật khẩu phải chứa ít nhất một ký tự đặc biệt.";
        return null;
    }
}
