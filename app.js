const express = require('express'); 
const path = require('path');
const cors = require('cors'); // Importer cors middleware
const bcrypt = require('bcrypt');
const sql = require('mssql');
const app = express();
const PORT = 3000;

// Import controllers for application functionalities
const admin_login = require('./Static/controllers/admin_login'); // Importer admin login controller
const employee_login = require('./Static/controllers/employee_login');
const quiz_controller = require('./Static/controllers/quiz_controller'); // Importer quiz controller
const employee_controller = require('./Static/controllers/employee_controller'); // Importer employee controller
const result_controller = require('./Static/controllers/result_controller'); // Importer result controller
const { getPool } = require('./database');

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Brug CORS middleware for at tillade anmodninger kun fra produktionsdomænet
app.use(cors({
    origin: ['https://joe-and-the-juice.engineer'], // Tillad kun produktionsdomænet
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Tillad GET, POST, PUT, DELETE, og OPTIONS anmodninger
    allowedHeaders: ['Content-Type', 'Authorization'], // Tillad specifikke headers
    credentials: true // Tillad autoriseringsoplysninger og cookies
}));

// Serve static files from Static directory
app.use('/Static', express.static(path.join(__dirname, 'Static')));

// Route to serve the start page at the root URL
app.get('/', (req, res) => {
  const filePath = path.resolve(__dirname, 'Static/views/start.html');
  console.log('Serving file from:', filePath);
  res.sendFile(filePath);
});

// Generic route to serve any HTML file from Static/views directory
app.get('/Static/views/:filename', (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.resolve(__dirname, 'Static/views', fileName);
  console.log('Serving file from:', filePath);
  res.sendFile(filePath);
});

// Brug controllers til at håndtere login-ruter
app.use('/admin_login', admin_login);
app.use('/employee_login', employee_login);
app.use('/quiz', quiz_controller); // Brug quiz controlleren
app.use('/employee', employee_controller); // Simplificér employee controlleren uden ekstra middleware
app.use('/quiz', result_controller); // Brug result controlleren til quizresultater

// Tilføj logning for at spore anmodninger til admin_login ruten
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
