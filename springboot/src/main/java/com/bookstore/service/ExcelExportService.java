package com.bookstore.service;

import com.bookstore.model.Order;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ExcelExportService {

    public ByteArrayInputStream exportOrdersToExcel(List<Order> orders) throws IOException {
        String[] columns = {"Mã ĐH", "Khách Hàng", "Số Điện Thoại", "Địa Chỉ", "Tổng Tiền", "Trạng Thái", "Thanh Toán", "Ngày Đặt"};

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Danh Sách Đơn Hàng");

            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.BLACK.getIndex());

            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);

            // Create Header Row
            Row headerRow = sheet.createRow(0);
            for (int col = 0; col < columns.length; col++) {
                Cell cell = headerRow.createCell(col);
                cell.setCellValue(columns[col]);
                cell.setCellStyle(headerCellStyle);
            }

            int rowIdx = 1;
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

            for (Order order : orders) {
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue("#" + order.getId());
                
                String customerName = order.getShippingName();
                if (customerName == null || customerName.isEmpty()) {
                    customerName = order.getUser() != null ? order.getUser().getFullName() : "Khách Vãng Lai";
                }
                row.createCell(1).setCellValue(customerName);

                String customerPhone = order.getShippingPhone();
                if (customerPhone == null || customerPhone.isEmpty()) {
                    customerPhone = order.getUser() != null ? order.getUser().getPhone() : "";
                }
                row.createCell(2).setCellValue(customerPhone);

                row.createCell(3).setCellValue(order.getShippingAddress());
                row.createCell(4).setCellValue(String.format("%,.0f đ", order.getFinalTotal()));
                row.createCell(5).setCellValue(translateStatus(order.getStatus()));
                row.createCell(6).setCellValue("PAID".equals(order.getPaymentStatus()) ? "Đã thanh toán" : "Chưa thanh toán");
                row.createCell(7).setCellValue(order.getOrderDate() != null ? order.getOrderDate().format(formatter) : "");
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    private String translateStatus(String status) {
        if (status == null) return "";
        return switch (status) {
            case "PENDING" -> "Chờ xác nhận";
            case "CONFIRMED" -> "Đã xác nhận";
            case "PROCESSING" -> "Đang xử lý";
            case "SHIPPED" -> "Đã giao cho ĐVVC";
            case "DELIVERING" -> "Đang giao hàng";
            case "COMPLETED" -> "Hoàn thành";
            case "CANCELLED" -> "Đã hủy";
            default -> status;
        };
    }
}
