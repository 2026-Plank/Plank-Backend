const { execute } = require('../config/db.config');
const User = require('../models/User');
const Friend = require('../models/Friend');

const sanitizeUser = (user) => {
  if (!user) return null;
  const cloned = { ...user };
  delete cloned.password;
  return cloned;
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(sanitizeUser(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { name, job, status } = req.body;

  await execute(
    `UPDATE USERS 
     SET NAME = NVL(:name, NAME),
         JOB = NVL(:job, JOB),
         STATUS_MESSAGE = NVL(:status, STATUS_MESSAGE)
     WHERE USERID = :userId`,
    { name, job, status, userId }
  );
  
  const result = await execute(
    `SELECT NAME, JOB, STATUS_MESSAGE FROM USERS WHERE USERID = :userId`,
    { userId }
  );

  const row = result.rows[0];

  res.json({
    user: {
      userId,
      name: row.NAME,
      job: row.JOB,
      status: row.STATUS_MESSAGE
    }
  });
};

const updatePresence = async (req, res) => {
  try {
    const allowed = ['ONLINE', 'IDLE', 'DND', 'OFFLINE'];
    const { presenceStatus } = req.body;
    if (!allowed.includes(presenceStatus)) {
      return res.status(400).json({ error: '올바른 상태값이 아닙니다.' });
    }

    const user = await User.findByIdAndUpdate(req.user.id, { presenceStatus });
    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getFriends = async (req, res) => {
  try {
    const friendships = await Friend.findAcceptedByUser(req.user.id);
    const friends = await Promise.all(friendships.map(async (relation) => {
      const friendUserId = relation.userId === req.user.id ? relation.friendId : relation.userId;
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
    const requests = await Friend.findIncomingPending(req.user.id);
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

exports.updateUser = async (req, res) => {
  const { name, job, status } = req.body;
  const userId = req.user.userId; // JWT에서

  try {
    await execute(
      `UPDATE USERS 
             SET NAME = :name,
                 JOB = :job,
                 STATUS_MESSAGE = :status
             WHERE USERID = :userId`,
      { name, job, status, userId }
    );

    res.json({
      message: "업데이트 성공",
      user: { userId, name, job, status }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};

const searchUsers = async (req, res) => {
  try {
    const keyword = `${req.query.keyword || ''}`.trim();
    if (!keyword) {
      return res.json({ users: [] });
    }
    const users = await User.search(keyword);
    const filtered = users.filter((user) => user.id !== req.user.id);
    res.json({ users: filtered.map(sanitizeUser) });
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
    if (Number(friendId) === Number(req.user.id)) {
      return res.status(400).json({ error: '자기 자신은 친구로 추가할 수 없습니다.' });
    }

    const targetUser = await User.findById(friendId);
    if (!targetUser) {
      return res.status(404).json({ error: '대상 사용자를 찾을 수 없습니다.' });
    }

    const existing = await Friend.findPair(req.user.id, friendId);
    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(409).json({ error: '이미 친구입니다.' });
      }
      return res.status(409).json({ error: '이미 친구 요청이 존재합니다.' });
    }

    await Friend.create({
      userId: req.user.id,
      friendId
    });
    res.status(201).json({ message: 'Friend request sent' });
  } catch (error) {
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
    if (Number(request.friendId) !== Number(req.user.id)) {
      return res.status(403).json({ error: '수락 권한이 없습니다.' });
    }

    await Friend.updateStatus(relationId, 'accepted');
    res.json({ message: 'Friend request accepted' });
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
    if (Number(target.userId) !== Number(req.user.id) && Number(target.friendId) !== Number(req.user.id)) {
      return res.status(403).json({ error: '삭제 권한이 없습니다.' });
    }

    await Friend.deleteById(relationId);
    res.json({ message: 'Friend deleted' });
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
