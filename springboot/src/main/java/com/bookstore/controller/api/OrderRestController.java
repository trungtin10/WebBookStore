package com.bookstore.controller.api;

import com.bookstore.model.Order;
import com.bookstore.model.OrderDetail;
import com.bookstore.model.Product;
import com.bookstore.security.CustomUserDetails;
import com.bookstore.service.OrderService;
import com.bookstore.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderRestController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private ProductService productService;

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@AuthenticationPrincipal CustomUserDetails userDetails, @RequestBody Map<String, Object> orderRequest) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
        }

        try {
            Order order = new Order();
            order.setUser(userDetails.getUser());
            order.setShippingAddress((String) orderRequest.get("shippingAddress"));
            order.setPaymentMethod((String) orderRequest.get("paymentMethod"));
            order.setPaymentStatus("UNPAID");
            order.setStatus("PENDING");
            
            Double totalMoney = ((Number) orderRequest.get("totalMoney")).doubleValue();
            order.setTotalMoney(totalMoney);
            order.setShippingFee(((Number) orderRequest.get("shippingFee")).doubleValue());
            order.setDiscountAmount(((Number) orderRequest.get("discountAmount")).doubleValue());
            order.setFinalTotal(((Number) orderRequest.get("finalTotal")).doubleValue());

            if (orderRequest.containsKey("couponCode")) {
                order.setCouponCode((String) orderRequest.get("couponCode"));
            }
            if (orderRequest.containsKey("shippingCouponCode")) {
                order.setShippingCouponCode((String) orderRequest.get("shippingCouponCode"));
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> items = (List<Map<String, Object>>) orderRequest.get("items");
            List<OrderDetail> details = new ArrayList<>();

            for (Map<String, Object> item : items) {
                OrderDetail detail = new OrderDetail();
                Long productId = ((Number) item.get("productId")).longValue();
                Product product = productService.getProductById(productId)
                        .orElseThrow(() -> new RuntimeException("Product not found: " + productId));
                
                detail.setProduct(product);
                detail.setQuantity(((Number) item.get("quantity")).intValue());
                detail.setPriceAtPurchase(((Number) item.get("priceAtPurchase")).doubleValue());
                details.add(detail);
            }

            Order savedOrder = orderService.createOrder(order, details);
            return ResponseEntity.ok(Map.of("success", true, "message", "Đặt hàng thành công!", "orderId", savedOrder.getId()));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Lỗi: " + e.getMessage()));
        }
    }

    @GetMapping("/my-orders")
    public ResponseEntity<?> getMyOrders(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
        }
        List<Order> orders = orderService.getOrdersByUserId(userDetails.getUser().getId());
        return ResponseEntity.ok(orders);
    }
}
