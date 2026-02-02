import { Platform } from 'react-native';
import Constants from 'expo-constants';

export interface TranscriptionResult {
  title?: string;
  text: string;
  language: string;
  start_time: number;
  end_time: number;
  duration: number;
}

const ANDROID_EMULATOR_URL = 'http://10.0.2.2:8000/transcribe/';
const LOCALHOST_URL = 'http://localhost:8000/transcribe/';

export class TranscriptionService {
  private getApiUrl(): string {
    // If running on Android Emulator, use 10.0.2.2
    if (Platform.OS === 'android') {
      return ANDROID_EMULATOR_URL;
    }

    // Attempt to get the host URI from Expo Go/Dev Client
    const debuggerHost = Constants.expoConfig?.hostUri; // e.g. "192.168.1.5:8081"

    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0];
      // Use the detected IP with the backend port (8000)
      return `http://${ip}:8000/transcribe/`;
    }

    // Fallback for simulators or if hostUri is missing
    return LOCALHOST_URL;
  }

  async transcribeAudio(fileUri: string): Promise<TranscriptionResult> {
    const apiUrl = this.getApiUrl();
    const formData = new FormData();

    const filename = fileUri.split('/').pop() || 'recording.m4a';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `audio/${match[1]}` : 'audio/m4a';

    // @ts-ignore: React Native FormData expects an object with uri, name, type
    formData.append('file', {
      uri: fileUri,
      name: filename,
      type: type,
    });

    try {
      console.log(`Transcribing ${fileUri} to ${apiUrl}...`);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Transcription failed: ${response.status} ${errorText}`);
      }

      const result: TranscriptionResult = await response.json();
      return result;
    } catch (error) {
      console.error('Transcription service error:', error);
      throw error;
    }
  }
}

export const transcriptionService = new TranscriptionService();
