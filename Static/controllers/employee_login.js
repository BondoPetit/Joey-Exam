// Import the required modules
require('dotenv').config(); // Dette skal være øverst for at læse .env filen
const express = require('express');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const router = express.Router();
const { getPool } = require('../../database');
const twilio = require('twilio');

// Twilio credentials (these should be stored securely, e.g., in environment variables)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Route for sending SMS verification code
router.post('/send-verification-code', async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required.' });
    }
    try {
        // Send SMS verification code using Twilio
        const verificationCode = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit code
        await client.messages.create({
            body: `Your verification code is: ${verificationCode}`,
            from: process.env.TWILIO_PHONE_NUMBER, // Twilio phone number
            to: phoneNumber
        });

        // Store verification code in the session (or database for a more persistent solution)
        req.session.verificationCode = verificationCode;

        res.status(200).json({ message: 'Verification code sent successfully.' });
    } catch (err) {
        console.error('Error sending verification code:', err.message);
        res.status(500).json({ error: 'An error occurred while sending verification code.' });
    }
});

// Route for handling phone number verification
router.post('/verify-code', async (req, res) => {
    const { phoneNumber, verificationCode } = req.body;
    if (!phoneNumber || !verificationCode) {
        return res.status(400).json({ error: 'Phone number and verification code are required.' });
    }
    try {
        if (req.session.verificationCode && req.session.verificationCode === parseInt(verificationCode, 10)) {
            // Verification successful, clear the verification code from the session
            delete req.session.verificationCode;
            res.status(200).json({ message: 'Phone number verified successfully.' });
        } else {
            res.status(400).json({ error: 'Invalid verification code.' });
        }
    } catch (err) {
        console.error('Error verifying phone number:', err.message);
        res.status(500).json({ error: 'An error occurred while verifying phone number.' });
    }
});

// Route for handling employee registration
router.post('/register', async (req, res) => {
    const { email, password, phoneNumber } = req.body;
    if (!email || !password || !phoneNumber) {
        return res.status(400).json({ error: 'Email, password, and phone number are required.' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const pool = await getPool();
        const registrationResult = await pool.request()
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, hashedPassword)
            .input('phoneNumber', sql.NVarChar, phoneNumber)
            .query(`
                INSERT INTO Employees (EmployeeEmail, EmployeePassword, EmployeePhoneNumber)
                OUTPUT inserted.EmployeeID
                VALUES (@email, @password, @phoneNumber)
            `);
        
        if (registrationResult.recordset.length === 0) {
            console.error('Registration failed: No record inserted.');
            throw new Error('Failed to register employee.');
        }

        const employeeId = registrationResult.recordset[0].EmployeeID;
        
        req.session.employeeId = employeeId;

        res.status(200).json({ message: 'Registration successful.', redirectUrl: '/static/views/employee.html' });
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
            // Update session to store that the user is an employee
            req.session.isEmployee = true;
            req.session.employeeId = EmployeeID;
            req.session.employeeEmail = email;

            res.status(200).json({
                message: 'Login successful',
                employeeId: EmployeeID, // Return employee ID to be stored on frontend
                redirectUrl: '/static/views/employee.html' // Updated redirect URL
            });
        } else {
            console.error('Login failed: Invalid password for email:', email);
            res.status(401).json({ error: 'Invalid employee credentials.' });
        }
    } catch (err) {
        console.error('Error logging in employee:', err.message);
        res.status(500).json({ error: 'An error occurred while logging in.' });
    }
});

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
