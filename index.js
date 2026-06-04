const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./src/app');
const { startServer } = require('./src/server');

if (process.env.NODE_ENV !== 'production') {
  startServer(app);
} else {
  const { connectDB } = require('./src/config/db.config');
  const Team = require('./src/models/Team');
  const Friend = require('./src/models/Friend');
  const Feedback = require('./src/models/Feedback');
  const Chat = require('./src/models/Chat');
  const User = require('./src/models/User');
  const Notification = require('./src/models/Notification');
  const Schedule = require('./src/models/Schedule');

  connectDB().then(async () => {
    try {
      await User.ensureProfileColumns();
      await Team.ensureSchema();
      await Friend.ensureTable();
      await Feedback.ensureTable();
      await Chat.ensureTable();
      await Notification.ensureTable();
      await Schedule.ensureTable();
    } catch (err) {
      console.error('Table init error in Vercel:', err);
    }
  });
}

module.exports = app;