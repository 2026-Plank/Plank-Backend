<<<<<<< HEAD
const db = require('../config/db.config');

const baseSelect = `
  SELECT id, email, name, teamId, role, status, createdAt
  FROM users
`;

const User = {
  findByEmail: async (email) => {
    const query = `
      SELECT id, email, password, name, teamId, role, status, createdAt
      FROM users
      WHERE email = ?
      LIMIT 1
    `;
    const [rows] = await db.execute(query, [email]);
    return rows[0] || null;
  },

  findById: async (id) => {
    const query = `${baseSelect} WHERE id = ? LIMIT 1`;
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
  },

  searchByKeyword: async ({ keyword, excludeUserId }) => {
    const query = `
      ${baseSelect}
      WHERE id != ?
        AND (
          name LIKE CONCAT('%', ?, '%')
          OR email LIKE CONCAT('%', ?, '%')
        )
      ORDER BY name ASC
      LIMIT 20
    `;
    const [rows] = await db.execute(query, [excludeUserId, keyword, keyword]);
    return rows;
  },

  findManyByIds: async (userIds) => {
    if (!userIds.length) {
      return [];
    }

    const placeholders = userIds.map(() => '?').join(', ');
    const query = `
      ${baseSelect}
      WHERE id IN (${placeholders})
      ORDER BY name ASC
    `;
    const [rows] = await db.execute(query, userIds);
    return rows;
  },

  findTeamMembers: async ({ teamId, excludeUserId }) => {
    const query = `
      ${baseSelect}
      WHERE teamId = ?
        AND status = 'APPROVED'
        AND id != ?
      ORDER BY name ASC
    `;
    const [rows] = await db.execute(query, [teamId, excludeUserId]);
    return rows;
  },

  create: async ({ email, password, name, role = 'MEMBER', status = 'APPROVED' }) => {
    const query = `
      INSERT INTO users (email, password, name, role, status)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [email, password, name, role, status]);
    return User.findById(result.insertId);
  },

  updateTeamRequest: async (userId, teamId) => {
    const query = `
      UPDATE users
      SET teamId = ?, status = 'PENDING'
      WHERE id = ?
    `;
    const [result] = await db.execute(query, [teamId, userId]);
    return result;
  },

  findPendingByTeamId: async (teamId) => {
    const query = `${baseSelect} WHERE teamId = ? AND status = 'PENDING' ORDER BY createdAt DESC`;
    const [rows] = await db.execute(query, [teamId]);
    return rows;
  },

  approveTeamMember: async (userId, teamId) => {
    const query = `
      UPDATE users
      SET status = 'APPROVED'
      WHERE id = ? AND teamId = ?
    `;
    const [result] = await db.execute(query, [userId, teamId]);
    return result;
  },

  belongsToSameTeam: async (userId, teamId) => {
    const query = `
      SELECT id
      FROM users
      WHERE id = ? AND teamId = ? AND status = 'APPROVED'
      LIMIT 1
    `;
    const [rows] = await db.execute(query, [userId, teamId]);
    return Boolean(rows[0]);
  }
};

module.exports = User;
=======
const { execute } = require('../config/db.config');

const buildWhere = (filter) => {
  const keys = Object.keys(filter || {});
  if (!keys.length) return { clause: '', binds: {} };
  const clauses = keys.map((key) => `${key} = :${key}`);
  const binds = { ...filter };
  return { clause: `WHERE ${clauses.join(' AND ')}`, binds };
};

const ensurePresenceColumn = async () => {
  await execute(`
    BEGIN
      EXECUTE IMMEDIATE 'ALTER TABLE users ADD presenceStatus VARCHAR2(20) DEFAULT ''ONLINE'' NOT NULL';
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLCODE != -1430 THEN
          RAISE;
        END IF;
    END;
  `);
};

const create = async ({ userid, email, password, name }) => {
  const sql = `INSERT INTO users (userid, email, password, name) VALUES (:userid, :email, :password, :name)`;
  await execute(sql, { userid, email, password, name });
  return findOne({ email });
};

const findOne = async (filter) => {
  let sql = 'SELECT id AS "id", userid AS "userid", email AS "email", password AS "password", name AS "name", profile AS "profile", presenceStatus AS "presenceStatus" FROM users';
  const { clause, binds } = buildWhere(filter);
  sql += ` ${clause}`;
  const result = await execute(sql, binds);
  return result.rows[0] || null;
};

const findByLoginId = async (loginId) => {
  const sql = 'SELECT id AS "id", userid AS "userid", email AS "email", password AS "password", name AS "name", profile AS "profile", presenceStatus AS "presenceStatus" FROM users WHERE email = :loginId OR userid = :loginId';
  const result = await execute(sql, { loginId });
  return result.rows[0] || null;
};

const findByEmailOrUserid = async ({ email, userid }) => {
  const sql = 'SELECT id AS "id", userid AS "userid", email AS "email", password AS "password", name AS "name", profile AS "profile", presenceStatus AS "presenceStatus" FROM users WHERE email = :email OR userid = :userid';
  const result = await execute(sql, { email, userid });
  return result.rows[0] || null;
};

const findById = async (id) => {
  return findOne({ id });
};

const findByIdAndUpdate = async (id, updates) => {
  const fields = Object.keys(updates);
  if (!fields.length) return findById(id);

  const setClauses = fields.map((field) => `${field} = :${field}`);
  const binds = { id, ...updates };
  const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE id = :id`;
  await execute(sql, binds);
  return findById(id);
};

const findOneAndUpdate = async (filter, updates) => {
  const existing = await findOne(filter);
  if (!existing) return null;
  await findByIdAndUpdate(existing.id, updates);
  return findById(existing.id);
};

const find = async (filter) => {
  let sql = 'SELECT id AS "id", userid AS "userid", email AS "email", name AS "name", profile AS "profile", presenceStatus AS "presenceStatus" FROM users';
  const { clause, binds } = buildWhere(filter);
  sql += ` ${clause}`;
  const result = await execute(sql, binds);
  return result.rows;
};

const search = async (keyword) => {
  const sql = `SELECT id AS "id", userid AS "userid", email AS "email", name AS "name", profile AS "profile", presenceStatus AS "presenceStatus"
               FROM users
               WHERE LOWER(userid) LIKE LOWER(:keyword)
                  OR LOWER(email) LIKE LOWER(:keyword)
                  OR LOWER(name) LIKE LOWER(:keyword)
               ORDER BY id`;
  const result = await execute(sql, { keyword: `%${keyword}%` });
  return result.rows;
};

module.exports = { ensurePresenceColumn, create, findOne, findByLoginId, findByEmailOrUserid, findById, findByIdAndUpdate, findOneAndUpdate, find, search };

>>>>>>> 6b0dad0c16077e3674c3d16d79957895695a9153
