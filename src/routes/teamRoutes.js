const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
const { createTeamController, getTeamsController, joinTeamRequest, getPendingMembers, approveMember } = require('../controllers/teamController');

router.get('/', verifyToken, getTeamsController);
router.post('/create', verifyToken, createTeamController);
router.post('/join', verifyToken, joinTeamRequest);
router.get('/pending', verifyToken, verifyAdmin, getPendingMembers);
router.patch('/approve/:targetUserId', verifyToken, verifyAdmin, approveMember);

module.exports = router;
