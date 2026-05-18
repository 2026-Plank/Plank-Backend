/* const { register, login, approveUser } = require('../services/authService');

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
 */

const bcrypt = require('bcrypt');
const { execute } = require('../config/db.config');
const { generateToken } = require('../utils/jwtHelper');

// 회원가입
exports.sign = async (req, res) => {
  const userId = req.body.userId || req.body.userid || req.body.id;
  const pw = req.body.pw || req.body.password;
  const { email } = req.body;
  const name = req.body.name || userId;

  // 1. 입력값 체크
  if (!userId || !pw || !email || !name) {
    return res.status(400).json({ message: "모든 값을 입력하세요" });
  }

  try {
    // 2. 중복 체크
    const exist = await execute(
      `SELECT USERID FROM USERS WHERE USERID = :userId`,
      { userId }
    );

    if (exist.rows.length > 0) {
      return res.status(409).json({ message: "이미 존재하는 아이디" });
    }

    // 3. 비밀번호 암호화
    const hashedPw = await bcrypt.hash(pw, 10);

    // 4. 회원가입
    await execute(
      `INSERT INTO USERS (USERID, PASSWORD, EMAIL, NAME)
             VALUES (:userId, :pw, :email, :name)`,
      {
        userId,
        pw: hashedPw,
        email,
        name
      }
    );

    res.json({ message: "회원가입 성공" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};


// 로그인
exports.login = async (req, res) => {
  const loginId = req.body.userId || req.body.userid || req.body.email;
  const pw = req.body.pw || req.body.password;

  if (!loginId || !pw) {
    return res.status(400).json({ message: "아이디/비밀번호 입력" });
  }

  try {
    // 1. 유저 조회
    const result = await execute(
      `SELECT ID AS "id", USERID AS "userid", EMAIL AS "email", PASSWORD AS "password", NAME AS "name"
       FROM USERS
       WHERE USERID = :loginId OR EMAIL = :loginId`,
      { loginId }
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "아이디 없음" });
    }

    const user = result.rows[0];

    // 2. 비밀번호 비교
    const isMatch = await bcrypt.compare(pw, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "비밀번호 틀림" });
    }

    // 3. 토큰 생성
    const token = generateToken({ id: user.id, userId: user.userid });

    res.json({
      message: "로그인 성공",
      token,
      user: {
        id: user.id,
        userId: user.userid,
        email: user.email,
        name: user.name || user.userid
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};
