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
};

const normalizeSchedule = (schedule) => {
  if (!schedule) return null;
  return {
    id: schedule.id,
    userId: schedule.userId,
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

const normalizeType = (type) => {
  if (type === 'Project') return 'Schedule';
  if (type === 'Schedule' || type === 'Task') return type;
  return 'Task';
};

const createSchedule = async ({ userId, teamId, type, title, description, dpName, targetDate }) => {
  if (!userId) {
    const error = new Error('로그인이 필요합니다.');
    error.statusCode = 401;
    throw error;
  }
  if (!title || !targetDate) {
    const error = new Error('일정명과 날짜를 입력해주세요.');
    error.statusCode = 400;
    throw error;
  }

  const schedule = await Schedule.create({
    userId,
    teamId: teamId || null,
    type: normalizeType(type),
    title,
    description: description || '',
    dpName: dpName || '기본 프로젝트',
    targetDate
  });

  return normalizeSchedule(schedule);
};

const getTeamSchedules = async ({ userId, teamId }) => {
  if (!userId) {
    const error = new Error('로그인이 필요합니다.');
    error.statusCode = 401;
    throw error;
  }
  const schedules = teamId
    ? await Schedule.findByTeamId(teamId, userId)
    : await Schedule.findAll(userId);

  const normalized = schedules.map(normalizeSchedule);

  const teamCache = {};
  for (const item of normalized) {
    if (item.type === 'ProjectTodo' && item.teamId && !item.dpName) {
      if (!teamCache[item.teamId]) {
        teamCache[item.teamId] = await Team.findOne({ id: item.teamId });
      }
      item.dpName = teamCache[item.teamId]?.name || '';
    }
  }

  return normalized;
};

const updateSchedule = async ({ id, userId, updates }) => {
  const allowedFields = ['type', 'title', 'description', 'dpName', 'targetDate', 'status'];
  const allowedStatuses = ['Wait', 'Progress', 'Done'];
  const filteredUpdates = Object.fromEntries(
    Object.entries(updates || {}).filter(([key, value]) => allowedFields.includes(key) && value !== undefined)
  );

  if (!Object.keys(filteredUpdates).length) {
    const error = new Error('수정할 일정 정보가 없습니다.');
    error.statusCode = 400;
    throw error;
  }

  if (filteredUpdates.status && !allowedStatuses.includes(filteredUpdates.status)) {
    const error = new Error('올바르지 않은 일정 상태입니다.');
    error.statusCode = 400;
    throw error;
  }

  if (filteredUpdates.type) {
    filteredUpdates.type = normalizeType(filteredUpdates.type);
  }

  const schedule = await Schedule.findByIdAndUpdate(id, userId, filteredUpdates);
  if (!schedule) {
    const error = new Error('일정을 찾을 수 없습니다.');
    error.statusCode = 404;
    throw error;
  }
  return normalizeSchedule(schedule);
};

const deleteSchedule = async ({ id, userId }) => {
  if (!id) {
    const error = new Error('삭제할 일정 id가 필요합니다.');
    error.statusCode = 400;
    throw error;
  }
  await Schedule.deleteById(id, userId);
};

module.exports = { createSchedule, getTeamSchedules, updateSchedule, deleteSchedule };
