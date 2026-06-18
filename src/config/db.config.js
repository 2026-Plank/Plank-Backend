const oracledb = require('oracledb');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// 💡 환경(Render 배포 vs 로컬)에 따라 지갑 파일 위치 자동 설정
const isRender = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
const walletPath = isRender 
  ? path.resolve(__dirname, '../../')       // Render에서는 최상위 루트 폴더에 Secret File이 생성됨
  : path.resolve(__dirname, '../../wallet'); // 로컬에서는 프로젝트 하위 wallet 폴더 안을 바라봄

// 💡 딱 한 번만 올바른 경로로 오라클 클라이언트 초기화
try {
  oracledb.initOracleClient({ 
    configDir: walletPath 
  });
} catch (err) {
  // 중복 초기화 에러 방지
}

let pool;

const connectDB = async () => {
  if (pool) return pool;

  try {
    console.log('데이터베이스 연결 시도 중... (Thin Mode with Secret Files)');
    
    const poolOptions = {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING, 
      poolMin: 0, 
      poolMax: 3,
      queueTimeout: 60000, 
    };

    pool = await oracledb.createPool(poolOptions);

    console.log('=== Oracle DB Pool Created Successfully! ===');
    return pool;
  } catch (error) {
    console.error('Oracle DB connection error:', error);
    pool = null;
    throw error;
  }
};

const execute = async (sql, binds = {}, options = {}) => {
  if (!pool) await connectDB();
  let connection;
  try {
    connection = await pool.getConnection();
    return await connection.execute(sql, binds, { autoCommit: true, ...options });
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error('Error closing connection:', err); }
    }
  }
};

module.exports = { connectDB, execute };