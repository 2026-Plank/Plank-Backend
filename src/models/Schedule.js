const { execute } = require('../config/db.config');

const create = async ({ teamId, type, title, description, dpName, targetDate }) => {
  const normalizedTeamId = teamId === '' || teamId === undefined || teamId === null ? null : teamId;
  const sql = `INSERT INTO tasks_schedules (teamId, type, title, description, dpName, status, targetDate)
               VALUES (:teamId, :type, :title, :description, :dpName, 'Wait', TO_DATE(:targetDate, 'YYYY-MM-DD'))`;
  await execute(sql, { teamId: normalizedTeamId, type, title, description, dpName, targetDate });
  const result = await execute(
    `SELECT ${rowSelect} FROM tasks_schedules WHERE id = :id`,
    { id }
  );
  return result.rows[0] || null;
};

const create = async ({ userId, teamId = null, type, title, description, dpName, targetDate }) => {
  await execute(
    `INSERT INTO tasks_schedules (userId, teamId, type, title, description, dpName, status, targetDate, createdAt, updatedAt)
     VALUES (:userId, :teamId, :type, :title, :description, :dpName, 'Wait', TO_DATE(:targetDate, 'YYYY-MM-DD'), SYSDATE, SYSDATE)`,
    { userId, teamId, type, title, description, dpName, targetDate }
  );

  const result = await execute(
    `SELECT ${rowSelect}
     FROM tasks_schedules
     WHERE userId = :userId
       AND title = :title
       AND targetDate = TO_DATE(:targetDate, 'YYYY-MM-DD')
     ORDER BY createdAt DESC, id DESC
     FETCH FIRST 1 ROWS ONLY`,
    { userId, title, targetDate }
  );
  return result.rows[0] || null;
};

module.exports = { create, findAll, findByTeamId, findByIdAndUpdate, deleteById };
