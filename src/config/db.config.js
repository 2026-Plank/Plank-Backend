const oracledb = require('oracledb');
const path = require('path');

// 환경 변수 설정 (.env 파일 로드)
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// 오라클 쿼리 결과를 객체(Object) 형태로 받도록 설정
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let pool;

const connectDB = async () => {
  if (pool) return pool;

  try {
    console.log('데이터베이스 연결 시도 중... (Physical Wallet Mode)');
    
    // 💡 프로젝트 루트에 생성한 wallet 폴더의 절대 경로를 계산합니다.
    const walletPath = path.join(__dirname, '../../wallet');
    console.log(`[INFO] 설정된 지갑 경로: ${walletPath}`);

    // 오라클 드라이버에게 지갑 파일이 있는 위치를 강제로 주입 (mTLS 인증용)
    oracledb.initOracleClient({ walletLocation: walletPath });

    const poolOptions = {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING,
      walletPassword: process.env.WALLET_PASSWORD, // 지갑 다운로드할 때 입력했던 비밀번호
      poolMin: 2,
      poolMax: 10,
      queueTimeout: 15000, // 네트워크 지연을 감안하여 대기 시간을 15초로 상향
    };

    // 커넥션 풀 생성
    pool = await oracledb.createPool(poolOptions);

    console.log('=== Oracle DB Pool Created Successfully! ===');
    return pool;
  } catch (error) {
    console.error('Oracle DB connection error:', error);
    pool = null;
    throw error;
  }
};

// 서비스/모델 단에서 공용으로 사용할 쿼리 실행 함수
const execute = async (sql, binds = {}, options = {}) => {
  if (!pool) await connectDB();
  let connection;
  try {
    connection = await pool.getConnection();
    // autoCommit: true 옵션으로 insert/update 시 별도로 commit을 안 해도 바로 반영되게 설정
    return await connection.execute(sql, binds, { autoCommit: true, ...options });
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  } finally {
    if (connection) {
      try { 
        await connection.close(); // 사용이 끝난 커넥션은 무조건 풀에 반환 (누수 방지)
      } catch (err) { 
        console.error('Error closing connection:', err); 
      }
    }
  }
};

module.exports = { connectDB, execute };