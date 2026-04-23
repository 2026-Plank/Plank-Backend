const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { verifyToken } = require('../middlewares/authMiddleware');

// 1. 피드백 작성 (기존: POST /feedback)
router.post('/', verifyToken, feedbackController.createFeedback);
router.get('/me/received', verifyToken, feedbackController.getMyReceivedFeedbacks);
router.get('/me/sent', verifyToken, feedbackController.getMySentFeedbacks);
router.delete('/:feedbackId', verifyToken, feedbackController.deleteFeedback);

router.get('/:targetId', verifyToken, feedbackController.getFeedbacks);

module.exports = router;
