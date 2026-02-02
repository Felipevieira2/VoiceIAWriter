from fastapi import FastAPI
from app.routers import transcribe

app = FastAPI(
    title="VoiceIAWriter Backend",
    description="Local Audio Transcription API using faster-whisper",
    version="0.1.0"
)

# Include routers
app.include_router(transcribe.router)

@app.get("/")
def read_root():
    return {
        "status": "online", 
        "service": "VoiceIAWriter Backend",
        "docs_url": "/docs"
    }
