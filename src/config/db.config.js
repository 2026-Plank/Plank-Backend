const oracledb = require('oracledb');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// 순수 Thin 모드로 작동하도록 명시
try {
  oracledb.initOracleClient({ thin: true });
} catch (err) {
  // 중복 초기화 방지
}

let pool;

const connectDB = async () => {
  if (pool) return pool;

  try {
    console.log('데이터베이스 연결 시도 중... (Thin Mode with Wallet Buffer)');
    
    const poolOptions = {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING, // tnsnames.ora에서 가져온 full description
      poolMin: 2,
      poolMax: 10,
      queueTimeout: 10000, // 연결 대기 시간을 20초로 여유롭게 설정
    };

    if (process.env.WALLET_DATA) {
      console.log('[INFO] WALLET_DATA 감지. 메모리 버퍼를 통해 mTLS 보안 인증을 수행합니다.');
      poolOptions.walletPassword = process.env.WALLET_PASSWORD;
      poolOptions.walletBuffer = Buffer.from(process.env.WALLET_DATA, 'base64');
    } else {
      console.warn('[WARN] WALLET_DATA 환경 변수가 존재하지 않습니다!');
    }

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