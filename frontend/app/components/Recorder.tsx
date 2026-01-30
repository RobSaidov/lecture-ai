"use client";

import {useState, useRef} from "react";

export default function Recorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    // Check if browser suports microphone access
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Microphone access is not supported in this browser.");
      return;
    }

    try {  
      // ask browser for microphone access
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});

      //create a recorder from the microphone stream
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      //when audio data comes in we save it to chynks
      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      // when recording stops, combine all chunks into a single audio file
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {type: "audio/wav"});
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        chunksRef.current = []; // clear for next recording

      };


      //start recording
      mediaRecorder.start();
      setIsRecording(true);
      setError(null); // clear previous errors
    } catch (err) {
      setError("Could not access microphone. Please check permissions.");
      console.log("Microphone error:", err);  
    }
  
    
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

  };

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      <button
        onClick = {isRecording ? stopRecording : startRecording}
        className="bg-red-500 text-white px-6 py-3 rounded-full text-lg font-semibold"
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>

      <p className="text-gray-500">
        {isRecording ? "Recording..." : "Click to start"}

      </p>
      {/* Show error if something goes wrong*/}
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}


      {/*show audio player if recording*/}
      {audioURL && (
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-2">Your Recording:</p>
          <audio src={audioURL} controls />
        </div>
      )}


    </div>
  );
}

