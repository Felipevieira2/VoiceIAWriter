import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';

// -----------------------------------------------------------------------------
// Constants & Configuration
// -----------------------------------------------------------------------------
const SCREEN_WIDTH = Dimensions.get('window').width;
const VIEW_HEIGHT = 150; // Compact height
const VIEW_WIDTH = SCREEN_WIDTH - 64; // More padding to center it nicely
const BAR_COUNT = 35; // Number of bars to display
const BAR_WIDTH = 4; // Width of each bar
const BAR_GAP = (VIEW_WIDTH - (BAR_COUNT * BAR_WIDTH)) / (BAR_COUNT - 1);
const MAX_BAR_HEIGHT = VIEW_HEIGHT * 0.8;
const MIN_BAR_HEIGHT = 4; // Minimum height for "silence"

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
interface AudioVisualizerProps {
  /**
   * Normalized audio level (0.0 - 1.0)
   */
  level: number;

  /**
   * Whether the visualization is active (recording/listening)
   */
  active: boolean;

  /**
   * Primary color of the waveform
   */
  color?: string;
}

// -----------------------------------------------------------------------------
// Animated Path Component
// -----------------------------------------------------------------------------
const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function AudioVisualizer({
  level,
  active,
  color = '#3b82f6',
}: AudioVisualizerProps) {
  // ---------------------------------------------------------------------------
  // Shared Values
  // ---------------------------------------------------------------------------
  // We keep a history of levels to create the "scrolling" effect
  // Initialize with small values
  const levels = useSharedValue<number[]>(new Array(BAR_COUNT).fill(0.02));

  // ---------------------------------------------------------------------------
  // Animation Logic
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!active) {
      // When inactive, flatten the line smoothly
      // We can do this by filling the array with zeros gradually or just letting the effect stop
      // But for a nice exit, let's just reset smoothly? 
      // Reanimated arrays are hard to "animate" all at once. 
      // We'll rely on the incoming level being 0 from the parent if paused/stopped, 
      // or we manually push 0s if active is false but we want to clear the screen.
      // For now, assume parent stops sending levels or sends 0.
      return;
    }

    // Push new level into history
    // We smooth the input slightly to remove extreme jitter, 
    // although raw input usually looks best for voice.
    // Let's ensure level is non-negative
    const currentLevel = Math.max(0, level);

    // Shift and push
    // We create a new array to trigger the Reanimated update
    // 'value' update on the JS thread triggers the worklet on UI thread
    const currentHistory = levels.value;
    const newHistory = [...currentHistory.slice(1), currentLevel];
    levels.value = newHistory;
  }, [level, active]);

  // ---------------------------------------------------------------------------
  // Path Generation (Worklet)
  // ---------------------------------------------------------------------------
  const animatedProps = useAnimatedProps(() => {
    let d = '';
    const data = levels.value;
    const centerY = VIEW_HEIGHT / 2;

    for (let i = 0; i < BAR_COUNT; i++) {
      // Calculate x position for this bar
      const x = i * (BAR_WIDTH + BAR_GAP);

      // Retrieve level for this bar position
      const val = data[i];

      // Apply amplitude scaling
      // Interpolate 0-1 noise floor to reasonable heights
      // We enforce a minimum height so the bar is always visible as a dot/dash
      const barHeight = interpolate(
        val,
        [0, 1],
        [MIN_BAR_HEIGHT, MAX_BAR_HEIGHT]
      );

      // Draw vertical line centered vertically
      const yTop = centerY - (barHeight / 2);
      const yBottom = centerY + (barHeight / 2);

      // Move to top of bar
      d += `M ${x + BAR_WIDTH / 2} ${yTop}`;
      // Line to bottom of bar
      d += `L ${x + BAR_WIDTH / 2} ${yBottom}`;
    }

    return {
      d: d,
    };
  });

  return (
    <View style={styles.container}>
      <Svg width={VIEW_WIDTH} height={VIEW_HEIGHT}>
        <AnimatedPath
          animatedProps={animatedProps}
          fill="none"
          stroke={color}
          strokeWidth={BAR_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: VIEW_HEIGHT,
    width: '100%',
  },
});
