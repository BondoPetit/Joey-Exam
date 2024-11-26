// New result controller file: result_controller.js

const express = require('express');
const sql = require('mssql');
const router = express.Router();
const { getPool } = require('../../database');

// Route for fetching all quiz results and statistics
router.get('/results', async (req, res) => {
    try {
        const pool = await getPool();
        const resultsQuery = await pool.request().query(`
            SELECT r.ResultID, r.Title, r.EmployeeID, q.Text AS QuestionText, ea.EmployeeAnswer, ea.CorrectAnswer
            FROM EmployeeResults r
            LEFT JOIN EmployeeAnswers ea ON r.ResultID = ea.ResultID
            LEFT JOIN Questions q ON ea.QuestionID = q.QuestionID
            ORDER BY r.ResultID, q.QuestionID
        `);

        const rawResults = resultsQuery.recordset;
        const formattedResults = {};

        // Group results by EmployeeID and Quiz Title
        rawResults.forEach(row => {
            if (!formattedResults[row.EmployeeID]) {
                formattedResults[row.EmployeeID] = {};
            }
            if (!formattedResults[row.EmployeeID][row.Title]) {
                formattedResults[row.EmployeeID][row.Title] = {
                    title: row.Title,
                    employeeId: row.EmployeeID,
                    questions: [],
                    incorrectCount: 0,
                };
            }
            const isCorrect = row.EmployeeAnswer === row.CorrectAnswer;
            formattedResults[row.EmployeeID][row.Title].questions.push({
                text: row.QuestionText,
                employeeAnswer: row.EmployeeAnswer,
                correctAnswer: row.CorrectAnswer,
                isCorrect
            });
            if (!isCorrect) {
                formattedResults[row.EmployeeID][row.Title].incorrectCount++;
            }
        });

        // Flatten results into an array
        const results = Object.values(formattedResults).flatMap(quizGroup => Object.values(quizGroup));

        res.status(200).json(results);
    } catch (err) {
        console.error('Error fetching quiz results:', err.message);
        res.status(500).json({ error: 'An error occurred while fetching quiz results.' });
    }
});

module.exports = router;
