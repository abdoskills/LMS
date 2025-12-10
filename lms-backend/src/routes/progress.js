const express = require("express");
const router = express.Router();
const {
  updateProgress,
  getProgress,
  updateTimeSpent,
} = require("../controllers/progressController");
const { protect } = require("../middleware/auth");

router.route("/").get(protect, getProgress).put(protect, updateProgress);

router.route("/time").put(protect, updateTimeSpent);

module.exports = router;
