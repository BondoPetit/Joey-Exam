const express = require('express');
const sql = require('mssql');
const router = express.Router();
const { getPool } = require('../../database');

// Tjekker hvis brugeren er authentificeret
function isAuthenticated(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    } else {
        res.status(401).json({ error: 'Unauthorized: You must log in as an admin to access this function.' });
    }
}

// Route til at fetche quizresultater og statistikker
router.get('/', isAuthenticated, async (req, res) => {  // Middleware applied here
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

        // Grupperer resultater efter quizzer
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

            // Pusher spørgsmål detaljer
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

        // Sætter resultaterne i en array for hvert quiz
        const results = Object.values(formattedResults).map(quiz => {
            return {
                title: quiz.title,
                employeeSummaries: quiz.results.map(result => {
                    return {
                        employeeId: result.employeeId,
                        incorrectCount: result.incorrectCount
                    };
                })
            };
        });

        res.status(200).json(results);
    } catch (err) {
        console.error('Error fetching quiz results:', err.message);
        res.status(500).json({ error: 'An error occurred while fetching quiz results.' });
    }
});

// Henter specifikke resultater for et bestemt quiz og medarbejder
router.get('/:quizTitle/:employeeId', isAuthenticated, async (req, res) => {  
    const { quizTitle, employeeId } = req.params;
    try {
        const pool = await getPool();
        const resultsQuery = await pool.request()
            .input('quizTitle', sql.NVarChar, quizTitle)
            .input('employeeId', sql.NVarChar, employeeId)
            .query(`
                SELECT r.Title, r.EmployeeID, ea.QuestionText, ea.EmployeeAnswer, ea.CorrectAnswer
                FROM EmployeeResults r
                LEFT JOIN EmployeeAnswers ea ON r.ResultID = ea.ResultID
                WHERE r.Title = @quizTitle AND r.EmployeeID = @employeeId
                ORDER BY ea.QuestionText
            `);

        const rawResults = resultsQuery.recordset;
        if (rawResults.length === 0) {
            return res.status(404).json({ error: 'No results found for the specified quiz and employee.' });
        }

        const detailedResults = {
            title: rawResults[0].Title,
            employeeId: rawResults[0].EmployeeID,
            questions: rawResults.map(row => ({
                text: row.QuestionText,
                employeeAnswer: row.EmployeeAnswer,
                correctAnswer: row.CorrectAnswer,
                isCorrect: row.EmployeeAnswer === row.CorrectAnswer
            }))
        };

        res.status(200).json(detailedResults);
    } catch (err) {
        console.error('Error fetching detailed quiz results:', err.message);
        res.status(500).json({ error: 'An error occurred while fetching detailed quiz results.' });
    }
});

module.exports = router;
