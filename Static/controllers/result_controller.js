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
            SELECT r.ResultID, r.Title, r.EmployeeID, ea.QuestionText, ea.EmployeeAnswer, ea.CorrectAnswer
            FROM EmployeeResults r
            LEFT JOIN EmployeeAnswers ea ON r.ResultID = ea.ResultID
            ORDER BY r.Title, r.ResultID
        `);

        const rawResults = resultsQuery.recordset;
        const formattedResults = {};

        // Group results by Quiz Title
        rawResults.forEach(row => {
            if (!formattedResults[row.Title]) {
                formattedResults[row.Title] = {
                    title: row.Title,
                    results: [],
                };
            }

            let currentQuiz = formattedResults[row.Title];
            let existingResult = currentQuiz.results.find(result => result.employeeId === row.EmployeeID);

            if (!existingResult) {
                existingResult = {
                    employeeId: row.EmployeeID,
                    questions: [],
                    incorrectCount: 0,
                };
                currentQuiz.results.push(existingResult);
            }

            const isCorrect = row.EmployeeAnswer === row.CorrectAnswer;
            existingResult.questions.push({
                text: row.QuestionText,
                employeeAnswer: row.EmployeeAnswer,
                correctAnswer: row.CorrectAnswer,
                isCorrect
            });
            if (!isCorrect) {
                existingResult.incorrectCount++;
            }
        });

        // Flatten results into an array for each quiz
        const results = Object.values(formattedResults);

        res.status(200).json(results);
    } catch (err) {
        console.error('Error fetching quiz results:', err.message);
        res.status(500).json({ error: 'An error occurred while fetching quiz results.' });
    }
});

module.exports = router;
