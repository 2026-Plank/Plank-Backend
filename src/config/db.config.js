const oracledb = require('oracledb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

let pool;

const connectDB = async () => {
  if (pool) return pool;
  try {
    // 💡 오라클 클라우드 규격에 맞춘 최적화된 풀 생성
    pool = await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING,
      poolMin: 1,           // 최소 세션 유지
      poolMax: 10,          // 프리티어 한계를 고려한 최대 세션
      poolIncrement: 1,
      poolTimeout: 30,      // 유휴 커넥션 반환 시간
      queueTimeout: 10000,  // 대기 큐 타임아웃 10초
      poolPingInterval: 60,
    });
    console.log('Oracle DB Connection Pool Created Successfully.');
    return pool;
  } catch (error) {
    console.error('Oracle DB Pool creation error:', error);
    pool = null;
    throw error;
  }
};

const execute = async (sql, binds = {}, options = {}) => {
  if (!pool) {
    await connectDB();
  }

  let connection;
  try {
    connection = await pool.getConnection();
    
    const result = await connection.execute(sql, binds, {
      autoCommit: true, // 💡 다른 기능들도 자동으로 데이터가 바로 반영되도록 설정
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      ...options
    });
    
    return result;
  } catch (error) {
    console.error('[DB-EXEC-ERROR]:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        // 💡 쿼리 실행 후 즉시 커넥션을 풀로 반환하여 누수 방지
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
};

module.exports = { connectDB, execute };