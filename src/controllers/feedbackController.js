const Feedback = require('../models/Feedback');
const User = require('../models/User');

const mapFeedbackWithUsers = async (feedbacks) => {
  return Promise.all(
    feedbacks.map(async (feedback) => {
      const fromUser = await User.findById(feedback.fromUserId);
      const toUser = await User.findById(feedback.toUserId);
      if (fromUser) delete fromUser.password;
      if (toUser) delete toUser.password;
      return {
        ...feedback,
        fromUser,
        toUser
      };
    })
  );
};

const createFeedback = async (req, res) => {
  try {
    const { toUserId, teamId, content, rating } = req.body;
    if (!toUserId || !content?.trim()) {
      return res.status(400).json({ error: '대상 사용자와 피드백 내용을 입력해주세요.' });
    }
    if (Number(toUserId) === Number(req.user.id)) {
      return res.status(400).json({ error: '자기 자신에게는 피드백을 남길 수 없습니다.' });
    }
    const feedback = await Feedback.create({
      fromUserId: req.user.id,
      toUserId,
      teamId,
      content: content.trim(),
      rating: rating || 5
    });
    res.status(201).json({ message: 'Feedback created', feedback });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    const feedbacks = await Feedback.find({ toUserId: req.user.id });
    res.json({ feedbacks: await mapFeedbackWithUsers(feedbacks) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMySentFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ fromUserId: req.user.id });
    res.json({ feedbacks: await mapFeedbackWithUsers(feedbacks) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTeamFeedbacks = async (req, res) => {
  try {
    const { teamId } = req.params;
    const feedbacks = await Feedback.findByTeamId(teamId);
    res.json({ feedbacks: await mapFeedbackWithUsers(feedbacks) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createFeedback,
  getFeedbacks,
  getMyReceivedFeedbacks,
  getMySentFeedbacks,
  getTeamFeedbacks
};
