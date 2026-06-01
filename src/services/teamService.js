const Team = require('../models/Team');
const User = require('../models/User');
const Friend = require('../models/Friend');
const Notification = require('../models/Notification');
const Schedule = require('../models/Schedule');
const { generateInviteCode } = require('../utils/codeGenerator');

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeTeam = (team, stats = null) => {
  if (!team) return null;
  return {
    id: team.id,
    name: team.name,
    personnel: team.personnel,
    teamCode: team.teamCode,
    dpNum: team.dpNum,
    dpName: team.dpName,
    dpLeader: team.dpLeader,
    deadline: formatDate(team.deadline),
    role: team.role,
    progress: stats?.progress ?? team.progress ?? 0,
    taskTotal: stats?.total ?? team.taskTotal ?? 0,
    taskDone: stats?.done ?? team.taskDone ?? 0
  };
};

const withProgress = async (team) => {
  if (!team?.id) return normalizeTeam(team);
  const stats = await Schedule.getTeamProgressStats(team.id);
  return normalizeTeam(team, stats);
};

const createTeam = async ({ name, deadline, creatorName, creatorId, department = '', description = '' }) => {
  if (!name || !deadline) {
    const error = new Error('프로젝트 이름과 마감일을 입력해주세요.');
    error.statusCode = 400;
    throw error;
  }

  const team = await Team.create({
    name,
    personnel: 1,
    teamCode: generateInviteCode(),
    dpNum: 1,
    dpName: String(description || '').trim() || department || name,
    dpLeader: creatorName || 'unknown',
    deadline
  });

  // Add creator as Admin
  await Team.addMember(team.id, creatorId, 'Admin');

  const creator = await User.findOne({ userid: creatorId });
  if (creator) {
    await Notification.createOnce({
      userId: creator.id,
      type: 'project_created',
      message: `${team.name} 프로젝트가 생성되었습니다.`,
      targetType: 'team',
      targetId: String(team.id),
      actionPath: '/project',
      dedupeKey: `project_created:${team.id}:${creatorId}`
    });
  }

  return withProgress(team);
};

const getTeams = async (userId) => {
  const teams = await Team.getUserTeams(userId);
  return Promise.all(teams.map(withProgress));
};

const joinTeam = async (userid, inviteCode) => {
  const team = await Team.findOne({ teamCode: inviteCode });
  if (!team) {
    const error = new Error('Invalid invite code');
    error.statusCode = 400;
    throw error;
  }

  // Check if user is already a member
  const alreadyMember = await Team.isMember(team.id, userid);
  if (alreadyMember) {
    return withProgress(team);
  }

  // Add user to team
  await Team.addMember(team.id, userid, 'User');

  // Update personnel count from actual member list
  const members = await Team.getMembers(team.id);
  await Team.update(team.id, { personnel: members.length });

  const joiningUser = await User.findOne({ userid });
  const admins = members.filter((member) => member.role === 'Admin');
  await Promise.all(admins.map(async (admin) => {
    const adminUser = await User.findOne({ userid: admin.id });
    if (!adminUser) return null;
    return Notification.createOnce({
      userId: adminUser.id,
      type: 'project_member_joined',
      message: `${joiningUser?.name || userid}님이 ${team.name} 프로젝트에 참가했습니다.`,
      targetType: 'team',
      targetId: String(team.id),
      actionPath: '/project',
      dedupeKey: `project_member_joined:${team.id}:${userid}`
    });
  }));

  return withProgress({ ...team, personnel: members.length });
};

const getTeamMembers = async () => {
  return await User.find({});
};

const getInvitableFriends = async (teamId, user) => {
  const userPk = user?.id;
  const userLoginId = user?.userid;
  const friendships = await Friend.findAcceptedByUser(userPk);
  const teamMembers = await Team.getMembers(teamId);
  const memberIdSet = new Set(teamMembers.map((m) => String(m.id)));

  const invitableFriends = await Promise.all(friendships.map(async (relation) => {
    const friendPk = Number(relation.userId) === Number(userPk) ? relation.friendId : relation.userId;
    const friendUser = await User.findById(friendPk);
    if (!friendUser) return null;
    if (memberIdSet.has(String(friendUser.userid))) return null;
    if (String(friendUser.userid) === String(userLoginId)) return null;
    return {
      id: friendUser.userid,
      userPk: friendUser.id,
      userid: friendUser.userid,
      email: friendUser.email,
      name: friendUser.name,
      profile: friendUser.profile,
      relationId: relation.id
    };
  }));

  return invitableFriends.filter(Boolean);
};

const inviteFriendToTeam = async (teamId, friendId, user) => {
  const userPk = user?.id;
  const userLoginId = user?.userid;
  const members = await Team.getMembers(teamId);
  const userMember = members.find((m) => String(m.id) === String(userLoginId));
  if (!userMember || userMember.role !== 'Admin') {
    const error = new Error('팀 관리자 권한이 필요합니다.');
    error.statusCode = 403;
    throw error;
  }

  if (String(friendId) === String(userLoginId) || String(friendId) === String(userPk)) {
    const error = new Error('자기 자신을 초대할 수 없습니다.');
    error.statusCode = 400;
    throw error;
  }

  const friendUser = Number.isFinite(Number(friendId))
    ? await User.findById(friendId) || await User.findOne({ userid: friendId })
    : await User.findOne({ userid: friendId });
  if (!friendUser) {
    const error = new Error('초대할 사용자를 찾을 수 없습니다.');
    error.statusCode = 404;
    throw error;
  }

  const friendship = await Friend.findPair(userPk, friendUser.id);
  if (!friendship || friendship.status !== 'accepted') {
    const error = new Error('친구 관계가 아니면 초대할 수 없습니다.');
    error.statusCode = 403;
    throw error;
  }

  const alreadyMember = await Team.isMember(teamId, friendUser.userid);
  if (alreadyMember) {
    const error = new Error('이미 팀에 참여한 사용자입니다.');
    error.statusCode = 400;
    throw error;
  }

  await Team.addMember(teamId, friendUser.userid, 'User');
  const updatedMembers = await Team.getMembers(teamId);
  await Team.update(teamId, { personnel: updatedMembers.length });
  const updatedTeam = await Team.findOne({ id: teamId });

  await Notification.createOnce({
    userId: friendUser.id,
    type: 'project_invite',
    message: `${user?.name || userLoginId}님이 ${updatedTeam?.name || '프로젝트'}에 초대했습니다.`,
    targetType: 'team',
    targetId: String(teamId),
    actionPath: '/project',
    dedupeKey: `project_invite:${teamId}:${friendUser.userid}`
  });

  return withProgress({ ...updatedTeam, personnel: updatedMembers.length });
};

const updateTeam = async (teamId, updates, userId) => {
  // Check if user is admin of the team
  const members = await Team.getMembers(teamId);
  const userMember = members.find((m) => String(m.id) === String(userId));
  if (!userMember || userMember.role !== 'Admin') {
    const error = new Error('팀 관리자 권한이 필요합니다.');
    error.statusCode = 403;
    throw error;
  }

  const allowedFields = ['name', 'personnel', 'teamCode', 'dpNum', 'dpName', 'dpLeader', 'deadline'];
  const normalizedUpdates = Object.fromEntries(
    Object.entries(updates || {}).filter(([key, value]) => allowedFields.includes(key) && value !== undefined && value !== null && value !== '')
  );

  if (normalizedUpdates.deadline) {
    normalizedUpdates.deadline = formatDate(normalizedUpdates.deadline);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedUpdates.deadline)) {
      delete normalizedUpdates.deadline;
    }
  }

  const team = await Team.update(teamId, normalizedUpdates);
  return withProgress(team);
};

const deleteTeam = async (teamId, userId) => {
  // Check if user is admin of the team
  const members = await Team.getMembers(teamId);
  const userMember = members.find((m) => String(m.id) === String(userId));
  if (!userMember || userMember.role !== 'Admin') {
    const error = new Error('팀 관리자 권한이 필요합니다.');
    error.statusCode = 403;
    throw error;
  }

  await Team.remove(teamId);
};

const getTeamDetails = async (teamId, userId) => {
  // Check if user is member of the team
  const isMember = await Team.isMember(teamId, userId);
  if (!isMember) {
    const error = new Error('팀 멤버만 접근할 수 있습니다.');
    error.statusCode = 403;
    throw error;
  }

  const team = await Team.findOne({ id: teamId });
  const members = await Team.getMembers(teamId);
  return { ...(await withProgress(team)), members };
};

const removeTeamMember = async (teamId, targetUserId, userId) => {
  // Check if user is admin
  const members = await Team.getMembers(teamId);
  const userMember = members.find((m) => String(m.id) === String(userId));
  if (!userMember || userMember.role !== 'Admin') {
    const error = new Error('팀 관리자 권한이 필요합니다.');
    error.statusCode = 403;
    throw error;
  }

  if (String(targetUserId) === String(userId)) {
    const error = new Error('자기 자신을 제거할 수 없습니다.');
    error.statusCode = 400;
    throw error;
  }

  await Team.removeMember(teamId, targetUserId);
  const updatedMembers = await Team.getMembers(teamId);
  await Team.update(teamId, { personnel: updatedMembers.length });
};

const updateMemberRoleService = async (teamId, targetUserId, role, userId) => {
  // Check if user is admin
  const members = await Team.getMembers(teamId);
  const userMember = members.find((m) => String(m.id) === String(userId));
  if (!userMember || userMember.role !== 'Admin') {
    const error = new Error('팀 관리자 권한이 필요합니다.');
    error.statusCode = 403;
    throw error;
  }

  await Team.updateMemberRole(teamId, targetUserId, role);
};

const updateMyDepartment = async (teamId, userId, department, jobDetail = '') => {
  const normalizedDepartment = String(department || '').trim();
  const allowedDepartments = ['개발자', '디자이너', '기획자'];
  if (!allowedDepartments.includes(normalizedDepartment)) {
    const error = new Error('부서를 선택해주세요.');
    error.statusCode = 400;
    throw error;
  }

  const isMember = await Team.isMember(teamId, userId);
  if (!isMember) {
    const error = new Error('팀 멤버만 부서를 선택할 수 있습니다.');
    error.statusCode = 403;
    throw error;
  }

  const members = await Team.getMembers(teamId);
  const currentMember = members.find((member) => String(member.id) === String(userId));
  const normalizedJobDetail = String(jobDetail || '').trim();
  const role = currentMember?.role === 'Admin' ? 'Admin' : 'User';
  await Team.updateMemberDepartment(teamId, userId, normalizedDepartment, normalizedJobDetail, role);
  return { department: normalizedDepartment, jobDetail: normalizedJobDetail, role };
};
const getProjectTodos = async (teamId, userId) => {
  const isMember = await Team.isMember(teamId, userId);
  if (!isMember) {
    const error = new Error('팀 멤버만 접근할 수 있습니다.');
    error.statusCode = 403;
    throw error;
  }
  const todos = await Schedule.findProjectTodosByTeamId(teamId);
  return todos.map((t) => ({ id: t.id, title: t.title, status: t.status }));
};

const createProjectTodo = async (teamId, userId, title) => {
  if (!title || !String(title).trim()) {
    const error = new Error('할 일 제목을 입력해주세요.');
    error.statusCode = 400;
    throw error;
  }
  const isMember = await Team.isMember(teamId, userId);
  if (!isMember) {
    const error = new Error('팀 멤버만 접근할 수 있습니다.');
    error.statusCode = 403;
    throw error;
  }
  const user = await User.findOne({ userid: userId });
  const team = await Team.findOne({ id: teamId });
  const today = new Date().toISOString().split('T')[0];
  const todo = await Schedule.create({
    userId: user.id,
    teamId,
    type: 'ProjectTodo',
    title: String(title).trim(),
    description: '',
    dpName: team?.name || '',
    targetDate: today,
  });
  return { id: todo.id, title: todo.title, status: todo.status };
};

const toggleProjectTodo = async (teamId, todoId, userId, status) => {
  const allowedStatuses = ['Wait', 'Done'];
  if (!allowedStatuses.includes(status)) {
    const error = new Error('올바르지 않은 상태값입니다.');
    error.statusCode = 400;
    throw error;
  }
  const isMember = await Team.isMember(teamId, userId);
  if (!isMember) {
    const error = new Error('팀 멤버만 접근할 수 있습니다.');
    error.statusCode = 403;
    throw error;
  }
  const updated = await Schedule.updateProjectTodoStatus(todoId, teamId, status);
  if (!updated) {
    const error = new Error('할 일을 찾을 수 없습니다.');
    error.statusCode = 404;
    throw error;
  }
  return { id: updated.id, title: updated.title, status: updated.status };
};

const deleteProjectTodo = async (teamId, todoId, userId) => {
  const isMember = await Team.isMember(teamId, userId);
  if (!isMember) {
    const error = new Error('팀 멤버만 접근할 수 있습니다.');
    error.statusCode = 403;
    throw error;
  }
  await Schedule.deleteProjectTodoById(todoId, teamId);
};

module.exports = { createTeam, getTeams, joinTeam, getTeamMembers, getInvitableFriends, inviteFriendToTeam, updateTeam, deleteTeam, getTeamDetails, removeTeamMember, updateMemberRoleService, updateMyDepartment, getProjectTodos, createProjectTodo, toggleProjectTodo, deleteProjectTodo };
