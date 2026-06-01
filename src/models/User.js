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

const selectFields = `
  id AS "id",
  userid AS "userid",
  email AS "email",
  name AS "name",
  job AS "job",
  status AS "status",
  status_message AS "statusMessage",
  presenceStatus AS "presenceStatus",
  NULL AS "createdAt"
`;

const buildWhere = (filter = {}) => {
  const columnMap = {
    id: 'id',
    userid: 'userid',
    email: 'email'
  };
  const keys = Object.keys(filter).filter((key) => filter[key] !== undefined && filter[key] !== null);
  return {
    clause: keys.length ? `WHERE ${keys.map((key) => `${columnMap[key] || key} = :${key}`).join(' AND ')}` : '',
    binds: keys.reduce((binds, key) => ({ ...binds, [key]: filter[key] }), {})
  };
};

const User = {
  ensurePresenceColumn: async () => {
    await runIgnore(`CREATE SEQUENCE users_seq`, [955]);
    await db.execute(`
      CREATE OR REPLACE TRIGGER users_trg
      BEFORE INSERT ON users
      FOR EACH ROW
      WHEN (new.id IS NULL)
      BEGIN
        SELECT users_seq.NEXTVAL
        INTO :new.id
        FROM dual;
      END;
    `);

    await runIgnore(`ALTER TABLE users ADD job VARCHAR2(100 CHAR)`, [1430]);
    await runIgnore(`ALTER TABLE users ADD status_message VARCHAR2(300 CHAR)`, [1430]);
    await runIgnore(
      `ALTER TABLE users ADD presenceStatus VARCHAR2(20 CHAR) DEFAULT 'OFFLINE' NOT NULL`,
      [1430]
    );
  },

  findOne: async (filter) => {
    const { clause, binds } = buildWhere(filter);
    const result = await db.execute(
      `SELECT ${selectFields}, password AS "password" FROM users ${clause} FETCH FIRST 1 ROWS ONLY`,
      binds
    );
    return result.rows[0] || null;
  },

  findById: async (id) => User.findOne({ id }),

  findByEmail: async (email) => User.findOne({ email }),

  findByLoginId: async (loginId) => {
    const result = await db.execute(
      `SELECT ${selectFields}, password AS "password"
       FROM users
       WHERE userid = :loginId OR email = :loginId
       FETCH FIRST 1 ROWS ONLY`,
      { loginId }
    );
    return result.rows[0] || null;
  },

  findByEmailOrUserid: async ({ email, userid }) => {
    const result = await db.execute(
      `SELECT ${selectFields}, password AS "password"
       FROM users
       WHERE email = :email OR userid = :userid
       FETCH FIRST 1 ROWS ONLY`,
      { email, userid }
    );
    return result.rows[0] || null;
  },

  search: async (keyword) => {
    const result = await db.execute(
      `SELECT ${selectFields}
       FROM users
       WHERE LOWER(userid) LIKE LOWER(:keyword)
          OR LOWER(email) LIKE LOWER(:keyword)
          OR LOWER(name) LIKE LOWER(:keyword)
       ORDER BY name, userid
       FETCH FIRST 20 ROWS ONLY`,
      { keyword: `%${keyword}%` }
    );
    return result.rows;
  },

  searchByKeyword: async ({ keyword, excludeUserId }) => {
    const users = await User.search(keyword);
    return users.filter((user) => Number(user.id) !== Number(excludeUserId));
  },

  create: async ({ userid, email, password, name }) => {
    await db.execute(
      `INSERT INTO users (userid, email, password, name) VALUES (:userid, :email, :password, :name)`,
      { userid, email, password, name }
    );
    return User.findOne({ userid });
  },

  findByIdAndUpdate: async (id, updates = {}) => {
    const allowed = {
      name: 'name',
      job: 'job',
      status: 'status',
      statusMessage: 'status_message',
      presenceStatus: 'presenceStatus'
    };
    const fields = Object.keys(updates).filter((field) => allowed[field]);
    if (!fields.length) {
      return User.findById(id);
    }

    const setClause = fields.map((field) => `${allowed[field]} = :${field}`).join(', ');
    await db.execute(`UPDATE users SET ${setClause} WHERE id = :id`, { id, ...updates });
    return User.findById(id);
  },

  findOneAndUpdate: async (filter, updates) => {
    const existing = await User.findOne(filter);
    if (!existing) return null;
    return User.findByIdAndUpdate(existing.id, updates);
  },

  find: async (filter = {}) => {
    const { clause, binds } = buildWhere(filter);
    const result = await db.execute(`SELECT ${selectFields} FROM users ${clause} ORDER BY name, userid`, binds);
    return result.rows;
  },

  findManyByIds: async (userIds) => {
    const ids = [...new Set((userIds || []).map(Number).filter(Boolean))];
    if (!ids.length) return [];

    const binds = {};
    const placeholders = ids.map((id, index) => {
      const key = `id${index}`;
      binds[key] = id;
      return `:${key}`;
    });
    const result = await db.execute(
      `SELECT ${selectFields} FROM users WHERE id IN (${placeholders.join(', ')}) ORDER BY name, userid`,
      binds
    );
    return result.rows;
  },

  findTeamMembers: async () => []
};

module.exports = User;
