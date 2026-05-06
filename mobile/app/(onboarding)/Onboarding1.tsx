import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';

import { OnboardingTopBar } from '../../components/OnboardingTopBar';
import { ScreenBadge } from '../../components/ScreenBadge';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ProgressDots } from '../../components/ProgressDots';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';

interface Onboarding1Props {
  onNext: () => void;
  onSkip: () => void;
  currentIndex?: number;
  totalScreens?: number;
  onDotPress?: (index: number) => void;
}

const Onboarding1: React.FC<Onboarding1Props> = ({
                                                   onNext,
                                                   onSkip,
                                                   currentIndex = 0,
                                                   totalScreens = 3,
                                                   onDotPress,
                                                 }) => {
  return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.bgScreen} />

        <View style={styles.screen}>
          {/* Background blobs */}
          <View
              style={[
                styles.blob,
                {
                  width: 220,
                  height: 220,
                  backgroundColor: Colors.blobBlue,
                  top: -70,
                  right: -50,
                },
              ]}
          />

          <View
              style={[
                styles.blob,
                {
                  width: 160,
                  height: 160,
                  backgroundColor: Colors.blobCyan,
                  bottom: 120,
                  left: -60,
                },
              ]}
          />

          {/* Top bar */}
          <OnboardingTopBar showSkip onSkip={onSkip} />

          {/* IMAGE */}
          <View style={styles.illustZone}>
            <Image
                source={require('../../assets/illustration.png')}
                style={styles.illustration}
                resizeMode="contain"
            />
          </View>

          {/* CONTENT */}
          <View style={styles.content}>
            <ScreenBadge label="Bienvenue" />

            <Text style={styles.title}>
              Bienvenue chez{'\n'}
              SOMAP &amp; SERVICE
            </Text>

            <Text style={styles.subtitle}>
              Découvrez une plateforme intelligente dédiée aux services industriels
              et à la gestion de vos projets en temps réel.
            </Text>

            <PrimaryButton label="Suivant" onPress={onNext} icon="arrow-right" />
          </View>

          {/* DOTS */}
          <ProgressDots
              total={totalScreens}
              current={currentIndex}
              onDotPress={onDotPress}
          />
        </View>
      </SafeAreaView>
  );
};

export default Onboarding1;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgScreen,
  },

  screen: {
    flex: 1,
    backgroundColor: Colors.bgScreen,
    position: 'relative',
    overflow: 'hidden',
  },

  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.9,
  },

  illustZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.lg,
    backgroundColor: 'rgba(18,113,184,0.03)',
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 10,
  },

  illustration: {
    width: 820,
    height: 440,
    shadowColor: '#1271b8',
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 6,
  },

  content: {
    paddingHorizontal: Theme.spacing.xxl,
    zIndex: 10,
    marginBottom: 20,
  },

  title: {
    fontFamily: Theme.fonts.condensedBold,
    fontSize: 26,
    color: Colors.textPrimary,
    lineHeight: 32,
    marginBottom: 10,
    letterSpacing: 0.3,
  },

  subtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
});