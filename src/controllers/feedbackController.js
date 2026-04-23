const Feedback = require('../models/Feedback');
const User = require('../models/User');

const VALID_TYPES = ['PERSONAL', 'TEAM'];

exports.createFeedback = async (req, res, next) => {
  try {
    const { targetUserId, type, content, score } = req.body;

    if (!targetUserId || !type || !content) {
      return res.status(400).json({ message: 'targetUserId, type, content는 필수입니다.' });
    }

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ message: 'type은 PERSONAL 또는 TEAM 이어야 합니다.' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: '피드백 대상 사용자를 찾을 수 없습니다.' });
    }

    if (Number(targetUserId) === Number(req.user.userId)) {
      return res.status(400).json({ message: '자기 자신에게 피드백을 작성할 수 없습니다.' });
    }

    let teamId = null;
    if (type === 'TEAM') {
      if (!req.user.teamId) {
        return res.status(400).json({ message: '팀 피드백은 팀 소속 사용자만 작성할 수 있습니다.' });
      }

      const sameTeam = await User.belongsToSameTeam(targetUserId, req.user.teamId);
      if (!sameTeam) {
        return res.status(403).json({ message: '같은 팀원에게만 팀 피드백을 작성할 수 있습니다.' });
      }

      teamId = req.user.teamId;
    }

    await Feedback.create({
      authorId: req.user.userId,
      targetUserId,
      teamId,
      type,
      content,
      score: score ?? null
    });

    res.status(201).json({ message: '피드백이 등록되었습니다.' });
  } catch (error) {
    next(error);
  }
};

exports.getFeedbacks = async (req, res, next) => {
  try {
    const type = req.query.type || null;
    const feedbacks = await Feedback.findReceivedByUserId({
      userId: req.params.targetId,
      type
    });

    res.status(200).json(feedbacks);
  } catch (error) {
    next(error);
  }
};

exports.getMyReceivedFeedbacks = async (req, res, next) => {
  try {
    const type = req.query.type || null;
    const feedbacks = await Feedback.findReceivedByUserId({
      userId: req.user.userId,
      type
    });

    res.status(200).json(feedbacks);
  } catch (error) {
    next(error);
  }
};

exports.getMySentFeedbacks = async (req, res, next) => {
  try {
    const type = req.query.type || null;
    const feedbacks = await Feedback.findCreatedByUserId({
      userId: req.user.userId,
      type
    });

    res.status(200).json(feedbacks);
  } catch (error) {
    next(error);
  }
};

exports.deleteFeedback = async (req, res, next) => {
  try {
    const result = await Feedback.deleteByIdAndAuthor({
      feedbackId: req.params.feedbackId,
      authorId: req.user.userId
    });

    if (!result.affectedRows) {
      return res.status(404).json({ message: '삭제할 피드백을 찾을 수 없습니다.' });
    }

    res.status(200).json({ message: '피드백을 삭제했습니다.' });
  } catch (error) {
    next(error);
  }
};
