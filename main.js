// --- Word Beater Game with Dynamic Word Fetching from Datamuse API ---

// Time per difficulty
const times = {
  easy: 10,
  medium: 7,
  hard: 5
};

// DOM Elements
const currentWord = document.querySelector('#current-word');
const wordInput = document.querySelector('#word-input');
const scoreDisplay = document.querySelector('#score');
const bestScoreDisplay = document.querySelector('#best-score');
const timeDisplay = document.querySelector('#time');
const secondsDisplay = document.querySelector('#seconds');
const message = document.querySelector('#message');
const difficultySelect = document.querySelector('#difficulty');
const timerBar = document.querySelector('#timer-bar');
const soundCorrect = document.getElementById('sound-correct');
const soundWrong = document.getElementById('sound-wrong');
const soundTimeOver = document.getElementById('sound-timeover');
const startBtn = document.getElementById('start-btn');
const muteBtn = document.getElementById('mute-btn');

let words = [];
let score = 0;
let bestScore = 0;
let time = times.easy;
let isPlaying = false;
let countdownInterval = null;
let currentLevel = 'easy';
let isMuted = false;

// --- Dynamic Word Fetching ---
async function fetchWordsByLength(minLen, maxLen, count = 20) {
  // Datamuse API: get up to 1000 words, then filter by length
  const response = await fetch(`https://api.datamuse.com/words?sp=*`);
  const data = await response.json();
  const filtered = data
    .map(item => item.word)
    .filter(word => word.length >= minLen && word.length <= maxLen && /^[a-zA-Z]+$/.test(word));
  // Shuffle and return 'count' words
  return filtered.sort(() => 0.5 - Math.random()).slice(0, count);
}

async function loadWordsForLevel(level) {
  if (level === 'easy') {
    return await fetchWordsByLength(3, 4, 20);
  } else if (level === 'medium') {
    return await fetchWordsByLength(5, 7, 20);
  } else {
    return await fetchWordsByLength(8, 12, 20);
  }
}

// --- Game Logic ---
function showWord() {
  if (!words.length) {
    currentWord.textContent = 'Loading...';
    return;
  }
  const randIndex = Math.floor(Math.random() * words.length);
  currentWord.textContent = words[randIndex];
  // Animate word
  currentWord.classList.remove('animated');
  void currentWord.offsetWidth; // Trigger reflow
  currentWord.classList.add('animated');
}

function updateTimerBar() {
  const percent = (time / times[currentLevel]) * 100;
  timerBar.style.width = percent + '%';
  timerBar.className = 'progress-bar';
  if (percent < 40) timerBar.classList.add('bg-danger');
  else if (percent < 70) timerBar.classList.add('bg-warning');
  else timerBar.classList.add('bg-success');
}

function startMatch() {
  if (!isPlaying) return;
  if (wordInput.value.trim().toLowerCase() === currentWord.textContent.toLowerCase()) {
    if (!isMuted) { soundCorrect.currentTime = 0; soundCorrect.play(); }
    score++;
    scoreDisplay.textContent = score;
    if (score > bestScore) {
      bestScore = score;
      bestScoreDisplay.textContent = bestScore;
      localStorage.setItem('wordbeater_best', bestScore);
    }
    message.innerHTML = '<span style="color:#00ffb3;">🎉 Correct!</span>';
    showWord();
    wordInput.value = '';
    time = times[currentLevel] + 1; // Add 1 to compensate for immediate decrease
    updateTimerBar();
  } else if (wordInput.value.trim().length > 0) {
    if (!isMuted) { soundWrong.currentTime = 0; soundWrong.play(); }
    message.innerHTML = '<span style="color:#ffb347;">❌ Try Again...</span>';
  } else {
    message.textContent = '';
  }
}

function countdown() {
  if (time > 0) {
    time--;
    timeDisplay.textContent = time;
    updateTimerBar();
  } else {
    endGame();
  }
}

function startGame() {
  isPlaying = true;
  score = 0;
  scoreDisplay.textContent = score;
  message.textContent = '';
  time = times[currentLevel];
  timeDisplay.textContent = time;
  secondsDisplay.textContent = times[currentLevel];
  updateTimerBar();
  showWord();
  wordInput.value = '';
  wordInput.focus();
  clearInterval(countdownInterval);
  countdownInterval = setInterval(countdown, 1000);
  startBtn.style.display = 'none';
}

function endGame() {
  isPlaying = false;
  clearInterval(countdownInterval);
  if (!isMuted) { soundTimeOver.currentTime = 0; soundTimeOver.play(); }
  message.innerHTML = '<span style="color:#ff4c4c;">⏰ Time\'s up! Game Over.</span>';
  score = 0;
  scoreDisplay.textContent = score;
  startBtn.style.display = 'inline-block';
}

// --- Difficulty and Initialization ---
async function changeDifficulty() {
  currentLevel = difficultySelect.value;
  secondsDisplay.textContent = times[currentLevel];
  // Show loading indicator
  currentWord.textContent = 'Loading...';
  words = await loadWordsForLevel(currentLevel);
  startGame();
}

function loadBestScore() {
  const saved = localStorage.getItem('wordbeater_best');
  if (saved) {
    bestScore = parseInt(saved, 10);
    bestScoreDisplay.textContent = bestScore;
  }
}

// --- Mute/Unmute functionality ---
function setMuteState(muted) {
  [soundCorrect, soundWrong, soundTimeOver].forEach(audio => {
    audio.muted = muted;
  });
  muteBtn.textContent = muted ? '🔇' : '🔊';
}

muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  setMuteState(isMuted);
});

// --- Start/Restart button functionality ---
startBtn.addEventListener('click', () => {
  startGame();
  wordInput.focus();
});

// --- Input event ---
wordInput.addEventListener('input', startMatch);

// --- Difficulty change event ---
difficultySelect.addEventListener('change', changeDifficulty);

// --- Restart game when input is focused after game over ---
wordInput.addEventListener('focus', () => {
  if (!isPlaying) startGame();
});

// --- On load ---
window.addEventListener('DOMContentLoaded', async () => {
  loadBestScore();
  setMuteState(isMuted);
  await changeDifficulty(); // Loads words and starts game
  startBtn.style.display = 'inline-block';
});
