import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  GestureResponderEvent,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from './../constants/colors';
import { Theme } from './../constants/theme';

interface PrimaryButtonProps {
  label: string;
  onPress: (e: GestureResponderEvent) => void;
  icon?: 'arrow-right' | 'arrow-start';
}

const ArrowRight = () => (
  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
    <Path
      d="M3 7H11M8 4L11 7L8 10"
      stroke="#fff"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ArrowStart = () => (
  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
    <Path
      d="M7 2L12 7L7 12M2 7H12"
      stroke="#fff"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  icon = 'arrow-right',
}) => (
  <TouchableOpacity
    style={styles.btn}
    onPress={onPress}
    activeOpacity={0.88}
  >
    <Text style={styles.label}>{label}</Text>
    <View style={styles.icon}>
      {icon === 'arrow-right' ? <ArrowRight /> : <ArrowStart />}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 10, // 👈 more space between text & icon

    backgroundColor: Colors.blueMid,
    borderRadius: Theme.radius.xl + 4,

    paddingVertical: 16,      // 👈 taller button
    paddingHorizontal: 24,    // 👈 THIS is the key fix

    marginBottom: 12,

    shadowColor: Colors.shadowBtn,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 6,
  },
  label: {
    fontFamily: Theme.fonts.condensedBold,
    fontSize: 16, // 👈 slightly bigger
    color: Colors.textWhite,
    letterSpacing: 1.2, // 👈 less aggressive spacing
    textTransform: 'uppercase',
  },
  icon: {
    marginTop: 1,
  },
});
