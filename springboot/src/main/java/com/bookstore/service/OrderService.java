package com.bookstore.service;

import com.bookstore.model.Order;
import com.bookstore.model.OrderDetail;
import com.bookstore.model.Product;
import com.bookstore.repository.OrderDetailRepository;
import com.bookstore.repository.OrderRepository;
import com.bookstore.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderDetailRepository orderDetailRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private com.bookstore.repository.CouponRepository couponRepository;

    @Autowired
    private NotificationService notificationService;

    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByOrderDateDesc();
    }

    public List<Order> searchOrders(String keyword, String status, String paymentStatus) {
        if ("all".equals(status)) status = null;
        if ("all".equals(paymentStatus)) paymentStatus = null;
        return orderRepository.searchOrders(keyword, status, paymentStatus);
    }

    public List<Order> getOrdersByUserId(Long userId) {
        return orderRepository.findByUserIdOrderByOrderDateDesc(userId);
    }

    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    @Transactional
    public Order createOrder(Order order, List<OrderDetail> details) {
        order.setOrderDate(LocalDateTime.now());
        Order savedOrder = orderRepository.save(order);

        for (OrderDetail detail : details) {
            detail.setOrder(savedOrder);
            orderDetailRepository.save(detail);

            // Cập nhật số lượng tồn kho và số lượng đã bán
            Product product = detail.getProduct();
            if (product != null) {
                if (product.getQuantity() < detail.getQuantity()) {
                    throw new RuntimeException("Sản phẩm '" + product.getName() + "' không đủ số lượng trong kho.");
                }
                product.setQuantity(product.getQuantity() - detail.getQuantity());
                product.setSoldCount(product.getSoldCount() + detail.getQuantity());
                productRepository.save(product);
            }
        }

        // Cập nhật số lượng sử dụng cho mã giảm giá
        if (order.getCouponCode() != null) {
            final String code = order.getCouponCode();
            couponRepository.findByCodeAndIsActiveTrue(code).ifPresent(c -> {
                c.setUsedCount(c.getUsedCount() + 1);
                couponRepository.save(c);
            });
        }
        if (order.getShippingCouponCode() != null) {
            final String code = order.getShippingCouponCode();
            couponRepository.findByCodeAndIsActiveTrue(code).ifPresent(c -> {
                c.setUsedCount(c.getUsedCount() + 1);
                couponRepository.save(c);
            });
        }

        // Trigger notification
        if (savedOrder.getUser() != null) {
            notificationService.createNotification(
                savedOrder.getUser().getId(),
                "Đặt hàng thành công",
                "Đơn hàng #" + savedOrder.getId() + " của bạn đã được tiếp nhận thành công."
            );
        }

        return savedOrder;
    }

    @Transactional
    public void updateOrderStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus(status);

        if ("SHIPPED".equals(status) && (order.getTrackingCode() == null || order.getTrackingCode().isEmpty())) {
            // Simulate generating tracking code (parity with Node.js)
            long randomNum = (long) (Math.random() * 90000000L + 10000000L);
            String trackingCode = "GHN-" + randomNum;
            order.setTrackingCode(trackingCode);
            order.setExpectedDeliveryDate(LocalDateTime.now().plusDays(3));
        }

        orderRepository.save(order);

        // Trigger notification for status change
        String title = "Cập nhật đơn hàng";
        String message = "Đơn hàng #" + order.getId() + " đã thay đổi trạng thái.";
        String type = "info";

        switch (status) {
            case "CONFIRMED":
                title = "Đơn hàng đã được xác nhận";
                message = "Đơn hàng #" + order.getId() + " của bạn đã được xác nhận.";
                break;
            case "PROCESSING":
                title = "Đang xử lý đơn hàng";
                message = "Đơn hàng #" + order.getId() + " đang được đóng gói.";
                break;
            case "SHIPPED":
                title = "Đã giao cho vận chuyển";
                message = "Đơn hàng #" + order.getId() + " đã được bàn giao cho đơn vị vận chuyển GHN. Mã vận đơn: " + order.getTrackingCode();
                break;
            case "DELIVERING":
                title = "Đang giao hàng";
                message = "Shipper đang giao đơn hàng #" + order.getId() + " đến bạn.";
                type = "warning";
                break;
            case "COMPLETED":
                title = "Giao hàng thành công";
                message = "Đơn hàng #" + order.getId() + " đã hoàn tất. Cảm ơn bạn đã mua sắm!";
                type = "success";
                break;
            case "CANCELLED":
                title = "Đơn hàng bị hủy";
                message = "Đơn hàng #" + order.getId() + " đã bị hủy.";
                type = "danger";
                break;
        }

        if (order.getUser() != null) {
            notificationService.createNotification(order.getUser().getId(), title, message, type);
        }
    }

    private String translateStatus(String status) {
        switch (status) {
            case "PENDING": return "Chờ xác nhận";
            case "CONFIRMED": return "Đã xác nhận";
            case "PROCESSING": return "Đang xử lý";
            case "SHIPPED": return "Đã giao cho ĐVVC";
            case "DELIVERING": return "Đang giao hàng";
            case "COMPLETED": return "Đã hoàn thành";
            case "CANCELLED": return "Đã hủy";
            default: return status;
        }
    }

    @Transactional
    public void updatePaymentStatus(Long orderId, String paymentStatus) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new RuntimeException("Order not found"));
        order.setPaymentStatus(paymentStatus);
        orderRepository.save(order);
    }

    @Transactional
    public void updatePaymentMethod(Long orderId, String paymentMethod) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new RuntimeException("Order not found"));
        order.setPaymentMethod(paymentMethod);
        orderRepository.save(order);
    }

    @Transactional
    public void updateShippingInfo(Long orderId, String shippingName, String shippingPhone, String shippingAddress, String orderNote) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new RuntimeException("Order not found"));
        order.setShippingName(shippingName);
        order.setShippingPhone(shippingPhone);
        order.setShippingAddress(shippingAddress);
        order.setOrderNote(orderNote);
        orderRepository.save(order);
    }

    public Order save(Order order) {
        return orderRepository.save(order);
    }

    @Transactional
    public void updateOrderItemQuantity(Long orderId, Long itemId, Integer quantity) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new RuntimeException("Order not found"));
        OrderDetail item = orderDetailRepository.findById(itemId).orElseThrow(() -> new RuntimeException("Item not found"));
        
        if (!item.getOrder().getId().equals(orderId)) {
            throw new RuntimeException("Mục này không thuộc về đơn hàng đã chọn");
        }

        // Adjust stock
        Product product = item.getProduct();
        int diff = quantity - item.getQuantity();
        if (product != null) {
            if (product.getQuantity() < diff) {
                throw new RuntimeException("Số lượng tồn kho không đủ");
            }
            product.setQuantity(product.getQuantity() - diff);
            product.setSoldCount(product.getSoldCount() + diff);
            productRepository.save(product);
        }

        item.setQuantity(quantity);
        orderDetailRepository.save(item);
        
        recalculateOrderTotals(order);
    }

    @Transactional
    public void deleteOrderItem(Long orderId, Long itemId) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new RuntimeException("Order not found"));
        OrderDetail item = orderDetailRepository.findById(itemId).orElseThrow(() -> new RuntimeException("Item not found"));
        
        if (!item.getOrder().getId().equals(orderId)) {
            throw new RuntimeException("Mục này không thuộc về đơn hàng đã chọn");
        }

        // Return stock
        Product product = item.getProduct();
        if (product != null) {
            product.setQuantity(product.getQuantity() + item.getQuantity());
            product.setSoldCount(product.getSoldCount() - item.getQuantity());
            productRepository.save(product);
        }

        orderDetailRepository.delete(item);
        
        // Refresh items in memory for recalculation
        order.getOrderDetails().remove(item);
        recalculateOrderTotals(order);
    }

    private void recalculateOrderTotals(Order order) {
        double subtotal = 0;
        // Fetch fresh details if necessary or use the ones in memory
        for (OrderDetail detail : order.getOrderDetails()) {
            subtotal += detail.getPriceAtPurchase() * detail.getQuantity();
        }
        order.setTotalMoney(subtotal);
        
        // Final total = subtotal + shippingFee - discountAmount
        double finalTotal = subtotal + (order.getShippingFee() != null ? order.getShippingFee() : 0) 
                                     - (order.getDiscountAmount() != null ? order.getDiscountAmount() : 0);
        order.setFinalTotal(Math.max(0, finalTotal));
        
        orderRepository.save(order);
    }

    public void deleteOrder(Long id) {
        orderRepository.deleteById(id);
    }
}
