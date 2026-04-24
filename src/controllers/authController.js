const { register, login, approveUser } = require('../services/authService');

const signup = async (req, res) => {
  try {
    const { userid, email, password, name, id } = req.body;
    const userIdValue = userid || id;
    const displayName = name || userIdValue;
    const user = await register({ userid: userIdValue, email, password, name: displayName });
    res.status(201).json({ message: 'User registered', user });
  } catch (error) {
    const statusCode = error.statusCode || 400;
    if (error.code === 'ORA-00001') {
      return res.status(409).json({ message: '이미 사용 중인 이메일 또는 아이디입니다.' });
    }
    if (error.code === 'ORA-01400') {
      return res.status(400).json({ message: '필수 회원 정보가 누락되었습니다.' });
    }
    res.status(statusCode).json({ message: error.message });
  }
};
const signin = async (req, res) => {
  try {
    const { email, userid, password } = req.body;
    const loginId = email || userid;
    if (!loginId || !password) {
      return res.status(400).json({ message: '이메일 또는 아이디와 비밀번호를 입력해주세요.' });
    }
    const { user, token } = await login(loginId, password);
    res.json({ user, token });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

const approve = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await approveUser(userId);
    res.json({ message: 'User approved', user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { signup, signin, approve };
