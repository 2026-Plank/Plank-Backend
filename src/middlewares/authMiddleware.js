const jwt = require('jsonwebtoken');

// 1. 로그인 상태 확인 미들웨어
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "인증 토큰이 없습니다." });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'plank_secret_key');
        req.user = {
            ...decoded,
            id: decoded.id || decoded.userPk || decoded.user_id,
            userId: decoded.userId || decoded.userid
        };

        // 승인 대기 중인 사용자는 접근 제한
        if (req.user.status === 'PENDING') {
            return res.status(403).json({ message: "관리자의 가입 승인이 필요합니다." });
        }
        next();
    } catch (err) {
        res.status(401).json({ message: "유효하지 않은 토큰입니다." });
    }
};

// 2. 관리자 권한 확인 미들웨어
const verifyAdmin = (req, res, next) => {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'Admin') {
        return res.status(403).json({ message: "관리자 권한이 필요합니다." });
    }
    next();
};

module.exports = { verifyToken, verifyAdmin };
