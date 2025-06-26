const express = require('express');
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

// Create leaderboard table if it doesn't exist
client.query(`
  CREATE TABLE IF NOT EXISTS leaderboard (
    id SERIAL PRIMARY KEY,
    player_name VARCHAR(100),
    score INT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`, (err, res) => {
  if (err) {
    console.error('Error creating table', err);
  } else {
    console.log('Leaderboard table is ready');
  }
});

// API endpoint to add a score
app.post('/add-score', (req, res) => {
  const { playerName, score } = req.body;
  
  client.query('INSERT INTO leaderboard (player_name, score) VALUES ($1, $2)', [playerName, score], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error saving score');
    } else {
      res.status(200).send('Score saved successfully');
    }
  });
});

// API endpoint to get the leaderboard
app.get('/leaderboard', (req, res) => {
  client.query('SELECT player_name, score FROM leaderboard ORDER BY score DESC LIMIT 10', (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error retrieving leaderboard');
    } else {
      res.json(result.rows);  // Send back the leaderboard as JSON
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
