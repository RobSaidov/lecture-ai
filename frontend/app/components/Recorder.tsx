"use client";

import {useState, useRef} from "react";

export default function Recorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);



  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null); // to stop the stream later if needed
  const fileInputRef= useRef<HTMLInputElement | null>(null);


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

  // function to handle file upload

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setTranscript(null);
    setNotes(null);
    const fileURL = URL.createObjectURL(file);
    setAudioURL(fileURL);

    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const data = await response.json();
      setTranscript(data.transcript);
      setError(null);
    } catch (err) {
      setError("Failed to upload file. Is it an audio file?");
      console.log("Upload error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNotes = async () => {
    if (!transcript) return;
    
    setIsGeneratingNotes(true);
    setNotes(null);
    
    try {
      const response = await fetch("http://localhost:8000/generate-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",  // telling bakcend we are sending JSON
        },
        body: JSON.stringify({ transcript }),  //send the transcript as JSON
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate notes");
      }
      
      const data = await response.json();
      setNotes(data.notes);
    } catch (err) {
      setError("Failed to generate notes. Is Ollama running?");
      console.log("Notes error:", err);
    } finally {
      setIsGeneratingNotes(false);
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

      await new Promise((resolve) => setTimeout(resolve, 1000));

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
      setNotes(null); // clear previous notes




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
      {/* Recording Button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className="bg-red-500 text-white px-6 py-3 rounded-full text-lg font-semibold"
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>

      <p className="text-gray-500">
        {isRecording ? "Recording..." : "Click to start"}
      </p>

      {/* File Upload Section - SEPARATE from the <p> above */}
      <div className="mt-4 text-center">
        <span className="text-gray-500 mb-2 block">OR</span>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-500 text-white px-6 py-3 rounded-full text-lg font-semibold"
        >
          Upload Audio File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

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
      {/* Generate Notes button - only show after transcript is ready */}
      {transcript && !isGeneratingNotes && (
        <button
          onClick={generateNotes}
          className="bg-blue-500 text-white px-6 py-3 rounded-full text-lg font-semibold mt-4"
        >
          Generate Notes
        </button>
      )}

      {/* Show loading while generating notes */}
      {isGeneratingNotes && (
        <p className="text-blue-500">Generating notes...</p>
      )}

      {/*Show notes when ready */}
      {notes && (
        <div className="mt-4 p-4 bg-green-100 rounded-lg max-w-md">
          <p className="text-sm font-semibold mb-2">Notes:</p>
          <pre className="text-gray-700 whitespace-pre-wrap text-sm">{notes}</pre>
        </div>
      )}
    </div>
  );
}

