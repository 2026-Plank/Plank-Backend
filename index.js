const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./src/app');
const { startServer } = require('./src/server');

startServer(app);
