const bcrypt = require('bcrypt');
const User = require('../models/User');
const { generateToken } = require('../utils/jwtHelper');

const normalizeUser = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    userid: user.userid,
    userId: user.userid,
    email: user.email,
    name: user.name,
    job: user.job,
    status: user.status,
    statusMessage: user.statusMessage,
    presenceStatus: user.presenceStatus,
    profile: user.profile
  };
};

const register = async ({ userid, email, password, name }) => {
  console.log('[AUTH-SVC] register() called with:', { userid, email, password: password ? '***' : 'undefined', name });
  if (!userid || !email || !password) {
    const error = new Error('이메일, 아이디, 비밀번호를 모두 입력해주세요.');
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findByEmailOrUserid({ email, userid });
  if (existingUser) {
    const duplicatedField = existingUser.email === email ? '이메일' : '아이디';
    const error = new Error(`이미 사용 중인 ${duplicatedField}입니다.`);
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('[AUTH-SVC] Password hashed');
  const userIdValue = userid || email;
  const displayName = name || userIdValue;
  console.log('[AUTH-SVC] Creating user with userid:', userIdValue);
  const user = await User.create({ userid: userIdValue, email, password: hashedPassword, name: displayName });
  console.log('[AUTH-SVC] User created:', user);
  return normalizeUser(user);
};

const login = async (loginId, password) => {
  console.log('[AUTH-SVC] login() called with loginId:', loginId);
  const rawUser = await User.findByLoginId(loginId);
  console.log('[AUTH-SVC] User found:', rawUser ? `${rawUser.userid}` : 'null');
  if (!rawUser) {
    console.log('[AUTH-SVC] User not found');
    const error = new Error('존재하지 않는 아이디입니다.');
    error.statusCode = 401;
    throw error;
  }

  if (!(await bcrypt.compare(password, rawUser.password))) {
    console.log('[AUTH-SVC] Password invalid');
    const error = new Error('비밀번호가 틀렸습니다.');
    error.statusCode = 401;
    throw error;
  }
  console.log('[AUTH-SVC] Credentials valid, generating token');
  const user = normalizeUser(rawUser);
  const token = generateToken(user);
  return { user, token };
};

const approveUser = async (userId) => {
  const user = await User.findByIdAndUpdate(userId, { status: 'APPROVED' });
  return normalizeUser(user);
};

module.exports = { register, login, approveUser };
