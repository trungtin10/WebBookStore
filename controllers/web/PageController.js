const express = require('express');

class PageController {
    constructor() {
        this.router = express.Router();
        this.staticPages = {
            'terms': {
                title: 'Điều khoản sử dụng',
                content: `<div class="static-content">
                    <p>Chào mừng bạn đến với <strong>BookTotal</strong>. Khi truy cập và sử dụng website, bạn đồng ý tuân thủ các điều khoản dưới đây.</p>
                    <h4>1. Phạm vi áp dụng</h4>
                    <p>Điều khoản áp dụng cho mọi người dùng khi truy cập website, đặt hàng, thanh toán và sử dụng các tính năng tài khoản.</p>
                    <h4>2. Tài khoản người dùng</h4>
                    <ul>
                        <li>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mật khẩu tài khoản.</li>
                        <li>Không sử dụng tài khoản để thực hiện hành vi vi phạm pháp luật hoặc gây ảnh hưởng hệ thống.</li>
                        <li>BookTotal có quyền tạm khóa tài khoản nếu phát hiện dấu hiệu gian lận.</li>
                    </ul>
                    <h4>3. Đơn hàng và thanh toán</h4>
                    <ul>
                        <li>Đơn hàng chỉ được xác nhận khi hệ thống gửi trạng thái hợp lệ.</li>
                        <li>Giá bán và ưu đãi có thể thay đổi theo thời điểm mà không cần báo trước.</li>
                        <li>Khách hàng cần cung cấp thông tin giao nhận chính xác để tránh chậm trễ.</li>
                    </ul>
                    <h4>4. Quyền sở hữu nội dung</h4>
                    <p>Mọi nội dung trên website (hình ảnh, logo, văn bản, bố cục) thuộc quyền sở hữu của BookTotal hoặc đối tác liên quan và không được sao chép trái phép.</p>
                    <h4>5. Giới hạn trách nhiệm</h4>
                    <p>BookTotal không chịu trách nhiệm với các thiệt hại phát sinh do lỗi nhập sai thông tin từ phía người dùng hoặc sự cố ngoài khả năng kiểm soát (thiên tai, gián đoạn mạng diện rộng...).</p>
                    <h4>6. Điều chỉnh điều khoản</h4>
                    <p>Chúng tôi có thể cập nhật điều khoản để phù hợp vận hành thực tế. Phiên bản mới nhất luôn được công bố tại trang này.</p>
                </div>`
            },
            'privacy': {
                title: 'Chính sách bảo mật thông tin cá nhân',
                content: `<div class="static-content">
                    <p>BookTotal cam kết bảo mật dữ liệu cá nhân của khách hàng theo các nguyên tắc minh bạch và an toàn.</p>
                    <h4>1. Dữ liệu thu thập</h4>
                    <ul>
                        <li>Thông tin định danh: họ tên, email, số điện thoại, địa chỉ giao hàng.</li>
                        <li>Thông tin giao dịch: lịch sử đơn hàng, phương thức thanh toán, trạng thái đơn.</li>
                        <li>Dữ liệu kỹ thuật: IP, trình duyệt, cookie để tối ưu trải nghiệm sử dụng.</li>
                    </ul>
                    <h4>2. Mục đích sử dụng</h4>
                    <ul>
                        <li>Xử lý đơn hàng, giao hàng và chăm sóc sau bán.</li>
                        <li>Thông báo trạng thái đơn hàng, ưu đãi, chương trình khuyến mãi phù hợp.</li>
                        <li>Nâng cao chất lượng dịch vụ và cá nhân hóa nội dung hiển thị.</li>
                    </ul>
                    <h4>3. Chia sẻ thông tin</h4>
                    <p>BookTotal không bán dữ liệu người dùng. Thông tin chỉ được chia sẻ với đối tác vận chuyển/thanh toán khi cần thiết để hoàn tất đơn hàng.</p>
                    <h4>4. Quyền của khách hàng</h4>
                    <ul>
                        <li>Yêu cầu cập nhật/chỉnh sửa thông tin tài khoản.</li>
                        <li>Yêu cầu ngừng nhận thông báo marketing.</li>
                        <li>Yêu cầu xóa tài khoản theo chính sách hiện hành.</li>
                    </ul>
                </div>`
            },
            'payment-privacy': {
                title: 'Chính sách bảo mật thanh toán',
                content: `<div class="static-content">
                    <p>BookTotal áp dụng các tiêu chuẩn bảo mật để đảm bảo giao dịch thanh toán an toàn và minh bạch.</p>
                    <h4>1. Nguyên tắc bảo mật</h4>
                    <ul>
                        <li>Không lưu trữ thông tin thẻ thanh toán đầy đủ trên hệ thống nội bộ.</li>
                        <li>Dữ liệu thanh toán được truyền qua kết nối bảo mật.</li>
                        <li>Giao dịch được xử lý qua cổng thanh toán đối tác uy tín (VNPAY, MoMo...).</li>
                    </ul>
                    <h4>2. Xác thực và kiểm soát rủi ro</h4>
                    <ul>
                        <li>Hệ thống có thể yêu cầu xác minh thêm khi phát hiện giao dịch bất thường.</li>
                        <li>Đơn hàng có dấu hiệu gian lận có thể bị tạm dừng để kiểm tra.</li>
                    </ul>
                    <h4>3. Trách nhiệm khách hàng</h4>
                    <ul>
                        <li>Không cung cấp mã OTP/mật khẩu cho bất kỳ ai.</li>
                        <li>Đăng xuất khỏi thiết bị công cộng sau khi thanh toán.</li>
                    </ul>
                </div>`
            },
            'about': {
                title: 'Giới thiệu BookTotal',
                content: `<div class="static-content">
                    <p><strong>BookTotal</strong> là nền tảng bán sách trực tuyến hướng đến trải nghiệm mua sắm tiện lợi, minh bạch và đáng tin cậy.</p>
                    <h4>Sứ mệnh</h4>
                    <p>Kết nối người đọc với các đầu sách chất lượng, giúp việc tìm kiếm và mua sách trở nên nhanh chóng, dễ dàng.</p>
                    <h4>Giá trị cốt lõi</h4>
                    <ul>
                        <li><strong>Uy tín:</strong> thông tin sản phẩm rõ ràng, nguồn hàng đáng tin cậy.</li>
                        <li><strong>Tận tâm:</strong> hỗ trợ khách hàng nhanh, thân thiện.</li>
                        <li><strong>Cải tiến:</strong> liên tục nâng cấp trải nghiệm web và dịch vụ giao hàng.</li>
                    </ul>
                    <h4>Tầm nhìn</h4>
                    <p>Trở thành địa chỉ mua sách online được yêu thích tại Việt Nam cho mọi lứa tuổi.</p>
                </div>`
            },
            'store-system': {
                title: 'Hệ thống trung tâm - nhà sách',
                content: `<div class="static-content">
                    <p>BookTotal hiện phát triển hệ thống bán hàng trực tuyến kết hợp đối tác kho vận tại nhiều khu vực.</p>
                    <h4>Khu vực phục vụ chính</h4>
                    <ul>
                        <li>TP.HCM và các tỉnh lân cận.</li>
                        <li>Hà Nội và khu vực miền Bắc.</li>
                        <li>Đà Nẵng và một số tỉnh miền Trung.</li>
                    </ul>
                    <h4>Thời gian hỗ trợ</h4>
                    <p>08:00 - 21:00 mỗi ngày (kể cả cuối tuần và ngày lễ).</p>
                    <h4>Liên hệ</h4>
                    <p>Hotline: <strong>1900 636 467</strong> - Email: <strong>booktotal01@gmail.com</strong></p>
                </div>`
            },
            'return-policy': {
                title: 'Chính sách đổi - trả - hoàn tiền',
                content: `<div class="static-content">
                    <p>BookTotal hỗ trợ đổi/trả nhằm đảm bảo quyền lợi của khách hàng trong quá trình mua sắm.</p>
                    <h4>1. Điều kiện áp dụng</h4>
                    <ul>
                        <li>Sản phẩm giao sai mẫu, thiếu số lượng hoặc hư hỏng do vận chuyển.</li>
                        <li>Yêu cầu đổi/trả trong vòng <strong>03 ngày</strong> kể từ khi nhận hàng.</li>
                        <li>Sản phẩm còn đầy đủ phụ kiện/tem/bao bì (nếu có).</li>
                    </ul>
                    <h4>2. Trường hợp không áp dụng</h4>
                    <ul>
                        <li>Sản phẩm bị hư hại do người dùng sử dụng sai cách.</li>
                        <li>Yêu cầu sau thời hạn hỗ trợ hoặc thiếu bằng chứng mua hàng.</li>
                    </ul>
                    <h4>3. Quy trình xử lý</h4>
                    <ul>
                        <li>Liên hệ CSKH kèm mã đơn hàng và hình ảnh sản phẩm.</li>
                        <li>BookTotal xác minh trong 24-48 giờ làm việc.</li>
                        <li>Thực hiện đổi hàng hoặc hoàn tiền theo kết quả đối soát.</li>
                    </ul>
                </div>`
            },
            'warranty-policy': {
                title: 'Chính sách bảo hành - bồi hoàn',
                content: `<div class="static-content">
                    <p>Đối với các sản phẩm phụ kiện/văn phòng phẩm có chính sách bảo hành, BookTotal áp dụng theo quy định nhà cung cấp.</p>
                    <h4>1. Thời hạn bảo hành</h4>
                    <p>Thời hạn cụ thể được ghi trên mô tả sản phẩm hoặc phiếu bảo hành đi kèm (nếu có).</p>
                    <h4>2. Điều kiện tiếp nhận bảo hành</h4>
                    <ul>
                        <li>Sản phẩm còn trong thời hạn bảo hành.</li>
                        <li>Lỗi phát sinh do nhà sản xuất, không phải do tác động ngoại lực.</li>
                    </ul>
                    <h4>3. Bồi hoàn</h4>
                    <p>Trường hợp không thể sửa chữa/đổi mới theo chính sách, BookTotal sẽ thỏa thuận phương án bồi hoàn phù hợp.</p>
                </div>`
            },
            'shipping-policy': {
                title: 'Chính sách vận chuyển',
                content: `<div class="static-content">
                    <p>BookTotal hợp tác cùng các đơn vị vận chuyển uy tín để giao hàng nhanh, đúng hẹn và an toàn.</p>
                    <h4>1. Phạm vi giao hàng</h4>
                    <p>Giao hàng toàn quốc, thời gian dự kiến phụ thuộc khu vực và thời điểm đặt hàng.</p>
                    <h4>2. Thời gian giao hàng tham khảo</h4>
                    <ul>
                        <li>Nội thành: 1-2 ngày làm việc.</li>
                        <li>Liên tỉnh: 2-5 ngày làm việc.</li>
                    </ul>
                    <h4>3. Phí vận chuyển</h4>
                    <p>Phí ship hiển thị trực tiếp ở bước thanh toán, có thể thay đổi theo địa chỉ nhận và khối lượng đơn hàng.</p>
                    <h4>4. Lưu ý</h4>
                    <ul>
                        <li>Vui lòng kiểm tra tình trạng sản phẩm ngay khi nhận.</li>
                        <li>Nếu có vấn đề, liên hệ CSKH trong thời gian sớm nhất để được hỗ trợ.</li>
                    </ul>
                </div>`
            },
            'wholesale-policy': {
                title: 'Chính sách khách sỉ',
                content: `<div class="static-content">
                    <p>BookTotal hỗ trợ chính sách giá sỉ cho đại lý, trường học, tổ chức và doanh nghiệp có nhu cầu mua số lượng lớn.</p>
                    <h4>1. Đối tượng áp dụng</h4>
                    <ul>
                        <li>Đơn vị kinh doanh sách/văn phòng phẩm.</li>
                        <li>Trường học, thư viện, câu lạc bộ, doanh nghiệp.</li>
                    </ul>
                    <h4>2. Quyền lợi</h4>
                    <ul>
                        <li>Chiết khấu theo số lượng và nhóm sản phẩm.</li>
                        <li>Ưu tiên xử lý đơn và hỗ trợ xuất hóa đơn.</li>
                        <li>Tư vấn danh mục phù hợp theo ngân sách.</li>
                    </ul>
                    <h4>3. Liên hệ hợp tác</h4>
                    <p>Gửi yêu cầu về email <strong>booktotal01@gmail.com</strong> hoặc hotline <strong>1900 636 467</strong> để nhận báo giá chi tiết.</p>
                </div>`
            },
            'payment-methods': {
                title: 'Phương thức thanh toán và xuất hóa đơn',
                content: `<div class="static-content">
                    <h4>1. Phương thức thanh toán</h4>
                    <ul>
                        <li><strong>COD:</strong> thanh toán khi nhận hàng.</li>
                        <li><strong>VNPAY:</strong> quét QR/thanh toán qua ứng dụng ngân hàng.</li>
                        <li><strong>MoMo:</strong> thanh toán trực tuyến qua ví điện tử.</li>
                    </ul>
                    <h4>2. Lưu ý thanh toán online</h4>
                    <ul>
                        <li>Không chia sẻ mã OTP cho bên thứ ba.</li>
                        <li>Kiểm tra kỹ mã đơn và số tiền trước khi xác nhận giao dịch.</li>
                    </ul>
                    <h4>3. Xuất hóa đơn</h4>
                    <p>Khách hàng có nhu cầu xuất hóa đơn vui lòng cung cấp thông tin tại bước đặt hàng hoặc liên hệ CSKH trong vòng 24 giờ sau khi thanh toán thành công.</p>
                </div>`
            },
            'faq': {
                title: 'Câu hỏi thường gặp (FAQ)',
                content: `<div class="static-content">
                    <h4>1. Tôi có thể hủy đơn hàng không?</h4>
                    <p>Bạn có thể hủy khi đơn vẫn ở trạng thái chờ xác nhận/chưa bàn giao vận chuyển.</p>
                    <h4>2. Làm sao để theo dõi đơn hàng?</h4>
                    <p>Vào mục <strong>Lịch sử đơn hàng</strong> để xem trạng thái theo thời gian thực.</p>
                    <h4>3. Bao lâu tôi nhận được hàng?</h4>
                    <p>Thông thường 1-5 ngày làm việc tùy khu vực nhận hàng.</p>
                    <h4>4. Tôi có thể đổi địa chỉ sau khi đặt hàng không?</h4>
                    <p>Có, nếu đơn chưa giao cho đơn vị vận chuyển. Vui lòng liên hệ CSKH sớm nhất.</p>
                    <h4>5. Tôi quên mật khẩu tài khoản thì làm sao?</h4>
                    <p>Bạn chọn chức năng <strong>Quên mật khẩu</strong> ở màn hình đăng nhập để đặt lại.</p>
                </div>`
            }
        };
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get('/', this.home.bind(this));
        this.router.get('/page/:slug', this.showStaticPage.bind(this));
    }

    home(req, res) {
        res.render('pages/home');
    }

    showStaticPage(req, res) {
        const pageData = this.staticPages[req.params.slug];
        if (pageData) {
            res.render('pages/page', { title: pageData.title, content: pageData.content });
        } else {
            res.status(404).render('pages/page', { title: 'Không tìm thấy trang', content: '<p>Nội dung không tồn tại.</p>' });
        }
    }
}

module.exports = new PageController().router;
