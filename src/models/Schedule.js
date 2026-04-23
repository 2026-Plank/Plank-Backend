const db = require('../config/db.config');

const Schedule = {
  // 일정 추가 [cite: 144-146]
  create: async ({ userId, teamId, type, scheduleName, description, dpName, scheduleDate }) => {
    const query = `
      INSERT INTO tasks_schedules (userId, teamId, type, title, description, dpName, status, targetDate)
      VALUES (?, ?, ?, ?, ?, ?, 'Wait', ?)
    `;
    const [result] = await db.execute(query, [
      userId,
      teamId,
      type,
      scheduleName,
      description,
      dpName,
      scheduleDate
    ]);
    return result;
  },

  // 일정 수정 [cite: 148]
  update: async ({ scheduleId, ownerColumn, ownerId, scheduleName, scheduleDate, description, dpName }) => {
    const query = `
      UPDATE tasks_schedules
      SET title = ?, targetDate = ?, description = ?, dpName = ?
      WHERE id = ? AND ${ownerColumn} = ?
    `;
    const [result] = await db.execute(query, [
      scheduleName,
      scheduleDate,
      description,
      dpName,
      scheduleId,
      ownerId
    ]);
    return result;
  },

  // 일정 삭제 [cite: 148]
  delete: async ({ scheduleId, ownerColumn, ownerId }) => {
    const query = `DELETE FROM tasks_schedules WHERE id = ? AND ${ownerColumn} = ?`;
    const [result] = await db.execute(query, [scheduleId, ownerId]);
    return result;
  },

  findByOwner: async ({ userId, teamId, scope }) => {
    const conditions = [];
    const params = [];

    if (scope === 'PERSONAL') {
      conditions.push('userId = ?', "type = 'PERSONAL'");
      params.push(userId);
    } else if (scope === 'TEAM') {
      conditions.push('teamId = ?', "type = 'TEAM'");
      params.push(teamId);
    } else {
      conditions.push("((userId = ? AND type = 'PERSONAL') OR (teamId = ? AND type = 'TEAM'))");
      params.push(userId, teamId);
    }

    const query = `
      SELECT id, userId, teamId, type, title, description, dpName, status, targetDate
      FROM tasks_schedules
      WHERE ${conditions.join(' AND ')}
      ORDER BY targetDate ASC, id DESC
    `;
    const [rows] = await db.execute(query, params);
    return rows;
  }
};

module.exports = Schedule;
