const db = require('../config/db.config');

const Team = {
  findByInviteCode: async (inviteCode) => {
    const query = `
      SELECT id, name, inviteCode, adminId, createdAt
      FROM teams
      WHERE inviteCode = ?
      LIMIT 1
    `;
    const [rows] = await db.execute(query, [inviteCode]);
    return rows[0] || null;
  },

  findById: async (id) => {
    const query = `
      SELECT id, name, inviteCode, adminId, createdAt
      FROM teams
      WHERE id = ?
      LIMIT 1
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
  }
};

module.exports = Team;
