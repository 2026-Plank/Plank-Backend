const db = require('../config/db.config');

const runIgnore = async (sql, ignoredCodes = []) => {
  try {
    await db.execute(sql);
  } catch (error) {
    if (!ignoredCodes.includes(error.errorNum)) {
      throw error;
    }
  }
};

const teamSelect = `
  id AS "id",
  teamname AS "name",
  personnel AS "personnel",
  teamcode AS "teamCode",
  dpnum AS "dpNum",
  DBMS_LOB.SUBSTR(dpname, 2000, 1) AS "dpName",
  DBMS_LOB.SUBSTR(dpleader, 2000, 1) AS "dpLeader",
  deadline AS "deadline"
`;

const memberSelect = `
  tm.teamid AS "teamId",
  tm.userid AS "id",
  tm.role AS "role",
  tm.department AS "department",
  tm.jobdetail AS "jobDetail",
  u.id AS "userPk",
  u.name AS "name",
  u.email AS "email"
`;

const Team = {
  ensureSchema: async () => {
    await runIgnore(`CREATE SEQUENCE teams_seq`, [955]);
    await runIgnore(`
      CREATE TABLE teams (
        id NUMBER PRIMARY KEY,
        teamname VARCHAR2(100 CHAR) NOT NULL,
        personnel NUMBER DEFAULT 1 NOT NULL,
        teamcode VARCHAR2(50 CHAR) UNIQUE,
        dpnum NUMBER DEFAULT 1,
        dpname CLOB,
        dpleader CLOB,
        deadline DATE NOT NULL
      )
    `, [955]);
    await db.execute(`
      CREATE OR REPLACE TRIGGER teams_trg
      BEFORE INSERT ON teams
      FOR EACH ROW
      WHEN (new.id IS NULL)
      BEGIN
        SELECT teams_seq.NEXTVAL
        INTO :new.id
        FROM dual;
      END;
    `);

    await runIgnore(`ALTER TABLE teams ADD teamname VARCHAR2(100 CHAR)`, [1430]);
    await runIgnore(`ALTER TABLE teams ADD personnel NUMBER DEFAULT 1 NOT NULL`, [1430]);
    await runIgnore(`ALTER TABLE teams ADD teamcode VARCHAR2(50 CHAR)`, [1430]);
    await runIgnore(`ALTER TABLE teams ADD dpnum NUMBER DEFAULT 1`, [1430]);
    await runIgnore(`ALTER TABLE teams ADD dpname CLOB`, [1430]);
    await runIgnore(`ALTER TABLE teams ADD dpleader CLOB`, [1430]);
    await runIgnore(`ALTER TABLE teams ADD deadline DATE`, [1430]);

    await runIgnore(`
      CREATE TABLE team_members (
        teamid NUMBER NOT NULL,
        userid VARCHAR2(50 CHAR) NOT NULL,
        role VARCHAR2(10 CHAR) DEFAULT 'User',
        department VARCHAR2(50 CHAR),
        jobdetail VARCHAR2(200 CHAR)
      )
    `, [955]);
    await runIgnore(`ALTER TABLE team_members ADD department VARCHAR2(50 CHAR)`, [1430]);
    await runIgnore(`ALTER TABLE team_members ADD jobdetail VARCHAR2(200 CHAR)`, [1430]);
  },

  create: async ({ name, personnel = 1, teamCode, dpNum = 1, dpName = '', dpLeader = '', deadline }) => {
    await db.execute(
      `INSERT INTO teams (teamname, personnel, teamcode, dpnum, dpname, dpleader, deadline)
       VALUES (:name, :personnel, :teamCode, :dpNum, :dpName, :dpLeader, TO_DATE(:deadline, 'YYYY-MM-DD'))`,
      { name, personnel, teamCode, dpNum, dpName, dpLeader, deadline }
    );
    return Team.findOne({ teamCode });
  },

  findOne: async (filter = {}) => {
    const clauses = [];
    const binds = {};
    if (filter.id !== undefined) {
      clauses.push('id = :id');
      binds.id = filter.id;
    }
    if (filter.teamCode !== undefined) {
      clauses.push('teamcode = :teamCode');
      binds.teamCode = filter.teamCode;
    }
    if (!clauses.length) return null;

    const result = await db.execute(
      `SELECT ${teamSelect}
       FROM teams
       WHERE ${clauses.join(' AND ')}
       FETCH FIRST 1 ROWS ONLY`,
      binds
    );
    return result.rows[0] || null;
  },

  addMember: async (teamId, userid, role = 'User') => {
    await db.execute(
      `MERGE INTO team_members tm
       USING (SELECT :teamId AS teamid, :userid AS userid FROM dual) src
       ON (tm.teamid = src.teamid AND tm.userid = src.userid)
       WHEN MATCHED THEN UPDATE SET role = :role
       WHEN NOT MATCHED THEN INSERT (teamid, userid, role) VALUES (:teamId, :userid, :role)`,
      { teamId, userid, role }
    );
  },

  isMember: async (teamId, userid) => {
    const result = await db.execute(
      `SELECT userid AS "userid"
       FROM team_members
       WHERE teamid = :teamId AND userid = :userid
       FETCH FIRST 1 ROWS ONLY`,
      { teamId, userid }
    );
    return Boolean(result.rows[0]);
  },

  getMembers: async (teamId) => {
    const result = await db.execute(
      `SELECT ${memberSelect}
       FROM team_members tm
       LEFT JOIN users u ON u.userid = tm.userid
       WHERE tm.teamid = :teamId
       ORDER BY tm.role, u.name, tm.userid`,
      { teamId }
    );
    return result.rows;
  },

  getUserTeams: async (userid) => {
    const result = await db.execute(
      `SELECT ${teamSelect}, tm.role AS "role"
       FROM teams t
       JOIN team_members tm ON tm.teamid = t.id
       WHERE tm.userid = :userid
       ORDER BY t.deadline ASC, t.id DESC`,
      { userid }
    );
    return result.rows;
  },

  update: async (teamId, updates = {}) => {
    const columnMap = {
      name: 'teamname',
      personnel: 'personnel',
      teamCode: 'teamcode',
      dpNum: 'dpnum',
      dpName: 'dpname',
      dpLeader: 'dpleader',
      deadline: 'deadline'
    };
    const fields = Object.keys(updates).filter((key) => columnMap[key]);
    if (!fields.length) return Team.findOne({ id: teamId });

    const setClauses = fields.map((key) => {
      if (key === 'deadline') return `${columnMap[key]} = TO_DATE(:${key}, 'YYYY-MM-DD')`;
      return `${columnMap[key]} = :${key}`;
    });
    await db.execute(
      `UPDATE teams SET ${setClauses.join(', ')} WHERE id = :teamId`,
      { teamId, ...updates }
    );
    return Team.findOne({ id: teamId });
  },

  remove: async (teamId) => {
    await db.execute(`DELETE FROM team_members WHERE teamid = :teamId`, { teamId });
    await db.execute(`DELETE FROM teams WHERE id = :teamId`, { teamId });
  },

  removeMember: async (teamId, userid) => {
    await db.execute(
      `DELETE FROM team_members WHERE teamid = :teamId AND userid = :userid`,
      { teamId, userid }
    );
  },

  updateMemberRole: async (teamId, userid, role) => {
    await db.execute(
      `UPDATE team_members SET role = :role WHERE teamid = :teamId AND userid = :userid`,
      { teamId, userid, role }
    );
  },

  updateMemberDepartment: async (teamId, userid, department, jobDetail, role = 'User') => {
    await db.execute(
      `UPDATE team_members
       SET department = :department, jobdetail = :jobDetail, role = :role
       WHERE teamid = :teamId AND userid = :userid`,
      { teamId, userid, department, jobDetail, role }
    );
  }
};

module.exports = Team;
