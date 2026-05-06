import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  ViewToken,
} from 'react-native';
import Onboarding1 from './Onboarding1';
import Onboarding2 from './Onboarding2';
import Onboarding3 from './Onboarding3';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

interface OnboardingNavigatorProps {
  onFinish: () => void;
}

const OnboardingNavigator: React.FC<OnboardingNavigatorProps> = ({ onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);

  const goTo = (index: number) => {
    flatRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < 2) goTo(currentIndex + 1);
  };

  const handleSkip = () => goTo(2);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const screens = [
    {
      key: 'onboarding1',
      component: (
          <Onboarding1
              onNext={handleNext}
              onSkip={handleSkip}
              currentIndex={0}
              totalScreens={3}
              onDotPress={goTo}
          />
      ),
    },
    {
      key: 'onboarding2',
      component: (
          <Onboarding2
              onNext={handleNext}
              onSkip={handleSkip}
              currentIndex={1}
              totalScreens={3}
              onDotPress={goTo}
          />
      ),
    },
    {
      key: 'onboarding3',
      component: (
          <Onboarding3
              onStart={onFinish}
              currentIndex={2}
              totalScreens={3}
              onDotPress={goTo}
              isActive={currentIndex === 2}
          />
      ),
    },
  ];

  return (
    <View style={styles.container}>
      <FlatList
          ref={flatRef}
          data={screens}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
              <View style={styles.slide}>{item.component}</View>
          )}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
          scrollEventThrottle={16}
          bounces={false}
      />
    </View>
  );
};

export default OnboardingNavigator;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPage,
  },
  slide: {
    width,
    flex: 1,
  },
});
