import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export const ScheduleSkeleton: React.FC = () => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const SkeletonItem = () => (
    <Animated.View style={[styles.skeletonItem, { opacity }]}>
      <View style={styles.timeBlock} />
      <View style={styles.contentBlock}>
        <View style={styles.titleBlock} />
        <View style={styles.subtitleBlock} />
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((index) => (
        <SkeletonItem key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  skeletonItem: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  timeBlock: {
    width: 60,
    height: 40,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    marginRight: 16,
  },
  contentBlock: {
    flex: 1,
  },
  titleBlock: {
    width: '70%',
    height: 20,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
  },
  subtitleBlock: {
    width: '40%',
    height: 16,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
  },
});