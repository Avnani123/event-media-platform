const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Verification hook to check connection status on boot
pool.on('connect', () => {
    console.log('Database pool connected successfully.');
});

pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
    process.exit(-1);
});

module.exports = pool;