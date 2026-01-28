from fastapi import FastAPI, UploadFile, File # import necessary modules, like FastAPI for creating the server and UploadFile, File for handling file uploads
import os # this helps to create folders and manage file paths
import uuid # this is used to generate unique names for uploaded files

app = FastAPI() # created a server instance

os.makedirs("uploads", exist_ok = True) # creates and uploads folder if it doesn't exist

@app.get("/")
def home():
  return {"message": "LectureAI Backend is running"}
  
  
@app.get("/health") # check status of the server
def health():
  return {"status": "ok"}


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)): # endpoint to handle file uploads
  file_id = str(uuid.uuid4()) # generate a unique id for the file
  file_path = f"uploads/{file_id}_{file.filename}"
  
  # saving the file
  with open(file_path, "wb") as f:
    content = await file.read()
    f.write(content)
    
  return {"file_id": file_id, "filename": file.filename, "status": "uploaded"}
  
  
  
  
  
  
if __name__ == "__main__":
  import uvicorn
  uvicorn.run("main:app", reload=True)
  
  


