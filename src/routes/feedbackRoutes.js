const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

// 1. 피드백 작성 (기존: POST /feedback)
router.post('/', feedbackController.createFeedback);

router.get('/:targetId', feedbackController.getFeedbacks);

module.exports = router;