// ═══════════════════════════════════════
// Vaani — Translate Page Logic
// Two-way voice translation
// ═══════════════════════════════════════

const langNames = {
  'hi-IN': 'हिन्दी', 'kn-IN': 'ಕನ್ನಡ', 'ta-IN': 'தமிழ்',
  'te-IN': 'తెలుగు', 'ml-IN': 'മലയാളം', 'bn-IN': 'বাংলা',
  'mr-IN': 'मराठी', 'gu-IN': 'ગુજરાતી', 'od-IN': 'ଓଡ଼ିଆ',
  'pa-IN': 'ਪੰਜਾਬੀ'
};

// Parse URL params
const params = new URLSearchParams(window.location.search);
const fromLang = params.get('from');
const toLang = params.get('to');

if (!fromLang || !toLang || !langNames[fromLang] || !langNames[toLang]) {
  window.location.href = 'index.html';
}

// Set UI labels
document.getElementById('from-lang-name').textContent = langNames[fromLang];
document.getElementById('to-lang-name').textContent = langNames[toLang];
document.getElementById('mic-a-label').textContent = langNames[fromLang];
document.getElementById('mic-b-label').textContent = langNames[toLang];

// State
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let isProcessing = false;
let isPlaying = false;
let recordingStartTime = null;
let timerInterval = null;
let currentSpeaker = null; // 'a' or 'b'

// Elements
const micA = document.getElementById('mic-a');
const micB = document.getElementById('mic-b');
const micALabel = document.getElementById('mic-a-label');
const micBLabel = document.getElementById('mic-b-label');
const conversation = document.getElementById('conversation');
const welcomeMsg = document.getElementById('welcome-msg');

// ═══════════════════════════════════════
// Event Listeners
// ═══════════════════════════════════════

micA.addEventListener('click', () => handleMicClick('a'));
micB.addEventListener('click', () => handleMicClick('b'));

async function handleMicClick(speaker) {
  if (isProcessing || isPlaying) return;

  if (isRecording && currentSpeaker === speaker) {
    // Stop recording
    await stopAndTranslate(speaker);
  } else if (!isRecording) {
    // Start recording
    await startRecording(speaker);
  }
}

// ═══════════════════════════════════════
// Recording
// ═══════════════════════════════════════

async function startRecording(speaker) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    currentSpeaker = speaker;
    isRecording = true;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.start();

    // Remove welcome message
    if (welcomeMsg) welcomeMsg.remove();

    // Update UI
    updateButtonStates('recording', speaker);
    startTimer(speaker);

  } catch (err) {
    alert('Microphone access is required. Please allow microphone permission.');
  }
}

function stopRecording() {
  return new Promise((resolve) => {
    mediaRecorder.onstop = async () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      const base64 = await blobToBase64(blob);
      resolve(base64);
    };
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(t => t.stop());
  });
}

async function stopAndTranslate(speaker) {
  stopTimer();
  isRecording = false;

  const audioBase64 = await stopRecording();

  // Determine translation direction
  const speakerLang = speaker === 'a' ? fromLang : toLang;
  const listenerLang = speaker === 'a' ? toLang : fromLang;

  // Show processing state
  isProcessing = true;
  updateButtonStates('processing', speaker);
  showStatusMessage('Translating...');

  try {
    const response = await fetch('/api/voice-translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio_base64: audioBase64,
        from_lang: speakerLang,
        to_lang: listenerLang
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Translation failed');
    }

    const data = await response.json();
    removeStatusMessage();

    // Add message to conversation
    addMessage(data.original_text, data.translated_text, speakerLang, listenerLang, speaker, data.audio_chunks);

    // Auto-play translated audio
    isPlaying = true;
    updateButtonStates('playing', speaker);
    await playAudioChunks(data.audio_chunks);

  } catch (err) {
    removeStatusMessage();
    addErrorMessage(err.message);
  } finally {
    isProcessing = false;
    isPlaying = false;
    currentSpeaker = null;
    updateButtonStates('ready', null);
  }
}

// ═══════════════════════════════════════
// Conversation Messages
// ═══════════════════════════════════════

function addMessage(originalText, translatedText, fromL, toL, speaker, audioData) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message message-${speaker}`;

  const langLabel = document.createElement('div');
  langLabel.className = 'message-lang';
  langLabel.textContent = langNames[fromL];

  const original = document.createElement('div');
  original.className = 'message-original';
  original.textContent = originalText;

  const translated = document.createElement('div');
  translated.className = 'message-translated';
  translated.textContent = translatedText;

  const replayBtn = document.createElement('button');
  replayBtn.className = 'message-replay';
  replayBtn.innerHTML = '&#128266; Replay';
  replayBtn.addEventListener('click', () => {
    playAudioChunks(audioData);
  });

  msgDiv.appendChild(langLabel);
  msgDiv.appendChild(original);
  msgDiv.appendChild(translated);
  msgDiv.appendChild(replayBtn);

  conversation.appendChild(msgDiv);
  scrollToBottom();
}

function addErrorMessage(text) {
  const errDiv = document.createElement('div');
  errDiv.className = 'status-message';
  errDiv.style.color = '#E74C3C';
  errDiv.textContent = text;
  conversation.appendChild(errDiv);
  scrollToBottom();
}

function showStatusMessage(text) {
  removeStatusMessage();
  const statusDiv = document.createElement('div');
  statusDiv.className = 'status-message';
  statusDiv.id = 'active-status';
  statusDiv.innerHTML = `<span class="pulse-dot"></span>${text}<span class="wave-animation"><span></span><span></span><span></span><span></span></span>`;
  conversation.appendChild(statusDiv);
  scrollToBottom();
}

function removeStatusMessage() {
  const el = document.getElementById('active-status');
  if (el) el.remove();
}

function scrollToBottom() {
  conversation.scrollTop = conversation.scrollHeight;
}

// ═══════════════════════════════════════
// Audio Playback
// ═══════════════════════════════════════

function playAudioChunks(chunks) {
  return new Promise((resolve) => {
    if (!chunks || chunks.length === 0) {
      resolve();
      return;
    }

    let index = 0;

    function playNext() {
      if (index >= chunks.length) {
        resolve();
        return;
      }

      const audio = new Audio('data:audio/wav;base64,' + chunks[index]);
      audio.volume = 1.0;
      audio.onended = () => {
        index++;
        playNext();
      };
      audio.onerror = () => {
        index++;
        playNext();
      };
      audio.play().catch(() => {
        index++;
        playNext();
      });
    }

    playNext();
  });
}

// ═══════════════════════════════════════
// Button State Management
// ═══════════════════════════════════════

function updateButtonStates(state, activeSpeaker) {
  // Reset classes
  micA.classList.remove('recording', 'processing', 'playing');
  micB.classList.remove('recording', 'processing', 'playing');

  switch (state) {
    case 'recording':
      if (activeSpeaker === 'a') {
        micA.classList.add('recording');
        micALabel.textContent = 'Recording...';
        micB.disabled = true;
      } else {
        micB.classList.add('recording');
        micBLabel.textContent = 'Recording...';
        micA.disabled = true;
      }
      break;

    case 'processing':
      micA.disabled = true;
      micB.disabled = true;
      micA.classList.add('processing');
      micB.classList.add('processing');
      micALabel.textContent = 'Translating...';
      micBLabel.textContent = 'Translating...';
      break;

    case 'playing':
      micA.disabled = true;
      micB.disabled = true;
      micA.classList.add('playing');
      micB.classList.add('playing');
      micALabel.textContent = 'Playing...';
      micBLabel.textContent = 'Playing...';
      break;

    case 'ready':
    default:
      micA.disabled = false;
      micB.disabled = false;
      micALabel.textContent = langNames[fromLang];
      micBLabel.textContent = langNames[toLang];
      break;
  }
}

// ═══════════════════════════════════════
// Timer
// ═══════════════════════════════════════

function startTimer(speaker) {
  recordingStartTime = Date.now();
  const label = speaker === 'a' ? micALabel : micBLabel;

  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    label.textContent = `Recording... ${mins}:${secs.toString().padStart(2, '0')}`;
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// ═══════════════════════════════════════
// Helpers
// ═══════════════════════════════════════

function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}
