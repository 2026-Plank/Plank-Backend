const clients = new Map();

const getUserClients = (userId) => clients.get(String(userId)) || new Set();

const addClient = (userId, res) => {
  const key = String(userId);
  if (!clients.has(key)) clients.set(key, new Set());
  clients.get(key).add(res);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.write('event: connected\ndata: {}\n\n');

  reqCleanup(res, () => {
    const set = clients.get(key);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) clients.delete(key);
  });
};

const reqCleanup = (res, cleanup) => {
  res.on('close', cleanup);
  res.on('finish', cleanup);
};

const sendToUser = (userId, event, payload) => {
  for (const res of getUserClients(userId)) {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }
};

const broadcastDirectMessage = (chat) => {
  sendToUser(chat.senderId, 'chat:message', chat);
  sendToUser(chat.receiverId, 'chat:message', chat);
};

const broadcastGroupMessage = (memberIds, chat) => {
  memberIds.forEach((userId) => sendToUser(userId, 'chat:group-message', chat));
};

const broadcastNotification = (userId, notification) => {
  sendToUser(userId, 'notification', notification);
};

module.exports = { addClient, broadcastDirectMessage, broadcastGroupMessage, broadcastNotification };
