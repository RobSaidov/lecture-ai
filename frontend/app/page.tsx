import Recorder from "./components/Recorder";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* top bar with the app name */}
      <header className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-medium text-black tracking-tight">LectureAI</h1>
      </header>

      {/* main content area */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h2 className="text-3xl font-semibold text-black tracking-tight">
            Transcribe and analyze your lectures
          </h2>
          <p className="text-gray-500 mt-2 text-sm">
            Record or upload audio. Get transcription and structured notes.
          </p>
        </div>

        <Recorder />
      </div>
    </main>
  );
}
