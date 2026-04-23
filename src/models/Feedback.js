const db = require('../config/db.config');

const Feedback = {
  create: async ({ authorId, targetUserId, teamId, type, content, score }) => {
    const query = `
      INSERT INTO feedbacks (authorId, targetUserId, teamId, type, content, score)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [
      authorId,
      targetUserId,
      teamId,
      type,
      content,
      score
    ]);
    return result;
  },

  findReceivedByUserId: async ({ userId, type }) => {
    const conditions = ['f.targetUserId = ?'];
    const params = [userId];

    if (type) {
      conditions.push('f.type = ?');
      params.push(type);
    }

    const query = `
      SELECT f.id, f.authorId, f.targetUserId, f.teamId, f.type, f.content, f.score, f.createdAt,
             u.name AS authorName, u.email AS authorEmail
      FROM feedbacks f
      JOIN users u ON u.id = f.authorId
      WHERE ${conditions.join(' AND ')}
      ORDER BY f.createdAt DESC
    `;
    const [rows] = await db.execute(query, params);
    return rows;
  },

  findCreatedByUserId: async ({ userId, type }) => {
    const conditions = ['f.authorId = ?'];
    const params = [userId];

    if (type) {
      conditions.push('f.type = ?');
      params.push(type);
    }

    const query = `
      SELECT f.id, f.authorId, f.targetUserId, f.teamId, f.type, f.content, f.score, f.createdAt,
             u.name AS targetName, u.email AS targetEmail
      FROM feedbacks f
      JOIN users u ON u.id = f.targetUserId
      WHERE ${conditions.join(' AND ')}
      ORDER BY f.createdAt DESC
    `;
    const [rows] = await db.execute(query, params);
    return rows;
  },

  deleteByIdAndAuthor: async ({ feedbackId, authorId }) => {
    const query = `
      DELETE FROM feedbacks
      WHERE id = ? AND authorId = ?
    `;
    const [result] = await db.execute(query, [feedbackId, authorId]);
    return result;
  }
};

module.exports = Feedback;
