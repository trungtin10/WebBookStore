/**
 * Application constants - Single source of truth for magic values
 */
const OrderStatus = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    PROCESSING: 'PROCESSING',
    SHIPPED: 'SHIPPED',
    DELIVERING: 'DELIVERING',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
};

const PaymentStatus = {
    PAID: 'PAID',
    UNPAID: 'UNPAID'
};

const OrderStatusLabels = {
    [OrderStatus.PENDING]: 'Chờ duyệt',
    [OrderStatus.CONFIRMED]: 'Đã duyệt',
    [OrderStatus.PROCESSING]: 'Chuẩn bị hàng',
    [OrderStatus.SHIPPED]: 'Đang vận chuyển',
    [OrderStatus.DELIVERING]: 'Đang giao',
    [OrderStatus.COMPLETED]: 'Đã giao',
    [OrderStatus.CANCELLED]: 'Đã hủy'
};

const Shipping = {
    FREE_SHIPPING_THRESHOLD: 500000,
    DEFAULT_FEE: 30000
};

const Stock = {
    /** Tồn < giá trị này: cảnh báo / lọc "sắp hết" (không tính hết hàng = 0) */
    LOW_THRESHOLD: 5,
    OK_MIN_QUANTITY: 5
};

const Token = {
    /** Thời hạn link / mã đặt lại mật khẩu (quên mật khẩu) */
    RESET_EXPIRY_MS: 15 * 60 * 1000, // 15 phút
    JWT_EXPIRY: '1d'
};

const RevenueStats = {
    DAYS_LOOKBACK: 7
};

module.exports = {
    OrderStatus,
    OrderStatusLabels,
    PaymentStatus,
    Shipping,
    Stock,
    Token,
    RevenueStats
};
