const express = require("express");

const router = express.Router();

const {
    createSale
} = require("../controllers/sales.controller");

router.post("/", createSale);

module.exports = router;