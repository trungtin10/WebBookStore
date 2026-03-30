package com.bookstore.service;

import com.bookstore.model.Coupon;
import com.bookstore.repository.CouponRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class CouponService {

    @Autowired
    private CouponRepository couponRepository;

    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    public List<Coupon> getAllActiveCoupons() {
        return couponRepository
                .findByIsActiveTrueAndExpirationDateGreaterThanEqualOrExpirationDateIsNullOrderByDiscountValueDesc(
                        LocalDate.now());
    }

    public Optional<Coupon> getCouponById(Long id) {
        return couponRepository.findById(id);
    }

    public Optional<Coupon> getCouponByCode(String code) {
        return couponRepository.findByCodeAndIsActiveTrue(code).filter(
                c -> (c.getExpirationDate() == null || c.getExpirationDate().isAfter(LocalDate.now().minusDays(1))) &&
                        (c.getUsageLimit() == null || c.getUsedCount() < c.getUsageLimit()));
    }

    public void incrementUsage(Long couponId) {
        Coupon coupon = couponRepository.findById(couponId).orElseThrow(() -> new RuntimeException("Coupon not found"));
        coupon.setUsedCount(coupon.getUsedCount() + 1);
        couponRepository.save(coupon);
    }

    public Coupon saveCoupon(Coupon coupon) {
        return couponRepository.save(coupon);
    }

    public void deleteCoupon(Long id) {
        couponRepository.deleteById(id);
    }
}
