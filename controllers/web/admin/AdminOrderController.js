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
        const label = OrderStatusLabels[newStatus] || newStatus;
        const map = {
            CONFIRMED: { title: 'Đơn hàng đã được duyệt', message: `Đơn hàng #${orderId} của bạn đã được duyệt (${label}).`, type: 'info' },
            PROCESSING: { title: 'Đang chuẩn bị hàng', message: `Đơn hàng #${orderId} đang được chuẩn bị.`, type: 'info' },
            SHIPPED: { title: 'Đang vận chuyển', message: `Đơn hàng #${orderId} đang được vận chuyển.`, type: 'info' },
            DELIVERING: { title: 'Đang giao hàng', message: `Đơn hàng #${orderId} đang được giao đến bạn.`, type: 'warning' },
            COMPLETED: { title: 'Đã giao hàng', message: `Đơn hàng #${orderId} đã giao thành công. Cảm ơn bạn đã mua sắm!`, type: 'success' },
            CANCELLED: { title: 'Đơn hàng bị hủy', message: `Đơn hàng #${orderId} đã bị hủy.`, type: 'danger' }
        };
        return map[newStatus] || { title: 'Cập nhật đơn hàng', message: `Đơn hàng #${orderId}: ${label}.`, type: 'info' };
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

    _customerNameForExport(order) {
        let name = order.full_name;
        if (order.shipping_address) {
            const parts = order.shipping_address.split(',').map((p) => p.trim());
            if (parts.length >= 2 && (!name || name === 'Khách vãng lai')) {
                name = parts[0];
            }
        }
        return name || 'Khách vãng lai';
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
            workbook.creator = 'BookTotal Admin';
            const worksheet = workbook.addWorksheet('Đơn hàng', {
                views: [{ state: 'frozen', ySplit: 1 }]
            });

            worksheet.addRow(['Mã đơn', 'Khách hàng', 'Ngày đặt', 'Tổng tiền']);
            worksheet.getRow(1).font = { bold: true };

            orders.forEach((order) => {
                worksheet.addRow([
                    order.id,
                    this._customerNameForExport(order),
                    order.order_date ? new Date(order.order_date) : null,
                    Number(order.final_total) || 0
                ]);
            });

            worksheet.getColumn(1).width = 12;
            worksheet.getColumn(2).width = 30;
            worksheet.getColumn(3).width = 20;
            worksheet.getColumn(4).width = 16;
            worksheet.getColumn(3).numFmt = 'dd/mm/yyyy hh:mm';
            worksheet.getColumn(4).numFmt = '#,##0';

            if (orders.length > 0) {
                worksheet.autoFilter = {
                    from: { row: 1, column: 1 },
                    to: { row: 1, column: 4 }
                };
            }

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=Bao_cao_don_hang.xlsx');
            await workbook.xlsx.write(res);
            res.end();
        } catch (err) {
            console.error(err);
            res.status(500).send('Lỗi xuất file Excel');
        }
    }
}

module.exports = new AdminOrderController().router;
