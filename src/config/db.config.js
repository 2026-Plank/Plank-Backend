const oracledb = require('oracledb');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let pool;

const connectDB = async () => {
  if (pool) return pool;

  try {
    console.log('데이터베이스 연결 시도 중... (Wallet Buffer Mode)');
    
    const poolOptions = {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING,
      poolMin: 2,
      poolMax: 10,
      queueTimeout: 10000,
    };

    if (process.env.WALLET_DATA) {
      console.log('[INFO] Render 환경 변수에서 WALLET_DATA 감지. mTLS 통신을 활성화합니다.');
      poolOptions.walletPassword = process.env.WALLET_PASSWORD;
      poolOptions.walletBuffer = Buffer.from(process.env.WALLET_DATA, 'base64');
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