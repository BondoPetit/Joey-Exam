// Import the required modules
const express = require('express');
const sql = require('mssql');
const router = express.Router();
const { getPool } = require('../../database');

// Route for saving a new quiz
router.post('/save', async (req, res) => {
    const { title, questions } = req.body;

    if (!title || !questions || !Array.isArray(questions)) {
        return res.status(400).json({ error: 'Invalid quiz data. Title and questions are required.' });
    }

    try {
        const pool = await getPool();
        const transaction = new sql.Transaction(pool); // Initialize transaction
        await transaction.begin();

        // Insert quiz into the Quizzes table
        const quizRequest = new sql.Request(transaction);
        const quizResult = await quizRequest
            .input('title', sql.NVarChar, title)
            .query(`
                INSERT INTO Quizzes (Title)
                OUTPUT inserted.QuizID
                VALUES (@title)
            `);

        const quizID = quizResult.recordset[0].QuizID;

        // Insert questions into the Questions table
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];

            const questionRequest = new sql.Request(transaction);
            const questionResult = await questionRequest
                .input('quizID', sql.Int, quizID)
                .input('text', sql.NVarChar, question.text)
                .query(`
                    INSERT INTO Questions (QuizID, Text)
                    OUTPUT inserted.QuestionID
                    VALUES (@quizID, @text)
                `);

            const questionID = questionResult.recordset[0].QuestionID;

            // Insert answers into the Answers table
            for (let j = 0; j < question.answers.length; j++) {
                const answerText = question.answers[j];
                const isCorrect = parseInt(question.correctAnswer, 10) === (j + 1);

                const answerRequest = new sql.Request(transaction);
                await answerRequest
                    .input('questionID', sql.Int, questionID)
                    .input('text', sql.NVarChar, answerText)
                    .input('isCorrect', sql.Bit, isCorrect)
                    .query(`
                        INSERT INTO Answers (QuestionID, Text, IsCorrect)
                        VALUES (@questionID, @text, @isCorrect)
                    `);
            }
        }

        await transaction.commit();
        res.status(201).json({ message: 'Quiz saved successfully.' });
    } catch (err) {
        console.error('Error saving quiz:', err.message);
        try {
            await transaction.rollback();
            console.error('Transaction rolled back due to an error.');
        } catch (rollbackError) {
            console.error('Error rolling back transaction:', rollbackError.message);
        }
        res.status(500).json({ error: 'An error occurred while saving the quiz.' });
    }
});

// Export the router to make the routes accessible from other modules
module.exports = router;
