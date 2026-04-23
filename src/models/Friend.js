const db = require('../config/db.config');

const Friend = {
  createRequest: async ({ requesterId, addresseeId }) => {
    const query = `
      INSERT INTO friends (requesterId, addresseeId, status)
      VALUES (?, ?, 'PENDING')
    `;
    const [result] = await db.execute(query, [requesterId, addresseeId]);
    return result;
  },

  findRelationshipBetweenUsers: async (userId, otherUserId) => {
    const query = `
      SELECT id, requesterId, addresseeId, status, createdAt, acceptedAt
      FROM friends
      WHERE (requesterId = ? AND addresseeId = ?)
         OR (requesterId = ? AND addresseeId = ?)
      LIMIT 1
    `;
    const [rows] = await db.execute(query, [userId, otherUserId, otherUserId, userId]);
    return rows[0] || null;
  },

  findIncomingRequests: async (userId) => {
    const query = `
      SELECT f.id, f.requesterId, f.addresseeId, f.status, f.createdAt,
             u.name AS requesterName, u.email AS requesterEmail
      FROM friends f
      JOIN users u ON u.id = f.requesterId
      WHERE f.addresseeId = ? AND f.status = 'PENDING'
      ORDER BY f.createdAt DESC
    `;
    const [rows] = await db.execute(query, [userId]);
    return rows;
  },

  acceptRequest: async ({ requestId, userId }) => {
    const query = `
      UPDATE friends
      SET status = 'ACCEPTED', acceptedAt = NOW()
      WHERE id = ? AND addresseeId = ? AND status = 'PENDING'
    `;
    const [result] = await db.execute(query, [requestId, userId]);
    return result;
  },

  deleteRelationship: async ({ userId, friendId }) => {
    const query = `
      DELETE FROM friends
      WHERE (requesterId = ? AND addresseeId = ?)
         OR (requesterId = ? AND addresseeId = ?)
    `;
    const [result] = await db.execute(query, [userId, friendId, friendId, userId]);
    return result;
  },

  findAcceptedFriends: async (userId) => {
    const query = `
      SELECT
        CASE
          WHEN requesterId = ? THEN addresseeId
          ELSE requesterId
        END AS friendId
      FROM friends
      WHERE status = 'ACCEPTED'
        AND (requesterId = ? OR addresseeId = ?)
    `;
    const [rows] = await db.execute(query, [userId, userId, userId]);
    return rows.map((row) => row.friendId);
  }
};

module.exports = Friend;
