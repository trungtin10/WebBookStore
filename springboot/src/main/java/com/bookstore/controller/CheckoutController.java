package com.bookstore.controller;

import com.bookstore.model.CartItem;
import com.bookstore.model.Order;
import com.bookstore.model.OrderDetail;
import com.bookstore.model.Product;
import com.bookstore.model.User;
import com.bookstore.security.CustomUserDetails;
import com.bookstore.service.NotificationService;
import com.bookstore.service.OrderService;
import com.bookstore.service.ProductService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Controller
public class CheckoutController {

    @Autowired private OrderService orderService;
    @Autowired private ProductService productService;
    @Autowired private NotificationService notificationService;
    @Autowired private com.bookstore.service.ShippingService shippingService;

    // ────────────────────────────────────────────────
    // Step 1: POST /checkout  (from cart "Checkout" button)
    // ────────────────────────────────────────────────
    @PostMapping("/checkout")
    public String checkoutForm(
            @RequestParam(name = "selectedItems", required = false) List<Long> selectedItems,
            @RequestParam(name = "discount", defaultValue = "0") double discount,
            HttpSession session,
            Model model,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        if (userDetails == null) return "redirect:/login?returnUrl=/cart";

        List<CartItem> cart = getCart(session);
        if (cart.isEmpty()) return "redirect:/cart";

        // Filter to selected items; if none selected, use all
        List<CartItem> items;
        if (selectedItems != null && !selectedItems.isEmpty()) {
            final List<Long> sel = selectedItems;
            items = cart.stream().filter(i -> sel.contains(i.getId())).toList();
        } else {
            items = new ArrayList<>(cart);
        }
        if (items.isEmpty()) return "redirect:/cart";

        double total    = subtotal(items);
        // Default to HCM for initial charge if no province selected yet
        double shipping = shippingService.calculateShippingFee("79", total); // 79 is HCM code

        session.setAttribute("checkoutItems",   items);
        session.setAttribute("discountAmount",  discount);
        session.setAttribute("totalAmount",     total);
        session.setAttribute("shippingFee",     shipping);

        model.addAttribute("cart",           items);
        model.addAttribute("totalAmount",    total);
        model.addAttribute("shippingFee",    shipping);
        model.addAttribute("productDiscount", discount);
        model.addAttribute("finalTotal",     total + shipping - discount);
        model.addAttribute("user",           userDetails.getUser());
        return "checkout";
    }

    // ────────────────────────────────────────────────
    // Step 2: POST /order  (submit checkout form)
    // ────────────────────────────────────────────────
    @PostMapping("/order")
    public String createOrder(
            @RequestParam(name = "fullName")     String fullName,
            @RequestParam(name = "phone")        String phone,
            @RequestParam(name = "email")        String email,
            @RequestParam(name = "province")     String provinceCode,
            @RequestParam(name = "district", required = false) String districtCode,
            @RequestParam(name = "ward", required = false) String wardCode,
            @RequestParam(name = "address")      String fullAddress,
            @RequestParam(name = "paymentMethod") String paymentMethod,
            @RequestParam(name = "note", required = false, defaultValue = "") String note,
            HttpSession session,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        if (userDetails == null) return "redirect:/login";

        // Admin cannot place orders
        if (userDetails.getUser().getRole() != null &&
            userDetails.getUser().getRole().equals("ROLE_ADMIN")) {
            return "redirect:/admin";
        }

        @SuppressWarnings("unchecked")
        List<CartItem> items = (List<CartItem>) session.getAttribute("checkoutItems");
        if (items == null || items.isEmpty()) return "redirect:/cart";

        double total     = sessionDouble(session, "totalAmount");
        double discount  = sessionDouble(session, "discountAmount");
        
        // Recalculate shipping fee in backend for security
        double shipping  = shippingService.calculateShippingFee(provinceCode, total);
        double finalTotal = total + shipping - discount;

        User user = userDetails.getUser();
        // address từ form đã là địa chỉ đầy đủ (số nhà, phường, quận, tỉnh)

        Order order = buildOrder(user, fullName, phone, fullAddress, note, paymentMethod,
                                 total, shipping, discount, finalTotal);

        List<OrderDetail> details = buildDetails(items);
        Order saved = orderService.createOrder(order, details);

        // Remove purchased items from cart
        @SuppressWarnings("unchecked")
        List<CartItem> fullCart = (List<CartItem>) session.getAttribute("cart");
        if (fullCart != null) {
            List<Long> boughtIds = items.stream().map(CartItem::getId).toList();
            fullCart.removeIf(i -> boughtIds.contains(i.getId()));
            session.setAttribute("cart", fullCart);
        }

        // Clear temporary session data
        session.removeAttribute("checkoutItems");
        session.removeAttribute("discountAmount");
        session.removeAttribute("totalAmount");
        session.removeAttribute("shippingFee");

        Long orderId = saved.getId();

        // Redirect to payment gateway for online payments
        if ("MOMO".equals(paymentMethod) || "VNPAY".equals(paymentMethod)) {
            return "redirect:/payment/gateway?orderId=" + orderId
                   + "&amount=" + finalTotal + "&method=" + paymentMethod;
        }

        // COD: notify and redirect to success page
        notificationService.createNotification(user.getId(),
            "Đặt hàng thành công!",
            "Đơn hàng #" + orderId + " của bạn đã được ghi nhận. Chúng tôi sẽ sớm liên hệ xác nhận.",
            "success");

        return "redirect:/order/success/" + orderId;
    }

    // ────────────────────────────────────────────────
    // Order success page
    // ────────────────────────────────────────────────
    @GetMapping("/order/success/{id}")
    public String orderSuccess(@PathVariable("id") Long id, Model model,
                               @AuthenticationPrincipal CustomUserDetails ud) {
        if (ud == null) return "redirect:/login";
        model.addAttribute("orderId", id);
        return "order_success";
    }

    // ────────────────────────────────────────────────
    // Order history  /orders
    // ────────────────────────────────────────────────
    @GetMapping("/orders")
    public String orderHistory(Model model, @AuthenticationPrincipal CustomUserDetails ud) {
        if (ud == null) return "redirect:/login";
        model.addAttribute("orders", orderService.getOrdersByUserId(ud.getUser().getId()));
        return "order_history";
    }

    // ────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────
    @SuppressWarnings("unchecked")
    private List<CartItem> getCart(HttpSession session) {
        List<CartItem> c = (List<CartItem>) session.getAttribute("cart");
        return c != null ? c : new ArrayList<>();
    }

    private double subtotal(List<CartItem> items) {
        return items.stream().mapToDouble(i -> i.getPrice() * i.getQuantity()).sum();
    }

    private double sessionDouble(HttpSession session, String key) {
        try { Object v = session.getAttribute(key); return v == null ? 0.0 : Double.parseDouble(v.toString()); }
        catch (Exception e) { return 0.0; }
    }

    private Order buildOrder(User user, String name, String phone, String address,
                              String note, String payMethod,
                              double total, double shipping, double discount, double finalTotal) {
        Order o = new Order();
        o.setUser(user);
        o.setShippingName(name);
        o.setShippingPhone(phone);
        o.setShippingAddress(address);
        o.setOrderNote(note);
        o.setPaymentMethod(payMethod);
        o.setTotalMoney(total);
        o.setShippingFee(shipping);
        o.setDiscountAmount(discount);
        o.setFinalTotal(finalTotal);
        o.setStatus("PENDING");
        o.setPaymentStatus("COD".equals(payMethod) ? "UNPAID" : "PENDING_PAYMENT");
        return o;
    }

    private List<OrderDetail> buildDetails(List<CartItem> items) {
        List<OrderDetail> list = new ArrayList<>();
        for (CartItem item : items) {
            Optional<Product> p = productService.getProductById(item.getId());
            if (p.isPresent()) {
                OrderDetail d = new OrderDetail();
                d.setProduct(p.get());
                d.setPriceAtPurchase(item.getPrice());
                d.setQuantity(item.getQuantity());
                list.add(d);
            }
        }
        return list;
    }
}
