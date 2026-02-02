cd backend
docker build -t voice-ai-backend .
docker run -p 8000:8000 voice-ai-backend