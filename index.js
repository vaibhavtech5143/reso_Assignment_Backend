const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const cors = require('cors');
const app = express();
const port = 4300;
const secretKey = '12'; // Replace with your secret key for JWT



// if you are using mysql locally then set host  to --> localhost
// user as mysql user 
// password as mysql passowrd
// it is automatic db creation just give the right credentials it will automatically generate all the db and schemas
const db = mysql.createConnection({
  host: 'localhost',
  user: 'temp',
  password: 'Utsav@2633'
});

db.connect((err) => {
  if (err) throw err;
  console.log('MySQL connected!');
  
  // Create the 'assignment' database if it doesn't exist
  db.query('CREATE DATABASE IF NOT EXISTS assignment', (err) => {
    if (err) throw err;
    console.log('Database created or exists');
    
    // Use the 'assignment' database for subsequent operations
    db.query('USE assignment', (err) => {
      if (err) throw err;
      console.log('Using assignment database');
      
      // Check for table existence and create if not exists
      const createUserTable = `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      )`;
      
      const createTaskTable = `CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('assigned', 'pending', 'completed', 'missed') DEFAULT 'assigned'
      )`;
      db.query(createUserTable, (err) => {
        if (err) throw err;
        console.log('Users table checked/created');
      });
      
      db.query(createTaskTable, (err) => {
        if (err) throw err;
        console.log('Tasks table checked/created');
      });
          
    });
  });
});
app.use(cors());

app.use(bodyParser.json());
// Middleware function to verify token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).send('Token is not provided');
  
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) return res.status(401).send('Failed to authenticate token');
      req.user = decoded;
      next();
    });
  };
  
  // Register endpoint
  app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const INSERT_USER_QUERY = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.query(INSERT_USER_QUERY, [username, password], (err, result) => {
      if (err) {
        res.status(500).send('Error registering user');
      } else {
        res.status(201).send('User registered successfully');
      }
    });
  });
  
  // Login endpoint with JWT token generation
  app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const SELECT_USER_QUERY = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.query(SELECT_USER_QUERY, [username, password], (err, result) => {
      if (err || result.length === 0) {
        res.status(401).send('Invalid username or password');
      } else {
        const token = jwt.sign({ username }, secretKey, { expiresIn: '1h' }); // Token expires in 1 hour
        res.status(200).json({ token });
      }
    });
  });
  
  // CRUD Operations for Tasks (protected with Json Web Token Jwt)
  

// Create a task
app.post('/tasks', verifyToken, (req, res) => {
    const { title, description, status } = req.body; // Include 'status' in the request body
    const INSERT_TASK_QUERY = 'INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)';
    db.query(INSERT_TASK_QUERY, [title, description, status], (err, result) => {
      if (err) {
        res.status(500).send('Error creating task');
      } else {
        res.status(201).send('Task created successfully');
      }
    });
  });
  
  
  // Read all tasks
  app.get('/tasks', verifyToken, (req, res) => {
    const SELECT_ALL_TASKS_QUERY = 'SELECT * FROM tasks';
    db.query(SELECT_ALL_TASKS_QUERY, (err, results) => {
      if (err) {
        res.status(500).send('Error fetching tasks');
      } else {
        res.status(200).json(results);
      }
    });
  });
  
  // Update a task
app.put('/tasks/:id', verifyToken, (req, res) => {
    const { title, description, status } = req.body; // Include 'status' in the request body
    const { id } = req.params;
    const UPDATE_TASK_QUERY = 'UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?';
    db.query(UPDATE_TASK_QUERY, [title, description, status, id], (err, result) => {
      if (err) {
        res.status(500).send('Error updating task');
      } else {
        res.status(200).send('Task updated successfully');
      }
    });
  });
  
  
  // Delete a task
  app.delete('/tasks/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    const DELETE_TASK_QUERY = 'DELETE FROM tasks WHERE id = ?';
    db.query(DELETE_TASK_QUERY, id, (err, result) => {
      if (err) {
        res.status(500).send('Error deleting task');
      } else {
        res.status(200).send('Task deleted successfully');
      }
    });
  });
  
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });