require('dotenv').config(); // Load .env file at the top

const express = require('express'); 
const path = require('path');
const bcrypt = require('bcrypt');
const sql = require('mssql');
const session = require('express-session'); // Import express-session to manage sessions
const app = express();
const PORT = 3000;

// Import controllers for application functionalities
const admin_login = require('./Static/controllers/admin_login');
const employee_login = require('./Static/controllers/employee_login');
const quiz_controller = require('./Static/controllers/quiz_controller');
const employee_controller = require('./Static/controllers/employee_controller');
const result_controller = require('./Static/controllers/result_controller');
const admin_controller = require('./Static/controllers/admin_controller');
const { getPool } = require('./database');

// Custom middleware to add CORS headers for localhost development and production
app.use((req, res, next) => {
    const allowedOrigins = ["http://localhost:3000", "https://joe-and-the-juice.engineer"];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});



// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Setup session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Sat til false for at undgå problemer med HTTP under udvikling
        httpOnly: true,
        sameSite: 'Lax',  // 'Lax' tillader cookies i simple cross-site scenarier, f.eks. navigering fra en anden side
        maxAge: 1000 * 60 * 60 // 1 time
    }
}));





// Serve static files from Static directory
app.use('/Static', express.static(path.join(__dirname, 'Static')));

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    } else {
        res.redirect('/Static/views/employee_login.html'); // Redirect to login page if not authenticated
    }
}

// Route to serve the start page at the root URL
app.get('/', (req, res) => {
    const filePath = path.resolve(__dirname, 'Static/views/start.html');
    console.log('Serving file from:', filePath);
    res.sendFile(filePath);
});

// Route to serve employee login and register pages
app.get('/Static/views/:filename', (req, res) => {
    const allowedFiles = ['employee_login.html', 'start.html', 'employee_register.html'];
    const fileName = req.params.filename;

    if (allowedFiles.includes(fileName)) {
        const filePath = path.resolve(__dirname, 'Static/views', fileName);
        console.log('Serving file from:', filePath);
        res.sendFile(filePath);
    } else {
        res.status(403).send('Forbidden');
    }
});

// Route to serve admin.html only if authenticated
app.get('/admin', isAuthenticated, (req, res) => {
    const filePath = path.resolve(__dirname, 'Static/views/admin.html');
    console.log('Serving file from:', filePath);
    res.sendFile(filePath);
});

// Use controllers to handle specific routes
app.use('/admin_login', admin_login);
app.use('/employee_login', employee_login);
app.use('/quiz', quiz_controller);
app.use('/employee', employee_controller);
app.use('/results', result_controller);
app.use('/admin', admin_controller);

// Add logging to track requests to admin_login route
app.post('/admin_login/login', (req, res, next) => {
    console.log('Received POST request to /admin_login/login');
    next();
});

// Test database connection on startup
async function checkDatabaseConnection() {
    try {
        const pool = await getPool();
        await pool.request().query('SELECT 1 AS isConnected');
        console.log('Database connection successful!');
    } catch (err) {
        console.error('Error connecting to the database:', err.message);
    }
}
checkDatabaseConnection();

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
