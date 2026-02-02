import os
import re
from faster_whisper import WhisperModel
from transformers import pipeline

class TranscriptionService:
    def __init__(self, model_size: str = "medium", device: str = "cpu", compute_type: str = "int8"):
        """
        Initializes the TranscriptionService with Faster-Whisper and a local AI Summarizer.
        """
        print(f"Loading Whisper model: {model_size} on {device} with {compute_type}...")
        self.model = WhisperModel(model_size, device=device, compute_type=compute_type)
        
        print("Loading local AI Title Generator (t5-small)...")
        try:
            # Carrega um modelo de sumarização local para gerar o título
            self.summarizer = pipeline(
                "summarization", 
                model="t5-small", 
                device=-1  # Força CPU
            )
            print("AI Title Generator loaded.")
        except Exception as e:
            print(f"Warning: Could not load local AI Title Generator: {e}")
            self.summarizer = None
        
        print("Services initialized successfully.")

    def transcribe(self, file_path: str, language: str = "pt") -> dict:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Audio file not found at: {file_path}")

        segments, info = self.model.transcribe(file_path, language=language)

        segment_list = list(segments)
        full_text = " ".join([segment.text for segment in segment_list]).strip()

        # IA Analysis for Title
        title = self._generate_ai_title(full_text)
        print(f"AI Generated title: '{title}'")

        return {
            "title": title,
            "text": full_text,
            "language": info.language,
            "start_time": 0.0,
            "end_time": info.duration,
            "duration": info.duration
        }

    def _generate_ai_title(self, text: str) -> str:
        """
        Uses local AI to analyze text and generate a meaningful title.
        """
        if not text or len(text.strip()) < 10:
            return "Nova Transcrição"

        if self.summarizer:
            try:
                # O T5 espera o prefixo 'summarize: '
                # Limitamos o tamanho para gerar algo curto como um título
                input_text = f"summarize: {text[:512]}" # Limita entrada para performance
                result = self.summarizer(input_text, max_length=15, min_length=3, do_sample=False)
                
                title = result[0]['summary_text']
                # Limpeza básica do título gerado
                title = re.sub(r'[^\w\s]', '', title).strip()
                title = title.capitalize()
                
                if title:
                    return title
            except Exception as e:
                print(f"AI Title generation error: {e}")

        # Fallback inteligente (Heurística de backup)
        text = text.strip()
        sentences = re.split(r'(?<=[.!?])\s+', text)
        candidate = sentences[0] if sentences else text
        return (candidate[:47] + "...") if len(candidate) > 50 else candidate

