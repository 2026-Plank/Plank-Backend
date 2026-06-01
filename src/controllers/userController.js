const User = require('../models/User');
const Friend = require('../models/Friend');
const Notification = require('../models/Notification');

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
    const error = new Error('로그인 사용자를 찾을 수 없습니다. 다시 로그인해주세요.');
    error.statusCode = 401;
    throw error;
  }

  return user;
};

const getProfile = async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    res.json(sanitizeUser(user));
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const updates = {};

    ['name', 'job', 'statusMessage'].forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    if (Object.prototype.hasOwnProperty.call(req.body, 'status')) {
      updates.statusMessage = req.body.status;
    }

    const currentUser = await getCurrentUser(req);
    const user = await User.findByIdAndUpdate(currentUser.id, updates);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    res.json({ message: '프로필이 수정되었습니다.', user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePresence = async (req, res) => {
  try {
    const allowed = ['ONLINE', 'IDLE', 'DND', 'OFFLINE'];
    const { presenceStatus } = req.body;
    if (!allowed.includes(presenceStatus)) {
      return res.status(400).json({ error: '올바른 상태 값이 아닙니다.' });
    }

    const currentUser = await getCurrentUser(req);
    const user = await User.findByIdAndUpdate(currentUser.id, { presenceStatus });
    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getFriends = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    const friendships = await Friend.findAcceptedByUser(currentUser.id);
    const friends = await Promise.all(friendships.map(async (relation) => {
      const friendUserId = Number(relation.userId) === Number(currentUser.id) ? relation.friendId : relation.userId;
      const user = sanitizeUser(await User.findById(friendUserId));
      if (!user) return null;
      return {
        relationId: relation.id,
        status: relation.status,
        createdAt: relation.createdAt,
        user
      };
    }));
    res.json({ friends: friends.filter(Boolean) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getFriendRequests = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    const requests = await Friend.findIncomingPending(currentUser.id);
    const detailed = await Promise.all(requests.map(async (relation) => {
      const user = sanitizeUser(await User.findById(relation.userId));
      if (!user) return null;
      return {
        relationId: relation.id,
        status: relation.status,
        createdAt: relation.createdAt,
        user
      };
    }));
    res.json({ requests: detailed.filter(Boolean) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const searchUsers = async (req, res) => {
  try {
    const keyword = `${req.query.keyword || ''}`.trim();
    if (!keyword) {
      return res.json({ users: [] });
    }

    const users = await User.search(keyword);
    const currentUser = await getCurrentUser(req);
    const filtered = users.filter((user) => Number(user.id) !== Number(currentUser.id));
    const enriched = await Promise.all(filtered.map(async (user) => {
      const relation = await Friend.findPair(currentUser.id, user.id);
      const safeUser = sanitizeUser(user);
      if (!relation) {
        return {
          ...safeUser,
          friendStatus: null,
          friendDirection: null,
          relationId: null
        };
      }

      return {
        ...safeUser,
        friendStatus: relation.status,
        friendDirection: Number(relation.userId) === Number(currentUser.id) ? 'outgoing' : 'incoming',
        relationId: relation.id
      };
    }));
    res.json({ users: enriched });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const sendFriendRequest = async (req, res) => {
  try {
    const { friendId } = req.body;
    if (!friendId) {
      return res.status(400).json({ error: 'friendId가 필요합니다.' });
    }
    const currentUser = await getCurrentUser(req);
    if (Number(friendId) === Number(currentUser.id)) {
      return res.status(400).json({ error: '자기 자신에게 친구 요청을 보낼 수 없습니다.' });
    }

    const targetUser = await User.findById(friendId);
    if (!targetUser) {
      return res.status(404).json({ error: '대상 사용자를 찾을 수 없습니다.' });
    }

    const existing = await Friend.findPair(currentUser.id, friendId);
    if (existing) {
      if (String(existing.status).toLowerCase() === 'accepted') {
        return res.status(409).json({ error: '이미 친구입니다.' });
      }
      return res.status(409).json({ error: '이미 친구 요청이 있습니다.' });
    }

    const relation = await Friend.create({
      userId: currentUser.id,
      friendId
    });

    await Notification.createOnce({
      userId: friendId,
      type: 'friend_request',
      message: `${currentUser.name || currentUser.userid}님이 친구 요청을 보냈습니다.`,
      targetType: 'friend',
      targetId: String(currentUser.id),
      actionPath: '/mypage',
      dedupeKey: `friend_request:${currentUser.id}:${friendId}`
    });

    res.status(201).json({ message: '친구 요청을 보냈습니다.', relation });
  } catch (error) {
    if (error.errorNum === 1) {
      return res.status(409).json({ error: '이미 친구 요청이 있습니다.' });
    }
    res.status(500).json({ error: error.message });
  }
};

const acceptFriendRequest = async (req, res) => {
  try {
    const { relationId } = req.params;
    const relation = await Friend.find({ id: relationId });
    const request = relation[0];
    if (!request) {
      return res.status(404).json({ error: '친구 요청을 찾을 수 없습니다.' });
    }
    const currentUser = await getCurrentUser(req);
    if (Number(request.friendId) !== Number(currentUser.id)) {
      return res.status(403).json({ error: '수락 권한이 없습니다.' });
    }

    const accepted = await Friend.updateStatus(relationId, 'accepted');

    await Notification.createOnce({
      userId: request.userId,
      type: 'friend_accepted',
      message: `${currentUser.name || currentUser.userid}님이 친구 요청을 수락했습니다.`,
      targetType: 'friend',
      targetId: String(currentUser.id),
      actionPath: '/mypage',
      dedupeKey: `friend_accepted:${request.userId}:${currentUser.id}`
    });

    res.json({ message: '친구 요청을 수락했습니다.', relation: accepted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteFriend = async (req, res) => {
  try {
    const { relationId } = req.params;
    const relation = await Friend.find({ id: relationId });
    const target = relation[0];
    if (!target) {
      return res.status(404).json({ error: '친구 관계를 찾을 수 없습니다.' });
    }
    const currentUser = await getCurrentUser(req);
    if (Number(target.userId) !== Number(currentUser.id) && Number(target.friendId) !== Number(currentUser.id)) {
      return res.status(403).json({ error: '삭제 권한이 없습니다.' });
    }

    await Friend.deleteById(relationId);
    res.json({ message: '친구 관계를 삭제했습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updatePresence,
  getFriends,
  getFriendRequests,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  deleteFriend
};
