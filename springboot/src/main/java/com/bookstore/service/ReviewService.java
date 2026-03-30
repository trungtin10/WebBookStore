package com.bookstore.service;

import com.bookstore.model.Review;
import com.bookstore.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.HashMap;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    public List<Review> getAllReviews() {
        return reviewRepository.findAllByOrderByIdDesc();
    }

    public List<Review> getReviewsByProductId(Long productId) {
        return reviewRepository.findByProductIdOrderByIdDesc(productId);
    }

    public List<Review> getApprovedReviewsByProductId(Long productId) {
        return reviewRepository.findByProductIdAndIsApprovedTrueOrderByIdDesc(productId);
    }

    public Review saveReview(Review review) {
        review.setIsApproved(true);
        return reviewRepository.save(review);
    }

    @Transactional
    public void addAdminReply(Long reviewId, String reply) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found with id: " + reviewId));
        review.setAdminReply(reply);
        reviewRepository.save(review);
    }

    @Transactional
    public void deleteAdminReply(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found with id: " + reviewId));
        review.setAdminReply(null);
        reviewRepository.save(review);
    }

    public void deleteReview(Long id) {
        reviewRepository.deleteById(id);
    }

    public Map<String, Object> getRatingStats(Long productId) {
        Double average = reviewRepository.getAverageRating(productId);
        List<Object[]> counts = reviewRepository.countReviewsByRating(productId);
        long total = counts.stream().mapToLong(row -> (long) row[1]).sum();

        Map<Integer, Long> ratingCounts = IntStream.rangeClosed(1, 5)
                .boxed()
                .collect(Collectors.toMap(i -> i, i -> 0L));
        
        counts.forEach(row -> ratingCounts.put((Integer) row[0], (Long) row[1]));

        Map<Integer, Double> percentages = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            percentages.put(i, total > 0 ? (double) ratingCounts.get(i) * 100 / total : 0.0);
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("average", average != null ? average : 0.0);
        stats.put("total", total);
        stats.put("percentages", percentages);

        return stats;
    }
}
