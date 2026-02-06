from fastapi import FastAPI, UploadFile, File # import necessary modules, like FastAPI for creating the server and UploadFile, File for handling file uploads
from fastapi.middleware.cors import CORSMiddleware # import CORS middleware to handle cross-origin requests
import os # this helps to create folders and manage file paths
import uuid # this is used to generate unique names for uploaded files
import whisper  # placeholder for the transcription library
import uvicorn  # ASGI server for running FastAPI applications
import requests # let's python talk to external APIs or in our case Ollama


app = FastAPI() # created a server instance

# allowing frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # the frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # allowing all the HTTP methods
    allow_headers=["*"],  # also allowing all headers
)

os.makedirs("uploads", exist_ok = True) # creates and uploads folder if it doesn't exist

model = whisper.load_model("small")  # placeholder for loading the transcription model

def generate_notes(transcript: str):
  """
  Sends transcript to Ollama AI and get back organized notes
  
  """
  try: 
    #send request to ollama(it runs on port 11434)
    response = requests.post(
      "http://localhost:11434/api/generate",
      json={
        "model": "llama3.2",
        "prompt": f"""Analyze this lecture transcript and extract:

1. TOPICS: Key concepts covered
2. IMPORTANT DATES: Any deadlines, exam dates, due dates
3. TODOS: Things students need to do

Transcript: {transcript}

Keep it short and organized. Do NOT use markdown formatting like ** or #. Just use plain text with dashes for lists.""",
        "stream": False
      }
    )
    # if it worked, return the notes
    if response.status_code == 200:
      return response.json()['response']
    else:
      return "Error: Could not generate notes."
    
  except Exception as e:
    return f"error connecting to ollama: {str(e)}"
  
  

@app.get("/") # GET endpoint for the home route
def home():
  return {"message": "LectureAI Backend is running"}
  
  
@app.get("/health") # check status of the server # GET endpoint for health check
def health():
  return {"status": "ok"}


@app.post("/upload") # POST endpoint for file upload
async def upload_file(file: UploadFile = File(...)): # endpoint to handle file uploads
  """
  receives an uploaded audio file, transcribe it, and returns the transcript
  
  this endpoint is for uploading existing audio files(not to record through the browser, that will be a future feature) and saving them to the server. The frontend will send a POST request with the audio file, and the backend will save it in the uploads folder with a unique name. The response will include the file ID and original filename for reference.
  
  """
  
  file_id = str(uuid.uuid4()) # generate a unique id for the file
  file_path = f"uploads/{file_id}_{file.filename}"
  
  # saving the file
  with open(file_path, "wb") as f:
    content = await file.read()
    f.write(content)
    
  #transcribe with Whisper
  result= model.transcribe(file_path)
  
  #return the transcript
  return {"file_id": file_id, "filename": file.filename, "transcript": result["text"]}
  
  
@app.post("/transcribe") # POST endpoint for transcription
async def transcribe_file(file: UploadFile = File(...)):
  # Placeholder for transcription logic
  file_id = str(uuid.uuid4())
  file_path = f"uploads/{file_id}_{file.filename}"
  
  #saving the file
  with open(file_path, "wb") as f:
    content = await file.read()
    f.write(content)
    
  result = model.transcribe(file_path) # placeholder for transcription function
  
  return {
    "file_id": file_id,
    "filename": file.filename,
    "transcript": result["text"]
  }
  
@app.post("/generate-notes") # POST endpoint for generating notes
async def generate_lecture_notes(data: dict):
  """receives a transcript and returns ai generate notes
  
  frontend sends - {"transcript": "today we learned about..."}
  backend returns - {notes: "TOPICS: ...\nDates:... \nTODOS: ..."}
  
  """
  
  #get the transcpt from the request
  transcript = data.get("transcript", "")
  
  #check if transcript exists
  if not transcript:
    return {"error": "not transcript provided."}
  
  #send to ollama and get notes
  notes = generate_notes(transcript)
  
  #return the notes
  return {"notes": notes}


  
  
  
if __name__ == "__main__":
  import uvicorn
  uvicorn.run("main:app", reload=True)
  
  


