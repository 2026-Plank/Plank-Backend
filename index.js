const path = require('path');
const dotenv = require('dotenv');

// 환경 변수 로드 (.env)
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./src/app'); // 방금 보여주신 src/app.js 가져오기
const { connectDB } = require('./src/config/db.config');

// src 폴더 내부에 있는 모델들 경로 맞춤
const Team = require('./src/models/Team');
const Friend = require('./src/models/Friend');
const Feedback = require('./src/models/Feedback');
const Chat = require('./src/models/Chat');
const User = require('./src/models/User');
const Notification = require('./src/models/Notification');
const Schedule = require('./src/models/Schedule');

// DB 및 테이블 초기화 로직 (순차적 실행으로 ORA-14411 충돌 방지)
const initializeDatabase = async () => {
  try {
    await connectDB();
    console.log('Oracle DB connected successfully.');

    // await로 하나씩 순서대로 만들어야 오라클 DDL 락이 안 걸립니다!
    await User.ensureProfileColumns();
    await Team.ensureSchema();
    await Friend.ensureTable();
    await Feedback.ensureTable();
    await Chat.ensureTable();
    await Notification.ensureTable();
    await Schedule.ensureTable();
    
    console.log('All DB Tables initialized.');
  } catch (error) {
    console.error('DB Initialization failed:', error);
  }
};

// 서버 실행 분기
if (process.env.NODE_ENV !== 'production') {
  // 로컬 환경일 때 포트를 열어서 listen 합니다.
  const PORT = process.env.PORT || 3000;
  initializeDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running locally on port ${PORT}`);
    });
  });
} else {
  // Vercel 배포 환경일 때는 포트를 열지 않고 초기화만 조용히 실행합니다.
  initializeDatabase();
}

// Vercel 서버리스용 내보내기
module.exports = app;