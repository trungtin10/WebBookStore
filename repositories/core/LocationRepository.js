const db = require('../../config/dbConfig');

class LocationRepository {
    async getProvinces() {
        const [rows] = await db.query('SELECT * FROM provinces ORDER BY name');
        return rows;
    }

    async getDistricts(provinceCode) {
        const [rows] = await db.query('SELECT * FROM districts WHERE province_code = ? ORDER BY name', [provinceCode]);
        return rows;
    }

    async getWards(districtCode) {
        const [rows] = await db.query('SELECT * FROM wards WHERE district_code = ? ORDER BY name', [districtCode]);
        return rows;
    }
}

module.exports = LocationRepository;

