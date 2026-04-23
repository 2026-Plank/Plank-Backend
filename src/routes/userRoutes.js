const express = require('express');
const userController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/search', verifyToken, userController.searchUsers);
router.get('/friends', verifyToken, userController.getFriends);
router.post('/friends/request', verifyToken, userController.sendFriendRequest);
router.get('/friends/requests', verifyToken, userController.getFriendRequests);
router.patch('/friends/requests/:requestId/accept', verifyToken, userController.acceptFriendRequest);
router.delete('/friends/:friendId', verifyToken, userController.deleteFriend);
router.get('/team-members', verifyToken, userController.getTeamMembers);

module.exports = router;
