#include <napi.h>
#include <portaudio.h>
#include <iostream>
#include <vector>
#include <cstring>

PaStream *stream;
#define SAMPLE_RATE (44100)
#define FRAMES_PER_BUFFER (512)

std::vector<float> recordedData;  // Buffer to store recorded audio data
size_t playbackIndex = 0;         // To track playback position in the buffer

class AudioRecorder {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    AudioRecorder();
    ~AudioRecorder();
    static Napi::Value StartRecording(const Napi::CallbackInfo& info);
    static Napi::Value StopRecording(const Napi::CallbackInfo& info);
    static Napi::Value PlayAudio(const Napi::CallbackInfo& info);

private:
    static int RecordCallback(const void *inputBuffer, void *outputBuffer,
                              unsigned long framesPerBuffer,
                              const PaStreamCallbackTimeInfo* timeInfo,
                              PaStreamCallbackFlags statusFlags,
                              void *userData);
    static int PlayCallback(const void *inputBuffer, void *outputBuffer,
                            unsigned long framesPerBuffer,
                            const PaStreamCallbackTimeInfo* timeInfo,
                            PaStreamCallbackFlags statusFlags,
                            void *userData);
};

AudioRecorder::AudioRecorder() {}
AudioRecorder::~AudioRecorder() {}

// Record audio and store it in `recordedData` buffer
int AudioRecorder::RecordCallback(const void *inputBuffer, void *outputBuffer,
                                  unsigned long framesPerBuffer,
                                  const PaStreamCallbackTimeInfo* timeInfo,
                                  PaStreamCallbackFlags statusFlags,
                                  void *userData) {
    const float *in = (const float *)inputBuffer;
    if (inputBuffer == NULL) {
        // Silence input (when no data is available)
        return paContinue;
    }
    
    // Append the recorded samples to the `recordedData` buffer
    for (unsigned long i = 0; i < framesPerBuffer; i++) {
        recordedData.push_back(in[i]);
    }

    return paContinue;
}

// Play the recorded audio from the `recordedData` buffer
int AudioRecorder::PlayCallback(const void *inputBuffer, void *outputBuffer,
                                unsigned long framesPerBuffer,
                                const PaStreamCallbackTimeInfo* timeInfo,
                                PaStreamCallbackFlags statusFlags,
                                void *userData) {
    float *out = (float *)outputBuffer;
    
    // Check if there is still audio data to play
    if (playbackIndex < recordedData.size()) {
        for (unsigned long i = 0; i < framesPerBuffer; i++) {
            // Output the recorded audio data
            out[i] = (playbackIndex < recordedData.size()) ? recordedData[playbackIndex++] : 0.0f;
        }
    } else {
        // Finished playback, fill with silence
        for (unsigned long i = 0; i < framesPerBuffer; i++) {
            out[i] = 0.0f;
        }
        return paComplete;  // Notify PortAudio that playback is finished
    }

    return paContinue;
}

Napi::Object AudioRecorder::Init(Napi::Env env, Napi::Object exports) {
    exports.Set("startRecording", Napi::Function::New(env, StartRecording));
    exports.Set("stopRecording", Napi::Function::New(env, StopRecording));
    exports.Set("playAudio", Napi::Function::New(env, PlayAudio));
    return exports;
}

// Start recording
Napi::Value AudioRecorder::StartRecording(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    recordedData.clear();  // Clear previously recorded data
    Pa_Initialize();
    Pa_OpenDefaultStream(&stream, 1, 0, paFloat32, SAMPLE_RATE, 
                         FRAMES_PER_BUFFER, RecordCallback, nullptr);
    Pa_StartStream(stream);

    return env.Null();
}

// Stop recording
Napi::Value AudioRecorder::StopRecording(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    Pa_StopStream(stream);
    Pa_CloseStream(stream);
    Pa_Terminate();

    return env.Null();
}

// Play the recorded audio
Napi::Value AudioRecorder::PlayAudio(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (recordedData.empty()) {
        Napi::TypeError::New(env, "No audio has been recorded yet!").ThrowAsJavaScriptException();
        return env.Null();
    }

    playbackIndex = 0;  // Reset playback index
    Pa_Initialize();
    Pa_OpenDefaultStream(&stream, 0, 1, paFloat32, SAMPLE_RATE,
                         FRAMES_PER_BUFFER, PlayCallback, nullptr);
    Pa_StartStream(stream);

    return env.Null();
}

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    return AudioRecorder::Init(env, exports);
}

NODE_API_MODULE(audioaddon, InitAll)
