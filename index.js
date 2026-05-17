const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./src/app');
const { connectDB } = require('./src/config/db.config');
const Team = require('./src/models/Team');
const Friend = require('./src/models/Friend');
const Feedback = require('./src/models/Feedback');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    await Team.ensureSchema();
    await Friend.ensureTable();
    await Feedback.ensureTable();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server due to DB connection error:', error);
    process.exit(1);
  }
};

startServer();
