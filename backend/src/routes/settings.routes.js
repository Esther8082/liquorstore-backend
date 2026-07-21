const express = require("express");

const router = express.Router();

const {

    getSettings,
    updateSettings,
    sendTestEmail

} = require("../controllers/settings.controller");

// Load settings
router.get("/", getSettings);

// Save settings
router.put("/", updateSettings);

// Send test email
router.post("/test-email", sendTestEmail);

module.exports = router;