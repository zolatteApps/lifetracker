import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type ScheduleViewType = 'day' | 'week' | 'month';

interface ScheduleViewSwitcherProps {
  activeView: ScheduleViewType;
  onViewChange: (view: ScheduleViewType) => void;
}

export const ScheduleViewSwitcher: React.FC<ScheduleViewSwitcherProps> = ({
  activeView,
  onViewChange,
}) => {
  const views: ScheduleViewType[] = ['day', 'week', 'month'];

  return (
    <View style={styles.container}>
      {views.map((view) => (
        <TouchableOpacity
          key={view}
          style={[
            styles.button,
            activeView === view && styles.activeButton,
          ]}
          onPress={() => onViewChange(view)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.buttonText,
              activeView === view && styles.activeButtonText,
            ]}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
    marginVertical: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeButtonText: {
    color: '#4F46E5',
  },
});