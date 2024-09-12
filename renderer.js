const { ipcRenderer } = require('electron');

document.getElementById('recordBtn').addEventListener('click', () => {
  ipcRenderer.send('start-recording');
});

document.getElementById('stopBtn').addEventListener('click', () => {
  ipcRenderer.send('stop-recording');
});

document.getElementById('playBtn').addEventListener('click', () => {
  ipcRenderer.send('play-audio');
});
