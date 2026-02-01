"use client";

import {useState, useRef} from "react";

export default function Recorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);



  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null); // to stop the stream later if needed

  const sendToBackend = async (audioBlob: Blob) => {
    setIsLoading(true);  // Show "Transcribing..."
    setTranscript(null); // Clear old transcript

    try {
      // Put the audio file in a "FormData envelope"
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");

      // Send to your backend
      const response = await fetch("http://localhost:8000/transcribe", {
        method: "POST",
        body: formData,
      });

      // Check if it worked
      if (!response.ok) {
        throw new Error("Failed to transcribe");
      }

      // Get the transcript from response
      const data = await response.json();
      setTranscript(data.transcript);
    } catch (err) {
      setError("Failed to send to backend. Is it running?");
      console.log("Backend error:", err);
    } finally {
      setIsLoading(false); // Hide "Transcribing..."
    }
  };




  const startRecording = async () => {
    // Check if browser suports microphone access
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Microphone access is not supported in this browser.");
      return;
    }

    try {  
      // ask browser for microphone access
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      streamRef.current = stream;

      // small delay to ensure stream is ready

      await new Promise((resolve) => setTimeout(resolve, 300));

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
        

        // Send the audio blob to the backend for transcription
        sendToBackend(blob);

        chunksRef.current = []; // clear for next recording
        
        // Turn off microphone
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

      };  


      //start recording
      mediaRecorder.start();
      setIsRecording(true);
      setError(null); // clear previous errors
      setTranscript(null); // clear previous transcript
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

      {/* Show loading indicator */}
      {isLoading && (
        <p className="text-gray-500 mt-2">Transcribing...</p>
      )}
      {/* Show transcript if available */}
      {transcript && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg max-w-md">
          <p className="text-sm font-semibold mb-2">Transcript:</p>
          <p className="text-gray-700">{transcript}</p>
        </div>
      )}
    </div>
  );
}

