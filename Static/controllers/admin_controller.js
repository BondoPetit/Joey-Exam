const express = require('express');
const sql = require('mssql');
const router = express.Router();
const { getPool } = require('../../database');

// Tjekker hvis brugeren er admin
function isAuthenticated(req, res, next) {
    console.log('Session Info:', req.session); // Debugging
    if (req.session && req.session.isAdmin && req.session.adminId) {
        return next();
    } else {
        res.status(401).json({ error: 'Unauthorized: You must log in as an admin to access this function.' });
    }
}

// Admin adgang til quizzerne
router.get('/quizzes', isAuthenticated, async (req, res) => {
    try {
        const pool = await getPool();
        const quizzesResult = await pool.request().query('SELECT * FROM Quizzes');
        res.status(200).json(quizzesResult.recordset);
    } catch (err) {
        console.error('Error fetching quizzes:', err.message);
        res.status(500).json({ error: 'An error occurred while fetching quizzes.' });
    }
});

// Funktion til at slette en quiz
router.delete('/quizzes/:quizId', isAuthenticated, async (req, res) => {
    const { quizId } = req.params;
    try {
        const pool = await getPool();
        await pool.request().input('quizId', sql.Int, quizId).query('DELETE FROM Quizzes WHERE QuizID = @quizId');
        res.status(200).json({ message: 'Quiz deleted successfully.' });
    } catch (err) {
        console.error('Error deleting quiz:', err.message);
        res.status(500).json({ error: 'An error occurred while deleting the quiz.' });
    }
});

// Funktion for at ændre en quiz
router.put('/quizzes/:quizId', isAuthenticated, async (req, res) => {
    const { quizId } = req.params;
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Invalid quiz data. Title is required.' });
    }

    try {
        const pool = await getPool();
        await pool.request().input('quizId', sql.Int, quizId).input('title', sql.NVarChar, title).query('UPDATE Quizzes SET Title = @title WHERE QuizID = @quizId');
        res.status(200).json({ message: 'Quiz updated successfully.' });
    } catch (err) {
        console.error('Error updating quiz:', err.message);
        res.status(500).json({ error: 'An error occurred while updating the quiz.' });
    }
});

// Tjekker hvem er logget ind
router.get('/whoami', isAuthenticated, async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('adminId', sql.Int, req.session.adminId)
            .query('SELECT Username FROM Admins WHERE AdminID = @adminId');

        if (result.recordset.length > 0) {
            const username = result.recordset[0].Username;
            res.status(200).json({ loggedIn: true, userType: 'admin', username: username });
        } else {
            res.status(404).json({ loggedIn: false, error: 'Admin not found' });
        }
    } catch (err) {
        console.error('Error fetching admin username:', err.message);
        res.status(500).json({ error: 'An error occurred while fetching the admin username.' });
    }
});

// Logout funktion
router.post('/logout', isAuthenticated, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out. Please try again.' });
        }
        res.status(200).json({ message: 'Logout successful' });
    });
});

module.exports = router;
