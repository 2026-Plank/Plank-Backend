<<<<<<< HEAD
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
=======
/* const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
 */

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'plank_secret_key';

const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '7d'
    });
};

const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
>>>>>>> 6b0dad0c16077e3674c3d16d79957895695a9153
