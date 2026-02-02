import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, RotateCcw, Minus, Plus, Wrench, ArrowUp, Sparkles } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

export default function RevisionStudio() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'original' | 'polished'>('polished');
  const [inputText, setInputText] = useState('');

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top Navigation Bar */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full active:bg-white/10"
        >
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        
        <Text className="text-white text-lg font-bold">Revision Studio</Text>
        
        <TouchableOpacity className="w-10 h-10 items-center justify-center rounded-full active:bg-white/10">
          <RotateCcw color="white" size={22} />
        </TouchableOpacity>
      </View>

      {/* Mode Toggle */}
      <View className="px-4 py-2">
        <View className="flex-row bg-slate-900/80 p-1 rounded-full border border-slate-800">
          <TouchableOpacity 
            className={`flex-1 py-2 rounded-full items-center justify-center ${activeTab === 'original' ? 'bg-slate-700' : ''}`}
            onPress={() => setActiveTab('original')}
          >
            <Text className={`${activeTab === 'original' ? 'text-white font-medium' : 'text-slate-400'}`}>Original</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className={`flex-1 py-2 rounded-full items-center justify-center flex-row gap-2 ${activeTab === 'polished' ? 'bg-slate-800 border border-slate-700' : ''}`}
            onPress={() => setActiveTab('polished')}
          >
            <Text className={`${activeTab === 'polished' ? 'text-white font-medium' : 'text-slate-400'}`}>AI Polished</Text>
            {activeTab === 'polished' && <View className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView className="flex-1 px-5 pt-4">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-xs font-bold text-slate-400 tracking-widest">CHAPTER 1 • THE BEGINNING</Text>
          <View className="px-2 py-0.5 rounded-md border border-blue-500/30 bg-blue-500/10">
            <Text className="text-[10px] text-blue-400 font-medium">Auto-saved</Text>
          </View>
        </View>

        <Text className="text-slate-200 text-lg leading-8 font-serif">
          The morning sun <Highlight>illuminated</Highlight> the horizon, casting long shadows across the valley floor. He walked slowly towards the edge, contemplating the journey ahead. The wind <Highlight>whispered secrets</Highlight> through the ancient pines, a soft murmur that seemed to call his name.
          {'\n\n'}
          It was not just a quest for redemption, but a <Highlight>desperate bid</Highlight> for survival. Every step felt heavier than the last, burdening his soul with the weight of past mistakes.
          {'\n\n'}
          Far below, the river carved its path through the stone, relentless and unyielding. It reminded him of time itself—indifferent to the struggles of men, flowing endlessly towards an unknown sea. He took a deep breath, the cold air filling his lungs, and stepped forward into the <Highlight>unknown abyss</Highlight>.
        </Text>
        
        {/* Spacer for bottom controls */}
        <View className="h-40" />
      </ScrollView>

      {/* Bottom Controls */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="absolute bottom-0 left-0 right-0 bg-slate-950/95 border-t border-slate-800 pt-3 pb-6 px-4"
      >
        {/* Quick Actions */}
        <View className="flex-row gap-3 mb-4 overflow-hidden">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-3">
            <ActionButton icon={Minus} label="Shorten" />
            <ActionButton icon={Plus} label="Expand" />
            <ActionButton icon={Wrench} label="Fix Grammar" hasDot />
          </ScrollView>
        </View>

        {/* Input Bar */}
        <View className="flex-row items-center gap-3 bg-slate-900 rounded-3xl px-4 py-3 border border-slate-800">
          <Sparkles size={20} color="#3b82f6" style={{ opacity: 0.8 }} />
          <TextInput 
            className="flex-1 text-white text-base h-full"
            placeholder="Ask AI to rewrite..." 
            placeholderTextColor="#64748b"
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity 
            className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center"
            disabled={!inputText}
          >
            <ArrowUp size={18} color="white" strokeWidth={3} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Helper Components

const Highlight = ({ children }: { children: string }) => (
  <Text className="bg-blue-600/20 text-blue-100 rounded px-1 overflow-hidden">
    {children}
  </Text>
);

const ActionButton = ({ icon: Icon, label, hasDot }: { icon: any, label: string, hasDot?: boolean }) => (
  <TouchableOpacity className="flex-row items-center bg-slate-800 px-4 py-2.5 rounded-full border border-slate-700 mr-2">
    <Icon size={16} color="#cbd5e1" />
    <Text className="text-slate-200 ml-2 font-medium text-sm">{label}</Text>
    {hasDot && <View className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-2" />}
  </TouchableOpacity>
);
