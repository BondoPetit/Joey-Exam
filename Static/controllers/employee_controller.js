// Import the required modules
const express = require('express');
const sql = require('mssql');
const router = express.Router();
const { getPool } = require('../../database');

// Route for fetching all quizzes for employees
router.get('/get', async (req, res) => {
    console.log('GET /employee/get endpoint hit');
    console.log('Fetching quizzes...');
    try {
        const pool = await getPool();
        const quizzesResult = await pool.request().query(`
            SELECT q.QuizID, q.Title, 
                   qs.QuestionID, qs.Text AS QuestionText, 
                   a.AnswerID, a.Text AS AnswerText, a.IsCorrect
            FROM Quizzes q
            LEFT JOIN Questions qs ON q.QuizID = qs.QuizID
            LEFT JOIN Answers a ON qs.QuestionID = a.QuestionID
        `);

        const records = quizzesResult.recordset;
        const quizzesMap = {};

        records.forEach(record => {
            if (!quizzesMap[record.QuizID]) {
                quizzesMap[record.QuizID] = {
                    quizID: record.QuizID,
                    title: record.Title,
                    questions: []
                };
            }
            let quiz = quizzesMap[record.QuizID];
            let question = quiz.questions.find(q => q.questionID === record.QuestionID);
            if (!question && record.QuestionID) {
                question = {
                    questionID: record.QuestionID,
                    text: record.QuestionText,
                    answers: []
                };
                quiz.questions.push(question);
            }
            if (question && record.AnswerID) {
                question.answers.push({
                    answerID: record.AnswerID,
                    text: record.AnswerText,
                    isCorrect: record.IsCorrect
                });
            }
        });

        const quizzesWithQuestions = Object.values(quizzesMap);
        res.status(200).json(quizzesWithQuestions);
    } catch (err) {
        console.error('Error fetching quizzes:', err.message);
        res.status(500).json({ error: 'An error occurred while fetching quizzes.' });
    }
});

// Route for fetching a specific quiz by ID
router.get('/get/:id', async (req, res) => {
    const quizID = req.params.id;
    console.log(`GET /employee/get/${quizID} endpoint hit`);
    console.log('Fetching quiz details...');
    try {
        const pool = await getPool();
        const quizResult = await pool.request()
            .input('quizID', sql.Int, quizID)
            .query(`
                SELECT q.QuizID, q.Title, 
                       qs.QuestionID, qs.Text AS QuestionText, 
                       a.AnswerID, a.Text AS AnswerText, a.IsCorrect
                FROM Quizzes q
                LEFT JOIN Questions qs ON q.QuizID = qs.QuizID
                LEFT JOIN Answers a ON qs.QuestionID = a.QuestionID
                WHERE q.QuizID = @quizID
            `);

        const records = quizResult.recordset;
        if (records.length === 0) {
            console.log('No quiz found with the given ID.');
            return res.status(404).json({ error: 'Quiz not found.' });
        }

        const quiz = {
            quizID: records[0].QuizID,
            title: records[0].Title,
            questions: []
        };

        records.forEach(record => {
            let question = quiz.questions.find(q => q.questionID === record.QuestionID);
            if (!question && record.QuestionID) {
                question = {
                    questionID: record.QuestionID,
                    text: record.QuestionText,
                    answers: []
                };
                quiz.questions.push(question);
            }
            if (question && record.AnswerID) {
                question.answers.push({
                    answerID: record.AnswerID,
                    text: record.AnswerText,
                    isCorrect: record.IsCorrect
                });
            }
        });

        res.status(200).json(quiz);
    } catch (err) {
        console.error('Error fetching quiz details:', err.message);
        res.status(500).json({ error: 'An error occurred while fetching quiz details.' });
    }
});

// Route for saving employee quiz answers
router.post('/submit', async (req, res) => {
    console.log('POST /employee/submit endpoint hit');
    console.log('Saving quiz answers...');
    const { title, employeeId, questions } = req.body;

    if (!title || !employeeId || !questions || !Array.isArray(questions)) {
        console.error('Invalid submission data:', req.body);
        return res.status(400).json({ error: 'Invalid submission data. Title, employee ID, and questions are required.' });
    }

    let transaction;
    try {
        const pool = await getPool();
        transaction = new sql.Transaction(pool);
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

        if (!result.recordset || result.recordset.length === 0) {
            throw new Error('Failed to insert into EmployeeResults. No result ID returned.');
        }

        const resultID = result.recordset[0].ResultID;

        // Insert each question response into EmployeeAnswers table
        for (let question of questions) {
            if (!question.text || !question.employeeAnswer) {
                console.error('Invalid question data:', question);
                throw new Error('Invalid question data. Each question must have text and an employee answer.');
            }

            const answerRequest = new sql.Request(transaction);
            await answerRequest
                .input('resultID', sql.Int, resultID)
                .input('questionText', sql.NVarChar, question.text)
                .input('employeeAnswer', sql.NVarChar, question.employeeAnswer)
                .input('correctAnswer', sql.NVarChar, question.correctAnswer || null)
                .query(`
                    INSERT INTO EmployeeAnswers (ResultID, QuestionText, EmployeeAnswer, CorrectAnswer)
                    VALUES (@resultID, @questionText, @employeeAnswer, @correctAnswer)
                `);
        }

        await transaction.commit();
        res.status(201).json({ message: 'Quiz answers saved successfully.' });
    } catch (err) {
        console.error('Error saving quiz answers:', err.message);
        if (transaction) {
            try {
                await transaction.rollback();
                console.error('Transaction rolled back due to an error.');
            } catch (rollbackError) {
                console.error('Error rolling back transaction:', rollbackError.message);
            }
        }
        res.status(500).json({ error: 'An error occurred while saving quiz answers.' });
    }
});

// Export the router to make the routes accessible from other modules
module.exports = router;
