const { verifyJwt } = require('../utils/jwtHelper');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: '인증 토큰이 없습니다.' });
  }

    try {
        const decoded = verifyJwt(token);
        req.user = {
            ...decoded,
            id: decoded.id || decoded.userPk || decoded.user_id,
            userId: decoded.userId || decoded.userid
        };

    if (idCandidate && Number.isFinite(Number(idCandidate))) {
      user = await User.findById(Number(idCandidate));
    }

    if (!user && loginIdCandidate) {
      user = await User.findOne({ userid: loginIdCandidate });
    }

    if (!user && decoded.email) {
      user = await User.findOne({ email: decoded.email });
    }

    if (!user) {
      return res.status(401).json({ message: '로그인한 사용자를 찾을 수 없습니다. 다시 로그인해주세요.' });
    }

    req.user = {
      ...decoded,
      id: user.id,
      userPk: user.id,
      userid: user.userid,
      userId: user.userid,
      email: user.email,
      name: user.name,
      role: decoded.role,
      status: user.status || decoded.status
    };

    if (req.user.status === 'PENDING') {
      return res.status(403).json({ message: '관리자 승인이 필요합니다.' });
    }

    next();
  } catch (err) {
    res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
};

const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN' && req.user.role !== 'Admin') {
    return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
  }
  next();
};

module.exports = { verifyToken, verifyAdmin };
