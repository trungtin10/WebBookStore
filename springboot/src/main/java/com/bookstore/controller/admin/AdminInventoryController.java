package com.bookstore.controller.admin;

import com.bookstore.model.Product;
import com.bookstore.model.InventoryLog;
import com.bookstore.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;

@Controller
@RequestMapping("/admin/inventory")
public class AdminInventoryController {

    @Autowired
    private ProductService productService;

    @GetMapping
    public String listInventory(@RequestParam(name = "page", defaultValue = "0") int page,
                                @RequestParam(name = "keyword", required = false) String keyword,
                                @RequestParam(name = "categoryId", required = false) Long categoryId,
                                @RequestParam(name = "stockStatus", defaultValue = "all") String stockStatus,
                                Model model) {
        
        Page<Product> productPage = productService.searchInventory(keyword, categoryId, stockStatus, PageRequest.of(page, 10));
        
        model.addAttribute("products", productPage.getContent());
        model.addAttribute("categories", productService.getAllCategories());
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", productPage.getTotalPages());
        
        // Filters for persistence in UI
        model.addAttribute("keyword", keyword);
        model.addAttribute("categoryId", categoryId);
        model.addAttribute("stockStatus", stockStatus);
        
        // Top indicators
        model.addAttribute("totalProducts", productService.getTotalStockQuantity());
        model.addAttribute("lowStockProducts", productService.countLowStockProducts());
        
        return "admin/inventory_list";
    }

    @PostMapping("/import")
    public String importStock(@RequestParam(name = "productId") Long productId,
                             @RequestParam(name = "quantity") Integer quantity,
                             @RequestParam(name = "note", required = false) String note,
                             RedirectAttributes redirectAttributes) {
        productService.importStock(productId, quantity, note);
        redirectAttributes.addFlashAttribute("successMessage", "Nhập hàng thành công!");
        return "redirect:/admin/inventory";
    }

    @PostMapping("/export")
    public String exportStock(@RequestParam(name = "productId") Long productId,
                             @RequestParam(name = "quantity") Integer quantity,
                             @RequestParam(name = "note", required = false) String note,
                             RedirectAttributes redirectAttributes) {
        try {
            productService.exportStock(productId, quantity, note);
            redirectAttributes.addFlashAttribute("successMessage", "Xuất hàng thành công!");
            return "redirect:/admin/inventory";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
            return "redirect:/admin/inventory";
        }
    }

    @GetMapping("/logs/{id}")
    @ResponseBody
    public List<InventoryLog> getLogs(@PathVariable("id") Long id) {
        return productService.getInventoryLogs(id);
    }
}
