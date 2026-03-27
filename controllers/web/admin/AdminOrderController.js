const express = require('express');
const exceljs = require('exceljs');
const OrderService = require('../../../services/shop/OrderService');
const NotificationService = require('../../../services/core/NotificationService');
const { requireAdmin } = require('../../../middleware/auth.middleware');
const { OrderStatus, OrderStatusLabels, PaymentStatus } = require('../../../constants');

class AdminOrderController {
    constructor(orderService = null, notificationService = null) {
        this.router = express.Router();
        this.orderService = orderService || new OrderService();
        this.notificationService = notificationService || new NotificationService();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get('/', requireAdmin, this.getList.bind(this));
        this.router.get('/export', requireAdmin, this.exportExcel.bind(this));
        this.router.post('/bulk-action', requireAdmin, this.bulkAction.bind(this));
        this.router.get('/update/:id/:status', requireAdmin, this.updateStatus.bind(this));
        this.router.get('/update-payment/:id/:status', requireAdmin, this.updatePaymentStatus.bind(this));
        this.router.get('/delete/:id', requireAdmin, this.deleteOrder.bind(this));
        this.router.get('/detail/:id', requireAdmin, this.getDetail.bind(this));
    }

    async getList(req, res) {
        try {
            const filters = {
                keyword: req.query.keyword || '',
                status: req.query.status || 'all',
                payment_status: req.query.payment_status || 'all'
            };
            const orders = await this.orderService.getFilteredOrders(filters);
            res.render('admin/orders/order_list', { orders, query: filters, statusLabels: OrderStatusLabels });
        } catch (err) {
            console.error(err);
            res.status(500).send("Lỗi lấy danh sách đơn hàng");
        }
    }

    async getDetail(req, res) {
        try {
            const order = await this.orderService.getOrderById(req.params.id);
            if (!order) return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
            const items = await this.orderService.getOrderItems(req.params.id);
            order.items = items;
            res.json({ success: true, data: order });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    }

    async updateStatus(req, res) {
        try {
            const { id, status } = req.params;
            const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERING', 'COMPLETED', 'CANCELLED'];
            if (!VALID_STATUSES.includes(status)) {
                return res.status(400).send("Trạng thái không hợp lệ");
            }

            const order = await this.orderService.getOrderById(id);
            if (!order) return res.status(404).send("Đơn hàng không tồn tại");

            await this.orderService.updateOrderStatus(id, status);

            if (order.user_id) {
                try {
                    const { title, message, type } = this.getStatusNotification(status, id);
                    await this.notificationService.createNotification(order.user_id, title, message, type);
                } catch (notifErr) {
                    console.error('Lỗi tạo thông báo (đơn hàng đã cập nhật):', notifErr);
                }
            }
            res.redirect('/admin/orders');
        } catch (err) {
            console.error('Lỗi cập nhật trạng thái đơn hàng:', err);
            res.status(500).send("Lỗi cập nhật trạng thái đơn hàng: " + (err.message || ''));
        }
    }

    getStatusNotification(newStatus, orderId) {
        const map = {
            CONFIRMED: { title: 'Đơn hàng đã được xác nhận', message: `Đơn hàng #${orderId} của bạn đã được xác nhận.`, type: 'info' },
            PROCESSING: { title: 'Đang xử lý đơn hàng', message: `Đơn hàng #${orderId} đang được đóng gói.`, type: 'info' },
            SHIPPED: { title: 'Đã giao cho vận chuyển', message: `Đơn hàng #${orderId} đã được bàn giao cho đơn vị vận chuyển.`, type: 'info' },
            DELIVERING: { title: 'Đang giao hàng', message: `Shipper đang giao đơn hàng #${orderId} đến bạn.`, type: 'warning' },
            COMPLETED: { title: 'Giao hàng thành công', message: `Đơn hàng #${orderId} đã hoàn tất. Cảm ơn bạn đã mua sắm!`, type: 'success' },
            CANCELLED: { title: 'Đơn hàng bị hủy', message: `Đơn hàng #${orderId} đã bị hủy.`, type: 'danger' }
        };
        return map[newStatus] || { title: 'Cập nhật đơn hàng', message: `Đơn hàng #${orderId} đã thay đổi trạng thái.`, type: 'info' };
    }

    async updatePaymentStatus(req, res) {
        try {
            const { id, status } = req.params;
            if (!Object.values(PaymentStatus).includes(status)) {
                return res.status(400).send("Trạng thái thanh toán không hợp lệ");
            }
            const order = await this.orderService.getOrderById(id);
            if (!order) return res.status(404).send("Đơn hàng không tồn tại");

            await this.orderService.updatePaymentStatus(id, status);
            res.redirect('/admin/orders');
        } catch (err) {
            console.error('Lỗi cập nhật thanh toán:', err);
            res.status(500).send("Lỗi cập nhật thanh toán: " + (err.message || ''));
        }
    }

    async deleteOrder(req, res) {
        try {
            await this.orderService.deleteOrder(req.params.id);
            if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                return res.json({ success: true, message: 'Đã xóa đơn hàng thành công' });
            }
            res.redirect('/admin/orders');
        } catch (err) {
            console.error(err);
            res.status(500).send('Lỗi khi xóa đơn hàng');
        }
    }

    async bulkAction(req, res) {
        try {
            const { action, orderIds } = req.body;
            if (!Array.isArray(orderIds) || orderIds.length === 0) {
                return res.json({ success: false, message: 'Vui lòng chọn ít nhất một đơn hàng.' });
            }
            if (action === 'delete') {
                await this.orderService.bulkDeleteOrders(orderIds);
                return res.json({ success: true, message: `Đã xóa thành công ${orderIds.length} đơn hàng.` });
            }
            return res.json({ success: false, message: 'Hành động không hợp lệ.' });
        } catch (err) {
            console.error('Bulk Action Error:', err);
            return res.json({ success: false, message: 'Đã xảy ra lỗi hệ thống.' });
        }
    }

    async exportExcel(req, res) {
        try {
            const filters = {
                keyword: req.query.keyword || '',
                status: req.query.status || 'all',
                payment_status: req.query.payment_status || 'all'
            };
            const orders = await this.orderService.getFilteredOrders(filters);

            const workbook = new exceljs.Workbook();
            const worksheet = workbook.addWorksheet('Danh Sách Đơn Hàng');
            worksheet.columns = [
                { header: 'Mã ĐH', key: 'id', width: 10 },
                { header: 'Khách Hàng', key: 'full_name', width: 25 },
                { header: 'Số Điện Thoại', key: 'phone', width: 15 },
                { header: 'Địa Chỉ', key: 'address', width: 40 },
                { header: 'Tổng Tiền', key: 'total', width: 15 },
                { header: 'Trạng Thái', key: 'status', width: 20 },
                { header: 'Thanh Toán', key: 'payment_status', width: 15 },
                { header: 'Ngày Đặt', key: 'order_date', width: 20 }
            ];

            orders.forEach(order => {
                worksheet.addRow({
                    id: '#' + order.id,
                    full_name: order.full_name || 'Khách Vãng Lai',
                    phone: order.phone || '',
                    address: order.shipping_address || '',
                    total: Number(order.final_total).toLocaleString('vi-VN') + ' đ',
                    status: OrderStatusLabels[order.status] || order.status,
                    payment_status: order.payment_status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán',
                    order_date: new Date(order.order_date).toLocaleString('vi-VN')
                });
            });
            worksheet.getRow(1).font = { bold: true };

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=Danh_Sach_Don_Hang.xlsx');
            await workbook.xlsx.write(res);
            res.end();
        } catch (err) {
            console.error(err);
            res.status(500).send("Lỗi xuất file Excel");
        }
    }
}

module.exports = new AdminOrderController().router;
