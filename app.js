const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser"); // Thay session bằng cookie-parser
const db = require("./db");
const Product = require("./apps/models/product");
const { checkUser } = require("./middleware/auth"); // Middleware check JWT toàn cục

const app = express();

// 1. Cấu hình View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "apps", "views"));

// 2. Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser()); // Sử dụng Cookie Parser

// 3. Global Middleware (Thay thế session bằng JWT check)
// Middleware này sẽ đọc cookie, giải mã JWT và gán user vào res.locals
app.use(checkUser);

app.use(async (req, res, next) => {
    // Logic giỏ hàng (Tạm thời lưu giỏ hàng trong Cookie thay vì Session)
    // Lưu ý: Với JWT, giỏ hàng nên lưu trong DB hoặc Cookie client-side.
    // Ở đây tôi giả lập lấy từ cookie JSON đơn giản để code cũ không gãy.

    let cart = [];
    if (req.cookies.cart) {
        try {
            cart = JSON.parse(req.cookies.cart);
        } catch(e) { cart = []; }
    }
    req.cart = cart; // Gán vào req để dùng ở route

    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    res.locals.cartCount = totalQty;

    // Logic danh mục
    try {
        const categories = await Product.getCategories();
        res.locals.globalCategories = categories;
    } catch (err) {
        res.locals.globalCategories = [];
    }

    next();
});

// 4. NẠP ROUTER
// API Routes (Đáp ứng yêu cầu Web API)
const apiRoutes = require("./routes/api");
app.use("/api", apiRoutes);

// Web Routes (Giao diện EJS)
const routes = require("./routes");
app.use(routes);

// 5. Xử lý lỗi 404
app.use((req, res) => {
    res.status(404).send("Không tìm thấy trang!");
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});