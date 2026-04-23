const Friend = require('../models/Friend');
const User = require('../models/User');

exports.searchUsers = async (req, res, next) => {
  try {
    const keyword = (req.query.keyword || '').trim();

    if (!keyword) {
      return res.status(400).json({ message: 'keyword는 필수입니다.' });
    }

    const users = await User.searchByKeyword({
      keyword,
      excludeUserId: req.user.userId
    });

    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

exports.getFriends = async (req, res, next) => {
  try {
    const friendIds = await Friend.findAcceptedFriends(req.user.userId);
    const friends = await User.findManyByIds(friendIds);
    res.status(200).json(friends);
  } catch (error) {
    next(error);
  }
};

exports.sendFriendRequest = async (req, res, next) => {
  try {
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ message: 'friendId는 필수입니다.' });
    }

    if (Number(friendId) === Number(req.user.userId)) {
      return res.status(400).json({ message: '자기 자신에게 친구 요청을 보낼 수 없습니다.' });
    }

    const targetUser = await User.findById(friendId);
    if (!targetUser) {
      return res.status(404).json({ message: '대상 사용자를 찾을 수 없습니다.' });
    }

    const relationship = await Friend.findRelationshipBetweenUsers(req.user.userId, friendId);
    if (relationship) {
      return res.status(409).json({ message: '이미 친구이거나 요청이 존재합니다.' });
    }

    await Friend.createRequest({
      requesterId: req.user.userId,
      addresseeId: friendId
    });

    res.status(201).json({ message: '친구 요청을 보냈습니다.' });
  } catch (error) {
    next(error);
  }
};

exports.getFriendRequests = async (req, res, next) => {
  try {
    const requests = await Friend.findIncomingRequests(req.user.userId);
    res.status(200).json(requests);
  } catch (error) {
    next(error);
  }
};

exports.acceptFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const result = await Friend.acceptRequest({
      requestId,
      userId: req.user.userId
    });

    if (!result.affectedRows) {
      return res.status(404).json({ message: '수락할 친구 요청을 찾을 수 없습니다.' });
    }

    res.status(200).json({ message: '친구 요청을 수락했습니다.' });
  } catch (error) {
    next(error);
  }
};

exports.deleteFriend = async (req, res, next) => {
  try {
    const { friendId } = req.params;
    const result = await Friend.deleteRelationship({
      userId: req.user.userId,
      friendId
    });

    if (!result.affectedRows) {
      return res.status(404).json({ message: '삭제할 친구 관계를 찾을 수 없습니다.' });
    }

    res.status(200).json({ message: '친구 관계를 삭제했습니다.' });
  } catch (error) {
    next(error);
  }
};

exports.getTeamMembers = async (req, res, next) => {
  try {
    if (!req.user.teamId) {
      return res.status(400).json({ message: '소속 팀이 없습니다.' });
    }

    const members = await User.findTeamMembers({
      teamId: req.user.teamId,
      excludeUserId: req.user.userId
    });

    res.status(200).json(members);
  } catch (error) {
    next(error);
  }
};
