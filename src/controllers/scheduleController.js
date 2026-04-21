const scheduleService = require('../../services/scheduleService');

exports.addSchedule = async (req, res) => {
  try {
    const result = await scheduleService.createNewSchedule(req.body);
    res.status(201).json({ message: "일정이 추가되었습니다.", id: result[0].insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSchedules = async (req, res) => {
  try {
    const schedules = await scheduleService.getTeamSchedules(req.params.teamId);
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};