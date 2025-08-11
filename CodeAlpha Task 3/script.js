/* Music Player - JavaScript */

const audioElement = document.getElementById('audio');
const coverImage = document.getElementById('cover');
const titleElement = document.getElementById('title');
const artistElement = document.getElementById('artist');
const progressInput = document.getElementById('progress');
const currentTimeElement = document.getElementById('currentTime');
const totalDurationElement = document.getElementById('totalDuration');
const playPauseButton = document.getElementById('playPauseBtn');
const prevButton = document.getElementById('prevBtn');
const nextButton = document.getElementById('nextBtn');
const volumeInput = document.getElementById('volume');
const autoplayToggle = document.getElementById('autoplayToggle');
const playlistContainer = document.getElementById('playlist');

// Example playlist using freely accessible sample tracks.
// Replace src and cover with your local files in assets/audio and assets/covers for offline use.
const playlist = [
  {
    title: 'SoundHelix Song 1',
    artist: 'T. Schürger',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    cover: 'https://picsum.photos/seed/music1/600'
  },
  {
    title: 'SoundHelix Song 2',
    artist: 'T. Schürger',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    cover: 'https://picsum.photos/seed/music2/600'
  },
  {
    title: 'SoundHelix Song 3',
    artist: 'T. Schürger',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    cover: 'https://picsum.photos/seed/music3/600'
  }
];

let currentTrackIndex = 0;
let isSeekingWithSlider = false;

init();

function init() {
  // Restore autoplay preference
  const savedAutoplay = localStorage.getItem('mp_autoplay_enabled');
  if (savedAutoplay !== null) {
    autoplayToggle.checked = savedAutoplay === 'true';
  }

  // Initialize volume
  audioElement.volume = Number(volumeInput.value);

  // Build playlist UI
  renderPlaylist();

  // Load initial track
  loadTrack(currentTrackIndex, { autoPlay: false });

  // Wire up controls
  playPauseButton.addEventListener('click', togglePlayPause);
  prevButton.addEventListener('click', playPreviousTrack);
  nextButton.addEventListener('click', playNextTrack);
  volumeInput.addEventListener('input', (e) => {
    audioElement.volume = Number(e.target.value);
  });

  autoplayToggle.addEventListener('change', () => {
    localStorage.setItem('mp_autoplay_enabled', String(autoplayToggle.checked));
  });

  // Progress bar events
  progressInput.addEventListener('input', handleProgressInput);
  progressInput.addEventListener('change', handleProgressChange);

  // Audio events
  audioElement.addEventListener('timeupdate', handleTimeUpdate);
  audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
  audioElement.addEventListener('ended', handleEnded);

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeydownShortcuts);
}

function renderPlaylist() {
  playlistContainer.innerHTML = '';

  playlist.forEach((track, index) => {
    const li = document.createElement('li');
    li.className = 'playlist-item';
    li.dataset.index = String(index);

    li.innerHTML = `
      <img class="thumb" src="${track.cover}" alt="Cover" />
      <div>
        <p class="item-title">${track.title}</p>
        <p class="item-artist">${track.artist}</p>
      </div>
      <div class="item-duration" id="dur-${index}">--:--</div>
    `;

    li.addEventListener('click', () => {
      if (currentTrackIndex === index && !audioElement.paused) {
        togglePlayPause();
      } else {
        currentTrackIndex = index;
        loadTrack(currentTrackIndex, { autoPlay: true });
      }
    });

    playlistContainer.appendChild(li);

    // Preload duration metadata in background by creating a temp audio
    const tempAudio = new Audio();
    tempAudio.preload = 'metadata';
    tempAudio.src = track.src;
    tempAudio.addEventListener('loadedmetadata', () => {
      const durationLabel = document.getElementById(`dur-${index}`);
      if (durationLabel) {
        durationLabel.textContent = formatTime(tempAudio.duration);
      }
      tempAudio.remove();
    });
  });
}

function loadTrack(index, options = { autoPlay: false }) {
  const track = playlist[index];
  if (!track) return;

  audioElement.src = track.src;
  titleElement.textContent = track.title;
  artistElement.textContent = track.artist;
  coverImage.src = track.cover;

  // Reset progress UI
  progressInput.value = '0';
  currentTimeElement.textContent = '0:00';
  totalDurationElement.textContent = '0:00';

  // Update playlist active state
  updateActivePlaylistItem();

  if (options.autoPlay) {
    audioElement.play().then(() => updatePlayPauseUI()).catch(() => {
      // Autoplay might be blocked by the browser until a user gesture
      updatePlayPauseUI();
    });
  } else {
    updatePlayPauseUI();
  }
}

function updateActivePlaylistItem() {
  const items = playlistContainer.querySelectorAll('.playlist-item');
  items.forEach((el, idx) => {
    el.classList.toggle('active', idx === currentTrackIndex);
  });
}

function togglePlayPause() {
  if (audioElement.paused) {
    audioElement.play();
  } else {
    audioElement.pause();
  }
  updatePlayPauseUI();
}

function updatePlayPauseUI() {
  playPauseButton.textContent = audioElement.paused ? '▶' : '⏸';
}

function playPreviousTrack() {
  currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
  loadTrack(currentTrackIndex, { autoPlay: true });
}

function playNextTrack() {
  currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
  loadTrack(currentTrackIndex, { autoPlay: true });
}

function handleLoadedMetadata() {
  totalDurationElement.textContent = formatTime(audioElement.duration);
  progressInput.max = String(audioElement.duration || 0);
}

function handleTimeUpdate() {
  if (!isSeekingWithSlider) {
    progressInput.value = String(audioElement.currentTime || 0);
  }
  currentTimeElement.textContent = formatTime(audioElement.currentTime);
}

function handleEnded() {
  if (autoplayToggle.checked) {
    playNextTrack();
  } else {
    // Reset play UI
    updatePlayPauseUI();
  }
}

function handleProgressInput(e) {
  isSeekingWithSlider = true;
  const newTime = Number(e.target.value);
  currentTimeElement.textContent = formatTime(newTime);
}

function handleProgressChange(e) {
  const newTime = Number(e.target.value);
  audioElement.currentTime = newTime;
  isSeekingWithSlider = false;
}

function handleKeydownShortcuts(e) {
  // Do not interfere with typing into inputs
  const tag = document.activeElement?.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;

  if (e.code === 'Space') {
    e.preventDefault();
    togglePlayPause();
  } else if (e.key === 'ArrowRight') {
    audioElement.currentTime = Math.min((audioElement.currentTime || 0) + 5, audioElement.duration || Infinity);
  } else if (e.key === 'ArrowLeft') {
    audioElement.currentTime = Math.max((audioElement.currentTime || 0) - 5, 0);
  } else if (e.key === 'ArrowUp') {
    audioElement.volume = Math.min((audioElement.volume || 0) + 0.05, 1);
    volumeInput.value = String(audioElement.volume);
  } else if (e.key === 'ArrowDown') {
    audioElement.volume = Math.max((audioElement.volume || 0) - 0.05, 0);
    volumeInput.value = String(audioElement.volume);
  } else if (e.key.toLowerCase() === 'n') {
    playNextTrack();
  } else if (e.key.toLowerCase() === 'p') {
    playPreviousTrack();
  }
}

function formatTime(seconds) {
  if (!isFinite(seconds)) return '0:00';
  const totalSeconds = Math.floor(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
} 