const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'plank_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const createToken = (user) =>
  generateToken({
    id: user.id,
    userId: user.userid || user.userId,
    email: user.email,
    role: user.role,
    status: user.status
  });

const verifyJwt = (token) => jwt.verify(token, JWT_SECRET);
const verifyToken = verifyJwt;

module.exports = {
  createToken,
  generateToken,
  verifyJwt,
  verifyToken
};
