const AdminDashboardRepository = require('../../repositories/Admin/AdminDashboardRepository');
const AdminOrderRepository = require('../../repositories/Admin/AdminOrderRepository');

const MAX_REPORT_RANGE_DAYS = 731;

function pad2(n) {
    return String(n).padStart(2, '0');
}

function formatLocalYMD(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseYMD(str) {
    const [y, m, day] = str.split('-').map(Number);
    return new Date(y, m - 1, day);
}

function daysInclusive(fromStr, toStr) {
    const a = parseYMD(fromStr);
    const b = parseYMD(toStr);
    return Math.floor((b - a) / 86400000) + 1;
}

function toPeriodKey(periodDate, groupBy) {
    const d = periodDate instanceof Date ? periodDate : new Date(periodDate);
    if (Number.isNaN(d.getTime())) return null;
    if (groupBy === 'month') {
        return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
    }
    return formatLocalYMD(d);
}

function labelForPeriodKey(key, groupBy) {
    if (!key) return '';
    if (groupBy === 'month') {
        const [y, m] = key.split('-');
        return `Tháng ${Number(m)}/${y}`;
    }
    const [yy, mm, dd] = key.split('-').map(Number);
    return new Date(yy, mm - 1, dd).toLocaleDateString('vi-VN');
}

/**
 * Lấp các kỳ không có đơn bằng 0 để biểu đồ liên tục.
 */
function buildFilledSeries(rawSeries, dateFrom, dateTo, groupBy) {
    const map = new Map();
    for (const row of rawSeries) {
        const k = toPeriodKey(row.period_date, groupBy);
        if (k) map.set(k, { revenue: row.revenue, order_count: row.order_count });
    }

    const keys = [];
    if (groupBy === 'month') {
        const start = parseYMD(dateFrom);
        start.setDate(1);
        const end = parseYMD(dateTo);
        end.setDate(1);
        const cur = new Date(start);
        while (cur <= end) {
            keys.push(`${cur.getFullYear()}-${pad2(cur.getMonth() + 1)}`);
            cur.setMonth(cur.getMonth() + 1);
        }
    } else {
        const cur = parseYMD(dateFrom);
        const end = parseYMD(dateTo);
        while (cur <= end) {
            keys.push(formatLocalYMD(cur));
            cur.setDate(cur.getDate() + 1);
        }
    }

    return keys.map((key) => ({
        period_key: key,
        revenue: map.get(key)?.revenue ?? 0,
        order_count: map.get(key)?.order_count ?? 0
    }));
}

class AdminDashboardService {
    constructor(adminDashboardRepository = null, adminOrderRepository = null) {
        this.adminDashboardRepository = adminDashboardRepository || new AdminDashboardRepository();
        this.adminOrderRepository = adminOrderRepository || new AdminOrderRepository();
    }

    async getDashboardStats() {
        const totalRevenue = await this.adminDashboardRepository.getTotalRevenue();
        const totalOrders = await this.adminDashboardRepository.getTotalOrders();
        const totalUsers = await this.adminDashboardRepository.getTotalUsers();
        const lowStock = await this.adminDashboardRepository.getLowStockCount();

        const revenueStats = await this.adminOrderRepository.getRevenueStats();
        const recentOrders = await this.adminDashboardRepository.getRecentOrders(5);

        return {
            stats: {
                revenue: totalRevenue,
                orders: totalOrders,
                users: totalUsers,
                lowStock: lowStock
            },
            revenueChart: revenueStats,
            recentOrders
        };
    }

    async getStatsPage(query = {}) {
        const today = new Date();
        const defaultTo = formatLocalYMD(today);
        const defaultFromD = new Date(today);
        defaultFromD.setDate(defaultFromD.getDate() - 29);
        const defaultFrom = formatLocalYMD(defaultFromD);

        const dateRe = /^\d{4}-\d{2}-\d{2}$/;
        let dateTo = dateRe.test(query.to) ? query.to : defaultTo;
        let dateFrom = dateRe.test(query.from) ? query.from : defaultFrom;

        if (dateFrom > dateTo) {
            const t = dateFrom;
            dateFrom = dateTo;
            dateTo = t;
        }

        let span = daysInclusive(dateFrom, dateTo);
        if (span > MAX_REPORT_RANGE_DAYS) {
            const toD = parseYMD(dateTo);
            const fromD = new Date(toD);
            fromD.setDate(fromD.getDate() - (MAX_REPORT_RANGE_DAYS - 1));
            dateFrom = formatLocalYMD(fromD);
            span = MAX_REPORT_RANGE_DAYS;
        }

        const groupBy = query.group === 'month' ? 'month' : 'day';
        const chartType = query.chart === 'bar' ? 'bar' : 'line';

        const rawSeries = await this.adminOrderRepository.getRevenueSeriesByRange(dateFrom, dateTo, groupBy);
        const filled = buildFilledSeries(rawSeries, dateFrom, dateTo, groupBy);
        const labels = filled.map((row) => labelForPeriodKey(row.period_key, groupBy));
        const data = filled.map((row) => row.revenue);
        const orderCountsPerPeriod = filled.map((row) => row.order_count);

        const rangeTotals = await this.adminOrderRepository.getCompletedTotalsInRange(dateFrom, dateTo);

        const statusStats = await this.adminDashboardRepository.getOrderStatusStats();
        const orderStats = { PENDING: 0, CONFIRMED: 0, SHIPPING: 0, COMPLETED: 0, CANCELLED: 0 };
        statusStats.forEach((stat) => {
            if (stat.status) {
                orderStats[stat.status.toUpperCase()] = stat.count;
            }
        });

        const recentOrders = await this.adminDashboardRepository.getRecentOrders(20);

        return {
            totalRevenue: rangeTotals.totalRevenue,
            totalOrders: rangeTotals.totalOrders,
            orderStats,
            labels,
            data,
            orderCountsPerPeriod,
            chartType,
            reportQuery: {
                from: dateFrom,
                to: dateTo,
                group: groupBy,
                chart: chartType
            },
            recentOrders
        };
    }
}

module.exports = AdminDashboardService;
