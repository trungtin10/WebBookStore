class ProductValidator {
    validateProductCreate(data, hasFile) {
        if (!data.name || data.name.trim() === "") return { valid: false, message: "Tên sản phẩm không được để trống" };
        const price = parseInt((data.price || '').toString().replace(/\D/g, '')) || 0;
        if (price <= 0) return { valid: false, message: "Giá bán phải lớn hơn 0" };
        if (!hasFile) return { valid: false, message: "Vui lòng chọn ảnh" };
        const publicationYear = data.publication_year ? parseInt(data.publication_year) : null;
        if (publicationYear && publicationYear > new Date().getFullYear()) return { valid: false, message: "NXB không hợp lệ" };
        return { valid: true };
    }

    validateProductUpdate(data) {
        if (!data.name || data.name.trim() === "") return { valid: false, message: "Tên sản phẩm không được để trống" };
        const price = parseInt((data.price || '').toString().replace(/\D/g, '')) || 0;
        if (price <= 0) return { valid: false, message: "Giá bán phải lớn hơn 0" };
        const publicationYear = data.publication_year ? parseInt(data.publication_year) : null;
        if (publicationYear && publicationYear > new Date().getFullYear()) return { valid: false, message: "NXB không hợp lệ" };
        return { valid: true };
    }

    parseProductData(data, file, isEdit = false) {
        const result = {
            name: data.name?.trim() || '',
            price: parseInt((data.price || '').toString().replace(/\D/g, '')) || 0,
            quantity: parseInt(data.quantity) || 0,
            pages: data.pages ? parseInt(data.pages) : null,
            publication_year: data.publication_year ? parseInt(data.publication_year) : null,
            category_id: (data.category_id && parseInt(data.category_id) > 0) ? parseInt(data.category_id) : null,
            is_hidden: data.is_hidden ? parseInt(data.is_hidden) : 0,
            description: data.description || '',
            author_name: data.author_name || null,
            publisher_name: data.publisher_name || null,
            supplier_name: data.supplier_name || null,
            cover_type: data.cover_type || null,
            language: data.language || null,
            dimensions: data.dimensions || null
        };
        result.image_url = file ? file.filename : (isEdit ? data.old_image : null);
        return result;
    }
}

module.exports = ProductValidator;
