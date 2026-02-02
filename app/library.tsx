import { View, Text, FlatList, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MoreHorizontal, PlayCircle, PauseCircle, Mic, CheckCircle, Trash2, Sparkles, FileText, Loader2 } from 'lucide-react-native';
import { useEffect, useState, useCallback } from 'react';
import { Recording, recordingService } from '../src/services/recordingService';
import { transcriptionService } from '../src/services/transcriptionService';
import { useAudioPlayer } from '../src/hooks/useAudioPlayer';
import { useFocusEffect, useRouter } from 'expo-router';
import RecordingPlayerCard from '../src/components/RecordingPlayerCard';

export default function Library() {
  const router = useRouter();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);
  const { play, pause, seek, isPlaying, activeUri, error, position, duration } = useAudioPlayer();

  const loadRecordings = async () => {
    try {
      const saved = await recordingService.getAllRecordings();
      setRecordings(saved);
      checkAndTranscribePending(saved);
    } catch (error) {
      console.error('Failed to load recordings', error);
      Alert.alert('Error', 'Failed to load library');
    }
  };

  const checkAndTranscribePending = async (recs: Recording[]) => {
    // Find items that are pending or have no transcription status/text and aren't currently processing
    // Note: In a real background job scenario, we would need a queue system. 
    // Here we trigger for any 'pending' item found.
    const pendingItems = recs.filter(r =>
      (r.transcriptionStatus === 'pending' || (!r.transcription && !r.transcriptionStatus)) &&
      !transcribingId // Simple queue: only one at a time for now to avoid freezing UI
    );

    if (pendingItems.length > 0) {
      // Pick the first one and transcribe it
      const itemToTranscribe = pendingItems[0];
      handleTranscribe(itemToTranscribe);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRecordings();
    }, [])
  );

  const handlePlay = async (rec: Recording) => {
    if (activeUri === rec.fileUri && isPlaying) {
      await pause();
    } else {
      await play(rec.fileUri);
    }
  };

  const handleSeek = async (rec: Recording, newPos: number) => {
    if (activeUri !== rec.fileUri) {
      await play(rec.fileUri);
    }
    await seek(newPos);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      "Delete Recording",
      "Are you sure you want to delete this recording?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await recordingService.deleteRecording(id);
            loadRecordings();
          }
        }
      ]
    );
  };

  const handleTranscribe = async (rec: Recording) => {
    if (transcribingId) return; // Prevent multiple simultaneous

    try {
      setTranscribingId(rec.id);

      // Update local state immediately to show "processing"
      setRecordings(prev => prev.map(r => r.id === rec.id ? { ...r, transcriptionStatus: 'processing' } : r));
      // Update DB
      await recordingService.updateTranscriptionStatus(rec.id, 'processing');

      const result = await transcriptionService.transcribeAudio(rec.fileUri);

      await recordingService.updateTranscription(rec.id, result.text, result.language, result.title);

      console.log('Transcription result:', result);
      // Update local state
      setRecordings(prev => prev.map(r => r.id === rec.id ? {
        ...r,
        title: result.title || r.title,
        transcription: result.text,
        language: result.language,
        transcriptionStatus: 'completed'
      } : r));

      // Check for more pending items after this one finishes
      // Re-fetch or filter current list
      const updatedList = await recordingService.getAllRecordings();
      checkAndTranscribePending(updatedList);

    } catch (error: any) {
      console.error('Transcription error:', error);
      // Update DB status to failed
      await recordingService.updateTranscriptionStatus(rec.id, 'failed');
      setRecordings(prev => prev.map(r => r.id === rec.id ? { ...r, transcriptionStatus: 'failed' } : r));
    } finally {
      setTranscribingId(null);
    }
  };

  const renderItem = ({ item }: { item: Recording }) => {
    const isCurrent = activeUri === item.fileUri;
    const isPlayingCurrent = isCurrent && isPlaying;

    // Status Logic
    const isTranscribing = item.transcriptionStatus === 'processing' || transcribingId === item.id;
    const isTranscribed = item.transcriptionStatus === 'completed' || !!item.transcription;
    const isFailed = item.transcriptionStatus === 'failed';

    return (
      <View className="mb-4 rounded-xl bg-slate-900 p-4 border border-slate-800">
        <View className="flex-row justify-between items-start">
          <TouchableOpacity className="flex-1 pr-4" onPress={() => router.push({ pathname: '/editor', params: { id: item.id } })}>
            <Text className="text-lg font-semibold text-white">{item.title}</Text>


          </TouchableOpacity>

          {/* Status Indicator */}
          <View className="items-end">


            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Trash2 size={20} color="#f44545eb" />
              </TouchableOpacity>
            </View>
          </View>
        </View>


        <View className="mt-2 w-full">
          <RecordingPlayerCard
            recording={item}
            isPlaying={isPlayingCurrent}
            onPlayPause={() => handlePlay(item)}
            showTitle={false}
            currentPosition={isCurrent ? position : 0}
            playbackDuration={isCurrent ? duration : 0}
            onSeek={(pos) => handleSeek(item, pos)}
          />
        </View>

        <View className="flex-row items-center justify-between mt-3">
          {isTranscribing ? (
            <View className="flex-row items-center bg-yellow-500/10 px-2 py-1 rounded-md border border-yellow-500/20">
              <Loader2 size={12} color="#eab308" className="animate-spin mr-1.5" />
              <Text className="text-yellow-500 text-[10px] font-medium uppercase tracking-wider">Transcribing</Text>
            </View>
          ) : isTranscribed ? (
            <View className="flex-row items-center bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20">
              <CheckCircle size={12} color="#22c55e" style={{ marginRight: 6 }} />
              <Text className="text-green-500 text-[10px] font-medium uppercase tracking-wider">Transcribed</Text>
            </View>
          ) : isFailed ? (
            <View className="flex-row items-center bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">
              <Text className="text-red-500 text-[10px] font-medium uppercase tracking-wider">Failed</Text>
            </View>
          ) : null}


          <Text className="text-slate-400 text-xs font-medium mt-1">
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 px-4">
        <View className="flex-row items-center justify-between py-4">
          <Text className="text-2xl font-bold text-white">My Library</Text>
          <View className="w-8 h-8 rounded-full bg-slate-700" />
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-slate-900 rounded-xl px-3 h-12 mb-4 border border-slate-800">
          <Search size={20} color="#64748b" />
          <TextInput
            className="flex-1 ml-2 text-white text-base"
            placeholder="Search recordings..."
            placeholderTextColor="#64748b"
          />
        </View>

        <FlatList
          data={recordings}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Mic size={48} color="#334155" />
              <Text className="text-slate-500 mt-4">No recordings yet</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
