package com.bookstore.controller.api;

import com.bookstore.model.District;
import com.bookstore.model.Province;
import com.bookstore.model.Ward;
import com.bookstore.service.LocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/location")
public class LocationRestController {

    @Autowired
    private LocationService locationService;

    @GetMapping("/provinces")
    public List<Province> getProvinces() {
        return locationService.getAllProvinces();
    }

    @GetMapping("/districts/{provinceCode}")
    public List<District> getDistricts(@PathVariable(name = "provinceCode") String provinceCode) {
        return locationService.getDistrictsByProvince(provinceCode);
    }

    @GetMapping("/wards/{districtCode}")
    public List<Ward> getWards(@PathVariable(name = "districtCode") String districtCode) {
        return locationService.getWardsByDistrict(districtCode);
    }
}
