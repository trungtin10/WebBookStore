const AdminUserRepository = require('../../repositories/Admin/AdminUserRepository');

class AdminUserService {
    constructor(adminUserRepository = null) {
        this.adminUserRepository = adminUserRepository || new AdminUserRepository();
    }

    async getAllUsers() {
        return this.adminUserRepository.getAllUsers();
    }

    async countUsers(search) {
        return this.adminUserRepository.countUsers(search);
    }

    async getUsersPaginated(options) {
        return this.adminUserRepository.getUsersPaginated(options);
    }

    async setUserActive(id, isActive) {
        return this.adminUserRepository.setUserActive(id, isActive);
    }

    async deleteUser(id) {
        return this.adminUserRepository.deleteUser(id);
    }
}

module.exports = AdminUserService;
