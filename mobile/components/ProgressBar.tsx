import React, { useEffect, useState } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { Colors } from './../constants/colors';
import { Theme } from './../constants/theme';

interface ProgressBarProps {
  progress: number;
  color?: 'blue' | 'green';
  animate?: boolean;
  animKey?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
                                                          progress,
                                                          color = 'blue',
                                                          animate = true,
                                                          animKey,
                                                        }) => {
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!animate || progress === 0) return;

    anim.stopAnimation();
    anim.setValue(0);

    Animated.timing(anim, {
      toValue: progress,
      duration: 1400,
      delay: 100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animKey]);

  const fillColor = color === 'green'
      ? Colors.progressGradientEndGreen
      : Colors.progressGradientEnd;

  const width = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width, backgroundColor: fillColor }]}>
          <View style={styles.shine} />
        </Animated.View>
      </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 6,
    backgroundColor: '#dce8f5',
    borderRadius: Theme.radius.sm - 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Theme.radius.sm - 1,
  },
  shine: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    opacity: 0.6,
  },
});