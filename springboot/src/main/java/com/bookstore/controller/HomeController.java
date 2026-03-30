package com.bookstore.controller;

import com.bookstore.model.Product;
import com.bookstore.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.ArrayList;
import java.util.List;

@Controller
public class HomeController {

    @Autowired
    private ProductService productService;

    @GetMapping("/")
    public String index(Model model) {
        try {
            // Lấy 12 sản phẩm bán chạy nhất
            List<Product> bestSellers = productService.getBestSellingProducts(12);
            // Lấy 12 sản phẩm mới nhất
            List<Product> newArrivals = productService.getNewArrivals(12);

            model.addAttribute("bestSellers", bestSellers);
            model.addAttribute("newArrivals", newArrivals);
        } catch (Exception e) {
            // Nếu có lỗi DB, truyền vào list rỗng để trang không bị crash
            model.addAttribute("bestSellers", new ArrayList<>());
            model.addAttribute("newArrivals", new ArrayList<>());
            System.err.println("Lỗi khi tải sản phẩm cho trang chủ: " + e.getMessage());
        }
        return "home";
    }
}
