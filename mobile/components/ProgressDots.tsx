import React from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Colors } from './../constants/colors';
import { Theme } from './../constants/theme';

interface ProgressDotsProps {
  total: number;
  current: number;
  onDotPress?: (index: number) => void;
}

export const ProgressDots: React.FC<ProgressDotsProps> = ({
  total,
  current,
  onDotPress,
}) => (
  <View style={styles.container}>
    {Array.from({ length: total }).map((_, i) => (
      <TouchableOpacity
        key={i}
        onPress={() => onDotPress?.(i)}
        activeOpacity={0.7}
        style={[
          styles.dot,
          i === current ? styles.dotActive : styles.dotInactive,
        ]}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingBottom: 14,
  },
  dot: {
    height: 6,
    borderRadius: Theme.radius.sm - 1,
  },
  dotActive: {
    width: 18,
    backgroundColor: Colors.dotActive,
  },
  dotInactive: {
    width: 6,
    backgroundColor: Colors.dotInactive,
    borderRadius: 3,
  },
});
