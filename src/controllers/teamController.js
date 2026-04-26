const { createTeam, getTeams, joinTeam } = require('../services/teamService');
const User = require('../models/User');

const createTeamController = async (req, res) => {
  try {
    const { name, deadline } = req.body;
    const user = await User.findById(req.user.id);
    const team = await createTeam({
      name,
      deadline,
      creatorName: user?.name || user?.userid || 'unknown'
    });
    res.status(201).json({ message: 'Team created', team });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getTeamsController = async (req, res) => {
  try {
    const teams = await getTeams();
    res.json({ teams });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const joinTeamRequest = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const team = await joinTeam(req.user.id, inviteCode);
    res.status(200).json({ message: 'Team join request handled', team });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPendingMembers = async (req, res) => {
  res.status(200).json([]);
};

const approveMember = async (req, res) => {
  res.status(200).json({ message: 'Approval flow is not configured in current schema.' });
};

module.exports = { createTeamController, getTeamsController, joinTeamRequest, getPendingMembers, approveMember };
