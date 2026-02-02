import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withSpring,
  Easing,
  useDerivedValue,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';

// -----------------------------------------------------------------------------
// Constants & Configuration
// -----------------------------------------------------------------------------
const SCREEN_WIDTH = Dimensions.get('window').width;
const VIEW_HEIGHT = 200;
const VIEW_WIDTH = SCREEN_WIDTH - 48; // Padding adjustment
const POINTS = 40; // Resolution of the wave
const SMOOTHING_FACTOR = 0.15; // How fast the amplitude reacts (lerp)
const IDLE_AMPLITUDE = 0.1; // Amplitude when silence
const MAX_AMPLITUDE = 0.9; // Max amplitude scaling
const PHASE_SPEED = 0.08; // Speed of the wave animation

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
// We create an animated component for the SVG Path to update props on the UI thread
const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function AudioVisualizer({
  level,
  active,
  color = '#3b82f6', // blue-500
}: AudioVisualizerProps) {
  // ---------------------------------------------------------------------------
  // Shared Values
  // ---------------------------------------------------------------------------
  // The current smoothed audio level (for amplitude)
  const smoothedLevel = useSharedValue(0);
  
  // The phase (time) of the wave animation
  const phase = useSharedValue(0);

  // ---------------------------------------------------------------------------
  // Animation Logic
  // ---------------------------------------------------------------------------
  
  // 1. Update smoothed level based on input prop
  useEffect(() => {
    // If not active, drop to zero/idle quickly
    const target = active ? Math.max(IDLE_AMPLITUDE, level) : 0;
    
    // Smooth interpolation to avoid jitter
    smoothedLevel.value = withSpring(target, {
      damping: 20,
      stiffness: 150,
      mass: 0.5,
    });
  }, [level, active]);

  // 2. Continuous Wave Animation Loop
  useEffect(() => {
    // Start the phase animation
    // We use a large duration linear animation to simulate an infinite loop
    // In a real game loop we might use useFrameCallback, but this is simpler for UI
    const startLoop = () => {
      phase.value = withTiming(phase.value + 1000, {
        duration: 200000, // Very long duration
        easing: Easing.linear,
      });
    };

    if (active) {
      startLoop();
    } else {
      cancelAnimation(phase);
      // Optional: reset phase or let it pause
    }

    return () => cancelAnimation(phase);
  }, [active]);

  // ---------------------------------------------------------------------------
  // Path Generation (Worklet)
  // ---------------------------------------------------------------------------
  // We use useAnimatedProps to calculate the path string on the UI thread
  const animatedProps = useAnimatedProps(() => {
    // Base amplitude logic
    // We interpolate the level to a pixel height
    const amplitude = interpolate(
      smoothedLevel.value,
      [0, 1],
      [10, VIEW_HEIGHT * 0.4] // Min 10px, Max 40% of view height
    );

    // Generate path points
    // We combine 3 sine waves for an organic look
    // y = A * sin(kx + wt)
    let d = `M 0 ${VIEW_HEIGHT / 2}`;
    
    for (let i = 0; i <= POINTS; i++) {
      const x = (i / POINTS) * VIEW_WIDTH;
      // Normalized x (0 to 1) for frequency calculation
      const nx = i / POINTS; 
      
      const t = phase.value * PHASE_SPEED;

      // Wave 1: Main low frequency
      const y1 = Math.sin(nx * Math.PI * 2 + t);
      
      // Wave 2: Medium frequency, different phase
      const y2 = Math.sin(nx * Math.PI * 4 + t * 1.5 + Math.PI / 4);
      
      // Wave 3: Higher frequency, lower amplitude contribution
      const y3 = Math.sin(nx * Math.PI * 6 + t * 0.5) * 0.5;

      // Combine and scale
      // We taper the ends to 0 so the wave connects smoothly at the sides
      // Taper function: sin(pi * nx) -> 0 at start, 1 at center, 0 at end
      const taper = Math.sin(Math.PI * nx);
      
      const combinedY = (y1 + y2 * 0.5 + y3 * 0.25) / 1.75; // Normalize roughly to -1..1
      const y = (VIEW_HEIGHT / 2) + (combinedY * amplitude * taper);

      d += ` L ${x} ${y}`;
    }

    // Close the path (optional, but good for fills)
    // For a line, we might just end it. Let's make it a filled shape or just a thick stroke.
    // Let's try just a stroke first as requested "waveform"
    // But "organic curves" often implies a filled area or multiple lines.
    // Let's stick to a single clean stroke for "Voice Memos" style, 
    // maybe dual paths for a "mirrored" look if desired.
    
    return {
      d: d,
    };
  });

  // Secondary "Shadow" or "Echo" path for premium feel (slightly offset, lower opacity)
  const animatedPropsEcho = useAnimatedProps(() => {
    const amplitude = interpolate(
      smoothedLevel.value,
      [0, 1],
      [5, VIEW_HEIGHT * 0.45] // Slightly different scale
    );

    let d = `M 0 ${VIEW_HEIGHT / 2}`;
    
    for (let i = 0; i <= POINTS; i++) {
      const x = (i / POINTS) * VIEW_WIDTH;
      const nx = i / POINTS; 
      const t = phase.value * PHASE_SPEED - 0.5; // Phase lag

      const y1 = Math.sin(nx * Math.PI * 2 + t);
      const y2 = Math.sin(nx * Math.PI * 3 + t * 1.2);
      
      const taper = Math.sin(Math.PI * nx);
      const combinedY = (y1 + y2 * 0.5) / 1.5;
      const y = (VIEW_HEIGHT / 2) + (combinedY * amplitude * taper);

      d += ` L ${x} ${y}`;
    }
    return { d };
  });

  return (
    <View style={styles.container}>
      <Svg width={VIEW_WIDTH} height={VIEW_HEIGHT}>
        {/* Echo Line (Background) */}
        <AnimatedPath
          animatedProps={animatedPropsEcho}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeOpacity={0.3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Main Line (Foreground) */}
        <AnimatedPath
          animatedProps={animatedProps}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeOpacity={1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: VIEW_HEIGHT,
    width: '100%',
  },
});
