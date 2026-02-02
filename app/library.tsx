import { View, Text, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MoreHorizontal, PlayCircle, PauseCircle, Mic, CheckCircle, Trash2, Sparkles } from 'lucide-react-native';
import { useEffect, useState, useCallback } from 'react';
import { Recording, recordingService } from '../src/services/recordingService';
import { useAudioPlayer } from '../src/hooks/useAudioPlayer';
import { useFocusEffect, useRouter } from 'expo-router';

export default function Library() {
  const router = useRouter();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const { play, pause, isPlaying, activeUri, error } = useAudioPlayer();

  const loadRecordings = async () => {
    try {
      const saved = await recordingService.getAllRecordings();
      setRecordings(saved);
    } catch (error) {
      console.error('Failed to load recordings', error);
      Alert.alert('Error', 'Failed to load library');
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

  const renderItem = ({ item }: { item: Recording }) => {
    const isCurrent = activeUri === item.fileUri;
    const isPlayingCurrent = isCurrent && isPlaying;

    return (
      <View className="mb-4 rounded-xl bg-slate-900 p-4 border border-slate-800">
        <View className="flex-row justify-between items-start">
            <TouchableOpacity className="flex-1 pr-4" onPress={() => router.push('/editor')}>
                <Text className="text-lg font-semibold text-white">{item.title}</Text>
                <Text className="text-slate-400 text-xs font-medium mt-1">
                    {new Date(item.createdAt).toLocaleDateString()} • {Math.floor(item.duration / 1000)}s
                </Text>
            </TouchableOpacity>
            <View className="flex-row gap-2">
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Trash2 size={20} color="#64748b" />
                </TouchableOpacity>
                <TouchableOpacity>
                    <MoreHorizontal size={20} color="#64748b" />
                </TouchableOpacity>
            </View>
        </View>

        <View className="flex-row items-center justify-between mt-3">
             <View className={`flex-row items-center rounded-md px-2.5 py-1 ${item.status === 'draft' ? 'bg-slate-800' : 'bg-emerald-900/30'}`}>
                {item.status === 'draft' ? (
                    <Mic size={14} color="#cbd5e1" className="mr-1" />
                ) : (
                    <CheckCircle size={14} color="#6ee7b7" className="mr-1" />
                )}
                <Text className={`text-xs font-semibold ${item.status === 'draft' ? 'text-slate-300' : 'text-emerald-300'} ml-1`}>
                    {item.status === 'draft' ? 'Recorded' : 'Published'}
                </Text>
             </View>

             <TouchableOpacity onPress={() => handlePlay(item)}>
                {isPlayingCurrent ? (
                    <PauseCircle size={32} color="#3b82f6" />
                ) : (
                    <PlayCircle size={32} color="#94a3b8" />
                )}
             </TouchableOpacity>
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
