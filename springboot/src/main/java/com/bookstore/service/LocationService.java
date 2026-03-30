package com.bookstore.service;

import com.bookstore.model.District;
import com.bookstore.model.Province;
import com.bookstore.model.Ward;
import com.bookstore.repository.DistrictRepository;
import com.bookstore.repository.ProvinceRepository;
import com.bookstore.repository.WardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LocationService {

    @Autowired
    private ProvinceRepository provinceRepository;

    @Autowired
    private DistrictRepository districtRepository;

    @Autowired
    private WardRepository wardRepository;

    public List<Province> getAllProvinces() {
        return provinceRepository.findAllByOrderByNameAsc();
    }

    public List<District> getDistrictsByProvince(String provinceCode) {
        return districtRepository.findByProvinceCodeOrderByNameAsc(provinceCode);
    }

    public List<Ward> getWardsByDistrict(String districtCode) {
        return wardRepository.findByDistrictCodeOrderByNameAsc(districtCode);
    }
}
