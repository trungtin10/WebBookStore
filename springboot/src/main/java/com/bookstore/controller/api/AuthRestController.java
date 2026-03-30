package com.bookstore.controller.api;

import com.bookstore.model.User;
import com.bookstore.security.JwtTokenProvider;
import com.bookstore.service.EmailService;
import com.bookstore.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthRestController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private EmailService emailService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody Map<String, String> loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.get("username"),
                        loginRequest.get("password")
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = tokenProvider.generateToken(authentication);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("token", jwt);
        response.put("message", "Đăng nhập thành công");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        if (!user.getUsername().matches("^[a-zA-Z0-9_]+$")) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Tên đăng nhập chỉ được chứa chữ cái, chữ số hoặc dấu gạch dưới."));
        }

        if (userService.existsByUsername(user.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Tên đăng nhập đã tồn tại!"));
        }

        if (userService.existsByEmail(user.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email đã được sử dụng!"));
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole("USER"); // Default role
        userService.saveUser(user);

        // Send welcome email asynchronously
        emailService.sendWelcomeEmail(user.getEmail(), user.getFullName());

        return ResponseEntity.ok(Map.of("success", true, "message", "Đăng ký thành công!"));
    }
}
