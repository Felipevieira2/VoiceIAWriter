import { useState, useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeUri, setActiveUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  // Use a ref for the sound object for immediate access in async functions
  const soundRef = useRef<Audio.Sound | null>(null);
  const [, setReRender] = useState({}); // To trigger re-renders when soundRef changes if needed

  const play = useCallback(async (uri: string, seekToMillis?: number) => {
    try {
      if (soundRef.current) {
        if (activeUri === uri) {
          if (seekToMillis !== undefined) {
            await soundRef.current.setPositionAsync(seekToMillis);
          }
          await soundRef.current.playAsync();
          setIsPlaying(true);
          return;
        } else {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound: newSound, status: initialStatus } = await Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: true,
          positionMillis: seekToMillis || 0
        }
      );

      soundRef.current = newSound;
      setActiveUri(uri);
      setIsPlaying(true);

      if (initialStatus.isLoaded && initialStatus.durationMillis) {
        setDuration(initialStatus.durationMillis);
      }

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setIsPlaying(status.isPlaying);
          setPosition(status.positionMillis);
          if (status.durationMillis) {
            setDuration(status.durationMillis);
          }

          if (status.didJustFinish) {
            setIsPlaying(false);
            setPosition(0);
            newSound.setPositionAsync(0);
          }
        } else if (status.error) {
          setError(status.error);
        }
      });

    } catch (err: any) {
      console.error('Failed to play', err);
      setError(err.message);
    }
  }, [activeUri]);

  const pause = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    }
  }, []);

  const stop = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      setIsPlaying(false);
      setPosition(0);
    }
  }, []);

  const seek = useCallback(async (positionMillis: number) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(positionMillis);
      setPosition(positionMillis);
    } else if (activeUri) {
      // If we have a URI but no sound object, we play it from that position
      await play(activeUri, positionMillis);
    }
  }, [activeUri, play]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  return { play, pause, stop, seek, isPlaying, activeUri, error, position, duration };
}
