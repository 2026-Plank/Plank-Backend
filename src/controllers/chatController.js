const Chat = require('../models/Chat');

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
    const chat = await Chat.create({
      senderId: req.user.id,
      receiverId,
      message
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

module.exports = { getMessages, sendMessage, searchMessages };
