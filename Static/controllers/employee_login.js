// Import the required modules
require('dotenv').config(); // This should be at the top to load .env file
const express = require('express');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const router = express.Router();
const { getPool } = require('../../database');
const twilio = require('twilio');

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID; // Primary Account SID
const apiKeySid = process.env.TWILIO_API_KEY_SID; // API Key SID
const apiKeySecret = process.env.TWILIO_API_KEY_SECRET; // API Key Secret

// Initialize Twilio client with API Key
const client = twilio(apiKeySid, apiKeySecret, { accountSid });

// Route for sending SMS verification code
router.post('/send-verification-code', async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required.' });
    }
    try {
        const verificationCode = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit code
        await client.messages.create({
            body: `Your verification code is: ${verificationCode}`,
            from: process.env.TWILIO_PHONE_NUMBER, // Twilio phone number
            to: phoneNumber
        });

        req.session.verificationCode = verificationCode;
        req.session.save((err) => {
            if (err) {
                console.error('Error saving verification code to session:', err);
                return res.status(500).json({ error: 'An error occurred while saving verification code to session.' });
            }
            res.status(200).json({ message: 'Verification code sent successfully.' });
        });
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
            delete req.session.verificationCode; // Clear verification code after successful verification
            req.session.save((err) => {
                if (err) {
                    console.error('Error clearing verification code from session:', err);
                    return res.status(500).json({ error: 'An error occurred while clearing verification code from session.' });
                }
                res.status(200).json({ message: 'Phone number verified successfully.' });
            });
        } else {
            res.status(400).json({ error: 'Invalid verification code.' });
        }
    } catch (err) {
        console.error('Error verifying phone number:', err.message);
        res.status(500).json({ error: 'An error occurred while verifying phone number.' });
    }
});

// Route for employee registration
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
            throw new Error('Failed to register employee.');
        }

        const employeeId = registrationResult.recordset[0].EmployeeID;
        req.session.employeeId = employeeId;
        req.session.isEmployee = true;
        req.session.employeeEmail = email;

        req.session.save((err) => {
            if (err) {
                console.error('Error saving session:', err);
                return res.status(500).json({ error: 'An error occurred while saving session.' });
            }
            res.status(200).json({ message: 'Registration successful.', redirectUrl: '/static/views/employee.html' });
        });
    } catch (err) {
        console.error('Error registering employee:', err.message);
        res.status(500).json({ error: 'An error occurred while registering user.' });
    }
});

// Route for employee login
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
            return res.status(401).json({ error: 'Invalid employee credentials.' });
        }

        const { EmployeeID, EmployeePassword: hashedPassword } = result.recordset[0];
        const isPasswordValid = await bcrypt.compare(password, hashedPassword);

        if (isPasswordValid) {
            req.session.isEmployee = true;
            req.session.employeeId = EmployeeID;
            req.session.employeeEmail = email;

            req.session.save((err) => {
                if (err) {
                    console.error('Error saving session:', err);
                    return res.status(500).json({ error: 'An error occurred while saving session.' });
                }
                res.status(200).json({
                    message: 'Login successful',
                    employeeId: EmployeeID,
                    redirectUrl: '/static/views/employee.html'
                });
            });
        } else {
            res.status(401).json({ error: 'Invalid employee credentials.' });
        }
    } catch (err) {
        console.error('Error logging in employee:', err.message);
        res.status(500).json({ error: 'An error occurred while logging in.' });
    }
});

module.exports = router;
