const db = require('../config/db.config');

const Schedule = {
  // 일정 및 할 일 생성 [cite: 145]
  create: async (data) => {
    const { teamId, type, title, description, dpName, targetDate } = data;
    const query = `INSERT INTO tasks_schedules (teamId, type, title, description, dpName, status, targetDate) 
                   VALUES (?, ?, ?, ?, ?, 'Wait', ?)`;
    return await db.execute(query, [teamId, type, title, description, dpName, targetDate]);
  },

  // 팀별 일정 조회 [cite: 144]
  findByTeamId: async (teamId) => {
    const query = `SELECT * FROM tasks_schedules WHERE teamId = ? ORDER BY targetDate ASC`;
    const [rows] = await db.execute(query, [teamId]);
    return rows;
  }
};

module.exports = Schedule;