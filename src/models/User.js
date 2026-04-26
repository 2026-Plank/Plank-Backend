const { execute } = require('../config/db.config');

const buildWhere = (filter) => {
  const keys = Object.keys(filter || {});
  if (!keys.length) return { clause: '', binds: {} };
  const clauses = keys.map((key) => `${key} = :${key}`);
  const binds = { ...filter };
  return { clause: `WHERE ${clauses.join(' AND ')}`, binds };
};

const create = async ({ userid, email, password, name }) => {
  const sql = `INSERT INTO users (userid, email, password, name) VALUES (:userid, :email, :password, :name)`;
  await execute(sql, { userid, email, password, name });
  return findOne({ email });
};

const findOne = async (filter) => {
  let sql = 'SELECT id AS "id", userid AS "userid", email AS "email", password AS "password", name AS "name", profile AS "profile" FROM users';
  const { clause, binds } = buildWhere(filter);
  sql += ` ${clause}`;
  const result = await execute(sql, binds);
  return result.rows[0] || null;
};

const findByLoginId = async (loginId) => {
  const sql = 'SELECT id AS "id", userid AS "userid", email AS "email", password AS "password", name AS "name", profile AS "profile" FROM users WHERE email = :loginId OR userid = :loginId';
  const result = await execute(sql, { loginId });
  return result.rows[0] || null;
};

const findByEmailOrUserid = async ({ email, userid }) => {
  const sql = 'SELECT id AS "id", userid AS "userid", email AS "email", password AS "password", name AS "name", profile AS "profile" FROM users WHERE email = :email OR userid = :userid';
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
  let sql = 'SELECT id AS "id", userid AS "userid", email AS "email", name AS "name", profile AS "profile" FROM users';
  const { clause, binds } = buildWhere(filter);
  sql += ` ${clause}`;
  const result = await execute(sql, binds);
  return result.rows;
};

const search = async (keyword) => {
  const sql = `SELECT id AS "id", userid AS "userid", email AS "email", name AS "name", profile AS "profile"
               FROM users
               WHERE LOWER(userid) LIKE LOWER(:keyword)
                  OR LOWER(email) LIKE LOWER(:keyword)
                  OR LOWER(name) LIKE LOWER(:keyword)
               ORDER BY id`;
  const result = await execute(sql, { keyword: `%${keyword}%` });
  return result.rows;
};

module.exports = { create, findOne, findByLoginId, findByEmailOrUserid, findById, findByIdAndUpdate, findOneAndUpdate, find, search };

