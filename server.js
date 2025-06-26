const express = require('express');
const path = require('path');
const { Client } = require('pg');
const app = express();
const port = process.env.PORT || 5000;

// Use the DATABASE_URL environment variable from Heroku for Postgres connection
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // This is necessary for Heroku Postgres
  },
});

client.connect();

// Create leaderboard table if it doesn't exist, allowing floating-point scores
client.query(`
  CREATE TABLE IF NOT EXISTS leaderboard (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    score NUMERIC,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`, (err, res) => {
  if (err) {
    console.error('Error creating table', err);
  } else {
    console.log('Leaderboard table is ready');
  }
});

// Serve static files (HTML, CSS, JS) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to add a score
app.post('/add-score', express.json(), (req, res) => {
  // Destructure the email and score from the request body
  const { email, score } = req.body;

  // Insert the email and score into the leaderboard table
  client.query(
    'INSERT INTO leaderboard (email, score) VALUES ($1, $2)', 
    [email, score], 
    (err, result) => {
      if (err) {
        console.error('Error inserting score:', err);
        res.status(500).send('Error saving score');
      } else {
        console.log('Score saved successfully');
        res.status(200).send('Score saved successfully');
      }
    }
  );
});

// API endpoint to get the leaderboard
app.get('/leaderboard', (req, res) => {
  // Fetch the top 10 scores from the leaderboard table
  client.query('SELECT email, score FROM leaderboard ORDER BY score DESC LIMIT 10', (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error retrieving leaderboard');
    } else {
      res.json(result.rows);  // Send back the leaderboard as JSON
    }
  });
});

// Handle the root route to serve the main index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
