const UserRepository = require('../../repositories/core/UserRepository');
const AdminUserService = require('../Admin/AdminUserService');

class UserService {
    constructor(userRepository = null, adminUserService = null) {
        this.userRepository = userRepository || new UserRepository();
        this.adminUserService = adminUserService || new AdminUserService();
    }

    async getUserById(id) {
        return this.userRepository.getUserById(id);
    }

    async getUserByUsername(username) {
        return this.userRepository.getUserByUsername(username);
    }

    async addUser(data) {
        return this.userRepository.addUser(data);
    }

    async updateUser(id, data) {
        return this.userRepository.updateUser(id, data);
    }

    // ===== Admin features (proxy to AdminUserService) =====
    async getAllUsers() {
        return this.adminUserService.getAllUsers();
    }

    async countUsers(search) {
        return this.adminUserService.countUsers(search);
    }

    async getUsersPaginated(options) {
        return this.adminUserService.getUsersPaginated(options);
    }

    async setUserActive(id, isActive) {
        return this.adminUserService.setUserActive(id, isActive);
    }

    async deleteUser(id) {
        return this.adminUserService.deleteUser(id);
    }
}

module.exports = UserService;

