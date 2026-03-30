package com.bookstore.repository;

import com.bookstore.model.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Optional<Coupon> findByCodeAndIsActiveTrue(String code);
    List<Coupon> findByIsActiveTrueAndExpirationDateGreaterThanEqualOrExpirationDateIsNullOrderByDiscountValueDesc(LocalDate date);
}
