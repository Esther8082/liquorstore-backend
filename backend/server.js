require("dotenv").config();
require("./database"); // 👈 ADD THIS

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const SERVER_PORT = process.env.PORT || 5000;

// ========================
// MIDDLEWARE
// ========================

app.use(cors());

app.use((req, res, next) => {
    console.log("REQUEST:", req.method, req.url);
    next();
});

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ========================
// ROUTES
// ========================
const productsRouter = require("./src/routes/products.routes");
const categoriesRoutes = require("./src/routes/categories.routes");

app.get("/", (req, res) => {
    res.send("LIQUOR STORE POS Backend Running");
});

app.use("/products", productsRouter);
app.use("/categories", categoriesRoutes);

// ========================
// ERROR HANDLER (ADD HERE)
// ========================

app.use((err, req, res, next) => {
    console.error("SERVER ERROR:", err.message);
    res.status(500).json({ error: "Internal server error" });
});

// ========================
// START SERVER
// ========================
app.listen(SERVER_PORT, () => {
    console.log(`Backend running on http://localhost:${SERVER_PORT}`);
});