const { register, login, approveUser } = require('../services/authService');
const { toErrorResponse } = require('../utils/errorResponse');

const sign = async (req, res) => {
  try {
    const userid = req.body.userid || req.body.userId || req.body.id;
    const password = req.body.password || req.body.pw;
    const { email } = req.body;
    const name = req.body.name || userid;

    const user = await register({ userid, email, password, name });
    res.status(201).json({ message: 'User registered', user });
  } catch (error) {
    const response = toErrorResponse(error, 400);
    res.status(response.statusCode).json(response.body);
  }
};

const signin = async (req, res) => {
  try {
    const loginId = req.body.userid || req.body.userId || req.body.email;
    const password = req.body.password || req.body.pw;

    if (!loginId || !password) {
      return res.status(400).json({ message: '아이디와 비밀번호를 입력해주세요.' });
    }

    const { user, token } = await login(loginId, password);
    res.json({ message: 'Login successful', token, user });
  } catch (error) {
    const response = toErrorResponse(error, 401);
    res.status(response.statusCode).json(response.body);
  }
};

const approve = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await approveUser(userId);
    res.json({ message: 'User approved', user });
  } catch (error) {
    const response = toErrorResponse(error, 400);
    res.status(response.statusCode).json(response.body);
  }
};

module.exports = {
  sign,
  signup: sign,
  login: signin,
  signin,
  approve
};
