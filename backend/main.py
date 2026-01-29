from fastapi import FastAPI, UploadFile, File # import necessary modules, like FastAPI for creating the server and UploadFile, File for handling file uploads
import os # this helps to create folders and manage file paths
import uuid # this is used to generate unique names for uploaded files
import whisper  # placeholder for the transcription library

app = FastAPI() # created a server instance

os.makedirs("uploads", exist_ok = True) # creates and uploads folder if it doesn't exist

model = whisper.load_model("small")  # placeholder for loading the transcription model

@app.get("/") # GET endpoint for the home route
def home():
  return {"message": "LectureAI Backend is running"}
  
  
@app.get("/health") # check status of the server # GET endpoint for health check
def health():
  return {"status": "ok"}


@app.post("/upload") # POST endpoint for file upload
async def upload_file(file: UploadFile = File(...)): # endpoint to handle file uploads
  file_id = str(uuid.uuid4()) # generate a unique id for the file
  file_path = f"uploads/{file_id}_{file.filename}"
  
  # saving the file
  with open(file_path, "wb") as f:
    content = await file.read()
    f.write(content)
    
  return {"file_id": file_id, "filename": file.filename, "status": "uploaded"}
  
  
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
  
  
if __name__ == "__main__":
  import uvicorn
  uvicorn.run("main:app", reload=True)
  
  


