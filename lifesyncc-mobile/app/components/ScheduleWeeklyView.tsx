import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import scheduleService from '../services/schedule.service';

interface WeeklyViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onTaskPress?: (date: Date) => void;
}

interface DayData {
  date: Date;
  dayName: string;
  dayNumber: number;
  tasks: any[];
  isToday: boolean;
  isSelected: boolean;
}

const categoryColors = {
  physical: '#10B981',
  mental: '#8B5CF6',
  financial: '#F59E0B',
  social: '#3B82F6',
  personal: '#EC4899',
};

export const ScheduleWeeklyView: React.FC<WeeklyViewProps> = ({
  selectedDate,
  onDateSelect,
  onTaskPress,
}) => {
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getWeekDays = (startDate: Date) => {
    const days: DayData[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      days.push({
        date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        tasks: [],
        isToday: date.getTime() === today.getTime(),
        isSelected: date.toDateString() === selectedDate.toDateString(),
      });
    }
    return days;
  };

  const fetchWeekSchedules = async () => {
    setLoading(true);
    try {
      const weekStart = getWeekStart(currentWeekStart);
      const days = getWeekDays(weekStart);
      
      const schedulePromises = days.map(async (day) => {
        try {
          const dateStr = scheduleService.formatDateForAPI(day.date);
          const schedule = await scheduleService.getSchedule(dateStr);
          return { ...day, tasks: schedule.blocks || [] };
        } catch (error) {
          return { ...day, tasks: [] };
        }
      });

      const weekDataWithTasks = await Promise.all(schedulePromises);
      setWeekData(weekDataWithTasks);
    } catch (error) {
      console.error('Error fetching week schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const weekStart = getWeekStart(selectedDate);
    setCurrentWeekStart(weekStart);
  }, [selectedDate]);

  useEffect(() => {
    fetchWeekSchedules();
  }, [currentWeekStart]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const getWeekRange = () => {
    const start = new Date(currentWeekStart);
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);
    
    if (start.getMonth() === end.getMonth()) {
      return `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
    } else if (start.getFullYear() === end.getFullYear()) {
      return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()} - ${end.toLocaleDateString('en-US', { month: 'short' })} ${end.getDate()}, ${start.getFullYear()}`;
    } else {
      return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()}, ${start.getFullYear()} - ${end.toLocaleDateString('en-US', { month: 'short' })} ${end.getDate()}, ${end.getFullYear()}`;
    }
  };

  const getTaskIndicators = (tasks: any[]) => {
    const categories = tasks.map(task => task.category);
    const uniqueCategories = [...new Set(categories)].slice(0, 3);
    
    return uniqueCategories.map((category, index) => (
      <View
        key={index}
        style={[
          styles.taskIndicator,
          { backgroundColor: categoryColors[category as keyof typeof categoryColors] }
        ]}
      />
    ));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.weekHeader}>
        <TouchableOpacity onPress={() => navigateWeek('prev')} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color="#4F46E5" />
        </TouchableOpacity>
        <Text style={styles.weekRange}>{getWeekRange()}</Text>
        <TouchableOpacity onPress={() => navigateWeek('next')} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.weekGrid}>
          {weekData.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCard,
                day.isToday && styles.todayCard,
                day.isSelected && styles.selectedCard,
              ]}
              onPress={() => onDateSelect(day.date)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dayName,
                day.isToday && styles.todayText,
                day.isSelected && styles.selectedText,
              ]}>
                {day.dayName}
              </Text>
              <Text style={[
                styles.dayNumber,
                day.isToday && styles.todayText,
                day.isSelected && styles.selectedText,
              ]}>
                {day.dayNumber}
              </Text>
              
              <View style={styles.taskInfo}>
                {day.tasks.length > 0 ? (
                  <>
                    <Text style={[
                      styles.taskCount,
                      day.isSelected && styles.selectedText,
                    ]}>
                      {day.tasks.length} tasks
                    </Text>
                    <View style={styles.taskIndicators}>
                      {getTaskIndicators(day.tasks)}
                    </View>
                    <Text style={[
                      styles.completionRate,
                      day.isSelected && styles.selectedText,
                    ]}>
                      {Math.round((day.tasks.filter(t => t.completed).length / day.tasks.length) * 100)}%
                    </Text>
                  </>
                ) : (
                  <Text style={[
                    styles.noTasks,
                    day.isSelected && styles.selectedText,
                  ]}>
                    No tasks
                  </Text>
                )}
              </View>

              {day.isToday && (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>Today</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.weekStats}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {weekData.reduce((sum, day) => sum + day.tasks.length, 0)}
            </Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {weekData.reduce((sum, day) => 
                sum + day.tasks.filter(t => t.completed).length, 0
              )}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {weekData.filter(day => day.tasks.length > 0).length}
            </Text>
            <Text style={styles.statLabel}>Active Days</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  navButton: {
    padding: 8,
  },
  weekRange: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  weekGrid: {
    paddingHorizontal: 16,
  },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  todayCard: {
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  selectedCard: {
    backgroundColor: '#4F46E5',
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  todayText: {
    color: '#4F46E5',
  },
  selectedText: {
    color: '#fff',
  },
  taskInfo: {
    marginTop: 8,
  },
  taskCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  taskIndicators: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  taskIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  completionRate: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  noTasks: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  todayBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  todayBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  weekStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginTop: 8,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
});