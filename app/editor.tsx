import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Play,
  Pause,
  Sparkles,
  AlignLeft,
  List,
  Type
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Recording } from '../src/types';
import { recordingService } from '../src/services/recordingService';
import { useAudioPlayer } from '../src/hooks/useAudioPlayer';
import RecordingPlayerCard from '../src/components/RecordingPlayerCard';

export default function EditorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recording, setRecording] = useState<Recording | null>(null);
  const [loading, setLoading] = useState(true);

  const { play, pause, seek, isPlaying, activeUri, position, duration } = useAudioPlayer();

  useEffect(() => {
    loadRecording();
  }, [id]);

  const loadRecording = async () => {
    if (!id) return;
    try {
      const rec = await recordingService.getRecordingById(id);
      setRecording(rec);
    } catch (error) {
      console.error('Failed to load recording', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = async () => {
    if (!recording) return;

    if (activeUri === recording.fileUri && isPlaying) {
      await pause();
    } else {
      await play(recording.fileUri);
    }
  };

  const handleSeek = async (newPosition: number) => {
    if (recording) {
      if (activeUri !== recording.fileUri) {
        await play(recording.fileUri);
      }
      await seek(newPosition);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#0f172a] items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!recording) {
    return (
      <View className="flex-1 bg-[#0f172a] items-center justify-center">
        <Text className="text-white">Recording not found</Text>
      </View>
    );
  }

  const isCurrentPlaying = activeUri === recording.fileUri && isPlaying;
  const currentPos = activeUri === recording.fileUri ? position : 0;
  const currentDuration = activeUri === recording.fileUri ? duration : 0;

  return (
    <View className="flex-1 bg-[#0f172a]">
      <StatusBar style="light" />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#0f172a', '#020617']} // Dark blue to almost black
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1">
        {/* Top Bar */}
        <View className="flex-row items-center justify-between px-4 py-2">
          <TouchableOpacity className="p-2" onPress={() => router.push('/library')}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View className="items-center">
            <Text className="text-white text-base font-bold" numberOfLines={1} style={{ maxWidth: 200 }}>
              {recording.title}
            </Text>
            <Text className="text-gray-400 text-xs">
              {new Date(recording.createdAt).toLocaleDateString()}
            </Text>
          </View>

          <TouchableOpacity className="p-2">
            <Text className="text-blue-400 text-base font-semibold">Save</Text>
          </TouchableOpacity>
        </View>

        {/* Audio Player Card */}
        <View className="mx-4 mt-4 mb-6">
          <RecordingPlayerCard
            recording={recording}
            isPlaying={isCurrentPlaying}
            onPlayPause={handlePlayPause}
            currentPosition={currentPos}
            playbackDuration={currentDuration}
            onSeek={handleSeek}
          />
        </View>

        {/* Content Area */}
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {recording.transcription ? (
            <Text className="text-gray-300 text-lg font-serif leading-8 mb-6">
              {recording.transcription}
            </Text>
          ) : (
            <View className="items-center justify-center py-10">
              <Text className="text-gray-500 text-base italic">
                No transcription available. Go back to library to transcribe.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom Bar */}
        <View className="absolute bottom-8 left-4 right-4 h-16 bg-gray-900/90 rounded-full flex-row items-center justify-between px-6 border border-white/5 backdrop-blur-lg">
          <View className="flex-row space-x-6 items-center">
            <TouchableOpacity>
              <List size={22} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity>
              <AlignLeft size={22} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Type size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="flex-row items-center bg-blue-600 px-4 py-2 rounded-full shadow-lg shadow-blue-900/50"
            onPress={() => router.push({ pathname: '/revision', params: { id: recording.id } })}
          >
            <Sparkles size={16} color="#FFFFFF" />
            <Text className="text-white font-semibold ml-2">AI Edit</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}
