const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

const { connectDB } = require('./config/db.config');

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const teamRoutes = require('./routes/teamRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feedbacks', feedbackRoutes);
const authController = require('./controllers/authController');
app.post('/login', authController.login);
app.post('/sign', authController.sign);

app.use((req, res, next) => {
    console.log("요청 경로:", req.originalUrl);
    next();
});

app.use(cors({
    origin: true,
    credentials: true
}));

// Error handler
const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`서버 실행됨: http://localhost:${PORT}`);
    });
};

startServer();

module.exports = app;