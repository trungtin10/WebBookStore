package com.bookstore.service;

import com.bookstore.model.Category;
import com.bookstore.model.Product;
import com.bookstore.model.InventoryLog;
import com.bookstore.repository.CategoryRepository;
import com.bookstore.repository.InventoryLogRepository;
import com.bookstore.repository.OrderDetailRepository;
import com.bookstore.repository.ProductRepository;
import com.bookstore.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private InventoryLogRepository inventoryLogRepository;

    @Autowired
    private OrderDetailRepository orderDetailRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    public Page<Product> getAllProducts(Pageable pageable) {
        return productRepository.findAll(pageable);
    }

    public Page<Product> searchProducts(String keyword, Pageable pageable) {
        return productRepository.findByNameContainingIgnoreCaseOrderByIdDesc(keyword, pageable);
    }

    public Page<Product> getProductsByCategory(Long categoryId, Pageable pageable) {
        return productRepository.findByCategoryIdOrderByIdDesc(categoryId, pageable);
    }

    public List<Product> searchProducts(Long categoryId, String keyword, String sort) {
        org.springframework.data.domain.Sort sortOrder;
        switch (sort) {
            case "priceAsc":
                sortOrder = org.springframework.data.domain.Sort.by("price").ascending();
                break;
            case "priceDesc":
                sortOrder = org.springframework.data.domain.Sort.by("price").descending();
                break;
            case "soldDesc":
                sortOrder = org.springframework.data.domain.Sort.by("soldCount").descending();
                break;
            default:
                sortOrder = org.springframework.data.domain.Sort.by("id").descending();
                break;
        }
        return productRepository.searchProducts(keyword, categoryId, sortOrder);
    }

    public List<Product> getBestSellingProducts(int limit) {
        return productRepository.findAll(PageRequest.of(0, limit, org.springframework.data.domain.Sort.by("soldCount").descending())).getContent();
    }

    public List<Product> getNewArrivals(int limit) {
        return productRepository.findAll(PageRequest.of(0, limit, org.springframework.data.domain.Sort.by("id").descending())).getContent();
    }

    public List<Product> getBestSellers() {
        return productRepository.findTop10ByOrderBySoldCountDesc();
    }

    public List<Product> getNewArrivals() {
        return productRepository.findTop10ByOrderByCreatedAtDesc();
    }

    public List<Product> getOnSaleProducts() {
        // Match Node.js behavior: Randomized selection of 10 products
        return productRepository.findRandomProducts(10);
    }

    public List<Product> getRelatedProducts(Long productId, Long categoryId) {
        if (categoryId == null) return java.util.Collections.emptyList();
        // Match Node.js behavior: Randomized selection of 5 related products
        return productRepository.findRandomRelatedProducts(productId, categoryId, 5);
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        // Delete related records first to avoid Foreign Key constraints
        reviewRepository.deleteByProductId(id);
        inventoryLogRepository.deleteByProductId(id);
        orderDetailRepository.deleteByProductId(id);
        
        // Finally delete the product
        productRepository.deleteById(id);
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public List<Category> searchCategories(String keyword) {
        return categoryRepository.findByNameContainingIgnoreCaseOrderByIdDesc(keyword);
    }

    public Optional<Category> getCategoryById(Long id) {
        return categoryRepository.findById(id);
    }

    public Category saveCategory(Category category) {
        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }

    public void importStock(Long productId, Integer quantity, String note) {
        Product product = productRepository.findById(productId).orElseThrow();
        product.setQuantity(product.getQuantity() + quantity);
        productRepository.save(product);
        
        InventoryLog log = new InventoryLog(product, quantity, "IMPORT", note);
        inventoryLogRepository.save(log);
    }

    public void exportStock(Long productId, Integer quantity, String note) {
        Product product = productRepository.findById(productId).orElseThrow();
        if (product.getQuantity() < quantity) {
            throw new RuntimeException("Số lượng tồn kho không đủ để xuất!");
        }
        product.setQuantity(product.getQuantity() - quantity);
        productRepository.save(product);
        
        InventoryLog log = new InventoryLog(product, -quantity, "EXPORT", note);
        inventoryLogRepository.save(log);
    }

    public List<InventoryLog> getInventoryLogs(Long productId) {
        return inventoryLogRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    public Page<Product> searchInventory(String keyword, Long categoryId, String stockStatus, Pageable pageable) {
        return productRepository.searchInventory(keyword, categoryId, stockStatus, pageable);
    }

    public Long getTotalStockQuantity() {
        Long total = productRepository.getTotalStockQuantity();
        return total != null ? total : 0L;
    }

    public long countLowStockProducts() {
        return productRepository.countByQuantityLessThan(10);
    }

    public Page<Product> searchAdminProducts(String keyword, Long categoryId, String status, Pageable pageable) {
        return productRepository.searchAdminProducts(keyword, categoryId, status, pageable);
    }

    public Page<Category> getAllCategories(Pageable pageable) {
        return categoryRepository.findAll(pageable);
    }

    public Page<Category> searchCategories(String keyword, Pageable pageable) {
        return categoryRepository.findByNameContainingIgnoreCaseOrderByIdDesc(keyword, pageable);
    }
}
