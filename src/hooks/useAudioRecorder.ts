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

  // Cleanup function
  const cleanup = useCallback(async () => {
    if (recordingRef.current) {
      try {
        recordingRef.current.setOnRecordingStatusUpdate(null);
        const status = await recordingRef.current.getStatusAsync();
        if (status.isLoaded) {
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

      const finalDuration = finalStatus.durationMillis;
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
    toggleRecording,
    error
  };
}
