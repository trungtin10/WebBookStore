package com.bookstore.controller.api;

import com.bookstore.service.ShippingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/shipping")
public class ShippingRestController {

    @Autowired
    private ShippingService shippingService;

    @GetMapping("/calculate")
    public Map<String, Object> calculateShipping(
            @RequestParam(name = "provinceCode") String provinceCode,
            @RequestParam(name = "subtotal") double subtotal) {
        
        double fee = shippingService.calculateShippingFee(provinceCode, subtotal);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("fee", fee);
        return response;
    }
}
