const path = require('path');
const dotenv = require('dotenv');

// 환경 변수 로드 (.env)
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./src/app'); 
const { connectDB } = require('./src/config/db.config');

// src 폴더 내부에 있는 모델들 경로 맞춤
const Team = require('./src/models/Team');
const Friend = require('./src/models/Friend');
const Feedback = require('./src/models/Feedback');
const Chat = require('./src/models/Chat');
const User = require('./src/models/User');
const Notification = require('./src/models/Notification');
const Schedule = require('./src/models/Schedule');

// DB 및 테이블 초기화 로직
const initializeDatabase = async () => {
  try {
    console.log('데이터베이스 연결 시도 중...');
    await connectDB();
    console.log('Oracle DB connected successfully.');

    // 💡 [핵심 수정] 배포 환경(Render)이면 굳이 무거운 테이블 생성 검사를 하지 않고 종료합니다.
    const isRender = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
    if (isRender) {
      console.log('🚀 Render 배포 환경입니다. 테이블 검사를 생략하고 즉시 대기합니다.');
      return;
    }

    // 로컬 컴퓨터에서 실행할 때만 테이블 생성을 안전하게 수행
    console.log('로컬 환경: 테이블 초기화 검사를 시작합니다.');
    await User.ensureProfileColumns();
    await Team.ensureSchema();
    await Friend.ensureTable();
    await Feedback.ensureTable();
    await Chat.ensureTable();
    await Notification.ensureTable();
    await Schedule.ensureTable();
    
    console.log('🎉 All DB Tables initialized successfully.');
  } catch (error) {
    console.error('❌ DB Initialization failed:', error);
  }
};

const PORT = process.env.PORT || 3000;

// 💡 [핵심 수정] Render의 강제 재부팅을 막기 위해 포트부터 즉시 엽니다!
app.listen(PORT, () => {
  console.log(`🚀 Server is live and running on port ${PORT}`);
  
  // 포트가 열려 Render 스캔을 통과한 후, 백그라운드에서 안전하게 DB 초기화를 수행합니다.
  initializeDatabase();
});

// Vercel 서버리스용 내보내기
module.exports = app;