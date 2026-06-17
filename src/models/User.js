const { execute } = require('../config/db.config');

const buildWhere = (filter) => {
  const keys = Object.keys(filter || {});
  if (!keys.length) return { clause: '', binds: {} };
  const clauses = keys.map((key) => `${key} = :${key}`);
  return { clause: `WHERE ${clauses.join(' AND ')}`, binds: { ...filter } };
};

const userSelect = 'SELECT id AS "id", userid AS "userid", email AS "email", password AS "password", name AS "name", profile AS "profile", presenceStatus AS "presenceStatus" FROM users';
const publicUserSelect = 'SELECT id AS "id", userid AS "userid", email AS "email", name AS "name", profile AS "profile", presenceStatus AS "presenceStatus" FROM users';

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
  await execute(
    `INSERT INTO users (userid, email, password, name) VALUES (:userid, :email, :password, :name)`,
    { userid, email, password, name }
  );
  return findOne({ email });
};

const findOne = async (filter) => {
  const { clause, binds } = buildWhere(filter);
  const result = await execute(`${userSelect} ${clause}`, binds);
  return result.rows[0] || null;
};

const findByLoginId = async (loginId) => {
  const result = await execute(
    `${userSelect} WHERE email = :loginId OR userid = :loginId`,
    { loginId }
  );
  return result.rows[0] || null;
};

const findByEmailOrUserid = async ({ email, userid }) => {
  const result = await execute(
    `${userSelect} WHERE email = :email OR userid = :userid`,
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
  const result = await execute(`${publicUserSelect} ${clause}`, binds);
  return result.rows;
};

const search = async (keyword) => {
  const result = await execute(
    `${publicUserSelect}
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
