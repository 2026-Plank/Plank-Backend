const express = require('express');
const router = express.Router();
const {
  getConversations,
  getMessages,
  sendMessage,
  deleteMessage,
  markDirectRead,
  createGroup,
  addGroupMembers,
  getGroupMessages,
  sendGroupMessage,
  deleteGroupMessage,
  markGroupRead,
  searchMessages,
  streamChatEvents
} = require('../controllers/chatController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/conversations', verifyToken, getConversations);
router.get('/search', verifyToken, searchMessages);
router.get('/events', verifyToken, streamChatEvents);

router.post('/groups', verifyToken, createGroup);
router.post('/groups/:groupId/members', verifyToken, addGroupMembers);
router.get('/groups/:groupId/messages', verifyToken, getGroupMessages);
router.post('/groups/:groupId/messages', verifyToken, sendGroupMessage);
router.put('/groups/:groupId/read', verifyToken, markGroupRead);
router.delete('/groups/messages/:messageId', verifyToken, deleteGroupMessage);

router.put('/:friendId/read', verifyToken, markDirectRead);
router.delete('/messages/:messageId', verifyToken, deleteMessage);
router.get('/:friendId', verifyToken, getMessages);
router.post('/', verifyToken, sendMessage);

module.exports = router;
