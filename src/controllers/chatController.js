const Chat = require('../models/Chat');

const getConversations = async (req, res) => {
  try {
    const conversations = await Chat.getConversationSummaries(req.user.id);
    res.json({ conversations });
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
    res.status(201).json({ message: 'Message sent', chat });
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

module.exports = { getConversations, getMessages, sendMessage, searchMessages };
