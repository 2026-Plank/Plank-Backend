const express = require('express');
const router = express.Router();
const { getConversations, getMessages, sendMessage, searchMessages } = require('../controllers/chatController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/conversations', verifyToken, getConversations);
router.get('/search', verifyToken, searchMessages);
router.get('/:friendId', verifyToken, getMessages);
router.post('/', verifyToken, sendMessage);

module.exports = router;
