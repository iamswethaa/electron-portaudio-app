const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const AudioRecorder = require('./native-addon/build/Release/audioaddon');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // To allow communication between renderer and main process
    },
  });

  mainWindow.loadFile('index.html');
}

app.on('ready', createWindow);

// IPC communication to control audio recording and playback
ipcMain.on('start-recording', (event) => {
  console.log('Recording started');
  AudioRecorder.startRecording();
});

ipcMain.on('stop-recording', (event) => {
  console.log('Recording stopped');
  AudioRecorder.stopRecording();
});

ipcMain.on('play-audio', (event) => {
  console.log('Playing');
  AudioRecorder.playAudio();
});
