package com.bookstore.repository;

import com.bookstore.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByNameContainingIgnoreCaseOrderByIdDesc(String keyword);
    org.springframework.data.domain.Page<Category> findByNameContainingIgnoreCaseOrderByIdDesc(String keyword, org.springframework.data.domain.Pageable pageable);
}
