const express = require('express');
const router = express.Router();
const { register, login, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register); // public
router.post('/login', login);       // public
router.post('/logout', protect, logout); // private
router.get('/me', protect, getMe);       // private

module.exports = router;
