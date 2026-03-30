package com.bookstore.controller;

import com.bookstore.model.Notification;
import com.bookstore.security.CustomUserDetails;
import com.bookstore.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public String viewNotifications(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
        if (userDetails == null) return "redirect:/login";
        
        List<Notification> notifications = notificationService.getNotificationsByUserId(userDetails.getUser().getId());
        model.addAttribute("notifications", notifications);
        return "notifications";
    }

    @GetMapping("/recent")
    @ResponseBody
    public ResponseEntity<List<Notification>> getRecentNotifications(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) return ResponseEntity.status(401).build();
        
        return ResponseEntity.ok(notificationService.getRecentNotifications(userDetails.getUser().getId(), 5));
    }

    @PostMapping("/mark-read/{id}")
    @ResponseBody
    public ResponseEntity<?> markAsRead(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) return ResponseEntity.status(401).build();
        
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/mark-all-read")
    public String markAllAsRead(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) return "redirect:/login";
        
        notificationService.markAllAsRead(userDetails.getUser().getId());
        return "redirect:/notifications";
    }

    @GetMapping("/unread-count")
    @ResponseBody
    public ResponseEntity<Long> getUnreadCount(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) return ResponseEntity.ok(0L);
        
        return ResponseEntity.ok(notificationService.getUnreadCount(userDetails.getUser().getId()));
    }
}
