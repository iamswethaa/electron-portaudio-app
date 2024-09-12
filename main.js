const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const AudioRecorder = require('./native-addon/build/Release/audioaddon');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false, // To allow communication between renderer and main process
    },
  });

  mainWindow.loadFile('index.html');
}

app.on('ready', createWindow);

// IPC communication to control audio recording and playback
ipcMain.on('start-recording', (event) => {
  AudioRecorder.startRecording();
});

ipcMain.on('stop-recording', (event) => {
  AudioRecorder.stopRecording();
});

ipcMain.on('play-audio', (event) => {
  AudioRecorder.playAudio();
});
