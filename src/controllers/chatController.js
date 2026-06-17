const Chat = require('../models/Chat');
const { addClient, broadcastDirectMessage, broadcastGroupMessage } = require('../utils/chatRealtime');

const getConversations = async (req, res) => {
  try {
    const conversations = await Chat.getConversationSummaries(req.user.id);
    res.json({ conversations: conversations.direct, groups: conversations.groups });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { friendId } = req.params;
    const messages = await Chat.find({
      or: [
        { senderId: req.user.id, receiverId: friendId },
        { senderId: friendId, receiverId: req.user.id }
      ]
    });
    await Chat.upsertRead({ userId: req.user.id, targetType: 'direct', targetId: friendId });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    if (!receiverId || !String(message || '').trim()) {
      return res.status(400).json({ error: 'receiverId와 message가 필요합니다.' });
    }
    const chat = await Chat.create({
      senderId: req.user.id,
      receiverId,
      message: String(message).trim()
    });
    await Chat.upsertRead({ userId: req.user.id, targetType: 'direct', targetId: receiverId });
    broadcastDirectMessage(chat);
    res.status(201).json({ message: 'Message sent', chat });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const chat = await Chat.deleteMessage({ messageId: req.params.messageId, userId: req.user.id });
    res.json({ message: 'Message deleted', chat });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markDirectRead = async (req, res) => {
  try {
    await Chat.upsertRead({ userId: req.user.id, targetType: 'direct', targetId: req.params.friendId });
    res.json({ message: 'Read marked' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createGroup = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const memberIds = Array.isArray(req.body.memberIds) ? req.body.memberIds : [];
    if (!name) return res.status(400).json({ error: '그룹 이름이 필요합니다.' });
    const group = await Chat.createGroup({ ownerId: req.user.id, name, memberIds });
    res.status(201).json({ group });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const isMember = await Chat.isGroupMember({ groupId, userId: req.user.id });
    if (!isMember) return res.status(403).json({ error: '그룹 멤버만 친구를 추가할 수 있습니다.' });
    const memberIds = Array.isArray(req.body.memberIds) ? req.body.memberIds : [];
    await Promise.all(memberIds.map((userId) => Chat.addGroupMember({ groupId, userId })));
    res.json({ message: 'Members added' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const isMember = await Chat.isGroupMember({ groupId, userId: req.user.id });
    if (!isMember) return res.status(403).json({ error: '그룹 멤버만 메시지를 볼 수 있습니다.' });
    const messages = await Chat.getGroupMessages(groupId);
    await Chat.upsertRead({ userId: req.user.id, targetType: 'group', targetId: groupId });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const message = String(req.body.message || '').trim();
    if (!message) return res.status(400).json({ error: 'message가 필요합니다.' });
    const isMember = await Chat.isGroupMember({ groupId, userId: req.user.id });
    if (!isMember) return res.status(403).json({ error: '그룹 멤버만 메시지를 보낼 수 있습니다.' });
    const chat = await Chat.createGroupMessage({ groupId, senderId: req.user.id, message });
    await Chat.upsertRead({ userId: req.user.id, targetType: 'group', targetId: groupId });
    const memberIds = await Chat.getGroupMemberIds(groupId);
    broadcastGroupMessage(memberIds, chat);
    res.status(201).json({ message: 'Message sent', chat });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const streamChatEvents = async (req, res) => {
  addClient(req.user.id, res);
};

const deleteGroupMessage = async (req, res) => {
  try {
    const chat = await Chat.deleteGroupMessage({ messageId: req.params.messageId, userId: req.user.id });
    res.json({ message: 'Message deleted', chat });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markGroupRead = async (req, res) => {
  try {
    await Chat.upsertRead({ userId: req.user.id, targetType: 'group', targetId: req.params.groupId });
    res.json({ message: 'Read marked' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const searchMessages = async (req, res) => {
  try {
    const { query } = req.query;
    const messages = await Chat.search(req.user.id, query);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
