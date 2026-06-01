const express = require('express');
const router = express.Router();
const { addSchedule, getSchedules, updateScheduleById, deleteScheduleById } = require('../controllers/scheduleController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/', verifyToken, addSchedule);
router.get('/', verifyToken, getSchedules);
router.get('/:teamId', verifyToken, getSchedules);
router.put('/:id', verifyToken, updateScheduleById);
router.delete('/:id', verifyToken, deleteScheduleById);

module.exports = router;
