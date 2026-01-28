from fastapi import FastAPI


app = FastAPI() # created a server instance

@app.get("/")
def home():
  return {"message": "LectureAI Backend is running"}
  
  
@app.get("/health")
def health():
  return {"status": "ok"}


if __name__ == "__main__":
  import uvicorn
  uvicorn.run("main:app", reload=True)
  
  


