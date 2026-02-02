import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ChevronLeft, 
  Play, 
  Sparkles, 
  AlignLeft, 
  List, 
  Type, 
  MoreHorizontal 
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function EditorScreen() {
  const router = useRouter();

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
          <TouchableOpacity className="p-2" onPress={() => router.back()}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View className="items-center">
            <Text className="text-white text-base font-bold">Chapter 1 – Draft</Text>
            <Text className="text-gray-400 text-xs">Last synced 2m ago</Text>
          </View>
          
          <TouchableOpacity className="p-2">
            <Text className="text-blue-400 text-base font-semibold">Save</Text>
          </TouchableOpacity>
        </View>

        {/* Audio Player Card */}
        <View className="mx-4 mt-4 mb-6 p-4 bg-white/5 rounded-2xl flex-row items-center border border-white/5 shadow-sm">
          <TouchableOpacity className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center mr-3">
            <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
          </TouchableOpacity>
          
          <View className="flex-1">
            <View className="flex-row justify-between mb-1">
              <Text className="text-white text-xs font-medium">Voice Memo 001</Text>
              <Text className="text-gray-400 text-xs">02:14 / 15:30</Text>
            </View>
            
            {/* Simulated Waveform */}
            <View className="flex-row items-end h-6 space-x-[2px]">
              {[...Array(30)].map((_, i) => {
                const height = Math.max(20, Math.random() * 100);
                const isActive = i < 10;
                return (
                  <View 
                    key={i} 
                    style={{ height: `${height}%` }}
                    className={`w-1 rounded-full ${isActive ? 'bg-blue-500' : 'bg-gray-600/50'}`}
                  />
                );
              })}
            </View>
          </View>
        </View>

        {/* Content Area */}
        <ScrollView 
          className="flex-1 px-6" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <Text className="text-white text-3xl font-serif mb-6 leading-tight">
            The Rain Against the Cobblestones
          </Text>
          
          <Text className="text-gray-300 text-lg font-serif leading-8 mb-6">
            The rain fell hard against the cobblestones, echoing the rhythm of his anxious heart. He pulled his collar tight against the chill, glancing over his shoulder one last time.
          </Text>
          
          <Text className="text-gray-300 text-lg font-serif leading-8 mb-6">
            The alleyway was empty, save for the flickering gas lamp that cast long, dancing shadows against the brickwork. He knew he shouldn't be here, not after what happened last night. But the letter had been specific.
          </Text>
          
          {/* Selected Text */}
          <View className="bg-blue-900/50 rounded px-1 -mx-1 mb-6">
            <Text className="text-white text-lg font-serif leading-8">
              Midnight. The old pier. Come alone.
            </Text>
          </View>
          
          <Text className="text-gray-300 text-lg font-serif leading-8 mb-6">
            A distant foghorn moaned, a mournful sound that seemed to vibrate through his very bones. He checked his pocket watch—five minutes to. His hand trembled slightly as he reached for the latch of the rusted iron gate.
          </Text>
          
          <Text className="text-gray-300 text-lg font-serif leading-8 mb-6">
             The smell of salt and decay hung heavy in the air. This was where it ended, or perhaps, where it all began.
          </Text>
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

            <TouchableOpacity className="flex-row items-center bg-blue-600 px-4 py-2 rounded-full shadow-lg shadow-blue-900/50">
                <Sparkles size={16} color="#FFFFFF" className="mr-2" />
                <Text className="text-white font-semibold ml-2">AI Edit</Text>
            </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}
