require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// TEST CONNECTION
pool.connect()
    .then(() => console.log("DATABASE CONNECTED"))
    .catch(err => console.error("DB ERROR:", err));

module.exports = pool;