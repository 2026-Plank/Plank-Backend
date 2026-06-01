const { register, login, approveUser } = require('../services/authService');

const sign = async (req, res) => {
  try {
    const userid = req.body.userid || req.body.userId || req.body.id;
    const password = req.body.password || req.body.pw;
    const { email } = req.body;
    const name = req.body.name || userid;

    const user = await register({ userid, email, password, name });
    res.status(201).json({ message: 'User registered', user });
  } catch (error) {
    res.status(error.statusCode || 400).json({ message: error.message, error: error.message });
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
    res.status(error.statusCode || 401).json({ message: error.message, error: error.message });
  }
};

const approve = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await approveUser(userId);
    res.json({ message: 'User approved', user });
  } catch (error) {
    res.status(400).json({ message: error.message, error: error.message });
  }
};

module.exports = {
  sign,
  signup: sign,
  login: signin,
  signin,
  approve
};
