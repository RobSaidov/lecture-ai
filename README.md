# LectureAI

Speech-to-text transcription with automated note extraction using Whisper and Llama 3.2.

## Stack
Next.js, FastAPI, Whisper (244M), Llama 3.2 (3B via Ollama)

## Features
- Audio recording and file upload
- Real-time transcription
- Structured note generation (topics, dates, TODOs)
- Local inference, zero API costs

## Setup
```bash
# Backend
cd backend && python -m venv venv && .\venv\Scripts\Activate
pip install fastapi uvicorn python-multipart openai-whisper requests
ollama pull llama3.2
python main.py

# Frontend
cd frontend && npm install && npm run dev
```

## Endpoints
```
POST /transcribe       - Audio → text
POST /generate-notes   - Text → structured notes
```

## Performance
10s transcription per audio minute. Local processing, no API costs.

---

MIT License | [Rob Saidov] | [@robsaidov]