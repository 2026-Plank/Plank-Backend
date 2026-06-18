const { connectDB } = require('./config/db.config');
const Team = require('./models/Team');
const Friend = require('./models/Friend');
const Feedback = require('./models/Feedback');
const Chat = require('./models/Chat');
const User = require('./models/User');
const Notification = require('./models/Notification');
const Schedule = require('./models/Schedule');

const startServer = async (app) => {
  const PORT = process.env.PORT || 3000;

  try {
    await connectDB();
    await User.ensureProfileColumns();
    await Team.ensureSchema();
    await Friend.ensureTable();
    await Feedback.ensureTable();
    await Chat.ensureTable();
    await Notification.ensureTable();
    await Schedule.ensureTable();

    return app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server due to DB connection error:', error);
    process.exit(1);
  }
};

module.exports = { startServer };
