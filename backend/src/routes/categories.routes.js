const express = require("express");
const router = express.Router();

const { fetchCategories } = require("../controllers/categories.controller");

router.get("/", fetchCategories);

module.exports = router;