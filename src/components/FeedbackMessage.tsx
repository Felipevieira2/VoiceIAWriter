import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, Layout } from 'react-native-reanimated';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type FeedbackType = 'success' | 'error' | 'warning' | 'info';

export interface FeedbackMessageProps {
  /** Controls visibility of the feedback message */
  visible: boolean;
  /** The message text to display */
  message: string;
  /** The type of feedback, determining color and icon */
  type?: FeedbackType;
  /** Duration in ms before auto-dismissing. Set to 0 to disable auto-dismiss. Default: 4000ms */
  duration?: number;
  /** Callback function to handle closing (manual or auto) */
  onClose: () => void;
}

const FEEDBACK_CONFIG = {
  success: {
    icon: CheckCircle,
    // Using hex codes for colors ensures consistency if Tailwind config varies, 
    // but using Tailwind classes is preferred for theming.
    // We'll use Tailwind classes for background/border and specific colors for icons.
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    textColor: 'text-green-500',
    iconColor: '#22c55e', // green-500
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    textColor: 'text-red-500',
    iconColor: '#ef4444', // red-500
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    textColor: 'text-amber-500',
    iconColor: '#f59e0b', // amber-500
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    textColor: 'text-blue-500',
    iconColor: '#3b82f6', // blue-500
  },
};

/**
 * A reusable feedback message component that displays success, error, warning, or info messages.
 * Supports auto-dismiss and manual dismissal.
 */
export const FeedbackMessage: React.FC<FeedbackMessageProps> = ({
  visible,
  message,
  type = 'info',
  duration = 4000,
  onClose,
}) => {
  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  if (!visible) return null;

  const insets = useSafeAreaInsets();
  const config = FEEDBACK_CONFIG[type];
  const Icon = config.icon;

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(15)}
      exiting={FadeOutUp.duration(200)}
      layout={Layout.springify()}
      className={`absolute left-4 right-4 z-50 flex-row items-start p-4 rounded-2xl border ${config.bgColor} ${config.borderColor} shadow-sm backdrop-blur-md`}
      style={{
        top: insets.top + 10,
        // Additional shadow for better visibility on dark backgrounds
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View className="mt-0.5">
        <Icon size={24} color={config.iconColor} />
      </View>

      <View className="flex-1 mx-3">
        <Text className={`font-medium text-base ${config.textColor}`}>
          {message}
        </Text>
      </View>

      <TouchableOpacity
        onPress={onClose}
        className="mt-0.5 p-1 -mr-1 rounded-full active:bg-black/5 dark:active:bg-white/10"
        accessibilityLabel="Close feedback message"
        accessibilityRole="button"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X size={20} color={config.iconColor} style={{ opacity: 0.7 }} />
      </TouchableOpacity>
    </Animated.View>
  );
};
