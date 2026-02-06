"use client";

import { useState, useRef } from "react";

export default function Recorder() {
  // state variables - these update the UI when changed
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);

  // refs - these dont trigger re-renders, just store values
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null); // for the hidden file input

  // sends recorded audio to the backend for transcription
  const sendToBackend = async (audioBlob: Blob) => {
    setIsLoading(true);
    setTranscript(null);

    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");

      const response = await fetch("http://localhost:8000/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to transcribe");
      }

      const data = await response.json();
      setTranscript(data.transcript);
    } catch (err) {
      setError("Failed to send to backend. Is it running?");
      console.log("Backend error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // handles when user uploads a file instead of recording
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setTranscript(null);
    setNotes(null);

    // create a url so we can play the uploaded file
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

  // sends transcript to ollama to get organized notes back
  const generateNotes = async () => {
    if (!transcript) return;

    setIsGeneratingNotes(true);
    setNotes(null);

    try {
      const response = await fetch("http://localhost:8000/generate-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // telling backend we're sending json
        },
        body: JSON.stringify({ transcript }),
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
    // check if browser supports microphone
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Microphone access is not supported in this browser.");
      return;
    }

    try {
      // ask for microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // wait for mic to warm up so we dont get noise at the start
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // collect audio chunks as they come in
      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      // when recording stops, combine chunks and send to backend
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);

        sendToBackend(blob);

        chunksRef.current = [];

        // stop all mic tracks so the browser mic indicator goes away
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
      setTranscript(null);
      setNotes(null);
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
    <div className="space-y-6">

      {/* record and upload buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className="px-5 py-2.5 rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-800 transition-colors"
        >
          {isRecording ? "Stop Recording" : "Record"}
        </button>

        <span className="text-gray-400 text-sm">or</span>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Upload File
        </button>
        {/* hidden file input - gets triggered when upload button is clicked */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* recording indicator - small red dot */}
        {isRecording && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-500">Recording</span>
          </div>
        )}
      </div>

      {/* error messages */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* audio player - shows for both recorded and uploaded files */}
      {audioURL && (
        <div className="border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Audio
          </p>
          <audio src={audioURL} controls className="w-full" />
        </div>
      )}

      {/* loading spinner while transcribing */}
      {isLoading && (
        <div className="flex items-center gap-2 py-4">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Transcribing audio...</span>
        </div>
      )}

      {/* transcript section */}
      {transcript && (
        <div className="border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Transcript
          </p>
          <p className="text-sm text-gray-800 leading-relaxed">{transcript}</p>
        </div>
      )}

      {/* generate notes button - only shows after we have a transcript */}
      {transcript && !isGeneratingNotes && (
        <button
          onClick={generateNotes}
          className="px-5 py-2.5 rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-800 transition-colors"
        >
          Generate Notes
        </button>
      )}

      {/* loading spinner while generating notes */}
      {isGeneratingNotes && (
        <div className="flex items-center gap-2 py-4">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Generating notes...</span>
        </div>
      )}

      {/* notes section */}
      {notes && (
        <div className="border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Notes
          </p>
          <pre className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-sans">
            {notes}
          </pre>
        </div>
      )}
    </div>
  );
}

