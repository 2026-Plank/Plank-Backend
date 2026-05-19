const { execute } = require('../config/db.config');

<<<<<<< HEAD
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
=======
const create = async ({ teamId, type, title, description, dpName, targetDate }) => {
  const normalizedTeamId = teamId === '' || teamId === undefined || teamId === null ? null : teamId;
  const sql = `INSERT INTO tasks_schedules (teamId, type, title, description, dpName, status, targetDate)
               VALUES (:teamId, :type, :title, :description, :dpName, 'Wait', TO_DATE(:targetDate, 'YYYY-MM-DD'))`;
  await execute(sql, { teamId: normalizedTeamId, type, title, description, dpName, targetDate });
  const result = await execute(
    `SELECT id AS "id", teamId AS "teamId", type AS "type", title AS "title", DBMS_LOB.SUBSTR(description, 4000, 1) AS "description", dpName AS "dpName", status AS "status", targetDate AS "targetDate"
     FROM tasks_schedules
     WHERE NVL(teamId, -1) = NVL(:teamId, -1) AND title = :title AND targetDate = TO_DATE(:targetDate, 'YYYY-MM-DD')
     ORDER BY id DESC`,
    { teamId: normalizedTeamId, title, targetDate }
  );
  return result.rows[0] || null;
};

const findAll = async () => {
  const sql = `SELECT id AS "id", teamId AS "teamId", type AS "type", title AS "title", DBMS_LOB.SUBSTR(description, 4000, 1) AS "description", dpName AS "dpName", status AS "status", targetDate AS "targetDate"
               FROM tasks_schedules ORDER BY targetDate, id`;
  const result = await execute(sql);
  return result.rows;
};

const findByTeamId = async (teamId) => {
  const sql = `SELECT id AS "id", teamId AS "teamId", type AS "type", title AS "title", DBMS_LOB.SUBSTR(description, 4000, 1) AS "description", dpName AS "dpName", status AS "status", targetDate AS "targetDate"
               FROM tasks_schedules WHERE teamId = :teamId ORDER BY targetDate, id`;
  const result = await execute(sql, { teamId });
  return result.rows;
};

const findByIdAndUpdate = async (id, updates) => {
  const fields = Object.keys(updates);
  if (!fields.length) return null;

  const binds = { id };
  const setClauses = fields.map((field) => {
    const bindName = `update_${field}`;
    binds[bindName] = updates[field];
    if (field === 'targetDate') {
      return `targetDate = TO_DATE(:${bindName}, 'YYYY-MM-DD')`;
    }
    return `${field} = :${bindName}`;
  });

  const sql = `UPDATE tasks_schedules SET ${setClauses.join(', ')} WHERE id = :id`;
  await execute(sql, binds);
  const result = await execute(
    `SELECT id AS "id", teamId AS "teamId", type AS "type", title AS "title", DBMS_LOB.SUBSTR(description, 4000, 1) AS "description", dpName AS "dpName", status AS "status", targetDate AS "targetDate"
     FROM tasks_schedules WHERE id = :id`,
    { id }
  );
  return result.rows[0] || null;
};

const deleteById = async (id) => {
  await execute(`DELETE FROM tasks_schedules WHERE id = :id`, { id });
};

module.exports = { create, findAll, findByTeamId, findByIdAndUpdate, deleteById };
>>>>>>> 6b0dad0c16077e3674c3d16d79957895695a9153
