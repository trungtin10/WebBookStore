package com.bookstore.service;

import com.bookstore.model.Province;
import com.bookstore.repository.ProvinceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ShippingService {

    @Autowired
    private ProvinceRepository provinceRepository;

    private static final double RATE_PER_KM = 200.0;
    private static final double FREE_SHIPPING_THRESHOLD = 1000000.0;

    public double calculateShippingFee(String provinceCode, double subtotal) {
        if (subtotal >= FREE_SHIPPING_THRESHOLD) {
            return 0.0;
        }

        Optional<Province> provinceOpt = provinceRepository.findById(provinceCode);
        if (provinceOpt.isEmpty()) {
            return 30000.0; // Default fee
        }

        Province province = provinceOpt.get();
        double baseFee = 20000.0; // Default South
        
        String region = province.getRegion();
        if (region != null) {
            switch (region) {
                case "Bắc":
                    baseFee = 40000.0;
                    break;
                case "Trung":
                    baseFee = 30000.0;
                    break;
                case "Nam":
                default:
                    baseFee = 20000.0;
                    break;
            }
        }

        double distance = province.getDistanceKm() != null ? province.getDistanceKm() : 0.0;
        double distanceFee = distance * RATE_PER_KM;

        return baseFee + distanceFee;
    }
}
