import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LogoMark } from './LogoMark';
import { Colors } from '../constants/colors';
import { Theme } from '../constants/theme';

interface Props {
  showSkip?: boolean;
  onSkip?: () => void;
  centerLogo?: boolean;
}

export const OnboardingTopBar: React.FC<Props> = ({
                                                    showSkip = true,
                                                    onSkip,
                                                    centerLogo = false,
                                                  }) => {

  if (centerLogo) {
    return (
        <View style={styles.centerContainer}>
          <LogoMark size="lg" />
        </View>
    );
  }

  return (
      <View style={styles.container}>
        <LogoMark size="md" />

        {showSkip && (
            <TouchableOpacity
                onPress={onSkip}
                activeOpacity={0.6}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.skipText}>Passer</Text>
            </TouchableOpacity>
        )}
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  centerContainer: {
    paddingTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  skipText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.blue, // 👈 stronger than gray

    letterSpacing: 0.3,

    // 👇 THIS is the key improvement
    textDecorationLine: 'underline',

    // optional subtle spacing for clarity
    paddingVertical: 2,
  },
});