package com.bookstore.controller.api;

import com.bookstore.model.User;
import com.bookstore.security.CustomUserDetails;
import com.bookstore.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class AuthUserRestController {

    @Autowired
    private UserService userService;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
        }
        return ResponseEntity.ok(userDetails.getUser());
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal CustomUserDetails userDetails, @RequestBody Map<String, String> updates) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
        }

        User user = userDetails.getUser();
        if (updates.containsKey("fullName")) user.setFullName(updates.get("fullName"));
        if (updates.containsKey("email")) user.setEmail(updates.get("email"));
        if (updates.containsKey("phone")) user.setPhone(updates.get("phone"));
        
        userService.saveUser(user);
        return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật thành công!", "user", user));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@AuthenticationPrincipal CustomUserDetails userDetails, @RequestBody Map<String, String> payload) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
        }

        String currentPassword = payload.get("currentPassword");
        String newPassword = payload.get("newPassword");
        String confirmPassword = payload.get("confirmPassword");

        if (newPassword == null || !newPassword.equals(confirmPassword)) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Mật khẩu xác nhận không khớp!"));
        }

        User user = userService.getUserById(userDetails.getUser().getId()).orElseThrow();
        
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Mật khẩu hiện tại không đúng!"));
        }

        userService.updatePassword(user, passwordEncoder.encode(newPassword));
        
        return ResponseEntity.ok(Map.of("success", true, "message", "Đổi mật khẩu thành công!"));
    }
}
