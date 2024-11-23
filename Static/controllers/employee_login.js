// Import the required modules
const express = require('express');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const router = express.Router();
const { getPool } = require('../../database');

// Route for handling employee registration
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const pool = await getPool();
        const registrationResult = await pool.request()
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, hashedPassword)
            .query(`
                INSERT INTO Employees (EmployeeEmail, EmployeePassword)
                OUTPUT inserted.EmployeeID
                VALUES (@email, @password)
            `);
        
        if (registrationResult.recordset.length === 0) {
            console.error('Registration failed: No record inserted.');
            throw new Error('Failed to register employee.');
        }

        res.status(200).json({ redirectUrl: '/static/views/employee.html' });
    } catch (err) {
        console.error('Error registering employee:', err.message);
        res.status(500).json({ error: 'An error occurred while registering user.' });
    }
});

// Route for handling employee login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query(`
                SELECT EmployeeID, EmployeePassword
                FROM Employees
                WHERE EmployeeEmail = @email
            `);
        
        if (result.recordset.length === 0) {
            console.error('Login failed: No matching user found for email:', email);
            return res.status(401).json({ error: 'Invalid employee credentials.' });
        }
        
        const { EmployeeID, EmployeePassword: hashedPassword } = result.recordset[0];
        const isPasswordValid = await bcrypt.compare(password, hashedPassword);
        
        if (isPasswordValid) {
            res.status(200).json({ redirectUrl: '/static/views/employee.html' }); // Updated redirect URL
        } else {
            console.error('Login failed: Invalid password for email:', email);
            res.status(401).json({ error: 'Invalid employee credentials.' });
        }
    } catch (err) {
        console.error('Error logging in employee:', err.message);
        res.status(500).json({ error: 'An error occurred while logging in.' });
    }
});

// Export the router to make the routes accessible from other modules
// Route for testing database connection
router.get('/test-db-connection', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT 1 AS isConnected');
        
        if (result.recordset.length > 0) {
            res.status(200).json({ message: 'Database connection successful!' });
        } else {
            res.status(500).json({ error: 'Database connection failed.' });
        }
    } catch (err) {
        console.error('Error connecting to the database:', err.message);
        res.status(500).json({ error: 'An error occurred while connecting to the database.' });
    }
});

module.exports = router;
