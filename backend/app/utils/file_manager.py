
from pathlib import Path
import os
import logging
from fastapi import UploadFile

# Configure basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def save_upload_file(upload_file: UploadFile, destination: Path) -> None:
    """
    Asynchronously saves an uploaded file to the destination path.
    
    Args:
        upload_file (UploadFile): The file uploaded via FastAPI.
        destination (Path): The target path to save the file.
    """
    try:
        # Create parent directories if they don't exist
        destination.parent.mkdir(parents=True, exist_ok=True)
        
        with open(destination, "wb") as buffer:
            while content := await upload_file.read(1024 * 1024):  # Read in 1MB chunks
                buffer.write(content)
        
        logger.info(f"File saved successfully at {destination}")
    except Exception as e:
        logger.error(f"Error saving file to {destination}: {e}")
        # Clean up partial file if needed, or just re-raise
        if destination.exists():
            try:
                os.remove(destination)
            except:
                pass
        raise e
    finally:
        await upload_file.close()

def delete_file(file_path: Path) -> None:
    """
    Deletes a file from the filesystem.
    
    Args:
        file_path (Path): The path to the file to be deleted.
    """
    try:
        if file_path.exists():
            os.remove(file_path)
            logger.info(f"File deleted: {file_path}")
        else:
            logger.warning(f"Attempted to delete non-existent file: {file_path}")
    except PermissionError:
        logger.error(f"Permission denied: Unable to delete {file_path}")
    except Exception as e:
        logger.error(f"Error deleting file {file_path}: {e}")
