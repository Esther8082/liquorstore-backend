require("dotenv").config();
require("./database");

const express = require("express");
const cors = require("cors");

const app = express();
const SERVER_PORT = process.env.PORT || 5000;

const {
    startReportScheduler
} = require("./src/services/reportScheduler");

// ========================
// MIDDLEWARE
// ========================

app.use(cors());

app.use((req, res, next) => {
    console.log("REQUEST:", req.method, req.url);
    next();
});

app.use(express.json());

// ========================
// ROUTES
// ========================

const productsRouter = require("./src/routes/products.routes");
const categoriesRoutes = require("./src/routes/categories.routes");
const salesRoutes = require("./src/routes/sales.route");
const customersRoutes = require("./src/routes/customers.routes");
const reportsRoutes = require("./src/routes/reports.routes");
const settingsRoutes = require("./src/routes/settings.routes");

app.get("/", (req, res) => {
    res.send("LIQUOR STORE POS Backend Running");
});

app.use("/products", productsRouter);
app.use("/categories", categoriesRoutes);
app.use("/sales", salesRoutes);
app.use("/customers", customersRoutes);
app.use("/reports", reportsRoutes);
app.use("/settings", settingsRoutes);

// ========================
// ERROR HANDLER
// ========================

app.use((err, req, res, next) => {
    console.error("SERVER ERROR:", err.message);

    res.status(500).json({
        error: "Internal server error"
    });
});

// ========================
// START SERVER
// ========================

startReportScheduler();

app.listen(SERVER_PORT, () => {
    console.log(`Backend running on http://localhost:${SERVER_PORT}`);
});
