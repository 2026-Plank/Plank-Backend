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
    const { teamId, content } = req.body;
    const trimmedContent = content?.trim();

    if (!trimmedContent) {
      return res.status(400).json({ error: 'Feedback content is required.' });
    }

    if (!teamId) {
      return res.status(400).json({ error: 'Project is required.' });
    }

    const currentUser = await getCurrentUser(req);
    await assertTeamMember(teamId, currentUser);

    const feedback = await Feedback.create({
      fromUserId: currentUser.id,
      teamId,
      content: trimmedContent
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
