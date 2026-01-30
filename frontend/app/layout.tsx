import "./globals.css";

export const metadata = {
  title: "LectureAI",
  description: "Record the lectures and turn them into notes"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

