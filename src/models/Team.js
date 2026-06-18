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
    deadline: row.deadline,
    role: row.role
  };
};

const parseMemberRole = (role = '') => {
  const value = String(role || '');
  if (value === 'Admin') {
    return { role: value, department: '', jobDetail: '프로젝트 리더' };
  }
  if (!value.startsWith('Member|')) {
    return { role: value || 'User', department: '', jobDetail: '' };
  }
  const [, department = '', jobDetail = ''] = value.split('|');
  return { role: value, department, jobDetail };
};

const ensureColumn = async (columnName, definition) => {
  const result = await execute(
    `SELECT 1
     FROM USER_TAB_COLUMNS
     WHERE TABLE_NAME = 'TEAM_MEMBERS'
       AND COLUMN_NAME = :columnName`,
    { columnName }
  );

  if (result.rows.length === 0) {
    await execute(`ALTER TABLE team_members ADD (${definition})`);
  }
};

const ensureSchema = async () => {
  await ensureColumn('DEPARTMENT', 'department VARCHAR2(50 CHAR)');
  await ensureColumn('JOBDETAIL', 'jobdetail VARCHAR2(200 CHAR)');
};

const create = async ({ name, personnel, teamCode, dpNum, dpName, dpLeader, deadline }) => {
  await execute(
    `INSERT INTO teams (teamname, personnel, teamcode, dpnum, dpname, dpleader, deadline)
     VALUES (:name, :personnel, :teamCode, :dpNum, :dpName, :dpLeader, TO_DATE(:deadline, 'YYYY-MM-DD'))`,
    { name, personnel, teamCode, dpNum, dpName, dpLeader, deadline }
  );
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

  const result = await execute(
    `SELECT id AS "id",
            teamname AS "name",
            personnel AS "personnel",
            teamcode AS "teamCode",
            dpnum AS "dpNum",
            DBMS_LOB.SUBSTR(dpname, 4000, 1) AS "dpName",
            DBMS_LOB.SUBSTR(dpleader, 4000, 1) AS "dpLeader",
            deadline AS "deadline"
     FROM teams ${clause}`,
    filter
  );
  return mapRow(result.rows[0] || null);
};

const findAll = async () => {
  const result = await execute(
    `SELECT id AS "id",
            teamname AS "name",
            personnel AS "personnel",
            teamcode AS "teamCode",
            dpnum AS "dpNum",
            DBMS_LOB.SUBSTR(dpname, 4000, 1) AS "dpName",
            DBMS_LOB.SUBSTR(dpleader, 4000, 1) AS "dpLeader",
            deadline AS "deadline"
     FROM teams
     ORDER BY id DESC`
  );
  return result.rows.map(mapRow);
};

const getUserTeams = async (userId) => {
  const result = await execute(
    `SELECT t.id AS "id",
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
     ORDER BY t.id DESC`,
    { userId }
  );
  return result.rows.map(mapRow);
};

const addMember = async (teamId, userId, role = 'User') => {
  await execute(
    `INSERT INTO team_members (teamid, userid, role) VALUES (:teamId, :userId, :role)`,
    { teamId, userId, role }
  );
};

const isMember = async (teamId, userId) => {
  const result = await execute(
    `SELECT 1 FROM team_members WHERE teamid = :teamId AND userid = :userId`,
    { teamId, userId }
  );
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

  const setClauses = fields.map((field) => {
    const column = columnMap[field] || field;
    return field === 'deadline' ? `${column} = TO_DATE(:${field}, 'YYYY-MM-DD')` : `${column} = :${field}`;
  });
  await execute(`UPDATE teams SET ${setClauses.join(', ')} WHERE id = :id`, { id, ...updates });
  return findOne({ id });
};

const remove = async (id) => {
  await execute(`DELETE FROM tasks_schedules WHERE teamid = :id`, { id });
  await execute(`DELETE FROM feedbacks WHERE teamid = :id`, { id });
  await execute(`DELETE FROM notifications WHERE targetType = 'team' AND targetId = :targetId`, { targetId: String(id) });
  await execute(`DELETE FROM team_members WHERE teamid = :id`, { id });
  await execute(`DELETE FROM teams WHERE id = :id`, { id });
};

const getMembers = async (teamId) => {
  const result = await execute(
    `SELECT tm.userid AS "id",
            tm.role AS "storedRole",
            tm.department AS "department",
            tm.jobdetail AS "jobDetail",
            u.id AS "userPk",
            u.name AS "name",
            u.email AS "email"
     FROM team_members tm
     JOIN users u ON tm.userid = u.userid
     WHERE tm.teamid = :teamId
     ORDER BY tm.role DESC, u.name`,
    { teamId }
  );

  return result.rows.map((row) => {
    const parsed = parseMemberRole(row.storedRole);
    return {
      id: row.id,
      userPk: row.userPk,
      name: row.name,
      email: row.email,
      role: parsed.role,
      department: row.department || parsed.department,
      jobDetail: row.jobDetail || parsed.jobDetail
    };
  });
};

const removeMember = async (teamId, userId) => {
  await execute(`DELETE FROM team_members WHERE teamid = :teamId AND userid = :userId`, { teamId, userId });
};

const updateMemberRole = async (teamId, userId, role) => {
  await execute(
    `UPDATE team_members SET role = :role WHERE teamid = :teamId AND userid = :userId`,
    { teamId, userId, role }
  );
};

const updateMemberDepartment = async (teamId, userId, department, jobDetail, role = 'User') => {
  await execute(
    `UPDATE team_members
     SET role = :role,
         department = :department,
         jobdetail = :jobDetail
     WHERE teamid = :teamId AND userid = :userId`,
    { teamId, userId, role, department, jobDetail }
  );
};

module.exports = {
  create,
  findOne,
  findAll,
  getUserTeams,
  addMember,
  isMember,
  update,
  remove,
  getMembers,
  removeMember,
  updateMemberRole,
  updateMemberDepartment,
  ensureSchema
};
