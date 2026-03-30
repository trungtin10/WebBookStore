const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const ApiResponse = require('../utils/ApiResponse');

class JwtMiddleware {
    constructor(apiResponse = null) {
        this.apiResponse = apiResponse || new ApiResponse();
    }

    verifyApiToken(req, res, next) {
        const authHeader = req.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return this.apiResponse.error(res, 'Không tìm thấy token xác thực hoặc sai định dạng Bearer', 401);
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return this.apiResponse.error(res, 'Token không được để trống', 401);
        }

        jwt.verify(token, JWT_SECRET, (err, decodedToken) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return this.apiResponse.error(res, 'Token đã hết hạn. Vui lòng đăng nhập lại.', 401);
                }
                return this.apiResponse.error(res, 'Token không hợp lệ. Xác thực thất bại.', 403);
            }
            req.apiUser = decodedToken;
            next();
        });
    }
}

const instance = new JwtMiddleware();
module.exports = {
    verifyApiToken: instance.verifyApiToken.bind(instance),
    JwtMiddleware
};
