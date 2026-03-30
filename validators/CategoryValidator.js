class CategoryValidator {
    validateName(name) {
        if (!name || name.trim() === "") return { valid: false, message: "Tên danh mục không được để trống" };
        return { valid: true };
    }
}

module.exports = CategoryValidator;
