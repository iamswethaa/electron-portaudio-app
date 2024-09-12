{
  "targets": [
    {
      "target_name": "audioaddon",
      "sources": ["src/audioaddon.cpp"],
      "include_dirs": [
        "D:/Downloads/pa_stable_v190700_20210406/portaudio/include"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').targets\"):node_addon_api"
      ],
      "libraries": [
        "C:/msys64/ucrt64/lib/libportaudio.dll.a",
      ],
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ]
    }
  ]
}
