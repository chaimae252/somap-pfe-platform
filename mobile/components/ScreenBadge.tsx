import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from './../constants/colors';
import { Theme } from './../constants/theme';

interface ScreenBadgeProps {
  label: string;
}

export const ScreenBadge: React.FC<ScreenBadgeProps> = ({ label }) => (
  <View style={styles.badge}>
    <Text style={styles.text}>{label.toUpperCase()}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.greenSoft,
    borderWidth: 0.5,
    borderColor: Colors.greenBorder,
    borderRadius: Theme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  text: {
    fontFamily: Theme.fonts.condensedBold,
    fontSize: 10,
    color: Colors.greenText,
    letterSpacing: 2,
  },
});
