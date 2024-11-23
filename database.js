require('dotenv').config({ path: 'DB.env' }); // Sørg for at denne står øverst!
const sql = require('mssql');

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true' // Husk at sammenligne som streng
    }
};

let pool;

async function getPool() {
    if (!pool) {
        pool = await sql.connect(config);
    }
    return pool;
}

console.log('DB_SERVER:', process.env.DB_SERVER); // Debugging: Se hvad der sker

module.exports = {
    getPool,
};