const oracledb = require('oracledb');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let pool;

const connectDB = async () => {
  if (pool) return pool;

  try {
    console.log('데이터베이스 연결 시도 중... (Easy Connect Mode)');
    
    pool = await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING,
      walletPassword: process.env.WALLET_PASSWORD,
      
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 2,
      queueTimeout: 10000, // 10초 대기
      poolTimeout: 60,
      poolPingInterval: 30,

      // Render 서버와 Oracle 클라우드 간의 보안 접속(TLS) 병목을 해결하는 핵심 옵션
      expireTime: 1,
      sendTimeout: 10000,
      recvTimeout: 10000
    });

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