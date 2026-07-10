const express = require("express");
const router = express.Router();

const {
    fetchCategories,
    fetchCategoryProducts,
    createCategory,
    updateCategory,
    deleteCategory

} = require("../controllers/categories.controller");

router.get("/", fetchCategories);

router.get("/:id/products", fetchCategoryProducts);

router.post("/", createCategory);

router.put("/:id", updateCategory);

router.delete("/:id", deleteCategory);
module.exports = router;
