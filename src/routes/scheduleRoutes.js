const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

// 일정 추가: POST /api/schedules
router.post('/', scheduleController.addSchedule);

// 특정 팀 일정 조회: GET /api/schedules/:teamId
router.get('/:teamId', scheduleController.getSchedules);

module.exports = router;