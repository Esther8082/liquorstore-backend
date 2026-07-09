const express = require("express");
const router = express.Router();

const {
    fetchCategories,
    fetchCategoryProducts
} = require("../controllers/categories.controller");

router.get("/", fetchCategories);

router.get("/:id/products", fetchCategoryProducts);

module.exports = router;
