import shutil
import uuid
import logging
from pathlib import Path
from tempfile import gettempdir

from fastapi import APIRouter, File, UploadFile, HTTPException, status

from app.services.transcription_service import TranscriptionService
from app.utils.file_manager import save_upload_file, delete_file

# Initialize logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/transcribe",
    tags=["transcription"]
)

# Instantiate the service once (Global scope for the worker)
# This prevents reloading the model on every request.
try:
    transcription_service = TranscriptionService()
except Exception as e:
    logger.error(f"Failed to initialize TranscriptionService: {e}")
    # We don't raise here to allow app to start, but requests will fail.
    transcription_service = None

@router.post("/", response_model=dict)
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Endpoint para transcrever arquivos de áudio.
    
    Args:
        file (UploadFile): O arquivo de áudio (.m4a, .wav, etc.)
    
    Returns:
        JSON com o texto transcrito e metadados.
    """
    if not transcription_service:
         raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Transcription service is not initialized."
        )

    # Validate file (basic check)
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Filename is missing."
        )

    # Generate a unique temporary filename
    temp_dir = Path(gettempdir())
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    temp_file_path = temp_dir / unique_filename

    try:
        # 1. Save file temporarily
        logger.info(f"Saving temporary file to: {temp_file_path}")
        await save_upload_file(file, temp_file_path)

        # 2. Transcribe
        logger.info("Starting transcription...")
        # Since transcription is CPU bound and synchronous in current service implementation,
        # perfectly asyncio requires run_in_executor, but for now direct call inside async def 
        # might block the event loop. However, standard fastapi handles this if not defined as async?
        # Typically faster-whisper is blocking. 
        # To avoid blocking the event loop:
        # result = await run_in_threadpool(transcription_service.transcribe, str(temp_file_path))
        # But for simplicity as requested, we call directly. 
        # The user requested flow: "Instanciar... Chamar...". 
        
        # NOTE: TranscriptionService.transcribe is synchronous. 
        # Fastapi runs 'async def' in the main event loop. Blocking calls here block the server.
        # Ideally, we should use `def transcribe_audio` (without async) to run in a threadpool,
        # OR use `run_in_threadpool`.
        # However, save_upload_file IS async. So we need async def.
        # We will use starlette.concurrency.run_in_threadpool.
        from starlette.concurrency import run_in_threadpool
        
        result = await run_in_threadpool(transcription_service.transcribe, str(temp_file_path))

        return result

    except Exception as e:
        logger.error(f"Error during transcription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription failed: {str(e)}"
        )
    
    finally:
        # 4. Cleanup
        delete_file(temp_file_path)
