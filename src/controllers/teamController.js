const { createTeam, getTeams, joinTeam, updateTeam, deleteTeam, getTeamDetails, removeTeamMember, updateMemberRoleService, inviteFriendToTeam, getInvitableFriends, updateMyDepartment, getProjectTodos, createProjectTodo, toggleProjectTodo, deleteProjectTodo } = require('../services/teamService');
const User = require('../models/User');

const getCurrentUser = async (req) => {
  const user = req.user?.id
    ? await User.findById(req.user.id)
    : await User.findOne({ userid: req.user?.userId });
  if (!user) {
    const error = new Error('Authenticated user was not found.');
    error.statusCode = 401;
    throw error;
  }
  return user;
};

const createTeamController = async (req, res) => {
  try {
    const { name, deadline, department, description } = req.body;
    const user = await getCurrentUser(req);
    const team = await createTeam({
      name,
      deadline,
      department,
      description,
      creatorName: user?.name || user?.userid || 'unknown',
      creatorId: user.userid
    });
    res.status(201).json({ message: 'Team created', team });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getTeamsController = async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const teams = await getTeams(user.userid);
    res.json({ teams });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const joinTeamRequest = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const user = await getCurrentUser(req);
    const team = await joinTeam(user.userid, inviteCode);
    res.status(200).json({ message: 'Successfully joined the team', team });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getPendingMembers = async (req, res) => {
  res.status(200).json([]);
};

const approveMember = async (req, res) => {
  res.status(200).json({ message: 'Approval flow is not configured in current schema.' });
};

const updateTeamController = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const user = await getCurrentUser(req);
    const team = await updateTeam(id, updates, user.userid);
    res.json({ message: 'Team updated', team });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const deleteTeamController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getCurrentUser(req);
    await deleteTeam(id, user.userid);
    res.json({ message: 'Team deleted' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getTeamDetailsController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getCurrentUser(req);
    const team = await getTeamDetails(id, user.userid);
    res.json({ team });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getInvitableFriendsController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getCurrentUser(req);
    const friends = await getInvitableFriends(id, user);
    res.json({ friends });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const inviteFriendController = async (req, res) => {
  try {
    const { id } = req.params;
    const { friendId } = req.body;
    const user = await getCurrentUser(req);
    const team = await inviteFriendToTeam(id, friendId, user);
    res.status(200).json({ message: 'Friend invited to the team', team });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const removeMemberController = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const user = await getCurrentUser(req);
    await removeTeamMember(id, userId, user.userid);
    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const updateMemberRoleController = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;
    const user = await getCurrentUser(req);
    await updateMemberRoleService(id, userId, role, user.userid);
    res.json({ message: 'Member role updated' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const updateMyDepartmentController = async (req, res) => {
  try {
    const { id } = req.params;
    const { department, jobDetail } = req.body;
    const user = await getCurrentUser(req);
    const member = await updateMyDepartment(id, user.userid, department, jobDetail);
    res.json({ message: 'Department selected', member });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getProjectTodosController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getCurrentUser(req);
    const todos = await getProjectTodos(id, user.userid);
    res.json({ todos });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const createProjectTodoController = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const user = await getCurrentUser(req);
    const todo = await createProjectTodo(id, user.userid, title);
    res.status(201).json({ todo });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const toggleProjectTodoController = async (req, res) => {
  try {
    const { id, todoId } = req.params;
    const { status } = req.body;
    const user = await getCurrentUser(req);
    const todo = await toggleProjectTodo(id, todoId, user.userid, status);
    res.json({ todo });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const deleteProjectTodoController = async (req, res) => {
  try {
    const { id, todoId } = req.params;
    const user = await getCurrentUser(req);
    await deleteProjectTodo(id, todoId, user.userid);
    res.json({ message: 'Todo deleted' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

module.exports = { createTeamController, getTeamsController, joinTeamRequest, getPendingMembers, approveMember, updateTeamController, deleteTeamController, getTeamDetailsController, getInvitableFriendsController, inviteFriendController, removeMemberController, updateMemberRoleController, updateMyDepartmentController, getProjectTodosController, createProjectTodoController, toggleProjectTodoController, deleteProjectTodoController };
