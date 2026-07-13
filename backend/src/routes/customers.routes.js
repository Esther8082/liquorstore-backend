const express = require("express");

const router = express.Router();

const {

    fetchCustomers,
    createCustomer

} = require("../controllers/customers.controller");

router.get("/", fetchCustomers);

router.post("/", createCustomer);

module.exports = router;