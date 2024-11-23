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

// Serve static files from Static directory
app.use('/Static', express.static(path.join(__dirname, 'Static')));

// Route to serve the start page at the root URL
app.get('/', (req, res) => {
  const filePath = path.resolve(__dirname, 'Static/views/start.html');
  console.log('Serving file from:', filePath);
  res.sendFile(filePath);
});

// Route to serve employee_login.html directly
app.get('/Static/views/employee_login.html', (req, res) => {
  const filePath = path.resolve(__dirname, 'Static/views/employee_login.html');
  console.log('Serving file from:', filePath);
  res.sendFile(filePath);
});

// Route to serve employee_register.html directly
app.get('/Static/views/employee_register.html', (req, res) => {
  const filePath = path.resolve(__dirname, 'Static/views/employee_register.html');
  console.log('Serving file from:', filePath);
  res.sendFile(filePath);
});

// Route to serve employee.html directly
app.get('/Static/views/employee.html', (req, res) => {
  const filePath = path.resolve(__dirname, 'Static/views/employee.html');
  console.log('Serving file from:', filePath);
  res.sendFile(filePath);
});


// Route to serve admin.html directly
app.get('/views/admin.html', (req, res) => {
    const filePath = path.resolve(__dirname, 'Static/views', 'admin.html');
    console.log('Serving file from:', filePath);
    res.sendFile(filePath);
});

// Route to serve result.html directly
app.get('/Static/views/result.html', (req, res) => {
  const filePath = path.resolve(__dirname, 'Static/views/result.html');
  console.log('Serving file from:', filePath);
  res.sendFile(filePath);
});


// Brug controllers til at håndtere login-ruter
app.use('/admin_login', admin_login);
app.use('/employee_login', employee_login); 

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

// Function to add a new admin user
/*async function addAdminUser() {
    try {
        // Hash passwordet
        const plainPassword = '1234';
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // Forbind til databasen og indsæt admin bruger
        const pool = await getPool();
        await pool.request()
            .input('username', sql.NVarChar, 'Bondo')
            .input('passwordHash', sql.NVarChar, hashedPassword)
            .query(`
                INSERT INTO Admins (Username, PasswordHash)
                VALUES (@username, @passwordHash)
            `);

        console.log('Admin user "Bondo" added successfully.');
    } catch (error) {
        console.error('Error adding admin user:', error.message);
    }
}
addAdminUser();
*/

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
