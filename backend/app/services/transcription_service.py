import os
from faster_whisper import WhisperModel

class TranscriptionService:
    def __init__(self, model_size: str = "small", device: str = "cpu", compute_type: str = "int8"):
        """
        Initializes the TranscriptionService with the specified Faster-Whisper model configuration.
        """
        print(f"Loading Whisper model: {model_size} on {device} with {compute_type}...")
        self.model = WhisperModel(model_size, device=device, compute_type=compute_type)
        print("Whisper model loaded successfully.")

    def transcribe(self, file_path: str, language: str = "pt") -> dict:
        """
        Transcribes the given audio file using Faster-Whisper.

        Args:
            file_path (str): The absolute path to the audio file.
            language (str): The language code to force transcription (default: 'pt').
                            If None is passed, auto-detection logic could be applied, 
                            but based on requirements, we stick to 'pt' default.

        Returns:
            dict: A dictionary containing:
                - text (str): The full transcribed text.
                - language (str): The detected or forced language.
                - start_time (float): Start time of the transcription (usually 0.0).
                - end_time (float): End time based on duration.
                - duration (float): Total duration of the audio.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Audio file not found at: {file_path}")

        # Configura o transcribe do whisper para forçar o idioma português (language='pt') 
        # mas permite que seja informado outro via argumento.
        segments, info = self.model.transcribe(file_path, language=language)

        # Convert segments generator to list to extract text
        # While converting, we concatenate the text.
        segment_list = list(segments)
        full_text = " ".join([segment.text for segment in segment_list]).strip()

        return {
            "text": full_text,
            "language": info.language,
            "start_time": 0.0,
            "end_time": info.duration,
            "duration": info.duration
        }
