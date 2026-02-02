import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, PanResponder, LayoutChangeEvent } from 'react-native';
import { Play, Pause } from 'lucide-react-native';
import { Recording } from '../types';

interface RecordingPlayerCardProps {
    recording: Recording;
    isPlaying: boolean;
    onPlayPause: () => void;
    compact?: boolean;
    showTitle?: boolean;
    currentPosition?: number;
    playbackDuration?: number; // Optional override from the player
    onSeek?: (position: number) => void;
}

export default function RecordingPlayerCard({
    recording,
    isPlaying,
    onPlayPause,
    showTitle = true,
    currentPosition = 0,
    playbackDuration = 0,
    onSeek
}: RecordingPlayerCardProps) {
    const [layoutWidth, setLayoutWidth] = useState(0);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [scrubPos, setScrubPos] = useState(0);

    // Use playbackDuration if available (from actual loaded sound), otherwise fallback to saved duration
    const totalDuration = (playbackDuration > 0 && isPlaying) ? playbackDuration : (recording.duration > 0 ? recording.duration : playbackDuration);

    // Fallback default to avoid division by zero
    const safeDuration = totalDuration > 0 ? totalDuration : 1;

    // Determine which position to display (actual or user scrubbing)
    const displayPosition = isScrubbing ? scrubPos : currentPosition;
    const progressPercent = Math.min(1, Math.max(0, displayPosition / safeDuration));

    const handleGesture = (locationX: number) => {
        if (!onSeek || layoutWidth === 0) return;

        const percentage = Math.max(0, Math.min(1, locationX / layoutWidth));
        const newPos = percentage * safeDuration;

        setScrubPos(newPos);
        return newPos;
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onStartShouldSetPanResponderCapture: () => true,
            onMoveShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponderCapture: () => true,

            onPanResponderGrant: (evt) => {
                setIsScrubbing(true);
                handleGesture(evt.nativeEvent.locationX);
            },
            onPanResponderMove: (evt) => {
                handleGesture(evt.nativeEvent.locationX);
            },
            onPanResponderRelease: (evt) => {
                const finalPos = handleGesture(evt.nativeEvent.locationX);
                setIsScrubbing(false);
                if (onSeek && finalPos !== undefined) {
                    onSeek(finalPos);
                }
            },
            onPanResponderTerminate: () => {
                setIsScrubbing(false);
            }
        })
    ).current;

    return (
        <View className="p-3 bg-white/5 rounded-2xl flex-row items-center border border-white/5 shadow-sm">
            <TouchableOpacity
                className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center mr-3"
                onPress={onPlayPause}
                activeOpacity={0.7}
            >
                {isPlaying ? (
                    <Pause size={20} color="#FFFFFF" fill="#FFFFFF" />
                ) : (
                    <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
                )}
            </TouchableOpacity>

            <View className="flex-1">
                <View className="flex-row justify-between mb-1">
                    {showTitle && (
                        <Text className="text-white text-xs font-medium" numberOfLines={1}>
                            {recording.title}
                        </Text>
                    )}
                    <Text className="text-gray-400 text-xs ml-auto">
                        {Math.floor(displayPosition / 1000)}s / {Math.floor(totalDuration / 1000)}s
                    </Text>
                </View>

                {/* Waveform Visualization Container */}
                <View
                    onLayout={(e) => setLayoutWidth(e.nativeEvent.layout.width)}
                    className="h-10 justify-center relative" // Increased height for hit area
                >
                    {/* The Waveform Bars */}
                    <View
                        className="flex-row items-end h-6 space-x-[2px] overflow-hidden"
                        pointerEvents="none"
                    >
                        {(recording.meteringLevels && recording.meteringLevels.length > 0 ? recording.meteringLevels : [...Array(40)]).slice(0, 40).map((level: number | undefined, i: number, arr: any[]) => {
                            const heightVal = typeof level === 'number' ? level * 100 : Math.max(20, Math.random() * 100);
                            const height = Math.max(10, heightVal);

                            const activeIndexThreshold = Math.floor(progressPercent * arr.length);
                            const isActive = i <= activeIndexThreshold;

                            return (
                                <View
                                    key={i}
                                    style={{ height: `${height}%` }}
                                    className={`w-1 rounded-full ${isActive ? 'bg-blue-500' : 'bg-gray-600/50'}`}
                                />
                            );
                        })}
                    </View>

                    {/* Visual Scrubber Line */}
                    {layoutWidth > 0 && (
                        <View
                            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg shadow-black"
                            style={{
                                left: progressPercent * layoutWidth,
                                transform: [{ translateX: -0.25 }]
                            }}
                            pointerEvents="none"
                        >
                            <View className="absolute -top-1 -left-[3px] w-2 h-2 rounded-full bg-white shadow-sm" />
                        </View>
                    )}

                    {/* GESTURE OVERLAY - This catches all touches */}
                    <View
                        {...panResponder.panHandlers}
                        className="absolute inset-0"
                        style={{ backgroundColor: 'rgba(0,0,0,0)' }} // Explicitly set for Android hit testing
                    />
                </View>
            </View>
        </View>
    );
}
