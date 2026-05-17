const { execute } = require('../config/db.config');

const create = async ({ senderId, receiverId, message }) => {
  const sql = `INSERT INTO chats (senderId, receiverId, message, timestamp) VALUES (:senderId, :receiverId, :message, SYSDATE)`;
  await execute(sql, { senderId, receiverId, message });
  return { senderId, receiverId, message, timestamp: new Date() };
};

const find = async (filter) => {
  const keys = Object.keys(filter || {});
  const binds = {};
  const clauses = [];
  keys.forEach((key) => {
    if (key === 'or') return;
    clauses.push(`${key} = :${key}`);
    binds[key] = filter[key];
  });

  let sql = `SELECT id AS "id", senderId AS "senderId", receiverId AS "receiverId", message AS "message", timestamp AS "timestamp" FROM chats`;
  if (filter.or) {
    const orClauses = filter.or.map((cond, index) => {
      const keys = Object.keys(cond);
      return keys.map((key) => {
        binds[`or_${index}_${key}`] = cond[key];
        return `${key} = :or_${index}_${key}`;
      }).join(' AND ');
    });
    sql += ` WHERE (${orClauses.join(' OR ')})`;
  } else if (clauses.length) {
    sql += ` WHERE ${clauses.join(' AND ')}`;
  }
  sql += ' ORDER BY timestamp';

  const result = await execute(sql, binds);
  return result.rows;
};

const search = async (userId, query) => {
  const sql = `SELECT id AS "id", senderId AS "senderId", receiverId AS "receiverId", message AS "message", timestamp AS "timestamp"
               FROM chats WHERE (senderId = :userId OR receiverId = :userId) AND LOWER(message) LIKE LOWER(:query) ORDER BY timestamp`;
  const result = await execute(sql, { userId, query: `%${query}%` });
  return result.rows;
};

module.exports = { create, find, search };
