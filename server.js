// server.js
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
// For parsing form data or JSON
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session middleware (for dev/demo only, store in DB like Redis or MySQL for production)
app.use(
  session({
    secret: 'supersecretkey',  // replace with a strong key in production
    resave: false,
    saveUninitialized: true,
  })
);

// In-memory user store (demo only!)
const users = []; // Example: [{ id: 1, username: 'Alice', passwordHash: '...' }]

// -------------- ROUTES -------------- //

// Registration route
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Validate input (length, special characters, etc.)
  if (!username || !password) {
    return res.status(400).send('Missing username or password');
  }

  // Check if user already exists
  const existingUser = users.find((u) => u.username === username);
  if (existingUser) {
    return res.status(409).send('User already exists');
  }

  // Hash the password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create and store new user
  const newUser = {
    id: users.length + 1,
    username,
    passwordHash,
  };
  users.push(newUser);

  res.status(201).send('User registered successfully');
});

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Find the user in the "DB"
  const user = users.find((u) => u.username === username);
  if (!user) {
    return res.status(401).send('Invalid username or password');
  }

  // Compare the provided password with the stored hash
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).send('Invalid username or password');
  }

  // Set session data
  req.session.userId = user.id;
  req.session.username = user.username;

  res.send('Login successful!');
});

// Protected route example
app.get('/dashboard', (req, res) => {
  // Check if user is logged in via session
  if (!req.session.userId) {
    return res.status(403).send('Not authenticated. Please log in.');
  }

  // Return a protected resource
  res.send(`Welcome to your dashboard, ${req.session.username}!`);
});

// Logout route
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send('Error logging out.');
    res.send('Logged out successfully!');
  });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
