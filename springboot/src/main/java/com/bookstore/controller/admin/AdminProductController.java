package com.bookstore.controller.admin;

import com.bookstore.model.Product;
import com.bookstore.service.FileStorageService;
import com.bookstore.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/admin/products")
public class AdminProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private FileStorageService fileStorageService;

    @GetMapping
    public String listProducts(@RequestParam(name = "page", defaultValue = "0") int page,
                                @RequestParam(name = "keyword", required = false) String keyword,
                                @RequestParam(name = "categoryId", required = false) Long categoryId,
                                @RequestParam(name = "status", defaultValue = "all") String status,
                                Model model) {
        
        Page<Product> productPage = productService.searchAdminProducts(keyword, categoryId, status, PageRequest.of(page, 10));
        
        model.addAttribute("products", productPage.getContent());
        model.addAttribute("categories", productService.getAllCategories());
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", productPage.getTotalPages());
        
        // Filters for persistence in UI
        model.addAttribute("keyword", keyword);
        model.addAttribute("categoryId", categoryId);
        model.addAttribute("status", status);
        
        return "admin/products/product_list";
    }

    @GetMapping("/add")
    public String showAddForm(Model model) {
        model.addAttribute("product", new Product());
        model.addAttribute("categories", productService.getAllCategories());
        return "admin/products/product_add";
    }

    @PostMapping("/add")
    public String addProduct(@Valid @ModelAttribute Product product, BindingResult bindingResult, @RequestParam(name = "imageFile") MultipartFile imageFile, Model model, RedirectAttributes redirectAttributes) {
        if (bindingResult.hasErrors()) {
            model.addAttribute("categories", productService.getAllCategories());
            return "admin/products/product_add";
        }
        if (!imageFile.isEmpty()) {
            String imageUrl = fileStorageService.storeFile(imageFile);
            product.setImageUrl(imageUrl);
        }
        productService.saveProduct(product);
        redirectAttributes.addFlashAttribute("successMessage", "Thêm sản phẩm thành công");
        return "redirect:/admin/products";
    }

    @GetMapping("/edit/{id}")
    public String showEditForm(@PathVariable(name = "id") Long id, Model model) {
        Product product = productService.getProductById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid product id: " + id));
        model.addAttribute("product", product);
        model.addAttribute("categories", productService.getAllCategories());
        return "admin/products/product_edit";
    }

    @PostMapping("/edit/{id}")
    public String editProduct(@PathVariable(name = "id") Long id, @Valid @ModelAttribute Product product, BindingResult bindingResult, @RequestParam(name = "imageFile") MultipartFile imageFile, Model model, RedirectAttributes redirectAttributes) {
        if (bindingResult.hasErrors()) {
            model.addAttribute("categories", productService.getAllCategories());
            return "admin/products/product_edit";
        }
        Product existingProduct = productService.getProductById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid product id: " + id));
        
        // Preserve data not present in the form
        product.setSoldCount(existingProduct.getSoldCount());

        if (!imageFile.isEmpty()) {
            String imageUrl = fileStorageService.storeFile(imageFile);
            product.setImageUrl(imageUrl);
        } else {
            product.setImageUrl(existingProduct.getImageUrl());
        }

        product.setId(id);
        productService.saveProduct(product);
        redirectAttributes.addFlashAttribute("successMessage", "Cập nhật sản phẩm thành công");
        return "redirect:/admin/products";
    }

    @PostMapping("/delete/{id}")
    public String deleteProduct(@PathVariable(name = "id") Long id, RedirectAttributes redirectAttributes) {
        productService.deleteProduct(id);
        redirectAttributes.addFlashAttribute("successMessage", "Xóa sản phẩm thành công");
        return "redirect:/admin/products";
    }
}
