const express = require("express");

const router = express.Router();

const {
    createSale,
    getSaleById
} = require("../controllers/sales.controller");


router.post("/", createSale);
router.get("/:id", getSaleById);

module.exports = router;