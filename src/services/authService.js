const bcrypt = require('bcrypt');
const User = require('../models/User');
const { createToken } = require('../utils/jwtHelper');

const sanitizeUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  teamId: user.teamId,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt
});

const signup = async ({ email, password, name }) => {
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    const error = new Error('이미 가입된 이메일입니다.');
    error.status = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    email,
    password: hashedPassword,
    name
  });

  return {
    token: createToken(user),
    user: sanitizeUser(user)
  };
};

const login = async ({ email, password }) => {
  const user = await User.findByEmail(email);
  if (!user) {
    const error = new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
    error.status = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
    error.status = 401;
    throw error;
  }

  return {
    token: createToken(user),
    user: sanitizeUser(user)
  };
};

module.exports = {
  signup,
  login,
  sanitizeUser
};
