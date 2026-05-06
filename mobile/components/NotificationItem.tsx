import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from './../constants/colors';
import { Theme } from './../constants/theme';

interface NotificationItemProps {
  dotColor: string;
  title: string;
  body: string;
  time: string;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
                                                                    dotColor,
                                                                    title,
                                                                    body,
                                                                    time,
                                                                  }) => (
    <View style={styles.notif}>

      {/* LEFT DOT */}
      <View style={[styles.dot, { backgroundColor: dotColor }]} />

      {/* CONTENT */}
      <View style={styles.content}>

        {/* TOP ROW (title + time) */}
        <View style={styles.topRow}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>

        {/* BODY */}
        <Text style={styles.body}>{body}</Text>

      </View>
    </View>
);

const styles = StyleSheet.create({
  notif: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,

    backgroundColor: '#ffffff', // 👈 solid = better readability
    borderRadius: Theme.radius.lg,

    padding: 14,
    marginBottom: 8,

    borderWidth: 0.5,
    borderColor: '#e6eef7',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,

    borderLeftWidth: 3,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },

  content: {
    flex: 1,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  title: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13, // 👈 bigger
    color: Colors.textPrimary,
  },

  time: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: Colors.textHint,
  },

  body: {
    fontFamily: Theme.fonts.body,
    fontSize: 12.5,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});