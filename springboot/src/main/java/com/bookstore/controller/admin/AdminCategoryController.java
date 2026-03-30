package com.bookstore.controller.admin;

import com.bookstore.model.Category;
import com.bookstore.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/admin/categories")
public class AdminCategoryController {

    @Autowired
    private ProductService productService;

    @GetMapping
    public String listCategories(@RequestParam(name = "page", defaultValue = "0") int page,
                                 @RequestParam(name = "keyword", required = false) String keyword,
                                 Model model) {
        org.springframework.data.domain.Page<com.bookstore.model.Category> categoryPage;
        if (keyword != null && !keyword.isEmpty()) {
            categoryPage = productService.searchCategories(keyword, org.springframework.data.domain.PageRequest.of(page, 10));
        } else {
            categoryPage = productService.getAllCategories(org.springframework.data.domain.PageRequest.of(page, 10));
        }
        
        model.addAttribute("categories", categoryPage.getContent());
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", categoryPage.getTotalPages());
        model.addAttribute("keyword", keyword);
        
        return "admin/categories/category_list";
    }

    @GetMapping("/add")
    public String showAddForm(Model model) {
        model.addAttribute("category", new Category());
        return "admin/categories/category_add";
    }

    @PostMapping("/add")
    public String addCategory(@Valid @ModelAttribute Category category, BindingResult bindingResult, RedirectAttributes redirectAttributes) {
        if (bindingResult.hasErrors()) {
            return "admin/categories/category_add";
        }
        productService.saveCategory(category);
        redirectAttributes.addFlashAttribute("successMessage", "Thêm danh mục thành công");
        return "redirect:/admin/categories";
    }

    @GetMapping("/edit/{id}")
    public String showEditForm(@PathVariable(name = "id") Long id, Model model) {
        Category category = productService.getCategoryById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid category id: " + id));
        model.addAttribute("category", category);
        return "admin/categories/category_edit";
    }

    @PostMapping("/edit/{id}")
    public String editCategory(@PathVariable(name = "id") Long id, @Valid @ModelAttribute Category category, BindingResult bindingResult, RedirectAttributes redirectAttributes) {
        if (bindingResult.hasErrors()) {
            return "admin/categories/category_edit";
        }
        category.setId(id);
        productService.saveCategory(category);
        redirectAttributes.addFlashAttribute("successMessage", "Cập nhật danh mục thành công");
        return "redirect:/admin/categories";
    }

    @PostMapping("/delete/{id}")
    public String deleteCategory(@PathVariable(name = "id") Long id, RedirectAttributes redirectAttributes) {
        productService.deleteCategory(id);
        redirectAttributes.addFlashAttribute("successMessage", "Xóa danh mục thành công");
        return "redirect:/admin/categories";
    }
}
