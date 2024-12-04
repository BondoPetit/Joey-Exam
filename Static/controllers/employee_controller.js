employee_controller:
// Import the required modules
const express = require('express');
const sql = require('mssql');
const router = express.Router();
const { getPool } = require('../../database');

// Middleware to check if the user is authenticated as an employee
function isAuthenticated(req, res, next) {
    console.log('Session Info:', req.session); // Debugging for session information
    if (req.session && req.session.isEmployee && req.session.employeeId) {
        return next();
    } else {
        res.status(401).json({ error: 'Unauthorized: You must log in as an employee to access this function.' });
    }
}

// Route for handling employee login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query(
                SELECT EmployeeID, EmployeePassword
                FROM Employees
                WHERE EmployeeEmail = @email
            );

        if (result.recordset.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const { EmployeeID, EmployeePassword: storedPassword } = result.recordset[0];
        if (storedPassword !== password) { // You should use a proper hashing method like bcrypt in production
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Update session to store that the user is an employee
        req.session.isEmployee = true;
        req.session.employeeId = EmployeeID;
        req.session.employeeEmail = email;

        res.status(200).json({ message: 'Login successful', employeeId: EmployeeID, redirectUrl: '/static/views/employee.html' });
    } catch (err) {
        console.error('Error logging in employee:', err.message);
        res.status(500).json({ error: 'An error occurred while logging in.' });
    }
});

// Route for fetching all quizzes for employees
router.get('/get', isAuthenticated, async (req, res) => {
    console.log('GET /employee/get endpoint hit');
    console.log('Fetching quizzes...');
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    
    try {
        const pool = await getPool();
        const quizzesResult = await pool.request().query(
            SELECT q.QuizID, q.Title, 
                   qs.QuestionID, qs.Text AS QuestionText, 
                   a.AnswerID, a.Text AS AnswerText, a.IsCorrect
            FROM Quizzes q
            LEFT JOIN Questions qs ON q.QuizID = qs.QuizID
            LEFT JOIN Answers a ON qs.QuestionID = a.QuestionID
        );

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
router.get('/get/:id', isAuthenticated, async (req, res) => {
    const quizID = req.params.id;
    console.log(GET /employee/get/${quizID} endpoint hit);
    console.log('Fetching quiz details...');
    try {
        const pool = await getPool();
        const quizResult = await pool.request()
            .input('quizID', sql.Int, quizID)
            .query(
                SELECT q.QuizID, q.Title, 
                       qs.QuestionID, qs.Text AS QuestionText, 
                       a.AnswerID, a.Text AS AnswerText, a.IsCorrect
                FROM Quizzes q
                LEFT JOIN Questions qs ON q.QuizID = qs.QuizID
                LEFT JOIN Answers a ON qs.QuestionID = a.QuestionID
                WHERE q.QuizID = @quizID
            );

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

// Route for saving or updating employee quiz answers
router.post('/submit', isAuthenticated, async (req, res) => {
    console.log('POST /employee/submit endpoint hit');
    console.log('Saving or updating quiz answers...');
    const { quizID, title, employeeId, questions } = req.body;

    if (!quizID || !title || !employeeId || !questions || !Array.isArray(questions)) {
        console.error('Invalid submission data:', req.body);
        return res.status(400).json({ error: 'Invalid submission data. QuizID, Title, employee ID, and questions are required.' });
    }

    let transaction;
    try {
        const pool = await getPool();
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        // Check if a result already exists for this quiz and employee
        const existingResult = await pool.request()
            .input('quizID', sql.Int, quizID)
            .input('employeeId', sql.NVarChar, employeeId)
            .query(
                SELECT ResultID
                FROM EmployeeResults
                WHERE QuizID = @quizID AND EmployeeID = @employeeId
            );

        let resultID;
        if (existingResult.recordset.length > 0) {
            // If a result already exists, delete old answers
            resultID = existingResult.recordset[0].ResultID;
            await pool.request()
                .input('resultID', sql.Int, resultID)
                .query(
                    DELETE FROM EmployeeAnswers
                    WHERE ResultID = @resultID
                );
            console.log(Existing result found for EmployeeID ${employeeId}, deleting old answers...);
        } else {
            // If no result exists, insert a new one
            const resultRequest = new sql.Request(transaction);
            const result = await resultRequest
                .input('quizID', sql.Int, quizID) // Include QuizID
                .input('title', sql.NVarChar, title)
                .input('employeeId', sql.NVarChar, employeeId)
                .query(
                    INSERT INTO EmployeeResults (QuizID, Title, EmployeeID)
                    OUTPUT inserted.ResultID
                    VALUES (@quizID, @title, @employeeId)
                );

            if (!result.recordset || result.recordset.length === 0) {
                throw new Error('Failed to insert into EmployeeResults. No result ID returned.');
            }
            resultID = result.recordset[0].ResultID;
            console.log(New result created with ResultID ${resultID} for EmployeeID ${employeeId});
        }

        // Insert new answers into EmployeeAnswers
        for (let question of questions) {
            if (!question.text || !question.employeeAnswer) {
                console.error('Invalid question data:', question);
                throw new Error('Invalid question data. Each question must have text and an employee answer.');
            }

            const answerRequest = new sql.Request(transaction);
            await answerRequest
                .input('resultID', sql.Int, resultID)
                .input('quizID', sql.Int, quizID) // Include QuizID
                .input('questionText', sql.NVarChar, question.text)
                .input('employeeAnswer', sql.NVarChar, question.employeeAnswer)
                .input('correctAnswer', sql.NVarChar, question.correctAnswer || null)
                .query(
                    INSERT INTO EmployeeAnswers (ResultID, QuizID, QuestionText, EmployeeAnswer, CorrectAnswer)
                    VALUES (@resultID, @quizID, @questionText, @employeeAnswer, @correctAnswer)
                );
        }

        await transaction.commit();
        res.status(201).json({ message: 'Quiz answers saved successfully.' });
    } catch (err) {
        console.error('Error saving or updating quiz answers:', err.message);
        if (transaction) {
            try {
                await transaction.rollback();
                console.error('Transaction rolled back due to an error.');
            } catch (rollbackError) {
                console.error('Error rolling back transaction:', rollbackError.message);
            }
        }
        res.status(500).json({ error: 'An error occurred while saving or updating quiz answers.' });
    }
});


// Route to logout employee
router.post('/logout', isAuthenticated, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out. Please try again.' });
        }
        res.status(200).json({ message: 'Logout successful' });
    });
});

// Route to check who is logged in (accessible to employee only)
router.get('/whoami', isAuthenticated, async (req, res) => {
    if (req.session && req.session.isEmployee) {
        res.status(200).json({ loggedIn: true, userType: 'employee', email: req.session.employeeEmail });
    } else {
        res.status(401).json({ loggedIn: false, error: 'Unauthorized' });
    }
});


// Export the router to make the routes accessible from other modules
module.exports = router;
