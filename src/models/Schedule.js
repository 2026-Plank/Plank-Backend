const db = require('../config/db.config');

const Schedule = {
  // 일정 추가 [cite: 144-146]
  create: async (teamId, type, scheduleName, description, dpName, scheduleDate) => {
    const query = `INSERT INTO tasks_schedules (teamId, type, title, description, dpName, status, targetDate) 
                   VALUES (?, ?, ?, ?, ?, 'Wait', ?)`;
    const [result] = await db.execute(query, [teamId, type, scheduleName, description, dpName, scheduleDate]);
    return result;
  },

  // 일정 수정 [cite: 148]
  update: async (scheduleName, scheduleDate, description, dpName) => {
    const query = `UPDATE tasks_schedules 
                   SET targetDate = ?, description = ?, dpName = ? 
                   WHERE title = ?`;
    const [result] = await db.execute(query, [scheduleDate, description, dpName, scheduleName]);
    return result;
  },

  // 일정 삭제 [cite: 148]
  delete: async (scheduleName) => {
    const query = `DELETE FROM tasks_schedules WHERE title = ?`;
    const [result] = await db.execute(query, [scheduleName]);
    return result;
  }
};

module.exports = Schedule;