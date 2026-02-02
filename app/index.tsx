import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useAudioRecorder } from '../src/hooks/useAudioRecorder';
import AudioVisualizer from '../src/components/AudioVisualizer';
import { Settings, User, Mic, Square, Pause, Play } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();
  const {
    status,
    isRecording,
    isPaused,
    recordingTime,
    audioLevel,
    toggleRecording,
    stopRecording,
    error: recorderError
  } = useAudioRecorder();

  const isSessionActive = status === 'recording' || status === 'paused';

  if (recorderError) {
    Alert.alert('Error', recorderError);
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStop = async () => {
    try {
      const recording = await stopRecording();
      if (recording) {
        Alert.alert('Success', 'Recording saved successfully!');
        router.push('/library');
      } else {
        Alert.alert('Error', 'Failed to create recording file.');
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Error saving recording.');
    }
  };

  // Simple visualizer based on audioLevel
  // Scale the level (0-1) to a height or scale

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 flex flex-col items-center relative px-4">

        {/* Header */}
        <View className="flex-row items-center justify-between w-full pt-4 pb-2 z-10">
          <TouchableOpacity
            onPress={() => router.push('/feedback-demo')}
            className="items-center justify-center w-10 h-10 rounded-full bg-white/5"
          >
            <Settings size={24} color="#94a3b8" />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text className={`text-4xl font-light text-white tabular-nums ${isPaused ? 'opacity-50' : ''}`}>
              {formatTime(recordingTime)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/revision')}
            className="items-center justify-center w-10 h-10 rounded-full bg-white/5"
          >
            <User size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View className="flex-1 w-full items-center justify-center mb-20">
          <View className="mb-8 items-center">
            <Text className="text-3xl font-bold text-white mb-2">
              {isSessionActive ? (isPaused ? 'Paused' : 'Listening...') : 'Ready to listen...'}
            </Text>
            <Text className="text-slate-400 text-base">
              {isSessionActive ? 'Tap center to pause/resume' : 'Tap to capture your thoughts'}
            </Text>
          </View>

          {/* Visualizer */}
          <View className="w-full h-48 mb-6 items-center justify-center relative">
            <View
              className={`absolute w-64 h-40 bg-blue-500/20 rounded-full blur-3xl ${isRecording && !isPaused ? 'opacity-100' : 'opacity-30'}`}
              style={{ pointerEvents: 'none' }}
            />
            <AudioVisualizer
              level={audioLevel}
              active={isRecording && !isPaused}
              color="#3b82f6"
            />
          </View>

          {/* Controls */}
          <View className="relative items-center justify-center">
            {/* Record/Pause Button */}
            <TouchableOpacity
              onPress={toggleRecording}
              className={`items-center justify-center w-24 h-24 rounded-full bg-blue-500 shadow-lg shadow-blue-500/40 z-20 ${isPaused ? 'bg-amber-500 shadow-amber-500/40' : ''}`}
            >
              {!isSessionActive ? (
                <Mic size={44} color="white" />
              ) : isPaused ? (
                <Play size={44} color="white" className="ml-1" />
              ) : (
                <Pause size={44} color="white" />
              )}
            </TouchableOpacity>

            {/* Stop Button */}
            {isSessionActive && (
              <TouchableOpacity
                onPress={handleStop}
                className="absolute -right-20 flex items-center justify-center w-12 h-12 rounded-full bg-slate-700 hover:bg-red-500"
              >
                <Square size={20} color="white" fill="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
