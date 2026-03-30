package com.bookstore.controller.admin;

import com.bookstore.model.Coupon;
import com.bookstore.service.CouponService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/admin/coupons")
public class AdminCouponController {

    @Autowired
    private CouponService couponService;

    @GetMapping({"", "/"})
    public String listCoupons(Model model) {
        model.addAttribute("coupons", couponService.getAllCoupons());
        return "admin/coupons/list";
    }

    @GetMapping("/add")
    public String addCouponForm(Model model) {
        model.addAttribute("coupon", new Coupon());
        model.addAttribute("title", "Thêm mã giảm giá mới");
        return "admin/coupons/add";
    }

    @GetMapping("/edit/{id}")
    public String editCouponForm(@PathVariable("id") Long id, Model model) {
        Coupon coupon = couponService.getCouponById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid coupon id: " + id));
        model.addAttribute("coupon", coupon);
        model.addAttribute("title", "Chỉnh sửa mã giảm giá");
        return "admin/coupons/add";
    }

    @PostMapping("/save")
    public String saveCoupon(@ModelAttribute(name = "coupon") Coupon coupon, RedirectAttributes redirectAttributes) {
        couponService.saveCoupon(coupon);
        redirectAttributes.addFlashAttribute("successMessage", "Lưu mã giảm giá thành công!");
        return "redirect:/admin/coupons";
    }

    @PostMapping("/delete/{id}")
    public String deleteCoupon(@PathVariable("id") Long id, RedirectAttributes redirectAttributes) {
        couponService.deleteCoupon(id);
        redirectAttributes.addFlashAttribute("successMessage", "Xóa mã giảm giá thành công!");
        return "redirect:/admin/coupons";
    }
}
