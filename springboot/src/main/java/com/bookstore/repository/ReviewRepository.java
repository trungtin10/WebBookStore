package com.bookstore.repository;

import com.bookstore.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findAllByOrderByIdDesc();

    List<Review> findByProductIdOrderByIdDesc(Long productId);

    // Lấy các đánh giá đã được duyệt của một sản phẩm
    List<Review> findByProductIdAndIsApprovedTrueOrderByIdDesc(Long productId);

    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM Review r WHERE r.product.id = :productId AND r.isApproved = true")
    Double getAverageRating(@Param("productId") Long productId);

    @Query("SELECT r.rating, COUNT(r) FROM Review r WHERE r.product.id = :productId AND r.isApproved = true GROUP BY r.rating")
    List<Object[]> countReviewsByRating(@Param("productId") Long productId);

    @Modifying
    @Query("DELETE FROM Review r WHERE r.product.id = :productId")
    void deleteByProductId(@Param("productId") Long productId);
}
