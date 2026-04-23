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
