const { execute } = require('../config/db.config');

const find = async (filter) => {
  const keys = Object.keys(filter || {});
  const clause = keys.length ? `WHERE ${keys.map((key) => `${key} = :${key}`).join(' AND ')}` : '';
  const sql = `SELECT id AS "id", userId AS "userId", type AS "type", message AS "message", isRead AS "isRead", createdAt AS "createdAt" FROM notifications ${clause}`;
  const result = await execute(sql, filter);
  return result.rows;
};

const findByIdAndUpdate = async (id, updates) => {
  const fields = Object.keys(updates);
  if (!fields.length) return null;
  const setClauses = fields.map((field) => `${field} = :${field}`);
  const binds = { id, ...updates };
  const sql = `UPDATE notifications SET ${setClauses.join(', ')} WHERE id = :id`;
  await execute(sql, binds);
  const result = await execute(`SELECT id AS "id", userId AS "userId", type AS "type", message AS "message", isRead AS "isRead", createdAt AS "createdAt" FROM notifications WHERE id = :id`, { id });
  return result.rows[0] || null;
};

const deleteById = async (id) => {
  await execute(`DELETE FROM notifications WHERE id = :id`, { id });
};

module.exports = { find, findByIdAndUpdate, deleteById };

