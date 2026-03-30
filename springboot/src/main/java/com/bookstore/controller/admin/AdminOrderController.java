package com.bookstore.controller.admin;

import com.bookstore.model.Order;
import com.bookstore.model.OrderDetail;
import com.bookstore.repository.OrderRepository;
import com.bookstore.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import org.springframework.transaction.annotation.Transactional;
import com.bookstore.service.ExcelExportService;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.io.ByteArrayInputStream;
import java.io.IOException;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Optional;

@Controller
@RequestMapping("/admin/orders")
public class AdminOrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ExcelExportService excelExportService;

    @GetMapping
    public String listOrders(@RequestParam(name = "keyword", required = false) String keyword,
                             @RequestParam(name = "status", required = false) String status,
                             @RequestParam(name = "payment_status", required = false) String paymentStatus,
                             Model model) {
        List<Order> orders = orderService.searchOrders(keyword, status, paymentStatus);
        model.addAttribute("orders", orders);
        return "admin/order_list";
    }

    @GetMapping("/export")
    public ResponseEntity<InputStreamResource> exportOrders(
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "payment_status", required = false) String paymentStatus) throws IOException {
        
        List<Order> orders = orderService.searchOrders(keyword, status, paymentStatus);
        ByteArrayInputStream in = excelExportService.exportOrdersToExcel(orders);
        
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=orders.xlsx");
        
        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new InputStreamResource(in));
    }

    // Endpoint trả về JSON cho Modal chi tiết đơn hàng (giữ lại để tương thích hoặc dùng cho quick view)
    @GetMapping("/detail/{id}")
    @ResponseBody
    @Transactional(readOnly = true)
    public ResponseEntity<?> getOrderDetailJson(@PathVariable(name = "id") Long id) {
        try {
            Optional<Order> orderOpt = orderRepository.findById(id);
            if (orderOpt.isEmpty()) return ResponseEntity.status(404).body(Map.of("success", false, "message", "Không tìm thấy đơn hàng: " + id));
            
            Order order = orderOpt.get();
            Map<String, Object> response = new HashMap<>();
            response.put("id", order.getId());
            response.put("status", order.getStatus());
            response.put("paymentStatus", order.getPaymentStatus());
            response.put("paymentMethod", order.getPaymentMethod());
            response.put("shippingName", order.getShippingName());
            response.put("shippingPhone", order.getShippingPhone());
            response.put("shippingAddress", order.getShippingAddress());
            response.put("orderNote", order.getOrderNote());
            response.put("orderDate", order.getOrderDate());
            response.put("trackingCode", order.getTrackingCode());
            response.put("expectedDeliveryDate", order.getExpectedDeliveryDate());
            response.put("totalMoney", order.getTotalMoney());
            response.put("shippingFee", order.getShippingFee());
            response.put("discountAmount", order.getDiscountAmount());
            response.put("finalTotal", order.getFinalTotal());
            
            if (order.getUser() != null) {
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", order.getUser().getId());
                userMap.put("fullName", order.getUser().getFullName());
                userMap.put("phone", order.getUser().getPhone());
                response.put("user", userMap);
            }

            List<Map<String, Object>> details = new ArrayList<>();
            if (order.getOrderDetails() != null) {
                for (OrderDetail detail : order.getOrderDetails()) {
                    Map<String, Object> detailMap = new HashMap<>();
                    detailMap.put("id", detail.getId());
                    detailMap.put("priceAtPurchase", detail.getPriceAtPurchase());
                    detailMap.put("quantity", detail.getQuantity());
                    
                    if (detail.getProduct() != null) {
                        Map<String, Object> productMap = new HashMap<>();
                        productMap.put("id", detail.getProduct().getId());
                        productMap.put("name", detail.getProduct().getName());
                        productMap.put("imageUrl", detail.getProduct().getImageUrl());
                        detailMap.put("product", productMap);
                    }
                    details.add(detailMap);
                }
            }
            response.put("orderDetails", details);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Lỗi server: " + e.getMessage()));
        }
    }

    // Endpoint trả về Trang chi tiết đơn hàng
    @GetMapping("/view/{id}")
    @Transactional(readOnly = true)
    public String viewOrderDetail(@PathVariable(name = "id") Long id, Model model) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng: " + id));
        model.addAttribute("order", order);
        return "admin/order_detail";
    }

    @PostMapping("/update-status/{id}")
    public String updateStatusPost(@PathVariable(name = "id") Long id, @RequestParam(name = "status") String status, RedirectAttributes ra) {
        orderService.updateOrderStatus(id, status);
        ra.addFlashAttribute("successMessage", "Cập nhật trạng thái thành công");
        return "redirect:/admin/orders/view/" + id;
    }

    @PostMapping("/update-payment/{id}")
    public String updatePaymentStatusPost(@PathVariable(name = "id") Long id, @RequestParam(name = "paymentStatus") String paymentStatus, RedirectAttributes ra) {
        Order order = orderRepository.findById(id).orElseThrow();
        order.setPaymentStatus(paymentStatus);
        orderRepository.save(order);
        ra.addFlashAttribute("successMessage", "Cập nhật thanh toán thành công");
        return "redirect:/admin/orders/view/" + id;
    }

    // AJAX endpoints
    @PostMapping("/api/status/{id}")
    @ResponseBody
    public ResponseEntity<?> updateStatusAjax(@PathVariable(name = "id") Long id, @RequestParam(name = "status") String status) {
        try {
            orderService.updateOrderStatus(id, status);
            return ResponseEntity.ok(Map.of("success", true, "status", status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/api/payment/{id}")
    @ResponseBody
    public ResponseEntity<?> updatePaymentAjax(@PathVariable(name = "id") Long id, @RequestParam(name = "paymentStatus") String paymentStatus) {
        try {
            orderService.updatePaymentStatus(id, paymentStatus);
            return ResponseEntity.ok(Map.of("success", true, "paymentStatus", paymentStatus));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/api/order-info/{id}")
    @ResponseBody
    public ResponseEntity<?> updateOrderInfoAjax(@PathVariable(name = "id") Long id, 
                                               @RequestParam(name = "name") String name,
                                               @RequestParam(name = "phone") String phone,
                                               @RequestParam(name = "address") String address,
                                               @RequestParam(name = "note", required = false) String note,
                                               @RequestParam(name = "paymentMethod") String paymentMethod,
                                               @RequestParam(name = "paymentStatus") String paymentStatus) {
        try {
            orderService.updateShippingInfo(id, name, phone, address, note);
            orderService.updatePaymentMethod(id, paymentMethod);
            orderService.updatePaymentStatus(id, paymentStatus);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/api/shipping/{id}")
    @ResponseBody
    public ResponseEntity<?> updateShippingAjax(@PathVariable(name = "id") Long id, 
                                               @RequestParam(name = "name") String name,
                                               @RequestParam(name = "phone") String phone,
                                               @RequestParam(name = "address") String address,
                                               @RequestParam(name = "note", required = false) String note) {
        try {
            orderService.updateShippingInfo(id, name, phone, address, note);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/api/items/{orderId}/update-quantity")
    @ResponseBody
    public ResponseEntity<?> updateItemQuantity(@PathVariable(name = "orderId") Long orderId, 
                                               @RequestParam(name = "itemId") Long itemId, 
                                               @RequestParam(name = "quantity") Integer quantity) {
        try {
            orderService.updateOrderItemQuantity(orderId, itemId, quantity);
            Order updatedOrder = orderRepository.findById(orderId).orElseThrow();
            return ResponseEntity.ok(Map.of("success", true, "finalTotal", updatedOrder.getFinalTotal(), "totalMoney", updatedOrder.getTotalMoney()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @DeleteMapping("/api/items/{orderId}/{itemId}")
    @ResponseBody
    public ResponseEntity<?> deleteItem(@PathVariable(name = "orderId") Long orderId, @PathVariable(name = "itemId") Long itemId) {
        try {
            orderService.deleteOrderItem(orderId, itemId);
            Order updatedOrder = orderRepository.findById(orderId).orElseThrow();
            return ResponseEntity.ok(Map.of("success", true, "finalTotal", updatedOrder.getFinalTotal(), "totalMoney", updatedOrder.getTotalMoney()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/delete/{id}")
    public String deleteOrder(@PathVariable(name = "id") Long id, RedirectAttributes ra) {
        orderService.deleteOrder(id);
        ra.addFlashAttribute("successMessage", "Xóa đơn hàng thành công");
        return "redirect:/admin/orders";
    }

    @GetMapping("/update/{id}/{status}")
    public String updateStatus(@PathVariable(name = "id") Long id, @PathVariable(name = "status") String status, RedirectAttributes ra) {
        orderService.updateOrderStatus(id, status);
        ra.addFlashAttribute("successMessage", "Cập nhật trạng thái thành công");
        return "redirect:/admin/orders";
    }

    @GetMapping("/update-payment/{id}/{status}")
    public String updatePaymentStatus(@PathVariable(name = "id") Long id, @PathVariable(name = "status") String status, RedirectAttributes ra) {
        Order order = orderRepository.findById(id).orElseThrow();
        order.setPaymentStatus(status);
        orderRepository.save(order);
        ra.addFlashAttribute("successMessage", "Cập nhật thanh toán thành công");
        return "redirect:/admin/orders";
    }

    @PostMapping("/bulk-delete")
    @ResponseBody
    public ResponseEntity<?> bulkDelete(@RequestBody List<Long> ids) {
        try {
            ids.forEach(orderService::deleteOrder);
            return ResponseEntity.ok().body(Map.of("success", true, "message", "Đã xóa " + ids.size() + " đơn hàng"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Lỗi: " + e.getMessage()));
        }
    }
}
