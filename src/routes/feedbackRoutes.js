const express = require('express');
const router = express.Router();
const {
  createFeedback,
  getFeedbacks,
  getMyReceivedFeedbacks,
  getMySentFeedbacks,
  getTeamFeedbacks
} = require('../controllers/feedbackController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/', verifyToken, createFeedback);
router.get('/mine/received', verifyToken, getMyReceivedFeedbacks);
router.get('/mine/sent', verifyToken, getMySentFeedbacks);
router.get('/team/:teamId', verifyToken, getTeamFeedbacks);
router.get('/:userId', verifyToken, getFeedbacks);

module.exports = router;
