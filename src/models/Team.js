const { execute } = require('../config/db.config');

const mapRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    personnel: row.personnel,
    teamCode: row.teamCode,
    dpNum: row.dpNum,
    dpName: row.dpName,
    dpLeader: row.dpLeader,
    deadline: row.deadline
  };
};

const create = async ({ name, personnel, teamCode, dpNum, dpName, dpLeader, deadline }) => {
  const sql = `INSERT INTO teams (teamname, personnel, teamcode, dpnum, dpname, dpleader, deadline)
               VALUES (:name, :personnel, :teamCode, :dpNum, :dpName, :dpLeader, TO_DATE(:deadline, 'YYYY-MM-DD'))`;
  await execute(sql, { name, personnel, teamCode, dpNum, dpName, dpLeader, deadline });
  return findOne({ teamCode });
};

const findOne = async (filter) => {
  const keys = Object.keys(filter || {});
  const columnMap = {
    id: 'id',
    name: 'teamname',
    teamCode: 'teamcode'
  };
  const clause = keys.length
    ? `WHERE ${keys.map((key) => `${columnMap[key] || key} = :${key}`).join(' AND ')}`
    : '';

  const sql = `SELECT id AS "id",
                      teamname AS "name",
                      personnel AS "personnel",
                      teamcode AS "teamCode",
                      dpnum AS "dpNum",
                      DBMS_LOB.SUBSTR(dpname, 4000, 1) AS "dpName",
                      DBMS_LOB.SUBSTR(dpleader, 4000, 1) AS "dpLeader",
                      deadline AS "deadline"
               FROM teams ${clause}`;
  const result = await execute(sql, filter);
  return mapRow(result.rows[0] || null);
};

const findAll = async () => {
  const sql = `SELECT id AS "id",
                      teamname AS "name",
                      personnel AS "personnel",
                      teamcode AS "teamCode",
                      dpnum AS "dpNum",
                      DBMS_LOB.SUBSTR(dpname, 4000, 1) AS "dpName",
                      DBMS_LOB.SUBSTR(dpleader, 4000, 1) AS "dpLeader",
                      deadline AS "deadline"
               FROM teams
               ORDER BY id DESC`;
  const result = await execute(sql);
  return result.rows.map(mapRow);
};

const getUserTeams = async (userId) => {
  const sql = `SELECT t.id AS "id",
                      t.teamname AS "name",
                      t.personnel AS "personnel",
                      t.teamcode AS "teamCode",
                      t.dpnum AS "dpNum",
                      DBMS_LOB.SUBSTR(t.dpname, 4000, 1) AS "dpName",
                      DBMS_LOB.SUBSTR(t.dpleader, 4000, 1) AS "dpLeader",
                      t.deadline AS "deadline",
                      tm.role AS "role"
               FROM teams t
               JOIN team_members tm ON t.id = tm.teamid
               WHERE tm.userid = :userId
               ORDER BY t.id DESC`;
  const result = await execute(sql, { userId });
  return result.rows.map(mapRow);
};

const addMember = async (teamId, userId, role = 'User') => {
  const sql = `INSERT INTO team_members (teamid, userid, role) VALUES (:teamId, :userId, :role)`;
  await execute(sql, { teamId, userId, role });
};

const isMember = async (teamId, userId) => {
  const sql = `SELECT 1 FROM team_members WHERE teamid = :teamId AND userid = :userId`;
  const result = await execute(sql, { teamId, userId });
  return result.rows.length > 0;
};

const update = async (id, updates) => {
  const fields = Object.keys(updates || {});
  if (!fields.length) return findOne({ id });

  const columnMap = {
    name: 'teamname',
    personnel: 'personnel',
    teamCode: 'teamcode',
    dpNum: 'dpnum',
    dpName: 'dpname',
    dpLeader: 'dpleader',
    deadline: 'deadline'
  };

  const setClauses = fields.map((field) => `${columnMap[field] || field} = :${field}`);
  const binds = { id, ...updates };
  const sql = `UPDATE teams SET ${setClauses.join(', ')} WHERE id = :id`;
  await execute(sql, binds);
  return findOne({ id });
};

const remove = async (id) => {
  // First remove all team members
  await execute(`DELETE FROM team_members WHERE teamid = :id`, { id });
  // Then remove the team
  await execute(`DELETE FROM teams WHERE id = :id`, { id });
};

const getMembers = async (teamId) => {
  const sql = `SELECT tm.userid AS "id", tm.role AS "role", u.name AS "name", u.email AS "email"
               FROM team_members tm
               JOIN users u ON tm.userid = u.userid
               WHERE tm.teamid = :teamId
               ORDER BY tm.role DESC, u.name`;
  const result = await execute(sql, { teamId });
  return result.rows.map((row) => ({
    id: row.id,
    role: row.role,
    name: row.name,
    email: row.email
  }));
};

const removeMember = async (teamId, userId) => {
  await execute(`DELETE FROM team_members WHERE teamid = :teamId AND userid = :userId`, { teamId, userId });
};

const updateMemberRole = async (teamId, userId, role) => {
  await execute(`UPDATE team_members SET role = :role WHERE teamid = :teamId AND userid = :userId`, { teamId, userId, role });
};

module.exports = { create, findOne, findAll, getUserTeams, addMember, isMember, update, remove, getMembers, removeMember, updateMemberRole };
