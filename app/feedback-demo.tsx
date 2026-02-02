import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedbackMessage, FeedbackType } from '../src/components/FeedbackMessage';
import { Stack } from 'expo-router';

export default function FeedbackDemo() {
  const [feedback, setFeedback] = useState<{
    visible: boolean;
    message: string;
    type: FeedbackType;
  }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showFeedback = (type: FeedbackType, message: string) => {
    // If already visible, hide first to re-trigger animation (optional, but good for demo)
    if (feedback.visible) {
      setFeedback(prev => ({ ...prev, visible: false }));
      setTimeout(() => {
        setFeedback({ visible: true, message, type });
      }, 200);
    } else {
      setFeedback({ visible: true, message, type });
    }
  };

  const hideFeedback = () => {
    setFeedback(prev => ({ ...prev, visible: false }));
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <Stack.Screen options={{ 
        title: 'Feedback Demo', 
        headerStyle: { backgroundColor: '#0f172a' }, 
        headerTintColor: '#fff',
        headerShown: true
      }} />
      
      <View className="flex-1 p-6 items-center justify-center gap-4">
        <Text className="text-2xl font-bold text-white mb-8">Feedback Component</Text>
        
        <TouchableOpacity 
          className="w-full py-4 bg-green-600 rounded-xl items-center shadow-lg shadow-green-900/20"
          onPress={() => showFeedback('success', 'Recording saved successfully!')}
        >
          <Text className="text-white font-bold text-lg">Success Message</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="w-full py-4 bg-red-600 rounded-xl items-center shadow-lg shadow-red-900/20"
          onPress={() => showFeedback('error', 'Failed to connect to server.')}
        >
          <Text className="text-white font-bold text-lg">Error Message</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="w-full py-4 bg-amber-600 rounded-xl items-center shadow-lg shadow-amber-900/20"
          onPress={() => showFeedback('warning', 'Storage is almost full.')}
        >
          <Text className="text-white font-bold text-lg">Warning Message</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="w-full py-4 bg-blue-600 rounded-xl items-center shadow-lg shadow-blue-900/20"
          onPress={() => showFeedback('info', 'Syncing your data...')}
        >
          <Text className="text-white font-bold text-lg">Info Message</Text>
        </TouchableOpacity>

        <Text className="text-slate-400 mt-8 text-center px-4">
          Tap a button to see the feedback message. It will auto-dismiss after 4 seconds.
        </Text>
      </View>

      {/* 
        The FeedbackMessage component can be placed anywhere in the tree, 
        but usually at the root of the screen or in a Portal. 
        Since we used 'absolute' positioning in the component itself, 
        it will overlay correctly relative to this container.
      */}
      <FeedbackMessage 
        visible={feedback.visible}
        message={feedback.message}
        type={feedback.type}
        onClose={hideFeedback}
      />
    </SafeAreaView>
  );
}
