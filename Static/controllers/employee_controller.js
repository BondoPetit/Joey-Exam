// Import the required modules
const express = require('express');
const sql = require('mssql');
const router = express.Router();
const { getPool } = require('../../../database');

// Route for fetching all quizzes for employees
router.get('/get', async (req, res) => {
    try {
        const pool = await getPool();
        const quizzesResult = await pool.request().query(`
            SELECT * FROM Quizzes
        `);

        const quizzes = quizzesResult.recordset;
        const quizzesWithQuestions = [];

        for (let quiz of quizzes) {
            const questionsResult = await pool.request()
                .input('quizID', sql.Int, quiz.QuizID)
                .query(`
                    SELECT * FROM Questions WHERE QuizID = @quizID
                `);

            const questions = questionsResult.recordset;
            const questionsWithAnswers = [];

            for (let question of questions) {
                const answersResult = await pool.request()
                    .input('questionID', sql.Int, question.QuestionID)
                    .query(`
                        SELECT * FROM Answers WHERE QuestionID = @questionID
                    `);

                const answers = answersResult.recordset;
                questionsWithAnswers.push({
                    ...question,
                    answers: answers.map(answer => ({ text: answer.Text, isCorrect: answer.IsCorrect }))
                });
            }

            quizzesWithQuestions.push({
                ...quiz,
                questions: questionsWithAnswers
            });
        }

        res.status(200).json(quizzesWithQuestions);
    } catch (err) {
        console.error('Error fetching quizzes:', err.message);
        res.status(500).json({ error: 'An error occurred while fetching quizzes.' });
    }
});

// Route for saving employee quiz answers
router.post('/submit', async (req, res) => {
    const { title, employeeId, questions } = req.body;

    if (!title || !employeeId || !questions || !Array.isArray(questions)) {
        return res.status(400).json({ error: 'Invalid submission data. Title, employee ID, and questions are required.' });
    }

    try {
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        // Insert quiz result into EmployeeResults table
        const resultRequest = new sql.Request(transaction);
        const result = await resultRequest
            .input('title', sql.NVarChar, title)
            .input('employeeId', sql.NVarChar, employeeId)
            .query(`
                INSERT INTO EmployeeResults (Title, EmployeeID)
                OUTPUT inserted.ResultID
                VALUES (@title, @employeeId)
            `);

        const resultID = result.recordset[0].ResultID;

        // Insert each question response into EmployeeAnswers table
        for (let question of questions) {
            const answerRequest = new sql.Request(transaction);
            await answerRequest
                .input('resultID', sql.Int, resultID)
                .input('questionText', sql.NVarChar, question.text)
                .input('employeeAnswer', sql.NVarChar, question.employeeAnswer)
                .input('correctAnswer', sql.NVarChar, question.correctAnswer)
                .query(`
                    INSERT INTO EmployeeAnswers (ResultID, QuestionText, EmployeeAnswer, CorrectAnswer)
                    VALUES (@resultID, @questionText, @employeeAnswer, @correctAnswer)
                `);
        }

        await transaction.commit();
        res.status(201).json({ message: 'Quiz answers saved successfully.' });
    } catch (err) {
        console.error('Error saving quiz answers:', err.message);
        try {
            await transaction.rollback();
            console.error('Transaction rolled back due to an error.');
        } catch (rollbackError) {
            console.error('Error rolling back transaction:', rollbackError.message);
        }
        res.status(500).json({ error: 'An error occurred while saving quiz answers.' });
    }
});

// Export the router to make the routes accessible from other modules
module.exports = router;
