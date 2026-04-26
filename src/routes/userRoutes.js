const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getFriends,
  getFriendRequests,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  deleteFriend
} = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.get('/search', verifyToken, searchUsers);
router.get('/friends', verifyToken, getFriends);
router.get('/friends/requests', verifyToken, getFriendRequests);
router.post('/friends', verifyToken, sendFriendRequest);
router.put('/friends/:relationId/accept', verifyToken, acceptFriendRequest);
router.delete('/friends/:relationId', verifyToken, deleteFriend);

module.exports = router;
