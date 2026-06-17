const { execute } = require('../config/db.config');

const normalizeTeamId = (teamId) => {
  return teamId === '' || teamId === undefined || teamId === null ? null : teamId;
};

const rowSelect = `
  id AS "id",
  userId AS "userId",
  teamId AS "teamId",
  type AS "type",
  title AS "title",
  DBMS_LOB.SUBSTR(description, 4000, 1) AS "description",
  dpName AS "dpName",
  status AS "status",
  targetDate AS "targetDate",
  createdAt AS "createdAt",
  updatedAt AS "updatedAt"
`;

const create = async ({ userId, teamId = null, type, title, description, dpName, targetDate }) => {
  const normalizedTeamId = normalizeTeamId(teamId);

  await execute(
    `INSERT INTO tasks_schedules (userId, teamId, type, title, description, dpName, status, targetDate, createdAt, updatedAt)
     VALUES (:userId, :teamId, :type, :title, :description, :dpName, 'Wait', TO_DATE(:targetDate, 'YYYY-MM-DD'), SYSDATE, SYSDATE)`,
    { userId, teamId: normalizedTeamId, type, title, description, dpName, targetDate }
  );

  const result = await execute(
    `SELECT ${rowSelect}
     FROM tasks_schedules
     WHERE userId = :userId
       AND NVL(teamId, -1) = NVL(:teamId, -1)
       AND title = :title
       AND targetDate = TO_DATE(:targetDate, 'YYYY-MM-DD')
     ORDER BY createdAt DESC, id DESC
     FETCH FIRST 1 ROWS ONLY`,
    { userId, teamId: normalizedTeamId, title, targetDate }
  );
  return result.rows[0] || null;
};

const findAll = async (userId) => {
  const result = await execute(
    `SELECT ${rowSelect}
     FROM tasks_schedules
     WHERE userId = :userId OR teamId IN (
       SELECT teamid FROM team_members WHERE userid = (
         SELECT userid FROM users WHERE id = :userId
       )
     )
     ORDER BY targetDate, id`,
    { userId }
  );
  return result.rows;
};

const findByTeamId = async (teamId, userId) => {
  const result = await execute(
    `SELECT ${rowSelect}
     FROM tasks_schedules
     WHERE teamId = :teamId
       AND (userId = :userId OR :userId IS NOT NULL)
     ORDER BY targetDate, id`,
    { teamId, userId }
  );
  return result.rows;
};

const findByIdAndUpdate = async (id, userId, updates) => {
  const fields = Object.keys(updates || {});
  if (!fields.length) return null;

  const binds = { id, userId };
  const setClauses = fields.map((field) => {
    const bindName = `update_${field}`;
    binds[bindName] = updates[field];
    return field === 'targetDate'
      ? `targetDate = TO_DATE(:${bindName}, 'YYYY-MM-DD')`
      : `${field} = :${bindName}`;
  });
  setClauses.push('updatedAt = SYSDATE');

  await execute(
    `UPDATE tasks_schedules SET ${setClauses.join(', ')} WHERE id = :id AND userId = :userId`,
    binds
  );
  const result = await execute(
    `SELECT ${rowSelect} FROM tasks_schedules WHERE id = :id AND userId = :userId`,
    { id, userId }
  );
  return result.rows[0] || null;
};

const deleteById = async (id, userId) => {
  await execute(`DELETE FROM tasks_schedules WHERE id = :id AND userId = :userId`, { id, userId });
};

module.exports = { create, findAll, findByTeamId, findByIdAndUpdate, deleteById };
