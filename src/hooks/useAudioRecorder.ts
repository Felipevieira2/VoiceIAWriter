import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import { AudioRecorderHook, RecorderStatus, Recording as RecordingType } from '../types/index';
import { recordingService } from '../services/recordingService';

const METERING_MIN_DB = -60;
const VOICE_DETECTION_THRESHOLD = 0.1;
const UPDATE_INTERVAL_MS = 100;

export function useAudioRecorder(): AudioRecorderHook {
  // State Machine
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Observable Data
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isVoiceDetected, setIsVoiceDetected] = useState(false);

  // Refs for mutable instances
  // "Use exactly ONE recording instance stored in useRef"
  const recordingRef = useRef<Audio.Recording | null>(null);
  const meteringRef = useRef<number[]>([]);
  const durationRef = useRef(0);

  // Cleanup function
  const cleanup = useCallback(async () => {
    if (recordingRef.current) {
      try {
        recordingRef.current.setOnRecordingStatusUpdate(null);
        const status = await recordingRef.current.getStatusAsync();
        if (status.canRecord || status.isRecording) {
          await recordingRef.current.stopAndUnloadAsync();
        }
      } catch (err) {
        console.warn('Audio cleanup warning:', err);
      }
      recordingRef.current = null;
    }
  }, []);

  // Ensure cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Status update handler
  const handleStatusUpdate = (statusUpdate: Audio.RecordingStatus) => {
    if (statusUpdate.durationMillis !== undefined) {
      // "Timer must stop when paused" - handled by expo-av durationMillis not increasing when paused
      setRecordingTime(statusUpdate.durationMillis);
      durationRef.current = statusUpdate.durationMillis;
    }

    if (statusUpdate.metering !== undefined) {
      const db = statusUpdate.metering;
      const normalized = Math.max(0, (db - METERING_MIN_DB) / (0 - METERING_MIN_DB));
      setAudioLevel(normalized);
      setIsVoiceDetected(normalized > VOICE_DETECTION_THRESHOLD);

      if (statusUpdate.isRecording) {
        meteringRef.current.push(normalized);
      }
    }
  };

  const startRecording = async () => {
    // State Machine: idle -> recording
    // Allow restarting from stopped/error if needed.
    if (status !== 'idle' && status !== 'stopped' && status !== 'error') {
      throw new Error(`Invalid transition: Cannot start recording from ${status}`);
    }

    try {
      // Ensure any previous recording is cleaned up
      if (recordingRef.current) {
        await cleanup();
      }

      setError(null);
      setRecordingTime(0);
      durationRef.current = 0;
      setAudioLevel(0);
      meteringRef.current = [];

      // Permissions
      const permissionResponse = await Audio.requestPermissionsAsync();
      if (permissionResponse.status !== 'granted') {
        throw new Error('Microphone permission not granted');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create NEW instance only on start
      const recording = new Audio.Recording();

      // Assign IMMEDIATELY so cleanup works if prepare/start fails
      recordingRef.current = recording;

      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);

      recording.setOnRecordingStatusUpdate(handleStatusUpdate);
      recording.setProgressUpdateInterval(UPDATE_INTERVAL_MS);

      await recording.startAsync();

      setStatus('recording');

    } catch (err: any) {
      console.error('Start Recording Error:', err);
      setError(err.message || 'Failed to start recording');
      setStatus('error');
      // Cleanup will now properly unload the instance because recordingRef.current is set
      await cleanup();
    }
  };

  const pauseRecording = async () => {
    // State Machine: recording -> paused
    if (status !== 'recording') {
      throw new Error(`Invalid transition: Cannot pause from ${status}`);
    }

    if (!recordingRef.current) {
      throw new Error('No active recording session');
    }

    try {
      // "Pause must call recording.pauseAsync()"
      // "Do NOT unload the recording on pause"
      await recordingRef.current.pauseAsync();
      setStatus('paused');

      // Optional: zero out level for UI
      setAudioLevel(0);
      setIsVoiceDetected(false);
    } catch (err: any) {
      console.error('Pause Error:', err);
      setError('Failed to pause recording');
      setStatus('error');
    }
  };

  const resumeRecording = async () => {
    // State Machine: paused -> recording
    if (status !== 'paused') {
      throw new Error(`Invalid transition: Cannot resume from ${status}`);
    }

    if (!recordingRef.current) {
      throw new Error('No active recording session to resume');
    }

    try {
      // "Resume must call recording.startAsync()"
      // "Do NOT create a new Audio.Recording instance on resume"
      await recordingRef.current.startAsync();
      setStatus('recording');
    } catch (err: any) {
      console.error('Resume Error:', err);
      setError('Failed to resume recording');
      setStatus('error');
    }
  };

  const stopRecording = async (): Promise<RecordingType | null> => {
    // State Machine: recording -> stopped
    // Also handling paused -> stopped as implied necessity
    if (status !== 'recording' && status !== 'paused') {
      throw new Error(`Invalid transition: Cannot stop from ${status}`);
    }

    if (!recordingRef.current) {
      return null;
    }

    try {
      const recording = recordingRef.current;

      // 1. Stop and Unload first
      const finalStatus = await recording.stopAndUnloadAsync();

      // 2. Get URI after unloading
      const uri = recording.getURI();

      // 3. Cleanup ref immediately
      recording.setOnRecordingStatusUpdate(null);
      recordingRef.current = null;

      if (!uri) {
        // Instead of throwing, treat as a non-error case and return null
        console.warn('No recording URI generated');
        setStatus('stopped');
        return null;
      }

      let finalDuration = finalStatus.durationMillis || durationRef.current;

      // Double check: if duration is still 0 (short recording or bug), try to check file
      if (finalDuration === 0) {
        try {
          const { sound: checkSound, status: checkStatus } = await Audio.Sound.createAsync({ uri });
          if (checkStatus.isLoaded && checkStatus.durationMillis) {
            finalDuration = checkStatus.durationMillis;
          }
          await checkSound.unloadAsync();
        } catch (e) {
          console.warn("Retrying duration check failed", e);
        }
      }

      setRecordingTime(finalDuration);

      // 4. Save
      const savedRecording = await recordingService.saveRecording(
        uri,
        finalDuration,
        meteringRef.current
      );

      setStatus('stopped');
      return savedRecording;

    } catch (err: any) {
      console.error('Stop Error:', err);
      setError(err.message || 'Failed to stop recording');
      setStatus('error');
      await cleanup();
      return null;
    }
  };

  const cancelRecording = async (): Promise<void> => {
    if (status !== 'recording' && status !== 'paused') return;

    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current.setOnRecordingStatusUpdate(null);
        recordingRef.current = null;
      }

      // Reset state
      setRecordingTime(0);
      setAudioLevel(0);
      meteringRef.current = [];
      setStatus('idle');

    } catch (err: any) {
      console.error('Cancel Error:', err);
      setError(err.message || 'Failed to cancel recording');
      setStatus('error');
      await cleanup();
    }
  };


  const toggleRecording = async () => {
    try {
      if (status === 'recording') {
        await pauseRecording();
      } else if (status === 'paused') {
        await resumeRecording();
      } else {
        await startRecording();
      }
    } catch (err) {
      // Errors handled in individual methods
    }
  };

  return {
    status,
    isRecording: status === 'recording',
    isPaused: status === 'paused',
    recordingTime,
    audioLevel,
    isVoiceDetected,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    toggleRecording,
    error
  };
}
