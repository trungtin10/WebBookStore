package com.bookstore.controller;

import org.springframework.stereotype.Controller;

@Controller
public class OrderController {
    // Checkout flow is handled by CheckoutController (POST /checkout, POST /order)
    // Order success: CheckoutController handles /order/success/{id}
}
