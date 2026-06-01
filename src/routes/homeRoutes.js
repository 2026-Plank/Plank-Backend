const express = require('express');
const router = express.Router();
const { getHomeDashboard } = require('../controllers/homeController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, getHomeDashboard);

module.exports = router;
