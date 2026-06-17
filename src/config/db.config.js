const oracledb = require('oracledb');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

try {
  oracledb.initOracleClient({ thin: true });
} catch (err) {
  // 이미 초기화된 경우 에러가 날 수 있으므로 무시합니다.
}

let pool;

const connectDB = async () => {
  if (pool) return pool;

  try {
    console.log('데이터베이스 연결 시도 중... (Pure Thin Mode with Wallet)');
    
    // 프로젝트 루트에 있는 wallet 폴더의 절대 경로를 계산합니다.
    const walletPath = path.join(__dirname, '../../wallet');
    console.log(`[INFO] 설정된 지갑 경로: ${walletPath}`);

    const poolOptions = {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      // 💡 Thin 모드에서는 connectString 뒤에 지갑 경로(?config_dir=...)를 붙여서 찔러넣어야 합니다.
      connectString: `${process.env.DB_CONNECT_STRING}?config_dir=${walletPath}`,
      walletPassword: process.env.WALLET_PASSWORD,
      poolMin: 2,
      poolMax: 10,
      queueTimeout: 15000,
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