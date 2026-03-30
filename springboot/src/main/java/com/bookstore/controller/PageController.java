package com.bookstore.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class PageController {

    @GetMapping("/pages/{slug}")
    public String viewPage(@PathVariable(name = "slug") String slug, Model model) {
        String title = "";
        String content = "";

        switch (slug) {
            case "about":
                title = "Giới thiệu BookTotal";
                content = "<div class=\"static-content\"><div class=\"text-center mb-4\"><img src=\"/images/about-banner.jpg\" class=\"img-fluid rounded shadow-sm\" alt=\"Về BookTotal\" onerror=\"this.style.display='none'\"></div><p><strong>BookTotal</strong> là điểm đến lý tưởng cho những người yêu sách tại Việt Nam. Được thành lập từ năm 2024, chúng tôi không chỉ là một cửa hàng bán sách trực tuyến, mà còn là một cộng đồng kết nối tri thức.</p><h5 class=\"mt-4\">Sứ mệnh của chúng tôi</h5><p>Mang tri thức đến mọi nhà với chi phí hợp lý nhất và dịch vụ tận tâm nhất. Chúng tôi tin rằng mỗi cuốn sách là một cánh cửa mở ra thế giới mới, và nhiệm vụ của chúng tôi là giúp bạn mở những cánh cửa đó một cách dễ dàng.</p><h5 class=\"mt-4\">Giá trị cốt lõi</h5><ul><li><strong>Chất lượng:</strong> Chỉ cung cấp sách chính hãng 100% từ các nhà xuất bản uy tín.</li><li><strong>Tận tâm:</strong> Luôn đặt khách hàng làm trung tâm trong mọi hoạt động.</li><li><strong>Sáng tạo:</strong> Không ngừng cải tiến công nghệ để mang lại trải nghiệm mua sắm hiện đại.</li><li><strong>Trách nhiệm:</strong> Đóng góp tích cực cho sự phát triển văn hóa đọc của cộng đồng.</li></ul><h5 class=\"mt-4\">Đội ngũ của chúng tôi</h5><p>BookTotal quy tụ những người trẻ đầy nhiệt huyết, am hiểu về sách và công nghệ, luôn sẵn sàng hỗ trợ bạn tìm kiếm những tựa sách phù hợp nhất với nhu cầu của mình.</p></div>";
                break;
            case "terms":
                title = "Điều khoản sử dụng";
                content = "<div class=\"static-content\"><p>Chào mừng bạn đến với <strong>BookTotal</strong>. Khi sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ các điều khoản và điều kiện sau đây. Vui lòng đọc kỹ trước khi sử dụng website.</p><h5 class=\"mt-4\">1. Chấp thuận các Điều khoản</h5><p>Bằng cách truy cập và sử dụng website BookTotal, bạn xác nhận rằng bạn đã đọc, hiểu và đồng ý bị ràng buộc bởi các điều khoản này.</p><h5 class=\"mt-4\">2. Tài khoản Người dùng</h5><p>Để thực hiện mua hàng, bạn có thể cần đăng ký tài khoản. Bạn có trách nhiệm duy trì tính bảo mật của thông tin tài khoản và mật khẩu của mình.</p></div>";
                break;
            case "privacy":
                title = "Chính sách bảo mật";
                content = "<div class=\"static-content\"><p>Tại <strong>BookTotal</strong>, chúng tôi coi trọng quyền riêng tư của bạn. Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn.</p><h5 class=\"mt-4\">1. Thông tin chúng tôi thu thập</h5><p>Chúng tôi thu thập thông tin bạn cung cấp trực tiếp cho chúng tôi, chẳng hạn như khi bạn tạo tài khoản, thực hiện mua hàng.</p></div>";
                break;
            case "shipping-policy":
                title = "Chính sách vận chuyển";
                content = "<div class=\"static-content\"><p>BookTotal hợp tác với các đơn vị vận chuyển uy tín nhất (Giao Hàng Nhanh, Viettel Post, Ninja Van) để đảm bảo sách đến tay bạn nhanh chóng và an toàn.</p></div>";
                break;
            case "return-policy":
                title = "Chính sách đổi trả";
                content = "<div class=\"static-content\"><p>BookTotal cam kết bảo vệ quyền lợi khách hàng thông qua chính sách đổi trả linh hoạt trong vòng <strong>7 ngày</strong> kể từ khi nhận hàng thành công.</p></div>";
                break;
            case "faq":
                title = "Câu hỏi thường gặp (FAQ)";
                content = "<div class=\"static-content\"><h5 class=\"mt-4\">1. Tôi có thể hủy đơn hàng sau khi đã đặt không?</h5><p>Bạn hoàn toàn có thể hủy đơn hàng nếu trạng thái đơn hàng vẫn đang là \"Chờ xác nhận\".</p></div>";
                break;
            default:
                return "redirect:/404";
        }

        model.addAttribute("title", title);
        model.addAttribute("content", content);
        return "pages/page";
    }

    @GetMapping("/403")
    public String accessDenied() {
        return "403";
    }

    @GetMapping("/404")
    public String notFound() {
        return "404";
    }
}
