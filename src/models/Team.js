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
    deadline: row.deadline
  };
};

const create = async ({ name, personnel, teamCode, dpNum, dpName, dpLeader, deadline }) => {
  const sql = `INSERT INTO teams (teamname, personnel, teamcode, dpnum, dpname, dpleader, deadline)
               VALUES (:name, :personnel, :teamCode, :dpNum, :dpName, :dpLeader, TO_DATE(:deadline, 'YYYY-MM-DD'))`;
  await execute(sql, { name, personnel, teamCode, dpNum, dpName, dpLeader, deadline });
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

  const sql = `SELECT id AS "id",
                      teamname AS "name",
                      personnel AS "personnel",
                      teamcode AS "teamCode",
                      dpnum AS "dpNum",
                      DBMS_LOB.SUBSTR(dpname, 4000, 1) AS "dpName",
                      DBMS_LOB.SUBSTR(dpleader, 4000, 1) AS "dpLeader",
                      deadline AS "deadline"
               FROM teams ${clause}`;
  const result = await execute(sql, filter);
  return mapRow(result.rows[0] || null);
};

const findAll = async () => {
  const sql = `SELECT id AS "id",
                      teamname AS "name",
                      personnel AS "personnel",
                      teamcode AS "teamCode",
                      dpnum AS "dpNum",
                      DBMS_LOB.SUBSTR(dpname, 4000, 1) AS "dpName",
                      DBMS_LOB.SUBSTR(dpleader, 4000, 1) AS "dpLeader",
                      deadline AS "deadline"
               FROM teams
               ORDER BY id DESC`;
  const result = await execute(sql);
  return result.rows.map(mapRow);
};

module.exports = { create, findOne, findAll };
