const BaseApiController = require('../BaseApiController');
const UserService = require('../../../services/core/UserService');
const { verifyApiToken } = require('../../../middleware/jwt.middleware');

class ApiUserController extends BaseApiController {
    constructor(userService = null) {
        super();
        this.userService = userService || new UserService();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get('/', verifyApiToken, this.wrap(this.getAllUsers));
    }

    async getAllUsers(req, res) {
        const role = req.apiUser?.role?.toLowerCase?.() || '';
        if (role !== 'admin') {
            return this.apiResponse.error(res, 'Chỉ admin mới được truy cập', 403);
        }
        const users = await this.userService.getAllUsers();
        const safeUsers = users.map(u => {
            const { password, ...rest } = u;
            return rest;
        });
        return this.apiResponse.success(res, safeUsers, 'Thành công', 200);
    }
}

module.exports = new ApiUserController().router;
