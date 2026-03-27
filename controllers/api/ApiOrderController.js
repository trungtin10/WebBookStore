const BaseApiController = require('./BaseApiController');
const OrderService = require('../../services/shop/OrderService');
const LocationRepository = require('../../repositories/core/LocationRepository');
const { verifyApiToken } = require('../../middleware/jwt.middleware');

class ApiOrderController extends BaseApiController {
    constructor(orderService = null, locationRepository = null) {
        super();
        this.orderService = orderService || new OrderService();
        this.locationRepository = locationRepository || new LocationRepository();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get('/orders/:id', verifyApiToken, this.wrap(this.getOrderDetails));
        this.router.get('/location/provinces', this.wrap(this.getProvinces));
        this.router.get('/location/districts/:provinceCode', this.wrap(this.getDistricts));
        this.router.get('/location/wards/:districtCode', this.wrap(this.getWards));
    }

    async getOrderDetails(req, res) {
        const orderId = req.params.id;
        const order = await this.orderService.getOrderById(orderId);
        if (!order) return this.apiResponse.error(res, "Order not found", 404);

        const role = req.apiUser?.role?.toLowerCase?.() || '';
        const userId = req.apiUser?.id;
        if (role !== 'admin' && Number(order.user_id) !== Number(userId)) {
            return this.apiResponse.error(res, "Bạn không có quyền xem đơn hàng này", 403);
        }

        const items = await this.orderService.getOrderItems(orderId);
        order.items = items;

        return this.apiResponse.success(res, order, 'Thành công', 200);
    }

    async getProvinces(req, res) {
        const rows = await this.locationRepository.getProvinces();
        return this.apiResponse.success(res, rows, 'Thành công', 200);
    }

    async getDistricts(req, res) {
        const rows = await this.locationRepository.getDistricts(req.params.provinceCode);
        return this.apiResponse.success(res, rows, 'Thành công', 200);
    }

    async getWards(req, res) {
        const rows = await this.locationRepository.getWards(req.params.districtCode);
        return this.apiResponse.success(res, rows, 'Thành công', 200);
    }
}

module.exports = new ApiOrderController().router;
