const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

// 1. 일정 추가 (기존: POST /schedule)
router.post('/', scheduleController.createSchedule);

// 2. 일정 수정 (기존: POST /schedule-update -> 변경: PUT /schedules/:id)
// :scheduleId 부분에 프론트가 고유 번호를 넣어서 보냄 (예: /schedules/5)
router.put('/:scheduleId', scheduleController.updateSchedule);

// 3. 일정 삭제 (기존: GET /schedule-delete -> 변경: DELETE /schedules/:id)
router.delete('/:scheduleId', scheduleController.deleteSchedule);

// 해당 팀의 전체 일정 조회 API도 필요
router.get('/team/:teamId', scheduleController.getSchedulesByTeam);

module.exports = router;