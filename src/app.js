const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const teamRoutes = require('./routes/teamRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const homeRoutes = require('./routes/homeRoutes');
const authController = require('./controllers/authController');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors({
  origin: [
    'https://plank-web.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
  ],
  credentials: true,
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/home', homeRoutes);

// Keep legacy frontend endpoints working while pages are migrated to /api/auth.
app.post('/login', authController.login);
app.post('/sign', authController.sign);
app.post('/signup', authController.sign);

app.use((req, res, next) => {
  console.log('Request path:', req.originalUrl);
  next();
});

app.use(errorHandler);

if (require.main === module) {
  const { startServer } = require('./server');
  startServer(app);
}

module.exports = app;