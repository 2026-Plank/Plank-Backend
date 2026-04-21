const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

// 일정 추가 (POST /schedule) [cite: 144-146]
router.post('/schedule', scheduleController.addSchedule);

// 일정 수정 (POST /schedule-update) [cite: 148]
router.post('/schedule-update', scheduleController.updateSchedule);

// 일정 삭제 (DELETE /schedule-delete) [cite: 148]
router.delete('/schedule-delete', scheduleController.deleteSchedule);

module.exports = router;