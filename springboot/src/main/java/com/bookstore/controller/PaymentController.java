package com.bookstore.controller;

import com.bookstore.model.Order;
import com.bookstore.security.CustomUserDetails;
import com.bookstore.service.NotificationService;
import com.bookstore.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Optional;

@Controller
@RequestMapping("/payment")
public class PaymentController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private NotificationService notificationService;

    /**
     * Show mock payment gateway page (MOMO/VNPAY).
     */
    @GetMapping("/gateway")
    public String paymentGateway(
            @RequestParam("orderId") Long orderId,
            @RequestParam("amount") double amount,
            @RequestParam("method") String method,
            Model model,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        if (userDetails == null) return "redirect:/login";

        model.addAttribute("orderId", orderId);
        model.addAttribute("amount", amount);
        model.addAttribute("method", method);
        return "payment_gateway";
    }

    /**
     * Handle payment gateway confirmation (SUCCESS or FAILED).
     */
    @PostMapping("/confirm")
    public String confirmPayment(
            @RequestParam("orderId") Long orderId,
            @RequestParam("status") String status,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        if (userDetails == null) return "redirect:/login";

        Long userId = userDetails.getUser().getId();

        if ("SUCCESS".equals(status)) {
            Optional<Order> orderOpt = orderService.getOrderById(orderId);
            orderOpt.ifPresent(o -> {
                o.setPaymentStatus("PAID");
                orderService.save(o);
            });

            notificationService.createNotification(
                    userId,
                    "Thanh toán thành công!",
                    "Đơn hàng #" + orderId + " đã được thanh toán. Chúng tôi sẽ sớm xử lý đơn hàng của bạn.",
                    "success"
            );
            return "redirect:/order/success/" + orderId;

        } else {
            Optional<Order> orderOpt = orderService.getOrderById(orderId);
            orderOpt.ifPresent(o -> {
                o.setStatus("CANCELLED");
                o.setPaymentStatus("FAILED");
                orderService.save(o);
            });

            notificationService.createNotification(
                    userId,
                    "Thanh toán thất bại!",
                    "Đơn hàng #" + orderId + " đã bị hủy do thanh toán không thành công. Vui lòng đặt lại.",
                    "danger"
            );
            return "redirect:/cart?paymentFailed=true";
        }
    }
}
