const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
const { createTeamController, getTeamsController, joinTeamRequest, getPendingMembers, approveMember, updateTeamController, deleteTeamController, getTeamDetailsController, getInvitableFriendsController, inviteFriendController, removeMemberController, updateMemberRoleController, updateMyDepartmentController, getProjectTodosController, createProjectTodoController, toggleProjectTodoController, deleteProjectTodoController } = require('../controllers/teamController');

router.get('/', verifyToken, getTeamsController);
router.post('/create', verifyToken, createTeamController);
router.post('/join', verifyToken, joinTeamRequest);
router.get('/pending', verifyToken, verifyAdmin, getPendingMembers);
router.patch('/approve/:targetUserId', verifyToken, verifyAdmin, approveMember);
router.get('/:id/todos', verifyToken, getProjectTodosController);
router.post('/:id/todos', verifyToken, createProjectTodoController);
router.patch('/:id/todos/:todoId', verifyToken, toggleProjectTodoController);
router.delete('/:id/todos/:todoId', verifyToken, deleteProjectTodoController);
router.get('/:id', verifyToken, getTeamDetailsController);
router.get('/:id/inviteable-friends', verifyToken, getInvitableFriendsController);
router.post('/:id/invite', verifyToken, inviteFriendController);
router.put('/:id', verifyToken, updateTeamController);
router.delete('/:id', verifyToken, deleteTeamController);
router.patch('/:id/members/me/department', verifyToken, updateMyDepartmentController);
router.delete('/:id/members/:userId', verifyToken, removeMemberController);
router.patch('/:id/members/:userId/role', verifyToken, updateMemberRoleController);

module.exports = router;
