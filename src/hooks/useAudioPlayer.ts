import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

export function useAudioPlayer() {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeUri, setActiveUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const play = async (uri: string) => {
    try {
      if (sound) {
        if (activeUri === uri) {
           await sound.playAsync();
           setIsPlaying(true);
           return;
        } else {
           await sound.unloadAsync();
        }
      }

      await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
         { uri },
         { shouldPlay: true }
      );
      
      setSound(newSound);
      setActiveUri(uri);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
            if (status.didJustFinish) {
                setIsPlaying(false);
                // Optional: reset position
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
  };

  const pause = async () => {
    if (sound) {
        await sound.pauseAsync();
        setIsPlaying(false);
    }
  };

  const stop = async () => {
    if (sound) {
        await sound.stopAsync();
        setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
        if (sound) {
            sound.unloadAsync();
        }
    };
  }, [sound]);

  return { play, pause, stop, isPlaying, activeUri, error };
}
