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
    [OrderStatus.PENDING]: 'Chờ xác nhận',
    [OrderStatus.CONFIRMED]: 'Đã xác nhận',
    [OrderStatus.PROCESSING]: 'Đang xử lý',
    [OrderStatus.SHIPPED]: 'Đã giao cho ĐVVC',
    [OrderStatus.DELIVERING]: 'Đang giao hàng',
    [OrderStatus.COMPLETED]: 'Hoàn thành',
    [OrderStatus.CANCELLED]: 'Đã hủy'
};

const Shipping = {
    FREE_SHIPPING_THRESHOLD: 500000,
    DEFAULT_FEE: 30000
};

const Stock = {
    LOW_THRESHOLD: 10,
    OK_MIN_QUANTITY: 10
};

const Token = {
    RESET_EXPIRY_MS: 3600000, // 1 hour
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
