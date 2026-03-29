/**
 * Chuẩn hóa chuỗi tìm kiếm tiếng Việt (có dấu / không dấu) và biểu thức SQL tương ứng cho MySQL.
 * Cặp ký tự dùng chung để kết quả khớp giữa từ khóa đã bỏ dấu và cột trong DB có dấu.
 */
const VIETNAMESE_TONE_PAIRS = [
    ['à', 'a'],
    ['á', 'a'],
    ['ả', 'a'],
    ['ạ', 'a'],
    ['ã', 'a'],
    ['â', 'a'],
    ['ầ', 'a'],
    ['ấ', 'a'],
    ['ậ', 'a'],
    ['ẩ', 'a'],
    ['ẫ', 'a'],
    ['ă', 'a'],
    ['ằ', 'a'],
    ['ắ', 'a'],
    ['ặ', 'a'],
    ['ẳ', 'a'],
    ['ẵ', 'a'],
    ['è', 'e'],
    ['é', 'e'],
    ['ẹ', 'e'],
    ['ẻ', 'e'],
    ['ẽ', 'e'],
    ['ê', 'e'],
    ['ề', 'e'],
    ['ế', 'e'],
    ['ệ', 'e'],
    ['ể', 'e'],
    ['ễ', 'e'],
    ['ì', 'i'],
    ['í', 'i'],
    ['ị', 'i'],
    ['ỉ', 'i'],
    ['ĩ', 'i'],
    ['ò', 'o'],
    ['ó', 'o'],
    ['ọ', 'o'],
    ['ỏ', 'o'],
    ['õ', 'o'],
    ['ô', 'o'],
    ['ồ', 'o'],
    ['ố', 'o'],
    ['ộ', 'o'],
    ['ổ', 'o'],
    ['ỗ', 'o'],
    ['ơ', 'o'],
    ['ờ', 'o'],
    ['ớ', 'o'],
    ['ợ', 'o'],
    ['ở', 'o'],
    ['ỡ', 'o'],
    ['ù', 'u'],
    ['ú', 'u'],
    ['ụ', 'u'],
    ['ủ', 'u'],
    ['ũ', 'u'],
    ['ư', 'u'],
    ['ừ', 'u'],
    ['ứ', 'u'],
    ['ự', 'u'],
    ['ử', 'u'],
    ['ữ', 'u'],
    ['ỳ', 'y'],
    ['ý', 'y'],
    ['ỵ', 'y'],
    ['ỷ', 'y'],
    ['ỹ', 'y'],
    ['đ', 'd']
];

function normalizeSearchKey(str) {
    if (str == null) return '';
    let s = String(str).trim().toLowerCase();
    for (const [from, to] of VIETNAMESE_TONE_PAIRS) {
        s = s.split(from).join(to);
    }
    return s.replace(/\s+/g, ' ').trim();
}

/**
 * @param {string} columnRef - ví dụ p.name, a.name (đã là identifier hợp lệ)
 * @returns {string} biểu thức SQL: chuỗi không dấu, chữ thường
 */
function mysqlUnaccentExpression(columnRef) {
    let expr = `LOWER(${columnRef})`;
    for (const [from, to] of VIETNAMESE_TONE_PAIRS) {
        const esc = from.replace(/'/g, "''");
        expr = `REPLACE(${expr},'${esc}','${to}')`;
    }
    return expr;
}

module.exports = {
    VIETNAMESE_TONE_PAIRS,
    normalizeSearchKey,
    mysqlUnaccentExpression
};
