const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Import controllers for application functionalities
const employee_login = require('./Static/controllers/employee_login');
const { getPool } = require('./database'); 


// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files
app.use('/Static/public', express.static(path.join(__dirname, 'Static/public')));

app.use('/views', express.static(path.join(__dirname, 'Static/views')));

// Route to serve the start page at the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Static', 'views', 'start.html'));
});

app.use('/employee_login', employee_login); // Handles employee login-related routes

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
