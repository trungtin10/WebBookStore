package com.bookstore.controller.admin;

import com.bookstore.model.Review;
import com.bookstore.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/admin/reviews")
public class AdminReviewController {

    @Autowired
    private ReviewService reviewService;

    @GetMapping
    public String listReviews(Model model) {
        model.addAttribute("reviews", reviewService.getAllReviews());
        return "admin/review_list";
    }

    @PostMapping("/reply/{id}")
    public String replyToReview(@PathVariable Long id, @RequestParam String reply, RedirectAttributes redirectAttributes) {
        reviewService.addAdminReply(id, reply);
        redirectAttributes.addFlashAttribute("successMessage", "Phản hồi đã được gửi.");
        return "redirect:/admin/reviews";
    }

    @PostMapping("/delete/{id}")
    public String deleteReview(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        reviewService.deleteReview(id);
        redirectAttributes.addFlashAttribute("successMessage", "Đánh giá đã được xóa.");
        return "redirect:/admin/reviews";
    }

    @PostMapping("/delete-reply/{id}")
    public String deleteReply(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        reviewService.deleteAdminReply(id);
        redirectAttributes.addFlashAttribute("successMessage", "Đã xóa phản hồi.");
        return "redirect:/admin/reviews";
    }
}
