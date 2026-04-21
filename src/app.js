const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const teamRoutes = require('./routes/teamRoutes');

const app = express();

// 미들웨어 설정
app.use(cors()); // 프론트엔드와 통신 허용
app.use(express.json()); // JSON 바디 파싱

// MongoDB 연결 (로컬 또는 MongoDB Atlas URI 입력)
mongoose.connect('mongodb://localhost:27017/plank_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// 라우터 등록
app.use('/api/team', teamRoutes);
// app.use('/api/auth', authRoutes); // Auth 라우터 추가 필요
// app.use('/api/todos', todoRoutes); // 할일 라우터 추가 필요

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Plank 백엔드 서버가 포트 ${PORT}에서 실행 중입니다.`);
});