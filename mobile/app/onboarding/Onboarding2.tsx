import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { OnboardingTopBar } from '../../components/OnboardingTopBar';
import { ScreenBadge } from '../../components/ScreenBadge';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ProgressDots } from '../../components/ProgressDots';
import { ServiceCard } from '../../components/ServiceCard';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';

interface Onboarding2Props {
  onNext: () => void;
  onSkip: () => void;
  currentIndex?: number;
  totalScreens?: number;
  onDotPress?: (index: number) => void;
}

// --- Service Icons ---
const SablageIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Circle cx={9} cy={9} r={6} stroke={Colors.blue} strokeWidth={1.2} strokeDasharray="2,1" />
    <Path d="M6 9 Q9 5 12 9" stroke={Colors.blue} strokeWidth={1.2} strokeLinecap="round" />
    <Path d="M2 9L5 9M13 9L16 9M9 2L9 5M9 13L9 16"
      stroke={Colors.blue} strokeWidth={1} strokeLinecap="round" opacity={0.5} />
  </Svg>
);

const PeintureIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path d="M4 14 L7 8 L10 12 L11 5 L14 14"
      stroke={Colors.blue} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={14} cy={5} r={2} fill="rgba(18,113,184,0.2)" stroke={Colors.blue} strokeWidth={1} />
    <Path d="M2 15 L16 15" stroke={Colors.blue} strokeWidth={0.8} opacity={0.3} />
  </Svg>
);

const MetallisationIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path d="M5 13 L3 15" stroke={Colors.blue} strokeWidth={1.5} strokeLinecap="round" />
    <Rect x={5} y={7} width={9} height={7} rx={1}
      stroke={Colors.blue} strokeWidth={1.2}
      transform="rotate(-45 9 10)"
    />
    <Circle cx={12} cy={5} r={2} stroke={Colors.blue} strokeWidth={1} />
  </Svg>
);

const ChimieIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Rect x={5} y={4} width={8} height={11} rx={2} stroke={Colors.blue} strokeWidth={1.2} />
    <Path d="M7 4 L7 3 Q9 1.5 11 3 L11 4"
      stroke={Colors.blue} strokeWidth={1} strokeLinejoin="round" />
    <Path d="M8 8 L10 8M8 11 L10 11"
      stroke={Colors.blue} strokeWidth={0.8} strokeLinecap="round" opacity={0.6} />
  </Svg>
);

const SERVICES = [
  {
    icon: <SablageIcon />,
    title: 'Sablage',
    description: 'Traitement abrasif haute pression',
  },
  {
    icon: <PeintureIcon />,
    title: 'Peinture Ind.',
    description: 'Application revêtements industriels',
  },
  {
    icon: <MetallisationIcon />,
    title: 'Métallisation',
    description: 'Projection thermique métal',
  },
  {
    icon: <ChimieIcon />,
    title: 'Produits Chim.',
    description: 'Solutions chimiques spécialisées',
  },
];

const Onboarding2: React.FC<Onboarding2Props> = ({
  onNext,
  onSkip,
  currentIndex = 1,
  totalScreens = 3,
  onDotPress,
}) => {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgScreen} />
      <View style={styles.screen}>
        <View style={[styles.blob, {
          width: 220,
          height: 220,
          backgroundColor: Colors.blobCyan,
          bottom: 80,
          right: -60,
          opacity: 0.6
        }]} />

        <OnboardingTopBar showSkip onSkip={onSkip} />
        <Text style={styles.sectionTitle}>
          Nos expertises principales
        </Text>

        {/* Service cards grid */}
        <View style={styles.gridZone}>
          <View style={styles.row}>
            {SERVICES.slice(0, 2).map((s, i) => (
                <ServiceCard
                    key={i}
                    icon={s.icon}
                    title={s.title}
                    description={s.description}
                    isActive={i === 0}
                />
            ))}
          </View>
          <View style={styles.row}>
            {SERVICES.slice(2, 4).map((s, i) => (
              <ServiceCard key={i} icon={s.icon} title={s.title} description={s.description} />
            ))}
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <ScreenBadge label="Nos Services" />
          <Text style={styles.title}>
            Services industriels{'\n'}professionnels
          </Text>
          <Text style={styles.subtitle}>
            Accédez à des{' '}
            <Text style={styles.bold}>services industriels avancés</Text>, conçus pour garantir{' '}
            <Text style={styles.bold}>performance</Text>,{' '}
            <Text style={styles.bold}>durabilité</Text> et{' '}
            <Text style={styles.bold}>précision</Text>.
          </Text>
          <PrimaryButton label="Suivant" onPress={onNext} icon="arrow-right" />
        </View>

        <ProgressDots
          total={totalScreens}
          current={currentIndex}
          onDotPress={onDotPress}
        />
      </View>
    </SafeAreaView>
  );
};

export default Onboarding2;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgScreen,
  },
  bold: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: Colors.textPrimary,
  },
  screen: {
    flex: 1,
    backgroundColor: Colors.bgScreen,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
  },
  gridZone: {
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: 40, // 👈 push everything lower
    gap: 14,
    zIndex: 5,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
  },
  content: {
    paddingHorizontal: Theme.spacing.xxl,
    paddingTop: 24, // 👈 more breathing space
    zIndex: 10,
  },
  title: {
    fontFamily: Theme.fonts.condensedBold,
    fontSize: 28,
    color: Colors.textPrimary,
    lineHeight: 32,
    marginBottom: 12,
    letterSpacing: 0.5,
    textAlign: 'center', // 👈 important
  },
  subtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 13.5,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 22,
    textAlign: 'center', // 👈 cleaner look
  },
  sectionTitle: {
    fontFamily: Theme.fonts.condensedBold,
    fontSize: 25,
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: 32,
    marginBottom: -8,
    opacity: 0.85,
  },
});
