
const WORDS = [
  "fachcha", "tuchcha", "cp", "rg", "wimwi", "dorm", "chaos", "trbs", "globe", "fra", "dcp"
];

const HINTS = [
  "A term for first-year students at IIM Ahmedabad, often used informally.",
  "A playful term for second-year students at IIM Ahmedabad.",
  "Short for Class Participation, an essential aspect of classroom assessments.",
  "Abbreviation for relative grading, a system of assessment at IIM Ahmedabad.",
  "Short for Well-known Institute of Management in Western India, referring to IIM Ahmedabad.",
  "The residential blocks on campus, providing accommodation for students.",
  "The annual cultural festival of IIM Ahmedabad, featuring events and competitions.",
  "Short for 'The Red Brick Summit', an annual event that brings together thought leaders and experts.",
  "A playful term used to describe blabbering in class to participate in discussions.",
  "Short for Financial Reporting and Analysis, one of the most dreaded subjects in the first term.",
  "Abbreviation for Desperate Class Participation, used humorously to describe excessive attempts at participating in class."
];

let currentWords = [
  WORDS[Math.floor(Math.random() * WORDS.length)], 
  WORDS[Math.floor(Math.random() * WORDS.length)], 
  WORDS[Math.floor(Math.random() * WORDS.length)]
];

let currentWordIndex = 0;  // To track the current word the user is guessing
let totalWords = 3;  // Total number of words in the game
let secretWord = currentWords[currentWordIndex].toLowerCase();
let currentGuess = '';
let currentRow = 0;
let gameWon = false;
let timer = 0;
let timerInterval;
let guessesUsed = 0;
let score = 0;
let individualScores = [];  // To track score for each word
let totalScore = 0;  // To track total score across all words


// Google login logic
function handleCredentialResponse(response) {

  const id_token = response.credential;
  console.log('ID Token:', id_token);

  // Decode the JWT token to get user details
  const userInfo = decodeJwtResponse(id_token);
  console.log('User Info:', userInfo);

  // Store the user's email in localStorage
  const email = userInfo.email;
  localStorage.setItem('userEmail', email);  // Store email in localStorage

  // Display user's email
  document.getElementById('user-email').textContent = email;

  // Hide the Google Sign-In button and show the game elements
  document.getElementById('google-sign-in-btn').style.display = 'none';
  document.getElementById('user-info').style.display = 'block';
  document.getElementById('game-elements').style.display = 'block';
  document.getElementById('check-word-button').style.display = 'inline-block'; // Show the "Check Word" button

  // Hide the welcome message container after login
  document.getElementById('welcome-message').style.display = 'none';

  // Show the sidebar after user has signed in
  document.getElementById('info-sidebar').style.display = 'block'; // Show sidebar
}


// Decode JWT Token to extract user details
function decodeJwtResponse(id_token) {
  const base64Url = id_token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}

function initializeGoogleAuth() {
  gapi.load('auth2', function() {
    gapi.auth2.init({
      client_id: '1035999048110-9f4kn35u6iicg981ievos9mgki80fds9.apps.googleusercontent.com'  // Replace with your actual client ID
    });
  });
}

// Create game board for the wordle game
function createBoard() {
  const board = document.getElementById('game-board');
  board.innerHTML = '';  // Clear the previous board
  
  for (let i = 0; i < 6; i++) {  // 6 rows for the 6 guesses
    const row = document.createElement('div');
    row.className = 'row';
    if (i > 0) row.style.display = 'none'; // Hide rows except the first one initially
    
    for (let j = 0; j < secretWord.length; j++) {  // Box count based on the word length
      const box = document.createElement('input');
      box.className = 'box';
      box.type = 'text';
      box.maxLength = 1;  // Only allow 1 character per box
      box.addEventListener('input', handleInput);
      row.appendChild(box);
    }
    board.appendChild(row);
  }

  updateCurrentWordDisplay();
}

// Timer logic
function startTimer() {
  timerInterval = setInterval(() => {
    timer++;
    document.getElementById('timer').textContent = `Time: ${timer}s`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);  // Stop the timer when the game is won
}

// Move to the next box in the row
function handleInput(event) {
  const inputBox = event.target;
  const row = inputBox.parentElement;
  const boxes = row.getElementsByClassName('box');
  
  // Move focus to next box when a letter is typed
  if (inputBox.value.length === 1) {
    const nextBox = Array.from(boxes).find(box => !box.value);
    if (nextBox) {
      nextBox.focus();  // Move to the next empty box
    }
  }
}

// Check the guess against the secret word
function checkGuess() {
  if (gameWon) return;  // Stop further checks if the game is already won

  const row = document.getElementsByClassName('row')[currentRow];
  const boxes = row.getElementsByClassName('box');
  let guess = '';
  
  // Gather the guessed word from the input boxes
  for (let i = 0; i < boxes.length; i++) {
    guess += boxes[i].value.toLowerCase();
  }

  // Check and color the guessed word based on correctness
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === secretWord[i]) {
      boxes[i].style.backgroundColor = 'green'; // Correct letter and position
    } else if (secretWord.includes(guess[i])) {
      boxes[i].style.backgroundColor = 'yellow'; // Correct letter but wrong position
    } else {
      boxes[i].style.backgroundColor = 'gray'; // Incorrect letter
    }
  }

  // Reveal the next row only if the guess is incorrect
  if (guess !== secretWord && currentRow < 5) {
    document.getElementsByClassName('row')[currentRow + 1].style.display = 'flex';
  }

  // Show the win message if the guess is correct
  if (guess === secretWord) {
    const winMessage = document.getElementById('win-message');
    const congratulationsMessage = document.getElementById('congratulations-message');
    
    if (currentWordIndex === currentWords.length - 1) {
      congratulationsMessage.style.display = 'block';  // Show completion message
    } else {
      winMessage.style.display = 'block';  // Show win message for the current word
    }

    gameWon = true;  // Set gameWon to true to prevent further actions
    stopTimer();  // Stop the timer when the game is won
    guessesUsed = currentRow + 1;  // Number of guesses used for this word
    calculateScore();  // Calculate the score after winning
    individualScores.push(score);  // Add the score for the current word to the array
    
    // Check if it's the last word
    if (currentWordIndex === currentWords.length - 1) {
      document.getElementById('reset-game-button').style.display = 'block';  // Show the reset button
      displayScore();  // Show the total score once the game is completed
      const email = localStorage.getItem('userEmail');
      sendScoreToBackend(email, totalScore);  // Send the score to the backend
    } else {
      document.getElementById('next-word-button').style.display = 'block';  // Show the next word button
    }
  }

  // If attempts are exhausted and the user hasn't guessed correctly, show the consolation message
  if (currentRow === 5 && guess !== secretWord && !gameWon) {
    const consolationMessage = document.getElementById('consolation-message');
    const correctWordElement = document.getElementById('correct-word');
    correctWordElement.textContent = secretWord.toUpperCase();  // Show the correct word
    consolationMessage.style.display = 'block';  // Display the consolation message
    guessesUsed = 6;  // If attempts are exhausted, assume 6 guesses were used
    calculateScore();  // Calculate the score after game over
    individualScores.push(score);  // Add the score for the current word to the array
    document.getElementById('reset-game-button').style.display = 'block'; // Show the restart game button after failure
    displayScore();
  }

  currentRow++;
}

// Calculate score based on number of guesses and time
function calculateScore() {
  let guessScore = Math.max(10 - guessesUsed, 1) * 10;  // Max score is 100 for guessing in 1 try
  let timeScore = Math.max(100 - (timer / 10), 10);  // Max score of 100 based on time

  score = guessScore + timeScore;  // Total score
}

// Display total score
function displayScore() {
  const scoreMessage = document.getElementById('score-message');
  totalScore = individualScores.reduce((acc, score) => acc + score, 0);  // Sum all individual scores
  scoreMessage.textContent = `Your total score: ${totalScore}`;
  scoreMessage.style.display = 'block';  // Show the score message
}

// Move to the next word in the game
function nextWord() {
  if (currentWordIndex < currentWords.length - 1) {
    currentWordIndex++;
    secretWord = currentWords[currentWordIndex].toLowerCase();
    gameWon = false;
    currentRow = 0;
    document.getElementById('win-message').style.display = 'none';
    document.getElementById('consolation-message').style.display = 'none';
    document.getElementById('next-word-button').style.display = 'none';
    
    // Reset the board for the next word
    createBoard();
    currentGuess = '';
    timer = 0;
    clearInterval(timerInterval); // Stop the timer
    startTimer(); // Start the timer again

    updateCurrentWordDisplay();

  }
}

// Reset the game to start over
function resetGame() {
  
  currentWordIndex = 0;

  currentWords = [
  WORDS[Math.floor(Math.random() * WORDS.length)], 
  WORDS[Math.floor(Math.random() * WORDS.length)], 
  WORDS[Math.floor(Math.random() * WORDS.length)]
  ];

  secretWord = currentWords[currentWordIndex].toLowerCase();
  gameWon = false;
  currentRow = 0;
  currentGuess = '';
  document.getElementById('win-message').style.display = 'none';
  document.getElementById('congratulations-message').style.display = 'none'; // Hide congratulations message
  document.getElementById('consolation-message').style.display = 'none';
  document.getElementById('next-word-button').style.display = 'none';
  document.getElementById('reset-game-button').style.display = 'none';
  document.getElementById('score-message').style.display = 'none'; // Hide score

  createBoard();
  timer = 0;
  document.getElementById('timer').textContent = `Time: 0s`; // Reset timer display
  clearInterval(timerInterval); // Stop the timer
  startTimer(); // Start the timer again
}

// Update the current word and hint display
function updateCurrentWordDisplay() {
  const currentWordText = document.getElementById('current-word-text');
  currentWordText.textContent = `Word ${currentWordIndex + 1}/${totalWords}`;
  
  // Find the index of the current word in the WORDS array
  const wordIndex = WORDS.indexOf(secretWord);
  
  // Display the hint for the current word
  const hintText = document.getElementById('hint-text');
  hintText.textContent = HINTS[wordIndex]; // Use the index to fetch the correct hint
}

// Start the game when the start button is clicked
function startGame() {

  document.getElementById('start-button-container').style.display = 'none';  // Hide the start button after clicking
  document.getElementById('signout-button-container').style.display = 'none'; // Hide the signout button
  document.getElementById('game-elements').style.display = 'block';  // Show the game elements

  document.getElementById('welcome-message').style.display = 'none';
  document.getElementById('info-sidebar').style.display = 'block'; // Show sidebar
  document.getElementById('leaderboard-info').style.display = 'block';

  createBoard();
  startTimer();

}

// After the game is won, send the score to the backend (to add to the leaderboard)
function sendScoreToBackend(email, score) {
  fetch('/add-score', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, score }),  // Send email with score
  })
  .then(response => response.json())
  .then(data => {
    console.log('Score submitted successfully');
    // Optionally, you could fetch and update the leaderboard here to reflect the changes.
  })
  .catch(error => console.error('Error submitting score:', error));
}

// Sign out the user and reset the game state
function signOut() {

  // Use the Google API to sign the user out
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut();

  // Clear the user's session data from localStorage
  localStorage.removeItem('userEmail');  // Remove email from localStorage

  // Hide game elements and show the sign-in button
  document.getElementById('game-elements').style.display = 'none';
  document.getElementById('google-sign-in-btn').style.display = 'block';
  document.getElementById('start-button-container').style.display = 'none';  // Hide the start button
  document.getElementById('signout-button-container').style.display = 'none'; // Hide the sign-out button

  // Reset other elements (like user email and welcome message)
  document.getElementById('user-email').textContent = '';
  document.getElementById('user-info').style.display = 'none';
  document.getElementById('welcome-message').style.display = 'block'; // Show welcome message again

  // Reset the timer and game state
  clearInterval(timerInterval);
  timer = 0;
  document.getElementById('timer').textContent = 'Time: 0s';
}

// Initialize the game when the page loads
window.onload = () => {
  createBoard();
  startTimer();  // Start the timer when the page loads
  
  // Initially hide both win and consolation messages
  document.getElementById('win-message').style.display = 'none';
  document.getElementById('consolation-message').style.display = 'none';
  document.getElementById('score-message').style.display = 'none'; // Initially hide the score message
  document.getElementById('reset-game-button').style.display = 'none'; // Initially hide the reset button
  document.getElementById('congratulations-message').style.display = 'none'; // Initially hide the congratulations message
};
