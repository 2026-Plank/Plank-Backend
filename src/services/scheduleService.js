const Schedule = require('../models/Schedule');
const Team = require('../models/Team');
const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
   const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const normalizeSchedule = (schedule) => {
  if (!schedule) return null;
  return {
    id: schedule.id,
    teamId: schedule.teamId,
    type: schedule.type,
    title: schedule.title,
    description: schedule.description,
    dpName: schedule.dpName,
    status: schedule.status,
    targetDate: formatDate(schedule.targetDate),
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt
  };
};

const normalizeTeamId = async (teamId) => {
  if (teamId === '' || teamId === undefined || teamId === null) {
    return null;
  }

  const team = await Team.findOne({ id: teamId });
  return team ? team.id : null;
};

const createSchedule = async ({ teamId, type, title, description, dpName, targetDate }) => {
   if (!title || !targetDate) {
    const error = new Error('일정명과 날짜는 필수입니다.');
    error.statusCode = 400;
    throw error;
  }

  const schedule = await Schedule.create({
    teamId: await normalizeTeamId(teamId),
    type: type || 'Task',
    title,
    description: description || '',
    dpName: dpName || '기본 프로젝트',
    targetDate
  });

  return normalizeSchedule(schedule);
};

const getTeamSchedules = async (teamId) => {
  const schedules = teamId ? await Schedule.findByTeamId(teamId) : await Schedule.findAll();
 return schedules.map(normalizeSchedule);
};

const updateSchedule = async (id, updates) => {
  const allowedFields = ['type', 'title', 'description', 'dpName', 'targetDate', 'status'];
  const filteredUpdates = Object.fromEntries(
    Object.entries(updates || {}).filter(([key, value]) => allowedFields.includes(key) && value !== undefined)
  );

  if (!Object.keys(filteredUpdates).length) {
    const error = new Error('수정할 일정 정보가 없습니다.');
    error.statusCode = 400;
    throw error;
  }

  const schedule = await Schedule.findByIdAndUpdate(id, filteredUpdates);
  if (!schedule) {
    const error = new Error('일정을 찾을 수 없습니다.');
    error.statusCode = 404;
    throw error;
  }
  return normalizeSchedule(schedule);
};

const deleteSchedule = async (id) => {
  if (!id) {
    const error = new Error('삭제할 일정 id가 필요합니다.');
    error.statusCode = 400;
    throw error;
  }
  await Schedule.deleteById(id);
};

module.exports = { createSchedule, getTeamSchedules, updateSchedule, deleteSchedule };
