package com.bookstore.config;

import com.bookstore.model.Province;
import com.bookstore.repository.ProvinceRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;

/**
 * Seed provinces from provinces.open-api.vn when DB is empty.
 * DataInitializer (Order 2) sẽ cập nhật region và distance_km cho phí ship Bắc/Trung/Nam.
 */
@Component
@Order(1)
public class LocationSeeder implements CommandLineRunner {

    private static final String API_BASE = "https://provinces.open-api.vn/api";

    @Autowired
    private ProvinceRepository provinceRepository;
    @Autowired
    private RestTemplate restTemplate;
    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public void run(String... args) throws Exception {
        if (provinceRepository.count() > 0) return;

        try {
            String json = restTemplate.getForObject(API_BASE + "/p/", String.class);
            if (json == null || json.isEmpty()) return;

            List<JsonNode> provinces = objectMapper.readValue(json, new TypeReference<>() {});
            for (JsonNode p : provinces) {
                String code = String.valueOf(p.get("code").asInt());
                String name = p.has("name") ? p.get("name").asText() : "";
                if (name.isEmpty()) continue;

                Province province = new Province();
                province.setCode(code);
                province.setName(name);
                province.setFullName(name);
                province.setCodeName(p.has("codename") ? p.get("codename").asText() : null);
                provinceRepository.save(province);
            }
        } catch (Exception e) {
            System.err.println("LocationSeeder: " + e.getMessage());
        }
    }
}
