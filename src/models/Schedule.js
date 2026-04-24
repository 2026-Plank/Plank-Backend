const { execute } = require('../config/db.config');

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
