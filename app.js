const express = require('express');
const path = require('path');
const cors = require('cors'); // Importer cors middleware
const app = express();
const PORT = 3000;

// Import controllers for application functionalities
const admin_login = require('./controllers/admin_login'); // Importer admin login controller
const employee_login = require('./controllers/employee_login');
const { getPool } = require('./database');

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Brug CORS middleware for at tillade anmodninger fra bestemte domæner
app.use(cors({
    origin: ['https://joe-and-the-juice.engineer'], // Tillad kun dette domæne at lave anmodninger
    methods: ['GET', 'POST'], // Tillad kun GET og POST anmodninger
    allowedHeaders: ['Content-Type', 'Authorization'], // Tillad specifikke headers
}));

// Serve static files
app.use('/static/public', express.static(path.join(__dirname, 'public')));
app.use('/views', express.static(path.join(__dirname, 'views')));

// Route to serve the start page at the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'start.html'));
});

// Route to serve admin.html directly
app.get('/views/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// Brug controllers til at håndtere login-ruter
app.use('/admin_login', admin_login);
app.use('/employee_login', employee_login); 

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
