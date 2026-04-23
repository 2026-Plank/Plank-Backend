const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/schedules', verifyToken, scheduleController.getSchedules);
router.post('/schedules', verifyToken, scheduleController.addSchedule);
router.patch('/schedules/:scheduleId', verifyToken, (req, res, next) => {
  req.body.scheduleId = req.params.scheduleId;
  next();
}, scheduleController.updateSchedule);
router.delete('/schedules/:scheduleId', verifyToken, (req, res, next) => {
  req.body.scheduleId = req.params.scheduleId;
  next();
}, scheduleController.deleteSchedule);

// 일정 추가 (POST /schedule) [cite: 144-146]
router.post('/schedule', verifyToken, scheduleController.addSchedule);

// 일정 수정 (POST /schedule-update) [cite: 148]
router.post('/schedule-update', verifyToken, scheduleController.updateSchedule);

// 일정 삭제 (DELETE /schedule-delete) [cite: 148]
router.delete('/schedule-delete', verifyToken, scheduleController.deleteSchedule);

module.exports = router;
