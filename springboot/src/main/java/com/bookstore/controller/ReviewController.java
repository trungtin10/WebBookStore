package com.bookstore.controller;

import com.bookstore.model.Product;
import com.bookstore.model.Review;
import com.bookstore.model.User;
import com.bookstore.security.CustomUserDetails;
import com.bookstore.service.ProductService;
import com.bookstore.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private ProductService productService;

    @PostMapping("/product/{productId}/review")
    public String submitReview(@PathVariable Long productId,
                               @RequestParam("rating") int rating,
                               @RequestParam("comment") String comment,
                               @AuthenticationPrincipal CustomUserDetails userDetails,
                               RedirectAttributes redirectAttributes) {
        
        if (userDetails == null) {
            return "redirect:/login";
        }

        Product product = productService.getProductById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        User user = userDetails.getUser();

        Review review = new Review();
        review.setProduct(product);
        review.setUser(user);
        review.setRating(rating);
        review.setComment(comment);
        
        reviewService.saveReview(review);

        redirectAttributes.addFlashAttribute("successMessage", "Cảm ơn bạn đã gửi đánh giá!");
        return "redirect:/product/" + productId;
    }
}
