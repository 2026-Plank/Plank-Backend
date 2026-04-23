const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
const { joinTeamRequest, getPendingMembers, approveMember } = require('../controllers/teamController');

// 1. 일반 사용자(팀원) 라우트
// POST /api/team/join
router.post('/join', verifyToken, joinTeamRequest);

// 2. 관리자(ADMIN) 전용 라우트
// GET /api/team/pending
router.get('/pending', verifyToken, verifyAdmin, getPendingMembers);

// PATCH /api/team/approve/:targetUserId
router.patch('/approve/:targetUserId', verifyToken, verifyAdmin, approveMember);

module.exports = router;
