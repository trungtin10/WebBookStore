const express = require('express');
const AdminDashboardService = require('../../../services/Admin/AdminDashboardService');
const { requireAdmin } = require('../../../middleware/auth.middleware');

class AdminController {
    constructor(dashboardService = null) {
        this.router = express.Router();
        this.dashboardService = dashboardService || new AdminDashboardService();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get('/admin', requireAdmin, this.dashboard.bind(this));
        this.router.get('/admin/stats', requireAdmin, this.getStats.bind(this));
    }

    async dashboard(req, res) {
        try {
            const data = await this.dashboardService.getDashboardStats();
            res.render('admin/dashboard/index', data);
        } catch (err) {
            console.error(err);
            res.status(500).send("Lỗi Dashboard");
        }
    }

    async getStats(req, res) {
        try {
            const data = await this.dashboardService.getStatsPage();
            res.render('admin/dashboard/stats', data);
        } catch (err) {
            console.error(err);
            res.status(500).send("Lỗi trang Thống kê");
        }
    }
}

module.exports = new AdminController().router;
