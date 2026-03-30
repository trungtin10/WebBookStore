const express = require('express');
const ApiResponse = require('../../utils/ApiResponse');

class BaseApiController {
    constructor({ router = null, apiResponse = null } = {}) {
        this.router = router || express.Router();
        this.apiResponse = apiResponse || new ApiResponse();
    }

    wrap(handler) {
        return async (req, res, next) => {
            try {
                return await handler.call(this, req, res, next);
            } catch (err) {
                const statusCode = err?.statusCode || 500;
                const message = err?.message || 'Lỗi server';
                return this.apiResponse.error(res, message, statusCode);
            }
        };
    }
}

module.exports = BaseApiController;

