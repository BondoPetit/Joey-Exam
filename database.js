// Import the mssql module to interact with Microsoft SQL Server
const sql = require('mssql');
require('dotenv').config(); // Load environment variables

// Database configuration containing server address, database name, user credentials, and encryption options
const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: true // Enable encryption for secure communication
    }
};

let pool; // Declare a variable to store the connection pool

// Function to get the connection pool asynchronously
async function getPool() {
    try {
        // If connection pool doesn't exist, create a new one and return it
        if (!pool) {
            pool = await sql.connect(config);
            console.log('Database connection established successfully.');
        }
    } catch (err) {
        console.error('Error connecting to the database:', err.message);
        throw err; // Re-throw error for further handling
    }
    return pool;
}

// Function to close the connection pool
async function closePool() {
    try {
        if (pool) {
            await pool.close();
            console.log('Database connection closed.');
            pool = null;
        }
    } catch (err) {
        console.error('Error closing the database connection:', err.message);
    }
}

// Export the getPool and closePool functions to make them accessible from other modules
module.exports = {
    getPool,
    closePool,
};
