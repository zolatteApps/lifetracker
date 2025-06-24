import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface StreakDay {
  date: string;
  completed: boolean;
}

interface StreakCalendarProps {
  streakData: StreakDay[];
  currentStreak: number;
  bestStreak: number;
}

const StreakCalendar: React.FC<StreakCalendarProps> = ({
  streakData,
  currentStreak,
  bestStreak,
}) => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const daySize = (screenWidth - 64) / 7 - 8;

  // Generate last 28 days
  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 27; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dateStr = date.toISOString().split('T')[0];
      const streakDay = streakData.find(d => d.date.startsWith(dateStr));
      
      days.push({
        date: dateStr,
        completed: streakDay?.completed || false,
        isToday: i === 0,
        dayOfWeek: date.getDay(),
        dayOfMonth: date.getDate(),
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const weeks = [];
  
  // Group days into weeks
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Habit Streak</Text>
        <View style={styles.streakStats}>
          <View style={styles.streakItem}>
            <Text style={[styles.streakNumber, { color: theme.primary }]}>
              {currentStreak}
            </Text>
            <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>
              Current
            </Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakItem}>
            <Text style={[styles.streakNumber, { color: theme.success }]}>
              {bestStreak}
            </Text>
            <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>
              Best
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.calendar}>
        <View style={styles.weekDays}>
          {dayNames.map((day, index) => (
            <Text
              key={index}
              style={[
                styles.weekDayText,
                { color: theme.textSecondary, width: daySize },
              ]}
            >
              {day}
            </Text>
          ))}
        </View>

        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {week.map((day, dayIndex) => (
              <View
                key={dayIndex}
                style={[
                  styles.day,
                  {
                    width: daySize,
                    height: daySize,
                    backgroundColor: day.completed
                      ? theme.success
                      : theme.background,
                    borderColor: day.isToday ? theme.primary : theme.border,
                    borderWidth: day.isToday ? 2 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    {
                      color: day.completed
                        ? '#FFFFFF'
                        : theme.textSecondary,
                      fontWeight: day.isToday ? '600' : '400',
                    },
                  ]}
                >
                  {day.dayOfMonth}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendBox,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
          />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>
            Not completed
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendBox, { backgroundColor: theme.success }]}
          />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>
            Completed
          </Text>
        </View>
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  streakStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakItem: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  streakLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  streakDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  calendar: {
    marginTop: 8,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekDayText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  day: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  dayText: {
    fontSize: 12,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
    borderWidth: 1,
  },
  legendText: {
    fontSize: 12,
  },
});

export default StreakCalendar;