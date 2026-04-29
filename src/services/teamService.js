const Team = require('../models/Team');
const User = require('../models/User');
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

const normalizeTeam = (team) => {
  if (!team) return null;
  return {
    id: team.id,
    name: team.name,
    personnel: team.personnel,
    teamCode: team.teamCode,
    dpNum: team.dpNum,
    dpName: team.dpName,
    dpLeader: team.dpLeader,
    deadline: formatDate(team.deadline)
  };
};

const createTeam = async ({ name, deadline, creatorName, creatorId }) => {
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
    dpName: name,
    dpLeader: creatorName || 'unknown',
    deadline
  });

  // Add creator as Admin
  await Team.addMember(team.id, creatorId, 'Admin');

  return normalizeTeam(team);
};

const getTeams = async (userId) => {
  const teams = await Team.getUserTeams(userId);
  return teams.map(normalizeTeam);
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
    const error = new Error('You are already a member of this team');
    error.statusCode = 400;
    throw error;
  }

  // Add user to team
  await Team.addMember(team.id, userid, 'User');

  // Update personnel count from actual member list
  const members = await Team.getMembers(team.id);
  await Team.update(team.id, { personnel: members.length });

  return normalizeTeam({ ...team, personnel: members.length });
};

const getTeamMembers = async () => {
  return await User.find({});
};

const updateTeam = async (teamId, updates, userId) => {
  // Check if user is admin of the team
  const members = await Team.getMembers(teamId);
  const userMember = members.find(m => m.USERID === userId);
  if (!userMember || userMember.ROLE !== 'Admin') {
    const error = new Error('팀 관리자 권한이 필요합니다.');
    error.statusCode = 403;
    throw error;
  }

  const team = await Team.update(teamId, updates);
  return normalizeTeam(team);
};

const deleteTeam = async (teamId, userId) => {
  // Check if user is admin of the team
  const members = await Team.getMembers(teamId);
  const userMember = members.find(m => m.USERID === userId);
  if (!userMember || userMember.ROLE !== 'Admin') {
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
  return { ...normalizeTeam(team), members };
};

const removeTeamMember = async (teamId, targetUserId, userId) => {
  // Check if user is admin
  const members = await Team.getMembers(teamId);
  const userMember = members.find(m => m.USERID === userId);
  if (!userMember || userMember.ROLE !== 'Admin') {
    const error = new Error('팀 관리자 권한이 필요합니다.');
    error.statusCode = 403;
    throw error;
  }

  if (targetUserId === userId) {
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
  const userMember = members.find(m => m.USERID === userId);
  if (!userMember || userMember.ROLE !== 'Admin') {
    const error = new Error('팀 관리자 권한이 필요합니다.');
    error.statusCode = 403;
    throw error;
  }

  await Team.updateMemberRole(teamId, targetUserId, role);
};

module.exports = { createTeam, getTeams, joinTeam, getTeamMembers, updateTeam, deleteTeam, getTeamDetails, removeTeamMember, updateMemberRoleService };
