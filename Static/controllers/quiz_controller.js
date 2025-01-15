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

// Route til at gemme quizzen
router.post('/save', isAuthenticated, async (req, res) => {
    const { title, questions } = req.body;

    if (!title || !questions || !Array.isArray(questions)) {
        return res.status(400).json({ error: 'Invalid quiz data. Title and questions are required.' });
    }

    try {
        const pool = await getPool();
        const transaction = new sql.Transaction(pool); 
        await transaction.begin();

        // Sætter quizzen ind i quiz tabellen
        const quizRequest = new sql.Request(transaction);
        const quizResult = await quizRequest
            .input('title', sql.NVarChar, title)
            .query(`
                INSERT INTO Quizzes (Title)
                OUTPUT inserted.QuizID
                VALUES (@title)
            `);

        const quizID = quizResult.recordset[0].QuizID;

        // Sætter spørgsmålene ind i Questions tabellen
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

            // Sætter svarene i svartabellen
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

module.exports = router;
