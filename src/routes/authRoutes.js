const express = require('express');
const router = express.Router();
const { signup, signin, approve } = require('../controllers/authController');

router.post('/signup', signup);
router.post('/login', signin);
router.put('/approve/:userId', approve);

module.exports = router;
