const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, searchMessages } = require('../controllers/chatController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/:friendId', verifyToken, getMessages);
router.post('/', verifyToken, sendMessage);
router.get('/search', verifyToken, searchMessages);

module.exports = router;
