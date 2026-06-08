const oracledb = require('oracledb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

let pool;

const connectDB = async () => {
  if (pool) {
    return pool;
  }

  try {
    pool = await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING,
      poolMin: 1,
      poolMax: 5,
      poolIncrement: 1
    });

    console.log('Oracle Pool Created');

    return pool;
  } catch (error) {
    console.error('Oracle DB connection error:', error);
    throw error;
  }
};

const execute = async (sql, binds = {}, options = {}) => {
  if (!pool) {
    throw new Error('Oracle pool is not initialized. Call connectDB first.');
  }

  const connection = await pool.getConnection();
  try {
    const result = await connection.execute(sql, binds, {
      autoCommit: true,
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      ...options
    });
    return result;
  } finally {
    try {
      await connection.close();
    } catch (err) {
      console.error('Error closing Oracle connection:', err);
    }
  }
};

module.exports = { connectDB, execute };