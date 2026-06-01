const Notification = require('../models/Notification');
const Team = require('../models/Team');
const { getTeamSchedules } = require('../services/scheduleService');

const toDateKey = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const daysUntil = (value) => {
  const targetKey = toDateKey(value);
  if (!targetKey) return null;
  const today = new Date(toDateKey(new Date()));
  const target = new Date(targetKey);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
};

const getLeftText = (left) => (left === 0 ? '오늘' : `${left}일`);

const isDeadlineNotification = (notification) => (
  ['task_deadline', 'project_deadline'].includes(notification.type)
);

const getScheduleDeadlineInfo = (schedule, userId) => {
  const left = daysUntil(schedule.targetDate);
  if (left === null || left < 0 || left > 3 || schedule.status === 'Done') return null;

  const isProject = schedule.type === 'Schedule' || schedule.type === 'Project';
  const type = isProject ? 'project_deadline' : 'task_deadline';
  const label = isProject ? '프로젝트' : '과제';
  const leftText = getLeftText(left);

  return {
    type,
    message: left === 0
      ? `${schedule.title} ${label} 마감일이 오늘입니다.`
      : `${schedule.title} ${label} 마감까지 ${leftText} 남았습니다.`,
    targetType: 'schedule',
    targetId: String(schedule.id),
    actionPath: isProject ? '/project' : '/schedule',
    dedupeKey: `${type}:${userId}:${schedule.id}:${schedule.targetDate}`
  };
};

const syncScheduleDeadlineNotifications = async (userId, schedules) => {
  const existingNotifications = await Notification.find({ userId });
  const existingScheduleDeadlines = existingNotifications.filter((notification) => (
    isDeadlineNotification(notification) && notification.targetType === 'schedule'
  ));

  const nextNotifications = schedules
    .map((schedule) => getScheduleDeadlineInfo(schedule, userId))
    .filter(Boolean);
  const nextByKey = new Map(nextNotifications.map((notification) => [notification.dedupeKey, notification]));

  await Promise.all(existingScheduleDeadlines
    .filter((notification) => !nextByKey.has(notification.dedupeKey))
    .map((notification) => Notification.deleteById(notification.id)));

  await Promise.all(nextNotifications.map(async (next) => {
    const existing = existingScheduleDeadlines.find((notification) => notification.dedupeKey === next.dedupeKey);
    if (!existing) {
      return Notification.create({ userId, ...next });
    }

    if (
      existing.message !== next.message ||
      existing.type !== next.type ||
      existing.actionPath !== next.actionPath
    ) {
      return Notification.findByIdAndUpdate(existing.id, {
        type: next.type,
        message: next.message,
        targetType: next.targetType,
        targetId: next.targetId,
        actionPath: next.actionPath,
        dedupeKey: next.dedupeKey,
        isRead: false
      });
    }

    return existing;
  }));
};

const createTeamDeadlineNotifications = async (req) => {
  const teams = await Team.getUserTeams(req.user.userid);
  const dueTeams = teams.filter((team) => {
    const left = daysUntil(team.deadline);
    return left !== null && left >= 0 && left <= 3;
  });

  await Promise.all(dueTeams.map((team) => {
    const left = daysUntil(team.deadline);
    const leftText = getLeftText(left);
    return Notification.createOnce({
      userId: req.user.id,
      type: 'project_deadline',
      message: left === 0
        ? `${team.name} 프로젝트 마감일이 오늘입니다.`
        : `${team.name} 프로젝트 마감까지 ${leftText} 남았습니다.`,
      targetType: 'team',
      targetId: String(team.id),
      actionPath: '/project',
      dedupeKey: `project_deadline:${req.user.id}:${team.id}:${toDateKey(team.deadline)}`
    });
  }));
};

const createDeadlineNotifications = async (req) => {
  const schedules = await getTeamSchedules({ userId: req.user.id });
  await syncScheduleDeadlineNotifications(req.user.id, schedules);
  await createTeamDeadlineNotifications(req);
};

const getNotifications = async (req, res) => {
  try {
    await createDeadlineNotifications(req);
    const notifications = await Notification.find({ userId: req.user.id });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Notification.find({ id, userId: req.user.id });
    if (!existing.length) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    const notification = await Notification.findByIdAndUpdate(id, { isRead: true });
    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Notification.find({ id, userId: req.user.id });
    if (!existing.length) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    await Notification.deleteById(id);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getNotifications, markAsRead, deleteNotification };
