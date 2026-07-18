const express = require("express");

const router = express.Router();

const {

    fetchCustomers,
    createCustomer,
    fetchCustomerHistory

} = require("../controllers/customers.controller");

router.get("/", fetchCustomers);
router.get("/:id/history", fetchCustomerHistory);
router.post("/", createCustomer);

module.exports = router;