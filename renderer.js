const { ipcRenderer } = require('electron');

let mediaRecorder;
let audioChunks = [];
let audioBlob = null;
let audioUrl = null;

// Initialize Wavesurfer.js for playback
let wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: 'violet',
    progressColor: 'purple',
    cursorColor: 'navy',
    responsive: true,
    height: 100,
});

// Handle recording
const recordBtn = document.getElementById('recordBtn');
const stopBtn = document.getElementById('stopBtn');
const playBtn = document.getElementById('playBtn');

recordBtn.addEventListener('click', async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    // Create an AudioContext for the visualizer
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.fftSize = 2048;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
    };

    mediaRecorder.start();

    // Update the waveform
    function updateWaveform() {
        if (mediaRecorder.state === 'recording') {
            analyser.getByteTimeDomainData(dataArray);
            wavesurfer.empty(); // Clear previous waveform data

            // Create a buffer for the waveform visualization
            const buffer = audioContext.createBuffer(1, bufferLength, audioContext.sampleRate);
            buffer.copyToChannel(dataArray, 0);
            wavesurfer.loadDecodedBuffer(buffer); // Load the buffer into Wavesurfer
            requestAnimationFrame(updateWaveform); // Keep updating
        }
    }

    updateWaveform(); // Start the update loop
});

stopBtn.addEventListener('click', () => {
    if (mediaRecorder) {
        mediaRecorder.stop(); // Stop the recording
        mediaRecorder.onstop = () => {
            audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            audioUrl = URL.createObjectURL(audioBlob);
            wavesurfer.load(audioUrl); // Load recorded audio for playback
        };
    }
});

// Play the recorded audio with waveform
playBtn.addEventListener('click', () => {
    if (audioUrl) {
        wavesurfer.playPause(); // Toggle play/pause
    } else {
        alert('No audio recorded yet.');
    }
});

// Update play/pause button based on Wavesurfer state
wavesurfer.on('play', () => {
    playBtn.textContent = 'Pause';
});

wavesurfer.on('pause', () => {
    playBtn.textContent = 'Play Audio';
});
