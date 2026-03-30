package com.bookstore.controller.admin;

import com.bookstore.model.User;
import com.bookstore.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/admin/user")
public class AdminUserController {

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public String listUsers(Model model) {
        model.addAttribute("users", userService.getAllUsers());
        return "admin/user/user_list";
    }

    @GetMapping("/add")
    public String showAddUserForm(Model model) {
        model.addAttribute("user", new User());
        return "admin/user/add";
    }

    @PostMapping("/add")
    public String addUser(@Valid @ModelAttribute("user") User user, BindingResult bindingResult, Model model, RedirectAttributes redirectAttributes) {
        if (bindingResult.hasErrors()) {
            return "admin/user/add";
        }
        if (userService.existsByUsername(user.getUsername())) {
            bindingResult.rejectValue("username", "error.user", "Tên đăng nhập đã tồn tại");
            return "admin/user/add";
        }
        if (userService.existsByEmail(user.getEmail())) {
            bindingResult.rejectValue("email", "error.user", "Email đã được sử dụng");
            return "admin/user/add";
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userService.saveUser(user);
        redirectAttributes.addFlashAttribute("successMessage", "Thêm người dùng thành công");
        return "redirect:/admin/user";
    }

    @GetMapping("/edit/{id}")
    public String showEditUserForm(@PathVariable(name = "id") Long id, Model model) {
        User user = userService.getUserById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid user id: " + id));
        // Xóa mật khẩu để tránh hiển thị hash
        user.setPassword("");
        model.addAttribute("user", user);
        return "admin/user/edit";
    }

    @PostMapping("/edit/{id}")
    public String editUser(@PathVariable(name = "id") Long id, @ModelAttribute("user") User user, BindingResult bindingResult, Model model, RedirectAttributes redirectAttributes) {
        // Không dùng @Valid ở đây để tránh lỗi password trống
        
        User existingUser = userService.getUserById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid user id: " + id));

        // Kiểm tra email trùng lặp (nếu email thay đổi)
        if (!existingUser.getEmail().equals(user.getEmail()) && userService.existsByEmail(user.getEmail())) {
            bindingResult.rejectValue("email", "error.user", "Email đã được sử dụng bởi người dùng khác");
            return "admin/user/edit";
        }

        existingUser.setFullName(user.getFullName());
        existingUser.setEmail(user.getEmail());
        existingUser.setRole(user.getRole());

        // Chỉ cập nhật mật khẩu nếu người dùng nhập mới
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            if (user.getPassword().length() < 6) {
                bindingResult.rejectValue("password", "error.user", "Mật khẩu phải có ít nhất 6 ký tự");
                return "admin/user/edit";
            }
            existingUser.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        userService.saveUser(existingUser);
        redirectAttributes.addFlashAttribute("successMessage", "Cập nhật người dùng thành công");
        return "redirect:/admin/user";
    }

    @GetMapping("/delete/{id}")
    public String deleteUser(@PathVariable(name = "id") Long id, RedirectAttributes redirectAttributes) {
        try {
            userService.deleteUser(id);
            redirectAttributes.addFlashAttribute("successMessage", "Xóa người dùng thành công");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Không thể xóa người dùng này (có thể do ràng buộc dữ liệu)");
        }
        return "redirect:/admin/user";
    }
}
