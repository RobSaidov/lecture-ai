"use client";

import {useState} from "react";

export default function Recorder() {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      <button
        onClick = {() => setIsRecording(!isRecording)}
        className="bg-red-500 text-white px-6 py-3 rounded-full text-lg font-semibold"
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>

      <p className="text-gray-500">
        {isRecording ? "Recording..." : "Click to start"}

      </p>
    </div>
  );
}

