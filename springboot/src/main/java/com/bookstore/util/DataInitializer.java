package com.bookstore.util;

import com.bookstore.model.Province;
import com.bookstore.repository.ProvinceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Order(2)
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private ProvinceRepository provinceRepository;

    @Override
    public void run(String... args) throws Exception {
        updateProvinceData();
    }

    private void updateProvinceData() {
        List<Province> provinces = provinceRepository.findAll();
        if (provinces.isEmpty()) return;

        for (Province p : provinces) {
            String name = p.getName().toLowerCase();
            
            // South (Nam) - Base fee 20k
            if (isSouth(name)) {
                p.setRegion("Nam");
                p.setDistanceKm(getDistanceSouth(name));
            } 
            // Central (Trung) - Base fee 30k
            else if (isCentral(name)) {
                p.setRegion("Trung");
                p.setDistanceKm(getDistanceCentral(name));
            }
            // North (Bắc) - Base fee 40k
            else {
                p.setRegion("Bắc");
                p.setDistanceKm(getDistanceNorth(name));
            }
            provinceRepository.save(p);
        }
    }

    private boolean isSouth(String name) {
        return name.contains("hồ chí minh") || name.contains("bình dương") || name.contains("đồng nai") ||
               name.contains("long an") || name.contains("tiền giang") || name.contains("bến tre") ||
               name.contains("vĩnh long") || name.contains("trà vinh") || name.contains("đồng tháp") ||
               name.contains("an giang") || name.contains("kiên giang") || name.contains("cần thơ") ||
               name.contains("hậu giang") || name.contains("sóc trăng") || name.contains("bạc liêu") ||
               name.contains("cà mau") || name.contains("tây ninh") || name.contains("bình phước") ||
               name.contains("vũng tàu");
    }

    private boolean isCentral(String name) {
        return name.contains("đà nẵng") || name.contains("quảng nam") || name.contains("quảng ngãi") ||
               name.contains("bình định") || name.contains("phú yên") || name.contains("khánh hòa") ||
               name.contains("ninh thuận") || name.contains("bình thuận") || name.contains("kon tum") ||
               name.contains("gia lai") || name.contains("đắk lắk") || name.contains("đắk nông") ||
               name.contains("lâm đồng") || name.contains("thanh hóa") || name.contains("nghệ an") ||
               name.contains("hà tĩnh") || name.contains("quảng bình") || name.contains("quảng trị") ||
               name.contains("thừa thiên huế");
    }

    private double getDistanceSouth(String name) {
        if (name.contains("hồ chí minh")) return 0.0;
        if (name.contains("bình dương")) return 30.0;
        if (name.contains("đồng nai")) return 30.0;
        if (name.contains("long an")) return 50.0;
        if (name.contains("vũng tàu")) return 100.0;
        if (name.contains("cần thơ")) return 170.0;
        return 150.0; // Average South
    }

    private double getDistanceCentral(String name) {
        if (name.contains("đà nẵng")) return 960.0;
        if (name.contains("huế")) return 1050.0;
        if (name.contains("nha trang") || name.contains("khánh hòa")) return 450.0;
        if (name.contains("đà lạt") || name.contains("lâm đồng")) return 300.0;
        return 700.0; // Average Central
    }

    private double getDistanceNorth(String name) {
        if (name.contains("hà nội")) return 1730.0;
        if (name.contains("hải phòng")) return 1700.0;
        return 1600.0; // Average North
    }
}
