const { execute } = require('../config/db.config');

const create = async ({ teamId, name, description }) => {
  const sql = `INSERT INTO departments (teamId, name, description, createdAt) VALUES (:teamId, :name, :description, SYSDATE)`;
  await execute(sql, { teamId, name, description });
  return find({ teamId, name });
};

const find = async (filter) => {
  const keys = Object.keys(filter || {});
  const clause = keys.length ? `WHERE ${keys.map((key) => `${key} = :${key}`).join(' AND ')}` : '';
  const sql = `SELECT id AS "id", teamId AS "teamId", name AS "name", description AS "description", createdAt AS "createdAt" FROM departments ${clause}`;
  const result = await execute(sql, filter);
  return result.rows;
};

module.exports = { create, find };
