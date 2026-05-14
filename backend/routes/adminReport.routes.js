// backend/routes/adminReport.routes.js
// Express router for the Admin Reports endpoint.

const express = require("express");
const { getAdminReports } = require("../controllers/adminReport.controller");

const router = express.Router();

// GET /api/admin/reports
router.get("/reports", getAdminReports);

module.exports = router;
