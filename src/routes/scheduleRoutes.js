const express = require('express');
const router = express.Router();
const { addSchedule, getSchedules, updateScheduleById, deleteScheduleById } = require('../controllers/scheduleController');

router.post('/', addSchedule);
router.get('/', getSchedules);
router.get('/:teamId', getSchedules);
router.put('/:id', updateScheduleById);
router.delete('/:id', deleteScheduleById);

module.exports = router;
