export interface Recording {
  id: string;
  title: string;
  duration: number; // in ms
  createdAt: string;
  status: 'draft' | 'published';
  fileUri: string; // Path to the audio file on the device
  meteringLevels?: number[]; // Optional: stored metering levels for waveform visualization
}

export type RecorderStatus = 'idle' | 'recording' | 'paused' | 'stopped' | 'error';

export interface AudioRecorderHook {
  status: RecorderStatus;
  isRecording: boolean; // Computed convenience: status === 'recording'
  isPaused: boolean;    // Computed convenience: status === 'paused'
  recordingTime: number; // Elapsed time in milliseconds
  audioLevel: number; // Normalized audio level (0.0 to 1.0)
  isVoiceDetected: boolean; // Voice activity detection signal
  startRecording: () => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  stopRecording: () => Promise<Recording | null>;
  toggleRecording: () => Promise<void>;
  error: string | null;
}
