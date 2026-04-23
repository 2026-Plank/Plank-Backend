const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'plank_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const createToken = (user) =>
  jwt.sign(
    {
      userId: user.id,
      email: user.email,
      teamId: user.teamId,
      role: user.role,
      status: user.status
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

const verifyJwt = (token) => jwt.verify(token, JWT_SECRET);

module.exports = {
  createToken,
  verifyJwt
};
