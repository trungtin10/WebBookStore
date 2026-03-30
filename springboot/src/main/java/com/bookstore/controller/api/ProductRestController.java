package com.bookstore.controller.api;

import com.bookstore.model.Product;
import com.bookstore.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductRestController {

    @Autowired
    private ProductService productService;

    @GetMapping
    public ResponseEntity<?> getAllProducts(
            @RequestParam(name = "categoryId", required = false) Long categoryId,
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "sort", defaultValue = "newest") String sort) {
        
        List<Product> products = productService.searchProducts(categoryId, keyword, sort);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProductById(@PathVariable(name = "id") Long id) {
        return productService.getProductById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/featured")
    public ResponseEntity<?> getFeaturedProducts() {
        // Simple logic for featured products, for example, top 8 sold products
        List<Product> products = productService.getBestSellingProducts(8);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/latest")
    public ResponseEntity<?> getLatestProducts() {
        List<Product> products = productService.getNewArrivals(8);
        return ResponseEntity.ok(products);
    }
}
