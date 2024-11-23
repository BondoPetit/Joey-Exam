// Import the required modules
const express = require('express');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const router = express.Router();
const { getPool } = require('../../database');

// Route for handling admin login
router.post('/login', async (req, res) => {
    console.log('Received POST request to /admin_login/login'); // Log to verify request receipt
    const { username, password } = req.body;
    if (!username || !password) {
        console.log('Missing username or password'); // Log to clarify missing fields
        return res.status(400).json({ error: 'Username and password are required.' });
    }
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query(`
                SELECT AdminID, PasswordHash
                FROM Admins
                WHERE Username = @username
            `);
        
        if (result.recordset.length === 0) {
            console.error('Login failed: No matching admin found for username:', username);
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        
        const { AdminID, PasswordHash: hashedPassword } = result.recordset[0];
        const isPasswordValid = await bcrypt.compare(password, hashedPassword);
        
        if (isPasswordValid) {
            console.log('Login successful for user:', username); // Log successful login
            res.status(200).json({ 
                message: 'Login successful',
                adminID: AdminID, // Send AdminID back to the client if needed
                redirectUrl: '/views/admin.html' // Updated redirect URL
            });
        } else {
            console.error('Login failed: Invalid password for username:', username);
            res.status(401).json({ error: 'Invalid credentials.' });
        }
    } catch (err) {
        console.error('Error logging in admin:', err.message);
        res.status(500).json({ error: 'An error occurred while logging in.' });
    }
});

// Export the router to make the routes accessible from other modules
module.exports = router;
