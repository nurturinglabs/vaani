// ═══════════════════════════════════════
// Vaani — Demo Playback Logic
// ═══════════════════════════════════════

let currentAudio = null;
let currentBtn = null;

document.querySelectorAll('.demo-play-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const audioSrc = btn.getAttribute('data-audio');

    // If same button clicked while playing, stop
    if (currentBtn === btn && currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      resetButton(btn);
      currentAudio = null;
      currentBtn = null;
      return;
    }

    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      if (currentBtn) resetButton(currentBtn);
    }

    // Play new audio
    const audio = new Audio(audioSrc);
    audio.volume = 1.0;
    currentAudio = audio;
    currentBtn = btn;

    // Disable all other buttons
    document.querySelectorAll('.demo-play-btn').forEach(b => {
      if (b !== btn) b.disabled = true;
    });

    btn.innerHTML = '&#9724; Playing...';

    audio.onended = () => {
      resetButton(btn);
      document.querySelectorAll('.demo-play-btn').forEach(b => b.disabled = false);
      currentAudio = null;
      currentBtn = null;
    };

    audio.onerror = () => {
      btn.innerHTML = '&#9654; Audio not found';
      setTimeout(() => {
        resetButton(btn);
        document.querySelectorAll('.demo-play-btn').forEach(b => b.disabled = false);
      }, 2000);
      currentAudio = null;
      currentBtn = null;
    };

    audio.play().catch(() => {
      btn.innerHTML = '&#9654; Could not play';
      setTimeout(() => {
        resetButton(btn);
        document.querySelectorAll('.demo-play-btn').forEach(b => b.disabled = false);
      }, 2000);
      currentAudio = null;
      currentBtn = null;
    });
  });
});

function resetButton(btn) {
  // Restore original text from neighboring elements
  const turn = btn.closest('.demo-turn');
  if (turn.classList.contains('demo-turn-a')) {
    const label = btn.getAttribute('data-audio').includes('turn1') ? getListenerLabel(btn) : getListenerLabel(btn);
    btn.innerHTML = '&#9654; ' + getOriginalLabel(btn);
  } else {
    btn.innerHTML = '&#9654; ' + getOriginalLabel(btn);
  }
}

function getOriginalLabel(btn) {
  // Extract from the original HTML
  const text = btn.textContent || btn.innerText;
  // Since we modified it, use data attribute as fallback
  const audioFile = btn.getAttribute('data-audio');

  const labels = {
    'audio/demo1_turn1.wav': 'Employer hears (ಕನ್ನಡ)',
    'audio/demo1_turn2.wav': 'Worker hears (ଓଡ଼ିଆ)',
    'audio/demo2_turn1.wav': 'Doctor hears (தமிழ்)',
    'audio/demo2_turn2.wav': 'Patient hears (বাংলা)',
    'audio/demo3_turn1.wav': 'Employer hears (മലയാളം)',
    'audio/demo3_turn2.wav': 'Worker hears (हिन्दी)'
  };

  return labels[audioFile] || 'Play';
}
