package com.bookstore.controller;

import com.bookstore.model.CartItem;
import com.bookstore.model.Product;
import com.bookstore.security.CustomUserDetails;
import com.bookstore.service.NotificationService;
import com.bookstore.service.ProductService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@Controller
@RequestMapping("/cart")
public class CartController {

    @Autowired
    private ProductService productService;

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public String viewCart(HttpSession session, Model model) {
        List<CartItem> cart = getCartFromSession(session);
        model.addAttribute("cart", cart);
        model.addAttribute("total", calculateTotal(cart));
        return "cart";
    }

    @GetMapping("/summary")
    @ResponseBody
    public ResponseEntity<?> getCartSummary(HttpSession session) {
        List<CartItem> cart = getCartFromSession(session);
        Map<String, Object> summary = new HashMap<>();
        summary.put("items", cart);
        summary.put("totalQty", cart.stream().mapToInt(CartItem::getQuantity).sum());
        summary.put("totalPrice", calculateTotal(cart));
        return ResponseEntity.ok(summary);
    }

    @PostMapping("/add")
    @ResponseBody
    public ResponseEntity<?> addToCart(@RequestParam("productId") Long productId, 
                                     @RequestParam(value = "quantity", defaultValue = "1") int quantity,
                                     HttpSession session,
                                     @AuthenticationPrincipal CustomUserDetails userDetails) {
        Optional<Product> productOpt = productService.getProductById(productId);
        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            List<CartItem> cart = getCartFromSession(session);

            boolean found = false;
            for (CartItem item : cart) {
                if (item.getId().equals(productId)) {
                    item.setQuantity(item.getQuantity() + quantity);
                    found = true;
                    break;
                }
            }
            if (!found) {
                cart.add(new CartItem(product.getId(), product.getName(), product.getPrice(), quantity, product.getImageUrl()));
            }
            session.setAttribute("cart", cart);

            // Tạo thông báo hệ thống
            if (userDetails != null) {
                notificationService.createNotification(
                    userDetails.getUser().getId(),
                    "Giỏ hàng",
                    "Sản phẩm '" + product.getName() + "' đã được thêm vào giỏ hàng.",
                    "success"
                );
            }

            int totalQty = cart.stream().mapToInt(CartItem::getQuantity).sum();
            return ResponseEntity.ok().body(Map.of("success", true, "message", "Đã thêm vào giỏ hàng", "totalQty", totalQty));
        }
        return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Sản phẩm không tồn tại"));
    }

    @PostMapping("/remove")
    @ResponseBody
    public ResponseEntity<?> removeFromCart(@RequestParam("productId") Long productId, HttpSession session) {
        List<CartItem> cart = getCartFromSession(session);
        cart.removeIf(item -> item.getId().equals(productId));
        session.setAttribute("cart", cart);
        
        int totalQty = cart.stream().mapToInt(CartItem::getQuantity).sum();
        return ResponseEntity.ok().body(Map.of("success", true, "totalQty", totalQty));
    }

    @PostMapping("/update")
    @ResponseBody
    public ResponseEntity<?> updateCart(@RequestParam("productId") Long productId, 
                                     @RequestParam("quantity") int quantity, 
                                     HttpSession session) {
        List<CartItem> cart = getCartFromSession(session);
        for (CartItem item : cart) {
            if (item.getId().equals(productId)) {
                item.setQuantity(quantity);
                break;
            }
        }
        session.setAttribute("cart", cart);
        return ResponseEntity.ok().body(Map.of("success", true));
    }

    @SuppressWarnings("unchecked")
    private List<CartItem> getCartFromSession(HttpSession session) {
        List<CartItem> cart = (List<CartItem>) session.getAttribute("cart");
        if (cart == null) {
            cart = new ArrayList<>();
            session.setAttribute("cart", cart);
        }
        return cart;
    }

    private double calculateTotal(List<CartItem> cart) {
        return cart.stream().mapToDouble(item -> item.getPrice() * item.getQuantity()).sum();
    }
}
