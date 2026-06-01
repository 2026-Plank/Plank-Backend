const { createSchedule, getTeamSchedules, updateSchedule, deleteSchedule } = require('../services/scheduleService');

const addSchedule = async (req, res) => {
  try {
    const { teamId, type, title, description, dpName, targetDate } = req.body;
    const schedule = await createSchedule({ teamId, type, title, description, dpName, targetDate });
    res.status(201).json({ message: 'Schedule created', scheduleId: schedule.id, schedule });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getSchedules = async (req, res) => {
  try {
    const { teamId } = req.params;
    const requestedTeamId = teamId || req.query.teamId;
    const schedules = await getTeamSchedules({ userId: req.user.id, teamId: requestedTeamId });
    res.json({ schedules });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const updateScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const schedule = await updateSchedule(id, updates);
    res.json({ message: 'Schedule updated', scheduleId: schedule.id, schedule });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const deleteScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteSchedule({ id, userId: req.user.id });
    res.json({ message: 'Schedule deleted' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

module.exports = { addSchedule, getSchedules, updateScheduleById, deleteScheduleById };
