const path = require('path');

module.exports = {
    port: process.env.PORT || 3001,
    session: {
        secret: process.env.SESSION_SECRET || 'your_secret_key',
        resave: false,
        saveUninitialized: true
    },
    view: {
        engine: 'ejs',
        path: path.join(__dirname, '..', 'views')
    },
    static: path.join(__dirname, '..', 'public'),
    error404: {
        api: { message: 'API endpoint không tồn tại' },
        web: {
            title: '404 - Không tìm thấy trang',
            content: '<div class="text-center py-5"><h3>Rất tiếc, trang bạn tìm kiếm không tồn tại.</h3><a href="/" class="btn btn-primary mt-3">Về trang chủ</a></div>'
        }
    },
    error500: {
        title: '500 - Lỗi Server',
        message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.',
        linkText: 'Quay lại trang chủ'
    }
};
