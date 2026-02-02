import '../global.css';
import { Tabs } from 'expo-router';
import { Mic, Library, Settings } from 'lucide-react-native';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function AppLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0f172a', // slate-900
            borderTopColor: '#334155', // slate-700
          },
          tabBarActiveTintColor: '#3b82f6', // blue-500
          tabBarInactiveTintColor: '#94a3b8', // slate-400
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Record',
            tabBarIcon: ({ color, size }) => <Mic color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            tabBarIcon: ({ color, size }) => <Library color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="editor"
          options={{
            href: null,
            tabBarStyle: { display: 'none' },
            headerShown: false,
          }}
        />
      </Tabs>
    </>
  );
}
