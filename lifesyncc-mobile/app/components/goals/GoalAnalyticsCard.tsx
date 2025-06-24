import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface AnalyticsData {
  averageProgressPerDay: number;
  projectedCompletionDate?: string;
  totalUpdates: number;
  completionRate: number;
  currentStreak?: number;
  bestStreak?: number;
}

interface GoalAnalyticsCardProps {
  analytics: AnalyticsData;
  goalType: 'milestone' | 'numeric' | 'habit';
}

const GoalAnalyticsCard: React.FC<GoalAnalyticsCardProps> = ({
  analytics,
  goalType,
}) => {
  const { theme } = useTheme();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getProgressIcon = () => {
    if (analytics.averageProgressPerDay > 2) {
      return { name: 'trending-up', color: theme.success };
    } else if (analytics.averageProgressPerDay > 0) {
      return { name: 'trending-neutral', color: theme.primary };
    } else {
      return { name: 'trending-down', color: theme.error };
    }
  };

  const progressIcon = getProgressIcon();

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Text style={[styles.title, { color: theme.text }]}>Analytics</Text>
      
      <View style={styles.metricsGrid}>
        <View style={styles.metric}>
          <View style={styles.metricHeader}>
            <MaterialCommunityIcons
              name={progressIcon.name}
              size={20}
              color={progressIcon.color}
            />
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
              Daily Progress
            </Text>
          </View>
          <Text style={[styles.metricValue, { color: theme.text }]}>
            {analytics.averageProgressPerDay.toFixed(1)}%
          </Text>
        </View>

        {analytics.projectedCompletionDate && (
          <View style={styles.metric}>
            <View style={styles.metricHeader}>
              <MaterialCommunityIcons
                name="calendar-check"
                size={20}
                color={theme.primary}
              />
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Est. Completion
              </Text>
            </View>
            <Text style={[styles.metricValue, { color: theme.text }]}>
              {formatDate(analytics.projectedCompletionDate)}
            </Text>
          </View>
        )}

        <View style={styles.metric}>
          <View style={styles.metricHeader}>
            <MaterialCommunityIcons
              name="counter"
              size={20}
              color={theme.primary}
            />
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
              Total Updates
            </Text>
          </View>
          <Text style={[styles.metricValue, { color: theme.text }]}>
            {analytics.totalUpdates}
          </Text>
        </View>

        {goalType === 'habit' && analytics.currentStreak !== undefined && (
          <View style={styles.metric}>
            <View style={styles.metricHeader}>
              <MaterialCommunityIcons
                name="fire"
                size={20}
                color={theme.warning}
              />
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Current Streak
              </Text>
            </View>
            <Text style={[styles.metricValue, { color: theme.text }]}>
              {analytics.currentStreak} days
            </Text>
          </View>
        )}
      </View>

      {analytics.completionRate > 80 && (
        <View style={[styles.insight, { backgroundColor: theme.successLight }]}>
          <MaterialCommunityIcons
            name="lightbulb-on"
            size={16}
            color={theme.success}
          />
          <Text style={[styles.insightText, { color: theme.success }]}>
            You're {analytics.completionRate}% complete! Keep up the great work!
          </Text>
        </View>
      )}

      {analytics.averageProgressPerDay > 3 && (
        <View style={[styles.insight, { backgroundColor: theme.primaryLight }]}>
          <MaterialCommunityIcons
            name="rocket-launch"
            size={16}
            color={theme.primary}
          />
          <Text style={[styles.insightText, { color: theme.primary }]}>
            Excellent momentum! You're progressing faster than average.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  metric: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    marginLeft: 6,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 4,
  },
  insight: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  insightText: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
});

export default GoalAnalyticsCard;