const { execute } = require('../config/db.config');

const runIgnore = async (sql, ignoredCodes = []) => {
  try {
    await execute(sql);
  } catch (error) {
    if (!ignoredCodes.includes(error.errorNum)) throw error;
  }
};

const buildWhere = (filter) => {
  const keys = Object.keys(filter || {});
  if (!keys.length) return { clause: '', binds: {} };
  const clauses = keys.map((key) => `${key} = :${key}`);
  return { clause: `WHERE ${clauses.join(' AND ')}`, binds: { ...filter } };
};

const userSelectWithPassword = `
  id AS "id",
  userid AS "userid",
  email AS "email",
  password AS "password",
  name AS "name",
  job AS "job",
  statusMessage AS "statusMessage",
  profile AS "profile",
  presenceStatus AS "presenceStatus"
`;

const publicUserSelect = `
  id AS "id",
  userid AS "userid",
  email AS "email",
  name AS "name",
  job AS "job",
  statusMessage AS "statusMessage",
  profile AS "profile",
  presenceStatus AS "presenceStatus"
`;

const ensurePresenceColumn = async () => {
  await runIgnore(`ALTER TABLE users ADD presenceStatus VARCHAR2(20) DEFAULT 'ONLINE' NOT NULL`, [1430]);
  await runIgnore(`ALTER TABLE users ADD job VARCHAR2(100 CHAR)`, [1430]);
  await runIgnore(`ALTER TABLE users ADD statusMessage VARCHAR2(200 CHAR)`, [1430]);
};

const create = async ({ userid, email, password, name }) => {
  await execute(
    `INSERT INTO users (userid, email, password, name) VALUES (:userid, :email, :password, :name)`,
    { userid, email, password, name }
  );
  return findOne({ email });
};

const findOne = async (filter) => {
  const { clause, binds } = buildWhere(filter);
  const result = await execute(`SELECT ${userSelectWithPassword} FROM users ${clause}`, binds);
  return result.rows[0] || null;
};

const findByLoginId = async (loginId) => {
  const result = await execute(
    `SELECT ${userSelectWithPassword} FROM users WHERE email = :loginId OR userid = :loginId`,
    { loginId }
  );
  return result.rows[0] || null;
};

const findByEmailOrUserid = async ({ email, userid }) => {
  const result = await execute(
    `SELECT ${userSelectWithPassword} FROM users WHERE email = :email OR userid = :userid`,
    { email, userid }
  );
  return result.rows[0] || null;
};

const findById = async (id) => {
  return findOne({ id });
};

const findByIdAndUpdate = async (id, updates) => {
  const fields = Object.keys(updates || {});
  if (!fields.length) return findById(id);

  const setClauses = fields.map((field) => `${field} = :${field}`);
  await execute(`UPDATE users SET ${setClauses.join(', ')} WHERE id = :id`, { id, ...updates });
  return findById(id);
};

const findOneAndUpdate = async (filter, updates) => {
  const existing = await findOne(filter);
  if (!existing) return null;
  await findByIdAndUpdate(existing.id, updates);
  return findById(existing.id);
};

const find = async (filter) => {
  const { clause, binds } = buildWhere(filter);
  const result = await execute(`SELECT ${publicUserSelect} FROM users ${clause}`, binds);
  return result.rows;
};

const search = async (keyword) => {
  const result = await execute(
    `SELECT ${publicUserSelect}
     FROM users
     WHERE LOWER(userid) LIKE LOWER(:keyword)
        OR LOWER(email) LIKE LOWER(:keyword)
        OR LOWER(name) LIKE LOWER(:keyword)
     ORDER BY id`,
    { keyword: `%${keyword}%` }
  );
  return result.rows;
};

module.exports = {
  ensurePresenceColumn,
  create,
  findOne,
  findByLoginId,
  findByEmailOrUserid,
  findById,
  findByIdAndUpdate,
  findOneAndUpdate,
  find,
  search
};
