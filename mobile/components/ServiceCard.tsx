import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from './../constants/colors';
import { Theme } from './../constants/theme';

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isActive?: boolean,
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  icon,
  title,
  description,
  isActive
}) => (
    <View style={[
      styles.card,
      isActive && {
        borderColor: Colors.blue,
        shadowColor: Colors.blue,
        shadowOpacity: 0.15,
      }
    ]}>
    <View style={styles.iconWell}>{icon}</View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.desc}>{description}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Theme.radius.lg,
    padding: 14,
    gap: 8,

    borderWidth: 1,
    borderColor: "rgba(194,216,239,0.6)",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  iconWell: {
    width: 42,
    height: 42,
    backgroundColor: "rgba(18,113,184,0.08)",
    borderRadius: Theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: "rgba(18,113,184,0.15)",
  },
  title: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12.5,
    color: Colors.textPrimary,
    lineHeight: 16,
  },
  desc: {
    fontFamily: Theme.fonts.body,
    fontSize: 10.5,
    color: Colors.textMuted,
    lineHeight: 15,
  },
});
