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

const createTeam = async ({ name, deadline, creatorName }) => {
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

  return normalizeTeam(team);
};

const getTeams = async () => {
  const teams = await Team.findAll();
  return teams.map(normalizeTeam);
};

const joinTeam = async (userId, inviteCode) => {
  const team = await Team.findOne({ teamCode: inviteCode });
  if (!team) throw new Error('Invalid invite code');
  return normalizeTeam(team);
};

const getTeamMembers = async () => {
  return await User.find({});
};

module.exports = { createTeam, getTeams, joinTeam, getTeamMembers };
