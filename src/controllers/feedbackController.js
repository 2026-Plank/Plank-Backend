const Feedback = require('../models/Feedback');
const Team = require('../models/Team');
const User = require('../models/User');

const sanitizeUser = (user) => {
  if (!user) return null;
  const cloned = { ...user };
  delete cloned.password;
  return cloned;
};

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

const assertTeamMember = async (teamId, user) => {
  if (!teamId) return;

  const isMember = await Team.isMember(teamId, user.userid);
  if (!isMember) {
    const error = new Error('You do not have permission to use feedback for this team.');
    error.statusCode = 403;
    throw error;
  }
};

const getFeedbackTarget = async ({ teamId, toUserId, currentUser }) => {
  if (!toUserId) {
    const error = new Error('Target user is required.');
    error.statusCode = 400;
    throw error;
  }

  const targetUser = Number.isFinite(Number(toUserId))
    ? await User.findById(Number(toUserId))
    : await User.findOne({ userid: toUserId });

  if (!targetUser) {
    const error = new Error('Target user was not found.');
    error.statusCode = 404;
    throw error;
  }

  if (Number(targetUser.id) === Number(currentUser.id)) {
    const error = new Error('Feedback cannot target yourself.');
    error.statusCode = 400;
    throw error;
  }

  if (teamId) {
    const isTargetMember = await Team.isMember(teamId, targetUser.userid);
    if (!isTargetMember) {
      const error = new Error('Target user is not a member of this team.');
      error.statusCode = 400;
      throw error;
    }
  }

  return targetUser;
};

const normalizeRating = (rating) => {
  const parsed = Number(rating ?? 5);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
    const error = new Error('Rating must be an integer from 1 to 5.');
    error.statusCode = 400;
    throw error;
  }
  return parsed;
};

const mapFeedbackWithUsers = async (feedbacks) => {
  return Promise.all(
    feedbacks.map(async (feedback) => {
      const fromUser = await User.findById(feedback.fromUserId);
      const toUser = await User.findById(feedback.toUserId);

      return {
        ...feedback,
        fromUser: sanitizeUser(fromUser),
        toUser: sanitizeUser(toUser),
        audience: feedback.teamId ? 'team' : 'personal'
      };
    })
  );
};

const createFeedback = async (req, res) => {
  try {
    const { toUserId, teamId, content, rating } = req.body;
    const trimmedContent = content?.trim();

    if (!trimmedContent) {
      return res.status(400).json({ error: 'Feedback content is required.' });
    }

    const currentUser = await getCurrentUser(req);
    const isTeamFeedback = Boolean(teamId);
    await assertTeamMember(teamId, currentUser);

    const targetUser = await getFeedbackTarget({ teamId, toUserId, currentUser });

    const feedback = await Feedback.create({
      fromUserId: currentUser.id,
      toUserId: targetUser.id,
      teamId,
      content: trimmedContent,
      rating: normalizeRating(rating)
    });

    const [mappedFeedback] = await mapFeedbackWithUsers([feedback]);
    res.status(201).json({ message: 'Feedback created', feedback: mappedFeedback });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getFeedbacks = async (req, res) => {
  try {
    const { userId } = req.params;
    const feedbacks = await Feedback.find({ toUserId: userId });
    res.json({ feedbacks: await mapFeedbackWithUsers(feedbacks) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMyReceivedFeedbacks = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    const feedbacks = await Feedback.find({ toUserId: currentUser.id });
    res.json({ feedbacks: await mapFeedbackWithUsers(feedbacks) });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getMySentFeedbacks = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    const feedbacks = await Feedback.find({ fromUserId: currentUser.id });
    res.json({ feedbacks: await mapFeedbackWithUsers(feedbacks) });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getTeamFeedbacks = async (req, res) => {
  try {
    const { teamId } = req.params;
    const currentUser = await getCurrentUser(req);

    await assertTeamMember(teamId, currentUser);

    const feedbacks = await Feedback.findByTeamId(teamId);
    res.json({ feedbacks: await mapFeedbackWithUsers(feedbacks) });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

module.exports = {
  createFeedback,
  getFeedbacks,
  getMyReceivedFeedbacks,
  getMySentFeedbacks,
  getTeamFeedbacks
};
