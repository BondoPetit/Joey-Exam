require('dotenv').config(); // Loader .env filen først (vigtigt)

const express = require('express');
const path = require('path');
const sql = require('mssql');
const session = require('express-session'); // Session middleware til at håndtere bruger sessions
const app = express();
const PORT = 3000;

// Controllers til at håndtere forskellige routes
const admin_login = require('./Static/controllers/admin_login');
const employee_login = require('./Static/controllers/employee_login');
const quiz_controller = require('./Static/controllers/quiz_controller');
const employee_controller = require('./Static/controllers/employee_controller');
const result_controller = require('./Static/controllers/result_controller');
const admin_controller = require('./Static/controllers/admin_controller');
const quiz_all_controller = require('./Static/controllers/quiz_all_controller'); 
const { getPool } = require('./database');

// Truster proxy for at håndtere HTTPS korrekt
app.set('trust proxy', 1);

// Middleware til at håndtere CORS (cross origin requests) 
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

// Session middleware til kryptering af session data
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', 
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', 
        maxAge: 1000 * 60 * 60 // 1 time
    }
}));

// Giver adgang til  filer i Static mappen
app.use('/Static', express.static(path.join(__dirname, 'Static')));

// Giver adgang til intl-tel-input for at bruge autofill for landkode til telefonnumre
app.use('/static/intl-tel-input', express.static(path.join(__dirname, 'node_modules/intl-tel-input/build')));

// Tjekker hvis brugeren er autentificeret
function isAuthenticated(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    } else {
        res.redirect('/Static/views/employee_login.html'); // Redirecter til login siden
    }
}

// Giver startsiden som root URL
app.get('/', (req, res) => {
    const filePath = path.resolve(__dirname, 'Static/views/start.html');
    console.log('Serving file from:', filePath);
    res.sendFile(filePath);
});

// Route til at give employee login og register sider
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

// Bruger isAuthenticated til at kun give admin siden hvis man er admin
app.get('/admin', isAuthenticated, (req, res) => {
    const filePath = path.resolve(__dirname, 'Static/views/admin.html');
    console.log('Serving file from:', filePath);
    res.sendFile(filePath);
});

// Controllers til specifikke ruter
app.use('/admin_login', admin_login);
app.use('/employee_login', employee_login);
app.use('/quiz', quiz_controller);
app.use('/employee', employee_controller);
app.use('/results', isAuthenticated, result_controller); 
app.use('/admin', admin_controller);
app.use('/quiz', quiz_all_controller); 

// Logging til at tracke hvem bruger admin siderne
app.post('/admin_login/login', (req, res, next) => {
    console.log('Received POST request to /admin_login/login');
    next();
});

// Logging til at tracke hvem bruger employee siderne
app.get('/employee/whoami', (req, res) => {
    console.log('Session data on whoami:', req.session);
    if (req.session && req.session.isEmployee) {
        res.json({ loggedIn: true, userType: 'employee', email: req.session.email });
    } else {
        res.status(401).json({ loggedIn: false });
    }
});

app.get('/employee/get', (req, res) => {
    console.log('Session data on get:', req.session);
    if (req.session && req.session.isEmployee) {
        res.json(quizzes); 
    } else {
        res.status(401).send('Unauthorized');
    }
});

// Tester RTT mellem klient og server
app.get('/ping', (req, res) => {
    console.log('Ping request received');
    res.send('pong'); 
});


// Tester forbindelsen til databasen når den starter op
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

// Starter serveren
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

console.log('NODE_ENV:', process.env.NODE_ENV);
