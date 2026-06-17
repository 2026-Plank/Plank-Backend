const oracledb = require('oracledb');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let pool;

const connectDB = async () => {
  if (pool) {
    return pool;
  }

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
      queueTimeout: 5000,
      poolTimeout: 30,
      poolPingInterval: 30
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
  if (!pool) {
    await connectDB();
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const result = await connection.execute(sql, binds, {
      autoCommit: true,
      ...options
    });
    return result;
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing Oracle connection:', err);
      }
    }
  }
};

module.exports = { connectDB, execute };