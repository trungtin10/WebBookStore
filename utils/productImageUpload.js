const fs = require('fs');
const path = require('path');

function cloudinaryConfigured() {
    return Boolean(
        process.env.CLOUDINARY_URL ||
        (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
    );
}

/**
 * Sau khi multer lưu file local: nếu cấu hình Cloudinary thì upload và xóa file tạm;
 * ngược lại trả về tên file để lưu trong DB (đường dẫn /images/...).
 * @param {Express.Multer.File|null} file
 * @returns {Promise<string|null>}
 */
async function finalizeProductImage(file) {
    if (!file || !file.path) return null;

    if (!cloudinaryConfigured()) {
        return file.filename;
    }

    const cloudinary = require('cloudinary').v2;
    if (process.env.CLOUDINARY_CLOUD_NAME && !process.env.CLOUDINARY_URL) {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true
        });
    }

    const result = await cloudinary.uploader.upload(file.path, {
        folder: 'webbookstore/products',
        resource_type: 'image'
    });

    try {
        fs.unlinkSync(file.path);
    } catch (e) {
        /* ignore */
    }

    return result.secure_url;
}

module.exports = { finalizeProductImage, cloudinaryConfigured };
