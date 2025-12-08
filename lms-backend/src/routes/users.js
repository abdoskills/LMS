const express = require("express");
const {
  getProfile,
  updateProfile,
  uploadAvatar,
  getCertificates,
  getUserStats,
  changePassword,
  changeEmail,
} = require("../controllers/userController");

const { protect } = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route("/profile").get(getProfile).put(updateProfile);

router.route("/avatar").post(uploadAvatar);

router.route("/certificates").get(getCertificates);

router.route("/stats").get(getUserStats);

router.route("/change-password").put(changePassword);

router.route("/change-email").put(changeEmail);

module.exports = router;
