package com.bookstore.repository;

import com.bookstore.model.Ward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WardRepository extends JpaRepository<Ward, String> {
    List<Ward> findByDistrictCodeOrderByNameAsc(String districtCode);
}
