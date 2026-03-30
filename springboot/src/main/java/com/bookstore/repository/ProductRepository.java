package com.bookstore.repository;

import com.bookstore.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByNameContainingIgnoreCaseOrderByIdDesc(String keyword, Pageable pageable);

    // Sửa lại: JOIN với p.category thay vì p.categories
    @Query("SELECT p FROM Product p WHERE p.category.id = :categoryId ORDER BY p.id DESC")
    Page<Product> findByCategoryIdOrderByIdDesc(@Param("categoryId") Long categoryId, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE " +
           "(:keyword IS NULL OR p.name LIKE %:keyword%) AND " +
           "(:categoryId IS NULL OR p.category.id = :categoryId)")
    List<Product> searchProducts(@Param("keyword") String keyword, @Param("categoryId") Long categoryId, Sort sort);

    List<Product> findTop10ByOrderBySoldCountDesc();

    List<Product> findTop10ByOrderByCreatedAtDesc();

    @Query(value = "SELECT * FROM products ORDER BY RAND() LIMIT :limit", nativeQuery = true)
    List<Product> findRandomProducts(@Param("limit") int limit);

    @Query(value = "SELECT p.* FROM products p " +
                   "WHERE p.id != :productId AND p.category_id = :categoryId " +
                   "ORDER BY RAND() LIMIT :limit", nativeQuery = true)
    List<Product> findRandomRelatedProducts(@Param("productId") Long productId, @Param("categoryId") Long categoryId, @Param("limit") int limit);

    @Query("SELECT p FROM Product p WHERE " +
           "(:keyword IS NULL OR p.name LIKE %:keyword%) AND " +
           "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
           "(:stockStatus = 'all' OR " +
           "(:stockStatus = 'ok' AND p.quantity >= 10) OR " +
           "(:stockStatus = 'low' AND p.quantity > 0 AND p.quantity < 10) OR " +
           "(:stockStatus = 'out' AND p.quantity = 0))")
    Page<Product> searchInventory(@Param("keyword") String keyword, @Param("categoryId") Long categoryId, @Param("stockStatus") String stockStatus, Pageable pageable);

    @Query("SELECT SUM(p.quantity) FROM Product p")
    Long getTotalStockQuantity();

    long countByQuantityLessThan(int stockLevel);

    @Query("SELECT p FROM Product p WHERE " +
           "(:keyword IS NULL OR p.name LIKE %:keyword%) AND " +
           "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
           "(:status = 'all' OR " +
           "(:status = 'hidden' AND p.isHidden = true) OR " +
           "(:status = 'visible' AND p.isHidden = false))")
    Page<Product> searchAdminProducts(@Param("keyword") String keyword, @Param("categoryId") Long categoryId, @Param("status") String status, Pageable pageable);
}
