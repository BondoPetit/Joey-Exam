// Import the required modules
const express = require('express');
const sql = require('mssql');
const router = express.Router();
const { getPool } = require('../../database');

// Middleware to check if the user is authenticated as an admin
function isAuthenticated(req, res, next) {
    console.log('Session Info:', req.session); // Debugging for session information
    if (req.session && req.session.isAdmin && req.session.adminId) {
        return next();
    } else {
        res.status(401).json({ error: 'Unauthorized: You must log in as an admin to access this function.' });
    }
}

// Route for getting all quizzes (accessible only to admin)
router.get('/all', isAuthenticated, async (req, res) => {
    try {
        const pool = await getPool();
        const quizzesResult = await pool.request().query('SELECT QuizID, Title FROM Quizzes');
        console.log('Fetched quizzes:', quizzesResult.recordset); // Debugging fetched quizzes
        res.status(200).json(quizzesResult.recordset);
    } catch (err) {
        console.error('Error fetching quizzes:', err.message);
        res.status(500).json({ error: 'An error occurred while fetching quizzes.' });
    }
});

// Route for getting all quizzes with their questions and answers (detailed view)
router.get('/all-details', isAuthenticated, async (req, res) => {
    try {
        const pool = await getPool();
        
        // Fetch quizzes with their related questions and answers
        const quizzesResult = await pool.request().query(`
            SELECT 
                q.QuizID, 
                q.Title, 
                qs.QuestionID, 
                qs.Text AS QuestionText,
                a.AnswerID,
                a.Text AS AnswerText,
                a.IsCorrect
            FROM Quizzes q
            LEFT JOIN Questions qs ON q.QuizID = qs.QuizID
            LEFT JOIN Answers a ON qs.QuestionID = a.QuestionID
            ORDER BY q.QuizID, qs.QuestionID, a.AnswerID
        `);

        // Organize the data into a structured format
        const quizzes = {};
        quizzesResult.recordset.forEach(record => {
            if (!quizzes[record.QuizID]) {
                quizzes[record.QuizID] = {
                    QuizID: record.QuizID,
                    Title: record.Title,
                    Questions: {}
                };
            }

            if (record.QuestionID && !quizzes[record.QuizID].Questions[record.QuestionID]) {
                quizzes[record.QuizID].Questions[record.QuestionID] = {
                    QuestionID: record.QuestionID,
                    Text: record.QuestionText,
                    Answers: []
                };
            }

            if (record.AnswerID) {
                quizzes[record.QuizID].Questions[record.QuestionID].Answers.push({
                    AnswerID: record.AnswerID,
                    Text: record.AnswerText,
                    IsCorrect: record.IsCorrect
                });
            }
        });

        // Convert quizzes object to an array
        const quizzesArray = Object.values(quizzes).map(quiz => {
            quiz.Questions = Object.values(quiz.Questions);
            return quiz;
        });

        res.status(200).json(quizzesArray);
    } catch (err) {
        console.error('Error fetching quizzes with details:', err.message);
        res.status(500).json({ error: 'An error occurred while fetching quizzes with details.' });
    }
});

// Route for deleting a quiz (accessible only to admin)
router.delete('/delete/:quizId', isAuthenticated, async (req, res) => {
    const { quizId } = req.params;
    try {
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        // Delete all answers related to questions of the quiz
        await transaction.request()
            .input('quizId', sql.Int, quizId)
            .query(`
                DELETE FROM Answers 
                WHERE QuestionID IN (SELECT QuestionID FROM Questions WHERE QuizID = @quizId)
            `);

        // Delete all questions related to the quiz
        await transaction.request()
            .input('quizId', sql.Int, quizId)
            .query(`
                DELETE FROM Questions 
                WHERE QuizID = @quizId
            `);

        // Delete the quiz itself
        await transaction.request()
            .input('quizId', sql.Int, quizId)
            .query(`
                DELETE FROM Quizzes 
                WHERE QuizID = @quizId
            `);

        await transaction.commit();
        res.status(200).json({ message: 'Quiz deleted successfully.' });
    } catch (err) {
        console.error('Error deleting quiz:', err.message);
        try {
            await transaction.rollback();
            console.error('Transaction rolled back due to an error.');
        } catch (rollbackError) {
            console.error('Error rolling back transaction:', rollbackError.message);
        }
        res.status(500).json({ error: 'An error occurred while deleting the quiz.' });
    }
});

// Export the router to make the routes accessible from other modules
module.exports = router;
