const express = require("express");
const router = express.Router();

const {
    fetchCategories,
    fetchCategoryProducts,
    createCategory
} = require("../controllers/categories.controller");

router.get("/", fetchCategories);

router.get("/:id/products", fetchCategoryProducts);
router.post("/", createCategory);
module.exports = router;
