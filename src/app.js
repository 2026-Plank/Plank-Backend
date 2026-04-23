const express = require('express');
const cors = require('cors'); // cors 모듈 불러오기
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const teamRoutes = require('./routes/teamRoutes');
const userRoutes = require('./routes/userRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// 프론트엔드 주소 허용 (리액트 기본 포트가 3000일 경우)
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// JSON 데이터를 받기 위한 미들웨어 (이게 있어야 req.body를 읽을 수 있음)
app.use(express.json());

// 라우터 연결
app.get('/api/health', (req, res) => {
  res.json({ message: 'Plank backend is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/users', userRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api', scheduleRoutes);
app.use(errorHandler);

// 서버 실행
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`${PORT}번 포트에서 실행 중`));
