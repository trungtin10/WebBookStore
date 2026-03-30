package com.bookstore.controller;

import com.bookstore.model.Product;
import com.bookstore.service.ProductService;
import com.bookstore.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private ReviewService reviewService;

    @GetMapping("/products")
    public String listProducts(@RequestParam(name = "page", defaultValue = "1") int page,
                               @RequestParam(name = "categoryId", required = false) Long categoryId,
                               @RequestParam(name = "search", required = false) String search,
                               Model model) {
        Page<Product> productPage;
        PageRequest pageable = PageRequest.of(page - 1, 9, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "id"));

        if (search != null && !search.isEmpty()) {
            productPage = productService.searchProducts(search, pageable);
        } else if (categoryId != null) {
            productPage = productService.getProductsByCategory(categoryId, pageable);
        } else {
            productPage = productService.getAllProducts(pageable);
        }

        model.addAttribute("products", productPage.getContent());
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", productPage.getTotalPages());
        return "product";
    }

    @GetMapping("/product/{id}")
    public String productDetail(@PathVariable Long id, Model model) {
        Product product = productService.getProductById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        model.addAttribute("product", product);
        model.addAttribute("reviews", reviewService.getApprovedReviewsByProductId(id));
        model.addAttribute("ratingStats", reviewService.getRatingStats(id));
        model.addAttribute("relatedProducts", productService.getRelatedProducts(id, product.getCategory() != null ? product.getCategory().getId() : null));

        return "product_detail";
    }
}
