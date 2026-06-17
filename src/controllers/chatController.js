const Chat = require('../models/Chat');
const { addClient, broadcastDirectMessage, broadcastGroupMessage } = require('../utils/chatRealtime');

const getConversations = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    const conversations = await Chat.getConversationSummaries(currentUser.id);
    res.json({ conversations: conversations.direct, groups: conversations.groups });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    const { friendId } = req.params;
    await assertAcceptedFriend(currentUser.id, friendId);

    const messages = await Chat.find({
      or: [
        { senderId: currentUser.id, receiverId: friendId },
        { senderId: friendId, receiverId: currentUser.id }
      ]
    });
    await Chat.upsertRead({ userId: currentUser.id, targetType: 'direct', targetId: friendId });
    res.json(messages);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    const { receiverId, message } = req.body;
    if (!receiverId || !String(message || '').trim()) {
      return res.status(400).json({ error: 'receiverId와 message가 필요합니다.' });
    }
    await assertAcceptedFriend(currentUser.id, receiverId);

    const chat = await Chat.create({
      senderId: currentUser.id,
      receiverId,
      message: String(message).trim()
    });
    await Chat.upsertRead({ userId: req.user.id, targetType: 'direct', targetId: receiverId });
    broadcastDirectMessage(chat);
    res.status(201).json({ message: 'Message sent', chat });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    const chat = await Chat.deleteMessage({ messageId: req.params.messageId, userId: currentUser.id });
    res.json({ message: 'Message deleted', chat });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const markDirectRead = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    await assertAcceptedFriend(currentUser.id, req.params.friendId);
    await Chat.upsertRead({ userId: currentUser.id, targetType: 'direct', targetId: req.params.friendId });
    res.json({ message: 'Read marked' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const createGroup = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    const name = String(req.body.name || '').trim();
    const memberIds = [...new Set((Array.isArray(req.body.memberIds) ? req.body.memberIds : [])
      .map(Number)
      .filter((id) => Number.isFinite(id) && id !== Number(currentUser.id)))];

    if (!name) return res.status(400).json({ error: '그룹 이름이 필요합니다.' });
    if (!memberIds.length) return res.status(400).json({ error: '초대할 친구를 선택해주세요.' });

    await assertGroupMembersAreFriends(currentUser.id, memberIds);
    const group = await Chat.createGroup({ ownerId: currentUser.id, name, memberIds });
    res.status(201).json({ group });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const addGroupMembers = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    const { groupId } = req.params;
    const isMember = await Chat.isGroupMember({ groupId, userId: currentUser.id });
    if (!isMember) return res.status(403).json({ error: '그룹 멤버만 친구를 추가할 수 있습니다.' });

    const memberIds = [...new Set((Array.isArray(req.body.memberIds) ? req.body.memberIds : [])
      .map(Number)
      .filter((id) => Number.isFinite(id) && id !== Number(currentUser.id)))];
    await assertGroupMembersAreFriends(currentUser.id, memberIds);
    await Promise.all(memberIds.map((userId) => Chat.addGroupMember({ groupId, userId })));
    res.json({ message: 'Members added' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const getGroupMessages = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    const { groupId } = req.params;
    const isMember = await Chat.isGroupMember({ groupId, userId: currentUser.id });
    if (!isMember) return res.status(403).json({ error: '그룹 멤버만 메시지를 볼 수 있습니다.' });

    const messages = await Chat.getGroupMessages(groupId);
    await Chat.upsertRead({ userId: currentUser.id, targetType: 'group', targetId: groupId });
    res.json(messages);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const sendGroupMessage = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    const { groupId } = req.params;
    const message = String(req.body.message || '').trim();
    if (!message) return res.status(400).json({ error: 'message가 필요합니다.' });

    const isMember = await Chat.isGroupMember({ groupId, userId: currentUser.id });
    if (!isMember) return res.status(403).json({ error: '그룹 멤버만 메시지를 보낼 수 있습니다.' });
    const chat = await Chat.createGroupMessage({ groupId, senderId: req.user.id, message });
    await Chat.upsertRead({ userId: req.user.id, targetType: 'group', targetId: groupId });
    const memberIds = await Chat.getGroupMemberIds(groupId);
    broadcastGroupMessage(memberIds, chat);
    res.status(201).json({ message: 'Message sent', chat });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const streamChatEvents = async (req, res) => {
  addClient(req.user.id, res);
};

const deleteGroupMessage = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    const chat = await Chat.deleteGroupMessage({ messageId: req.params.messageId, userId: currentUser.id });
    res.json({ message: 'Message deleted', chat });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const markGroupRead = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    await Chat.upsertRead({ userId: currentUser.id, targetType: 'group', targetId: req.params.groupId });
    res.json({ message: 'Read marked' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const searchMessages = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    const { query } = req.query;
    const messages = await Chat.search(currentUser.id, query || '');
    res.json(messages);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  deleteMessage,
  markDirectRead,
  createGroup,
  addGroupMembers,
  getGroupMessages,
  sendGroupMessage,
  deleteGroupMessage,
  markGroupRead,
  searchMessages,
  streamChatEvents
};
