const User = require('../models/User');
const { getTeamSchedules } = require('../services/scheduleService');

const sanitizeUser = (user) => {
  if (!user) return null;
  const cloned = { ...user };
  delete cloned.password;
  return cloned;
};

const getCurrentUser = async (req) => {
  const user = req.user?.id
    ? await User.findById(req.user.id)
    : await User.findOne({ userid: req.user?.userId });

  if (!user) {
    const error = new Error('로그인한 사용자를 찾을 수 없습니다.');
    error.statusCode = 401;
    throw error;
  }

  return user;
};

const toDateKey = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getHomeDashboard = async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const schedules = await getTeamSchedules({ userId: user.id });
    const todayKey = toDateKey(new Date());

    const sortedSchedules = [...schedules].sort((a, b) => {
      const dateDiff = new Date(a.targetDate) - new Date(b.targetDate);
      return dateDiff || Number(a.id) - Number(b.id);
    });

    const todaySchedules = sortedSchedules.filter((schedule) => schedule.targetDate === todayKey);
    const upcomingSchedules = sortedSchedules
      .filter((schedule) => schedule.targetDate >= todayKey)
      .slice(0, 20);

    const calendarMarks = sortedSchedules.reduce((marks, schedule) => {
      marks[schedule.targetDate] = (marks[schedule.targetDate] || 0) + 1;
      return marks;
    }, {});

    const projectMap = sortedSchedules.reduce((acc, schedule) => {
      const key = schedule.dpName || '기본 프로젝트';
      if (!acc[key]) {
        acc[key] = {
          id: key,
          name: key,
          total: 0,
          done: 0,
          nextDate: schedule.targetDate
        };
      }
      acc[key].total += 1;
      if (schedule.status === 'Done') acc[key].done += 1;
      if (schedule.targetDate < acc[key].nextDate) acc[key].nextDate = schedule.targetDate;
      return acc;
    }, {});

    res.json({
      user: sanitizeUser(user),
      schedules: sortedSchedules,
      todaySchedules,
      upcomingSchedules,
      projects: Object.values(projectMap),
      calendarMarks
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

module.exports = { getHomeDashboard };
