const { execute } = require('../config/db.config');

const buildWhere = (filter) => {
  const keys = Object.keys(filter || {});
  if (!keys.length) return { clause: '', binds: {} };
  const clauses = keys.map((key) => `${key} = :${key}`);
  const binds = { ...filter };
  return { clause: `WHERE ${clauses.join(' AND ')}`, binds };
};

const runIgnore = async (sql, ignoredCodes = []) => {
  try {
    await execute(sql);
  } catch (error) {
    if (!ignoredCodes.includes(error.errorNum)) throw error;
  }
};

const ensureProfileColumns = async () => {
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

  await runIgnore(`ALTER TABLE users ADD job VARCHAR2(100 CHAR)`, [1430]);
  await runIgnore(`ALTER TABLE users ADD statusMessage VARCHAR2(200 CHAR)`, [1430]);
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

const userSelect = `
  id AS "id",
  userid AS "userid",
  email AS "email",
  name AS "name",
  job AS "job",
  statusMessage AS "statusMessage",
  profile AS "profile",
  presenceStatus AS "presenceStatus"
`;

const create = async ({ userid, email, password, name }) => {
  const sql = `INSERT INTO users (userid, email, password, name) VALUES (:userid, :email, :password, :name)`;
  await execute(sql, { userid, email, password, name });
  return findOne({ email });
};

const findOne = async (filter) => {
  let sql = `SELECT ${userSelectWithPassword} FROM users`;
  const { clause, binds } = buildWhere(filter);
  sql += ` ${clause}`;
  const result = await execute(sql, binds);
  return result.rows[0] || null;
};

const findByLoginId = async (loginId) => {
  const sql = `SELECT ${userSelectWithPassword} FROM users WHERE email = :loginId OR userid = :loginId`;
  const result = await execute(sql, { loginId });
  return result.rows[0] || null;
};

const findByEmailOrUserid = async ({ email, userid }) => {
  const sql = `SELECT ${userSelectWithPassword} FROM users WHERE email = :email OR userid = :userid`;
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
  let sql = `SELECT ${userSelect} FROM users`;
  const { clause, binds } = buildWhere(filter);
  sql += ` ${clause}`;
  const result = await execute(sql, binds);
  return result.rows;
};

const search = async (keyword) => {
  const sql = `SELECT ${userSelect}
               FROM users
               WHERE LOWER(userid) LIKE LOWER(:keyword)
                  OR LOWER(email) LIKE LOWER(:keyword)
                  OR LOWER(name) LIKE LOWER(:keyword)
               ORDER BY id`;
  const result = await execute(sql, { keyword: `%${keyword}%` });
  return result.rows;
};

module.exports = { ensureProfileColumns, ensurePresenceColumn: ensureProfileColumns, create, findOne, findByLoginId, findByEmailOrUserid, findById, findByIdAndUpdate, findOneAndUpdate, find, search };
