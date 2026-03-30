package com.bookstore.repository;

import com.bookstore.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserIdOrderByOrderDateDesc(Long userId);
    List<Order> findAllByOrderByOrderDateDesc();

    @Query("SELECT SUM(o.finalTotal) FROM Order o WHERE o.status = 'COMPLETED'")
    Double getTotalRevenue();

    @Query("SELECT o FROM Order o WHERE " +
           "(:keyword IS NULL OR LOWER(o.shippingName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "CAST(o.id AS string) LIKE CONCAT('%', :keyword, '%') OR " +
           "LOWER(o.trackingCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "o.shippingPhone LIKE CONCAT('%', :keyword, '%')) AND " +
           "(:status IS NULL OR o.status = :status) AND " +
           "(:paymentStatus IS NULL OR o.paymentStatus = :paymentStatus) " +
           "ORDER BY o.orderDate DESC")
    List<Order> searchOrders(@Param("keyword") String keyword, @Param("status") String status, @Param("paymentStatus") String paymentStatus);

    long countByStatus(String status);

    @Query(value = "SELECT DATE(order_date) as date, SUM(final_total) as revenue " +
            "FROM orders " +
            "WHERE status = 'COMPLETED' " +
            "AND order_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) " +
            "GROUP BY DATE(order_date) " +
            "ORDER BY date ASC", nativeQuery = true)
    List<Object[]> getRevenueByDay();
}
