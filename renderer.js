const { ipcRenderer } = require('electron');

let mediaRecorder;
let audioChunks = [];
let audioBlob = null;
let audioUrl = null;

// Initialize Wavesurfer.js for playback
let wavesurfer = WaveSurfer.create({
    /** HTML element or CSS selector (required) */
    container: '#waveform',
    /** The color of the waveform */
    waveColor: 'gray',
    /** The color of the progress mask */
    progressColor: 'rgb(41, 39, 39)',
    /** The color of the playpack cursor */
    cursorColor: 'black',
    /** Pass false to disable clicks on the waveform */
    responsive: true,
    /** The height of the waveform in pixels */
    height: 100,

    /** Whether to show default audio element controls */
    mediaControls: true,
    // Set a bar width
    barWidth: 2,
    // Optionally, specify the spacing between bars
    barGap: 1,
    // And the bar radius
    barRadius: 2,
});

// Handle recording
const recordBtn = document.getElementById('recordBtn');
const playBtn = document.getElementById('playBtn');

recordBtn.addEventListener('click', async () => {
    
    if (recordBtn.textContent === 'Record') {

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
        recordBtn.textContent = 'Stop'; // Change button text


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

    } else {

        mediaRecorder.stop(); // Stop the recording
        mediaRecorder.onstop = () => {
            audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            audioUrl = URL.createObjectURL(audioBlob);
            wavesurfer.load(audioUrl); // Load recorded audio for playback
        };
        recordBtn.textContent = 'Record'; // Change button text back

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
    playBtn.textContent = 'Play';
});
