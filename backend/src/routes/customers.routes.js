const express = require("express");

const router = express.Router();

const {

    fetchCustomers,
    createCustomer,
    fetchCustomerHistory,
    updateCustomer

} = require("../controllers/customers.controller");

router.get("/", fetchCustomers);

router.post("/", createCustomer);

router.get("/:id/history", fetchCustomerHistory);

router.put("/:id", updateCustomer);

module.exports = router;