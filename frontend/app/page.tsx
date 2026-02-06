import Recorder from "./components/Recorder";

export default function HomePage() {
  return (
    <main className = "min-h-screen flex flex-col items-center justify-center">
      <h1 className = "text-4xl font-bold">LectureAI</h1>
      <p className = "text-gray-500 mt-2">Record your lectures, turn them into notes</p>

      <Recorder />
    </main>
  );
}
