const AdminUserRepository = require('../../repositories/Admin/AdminUserRepository');

class AdminUserService {
    constructor(adminUserRepository = null) {
        this.adminUserRepository = adminUserRepository || new AdminUserRepository();
    }

    async getAllUsers() {
        return this.adminUserRepository.getAllUsers();
    }

    async deleteUser(id) {
        return this.adminUserRepository.deleteUser(id);
    }
}

module.exports = AdminUserService;
