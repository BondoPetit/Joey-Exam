const express = require('express');
const sql = require('mssql');
const router = express.Router();
const { getPool } = require('../../database');

// Tjekker hvis brugeren er en admin
function isAuthenticated(req, res, next) {
    console.log('Session Info:', req.session); // Debugging til session data
    if (req.session && req.session.isAdmin && req.session.adminId) {
        return next();
    } else {
        res.status(401).json({ error: 'Unauthorized: You must log in as an admin to access this function.' });
    }
}

// Admin route til authentificering
router.get('/all', isAuthenticated, async (req, res) => {
    try {
        const pool = await getPool();
        const quizzesResult = await pool.request().query('SELECT QuizID, Title FROM Quizzes');
        console.log('Fetched quizzes:', quizzesResult.recordset); // Debugging quizzerne
        res.status(200).json(quizzesResult.recordset);
    } catch (err) {
        console.error('Error fetching quizzes:', err.message);
        res.status(500).json({ error: 'An error occurred while fetching quizzes.' });
    }
});

// Route for at hente quizzerne og svarene
router.get('/all-details', isAuthenticated, async (req, res) => {
    try {
        const pool = await getPool();
        
        // Hente quizzerne og svarene
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

        // Strukturerer dataen
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

        // Konverterer quizzerne til en array
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

// Admin funktion til at slette quizzer
router.delete('/delete/:quizId', isAuthenticated, async (req, res) => {
    const { quizId } = req.params;
    try {
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        // Sletter medarbejdernes svare
        await transaction.request()
            .input('quizId', sql.Int, quizId)
            .query(`
                DELETE FROM EmployeeAnswers 
                WHERE ResultID IN (
                    SELECT ResultID FROM EmployeeResults WHERE QuizID = @quizId
                )
            `);

        // Sletter medarbejdernes resultater til quizzen
        await transaction.request()
            .input('quizId', sql.Int, quizId)
            .query(`
                DELETE FROM EmployeeResults 
                WHERE QuizID = @quizId
            `);

        // Sletter alle svar relateret til quizzen
        await transaction.request()
            .input('quizId', sql.Int, quizId)
            .query(`
                DELETE FROM Answers 
                WHERE QuestionID IN (
                    SELECT QuestionID FROM Questions WHERE QuizID = @quizId
                )
            `);

        // Sletter alle spørgsmål til quizzen
        await transaction.request()
            .input('quizId', sql.Int, quizId)
            .query(`
                DELETE FROM Questions 
                WHERE QuizID = @quizId
            `);

        // Sletter quizzen
        await transaction.request()
            .input('quizId', sql.Int, quizId)
            .query(`
                DELETE FROM Quizzes 
                WHERE QuizID = @quizId
            `);

        await transaction.commit();
        res.status(200).json({ message: 'Quiz and related data deleted successfully.' });
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


module.exports = router;
