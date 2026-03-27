const BaseApiController = require('./BaseApiController');
const AuthValidator = require('../../validators/AuthValidator');
const AuthService = require('../../services/core/AuthService');

class ApiAuthController extends BaseApiController {
    constructor(authService = null, authValidator = null, apiResponse = null) {
        super({ apiResponse });
        this.authService = authService || new AuthService();
        this.authValidator = authValidator || new AuthValidator();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.post('/register', this.wrap(this.register));
        this.router.post('/login', this.wrap(this.login));
    }

    async register(req, res) {
        const validation = this.authValidator.validateRegistration(req.body);
        if (!validation.isValid) {
            return this.apiResponse.error(res, 'Dữ liệu không hợp lệ', 400, validation.errors);
        }

        const result = await this.authService.registerUser(req.body);
        return this.apiResponse.success(res, result, 'Đăng ký thành công', 201);
    }

    async login(req, res) {
        const validation = this.authValidator.validateLogin(req.body);
        if (!validation.isValid) {
            return this.apiResponse.error(res, 'Dữ liệu đăng nhập không hợp lệ', 400, validation.errors);
        }

        try {
            const result = await this.authService.authenticateUser(req.body.username, req.body.password);
            return this.apiResponse.success(res, result, 'Đăng nhập thành công', 200);
        } catch (error) {
            return this.apiResponse.error(res, error.message, 401);
        }
    }
}

module.exports = new ApiAuthController().router;
