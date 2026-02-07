const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const db = require("./db");
const Product = require("./apps/models/product");
const { checkUser } = require("./middleware/auth");

const app = express();

// 1. Cấu hình View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "apps", "views"));

// 2. Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// 3. Global Middleware
app.use(checkUser);

app.use(async (req, res, next) => {
    let cart = [];
    if (req.cookies.cart) {
        try {
            cart = JSON.parse(req.cookies.cart);
        } catch(e) { cart = []; }
    }
    req.cart = cart;

    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    res.locals.cartCount = totalQty;

    try {
        const categories = await Product.getCategories();
        res.locals.globalCategories = categories;
    } catch (err) {
        res.locals.globalCategories = [];
    }

    next();
});

// 4. NẠP ROUTER
const apiRoutes = require("./routes/api");
app.use("/api", apiRoutes);

const routes = require("./routes");
app.use(routes);

// 5. Xử lý lỗi 404
app.use((req, res) => {
    res.status(404).send("Không tìm thấy trang!");
});

// SỬA LẠI CỔNG CHẠY SERVER
const PORT = 8080; // Đổi từ 3000 sang 8080

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`); // Cập nhật log
});