package com.bookstore.repository;

import com.bookstore.model.Province;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProvinceRepository extends JpaRepository<Province, String> {
    List<Province> findAllByOrderByNameAsc();
}
