class ProductValidator {
    _parsePrice(raw) {
        if (raw === undefined || raw === null) return { ok: false, message: 'Vui lòng nhập giá bán.' };
        const s = String(raw).trim().replace(/\s/g, '').replace(/,/g, '');
        if (s === '') return { ok: false, message: 'Vui lòng nhập giá bán.' };
        const n = Number(s);
        if (Number.isNaN(n)) return { ok: false, message: 'Giá bán không hợp lệ.' };
        if (n < 0) return { ok: false, message: 'Giá bán không được âm.' };
        return { ok: true, value: Math.round(n) };
    }

    validateProductCreate(data, hasFile) {
        if (!data.name || String(data.name).trim() === '') {
            return { valid: false, message: 'Tên sản phẩm không được để trống' };
        }
        const pr = this._parsePrice(data.price);
        if (!pr.ok) return { valid: false, message: pr.message };
        if (pr.value <= 0) return { valid: false, message: 'Giá bán phải lớn hơn 0' };
        const lr = this._parseOptionalListPrice(data.list_price, pr.value);
        if (!lr.ok) return { valid: false, message: lr.message };
        if (!hasFile) return { valid: false, message: 'Vui lòng chọn ảnh sản phẩm' };
        const publicationYear = data.publication_year ? parseInt(data.publication_year, 10) : null;
        if (publicationYear && publicationYear > new Date().getFullYear()) {
            return { valid: false, message: 'Năm xuất bản không hợp lệ' };
        }
        return { valid: true };
    }

    validateProductUpdate(data) {
        if (!data.name || String(data.name).trim() === '') {
            return { valid: false, message: 'Tên sản phẩm không được để trống' };
        }
        const pr = this._parsePrice(data.price);
        if (!pr.ok) return { valid: false, message: pr.message };
        if (pr.value <= 0) return { valid: false, message: 'Giá bán phải lớn hơn 0' };
        const lr = this._parseOptionalListPrice(data.list_price, pr.value);
        if (!lr.ok) return { valid: false, message: lr.message };
        const publicationYear = data.publication_year ? parseInt(data.publication_year, 10) : null;
        if (publicationYear && publicationYear > new Date().getFullYear()) {
            return { valid: false, message: 'Năm xuất bản không hợp lệ' };
        }
        return { valid: true };
    }

    _normalizeGalleryImages(raw) {
        if (raw === undefined || raw === null || String(raw).trim() === '') return null;
        const s = String(raw).trim();
        if (s.startsWith('[')) {
            try {
                const arr = JSON.parse(s);
                if (Array.isArray(arr)) {
                    const cleaned = arr.map((x) => String(x).trim()).filter(Boolean).slice(0, 12);
                    return cleaned.length ? JSON.stringify(cleaned) : null;
                }
            } catch (e) {
                return null;
            }
        }
        const lines = s.split(/[\r\n,]+/).map((x) => x.trim()).filter(Boolean).slice(0, 12);
        return lines.length ? JSON.stringify(lines) : null;
    }

    _parseOptionalListPrice(raw, salePrice) {
        if (raw === undefined || raw === null || String(raw).trim() === '') return { ok: true, value: null };
        const s = String(raw).trim().replace(/\s/g, '').replace(/,/g, '');
        const n = Number(s);
        if (Number.isNaN(n) || n < 0) return { ok: false, message: 'Giá niêm yết không hợp lệ.' };
        if (n <= salePrice) return { ok: false, message: 'Giá niêm yết phải lớn hơn giá bán để hiển thị khuyến mãi.' };
        return { ok: true, value: Math.round(n) };
    }

    parseProductData(data, file, isEdit = false) {
        const pr = this._parsePrice(data.price);
        const price = pr.ok ? pr.value : 0;
        const lr = this._parseOptionalListPrice(data.list_price, price);

        const result = {
            name: data.name != null ? String(data.name).trim() : '',
            price,
            list_price: lr.ok ? lr.value : null,
            quantity: parseInt(data.quantity, 10) || 0,
            pages: data.pages ? parseInt(data.pages, 10) : null,
            publication_year: data.publication_year ? parseInt(data.publication_year, 10) : null,
            category_id: (data.category_id && parseInt(data.category_id, 10) > 0) ? parseInt(data.category_id, 10) : null,
            is_hidden: data.is_hidden ? parseInt(data.is_hidden, 10) : 0,
            description: data.description || '',
            author_name: data.author_name || null,
            publisher_name: data.publisher_name || null,
            supplier_name: data.supplier_name || null,
            cover_type: data.cover_type || null,
            language: data.language || null,
            dimensions: data.dimensions || null,
            color: data.color != null ? String(data.color).trim().slice(0, 100) || null : null,
            gallery_images: this._normalizeGalleryImages(data.gallery_images)
        };
        if (file) result.image_url = file.filename;
        else if (isEdit) result.image_url = data.old_image || null;
        else result.image_url = null;
        return result;
    }
}

module.exports = ProductValidator;
