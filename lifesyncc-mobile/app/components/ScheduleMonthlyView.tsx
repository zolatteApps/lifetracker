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

interface MonthlyViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  tasks: any[];
}

const categoryColors = {
  physical: '#10B981',
  mental: '#8B5CF6',
  financial: '#F59E0B',
  social: '#3B82F6',
  personal: '#EC4899',
};

export const ScheduleMonthlyView: React.FC<MonthlyViewProps> = ({
  selectedDate,
  onDateSelect,
}) => {
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthSchedules, setMonthSchedules] = useState<Map<string, any>>(new Map());

  const getMonthStart = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const getCalendarDays = (monthStart: Date) => {
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const firstDay = monthStart.getDay();
    const monthYear = monthStart.getFullYear();
    const monthIndex = monthStart.getMonth();
    
    const prevMonthDays = firstDay;
    const currentMonthDays = new Date(monthYear, monthIndex + 1, 0).getDate();
    const totalDays = Math.ceil((prevMonthDays + currentMonthDays) / 7) * 7;
    
    for (let i = 0; i < totalDays; i++) {
      const dayDate = new Date(monthYear, monthIndex, i - prevMonthDays + 1);
      days.push({
        date: dayDate,
        dayNumber: dayDate.getDate(),
        isCurrentMonth: dayDate.getMonth() === monthIndex,
        isToday: dayDate.getTime() === today.getTime(),
        isSelected: dayDate.toDateString() === selectedDate.toDateString(),
        tasks: [],
      });
    }
    
    return days;
  };

  const fetchMonthSchedules = async () => {
    setLoading(true);
    try {
      const monthStart = getMonthStart(currentMonth);
      const days = getCalendarDays(monthStart);
      const scheduleMap = new Map<string, any>();
      
      const currentMonthDays = days.filter(day => day.isCurrentMonth);
      
      const schedulePromises = currentMonthDays.map(async (day) => {
        try {
          const dateStr = scheduleService.formatDateForAPI(day.date);
          const schedule = await scheduleService.getSchedule(dateStr);
          if (schedule.blocks && schedule.blocks.length > 0) {
            scheduleMap.set(dateStr, schedule.blocks);
          }
        } catch (error) {
          console.error(`Error fetching schedule for ${day.date}:`, error);
        }
      });

      await Promise.all(schedulePromises);
      
      const daysWithTasks = days.map(day => ({
        ...day,
        tasks: scheduleMap.get(scheduleService.formatDateForAPI(day.date)) || [],
      }));
      
      setMonthSchedules(scheduleMap);
      setCalendarDays(daysWithTasks);
    } catch (error) {
      console.error('Error fetching month schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [selectedDate]);

  useEffect(() => {
    fetchMonthSchedules();
  }, [currentMonth]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newDate);
  };

  const getTaskDots = (tasks: any[]) => {
    if (tasks.length === 0) return null;
    
    const categories = tasks.map(task => task.category);
    const uniqueCategories = [...new Set(categories)].slice(0, 3);
    
    return (
      <View style={styles.taskDots}>
        {uniqueCategories.map((category, index) => (
          <View
            key={index}
            style={[
              styles.taskDot,
              { backgroundColor: categoryColors[category as keyof typeof categoryColors] }
            ]}
          />
        ))}
        {tasks.length > 3 && (
          <Text style={styles.moreTasks}>+{tasks.length - 3}</Text>
        )}
      </View>
    );
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const monthStats = {
    totalTasks: Array.from(monthSchedules.values()).reduce((sum, tasks) => sum + tasks.length, 0),
    completedTasks: Array.from(monthSchedules.values()).reduce(
      (sum, tasks) => sum + tasks.filter((t: any) => t.completed).length, 0
    ),
    activeDays: monthSchedules.size,
  };

  return (
    <View style={styles.container}>
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color="#4F46E5" />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.calendar}>
          <View style={styles.weekDaysRow}>
            {weekDays.map((day) => (
              <View key={day} style={styles.weekDayCell}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  !day.isCurrentMonth && styles.otherMonthDay,
                  day.isToday && styles.todayCell,
                  day.isSelected && styles.selectedCell,
                ]}
                onPress={() => day.isCurrentMonth && onDateSelect(day.date)}
                activeOpacity={day.isCurrentMonth ? 0.7 : 1}
              >
                <Text style={[
                  styles.dayNumber,
                  !day.isCurrentMonth && styles.otherMonthText,
                  day.isToday && styles.todayText,
                  day.isSelected && styles.selectedText,
                ]}>
                  {day.dayNumber}
                </Text>
                {day.isCurrentMonth && getTaskDots(day.tasks)}
                {day.tasks.length > 0 && day.isCurrentMonth && (
                  <View style={[
                    styles.taskCountBadge,
                    day.isSelected && styles.selectedBadge,
                  ]}>
                    <Text style={[
                      styles.taskCountText,
                      day.isSelected && styles.selectedText,
                    ]}>
                      {day.tasks.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.monthStats}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{monthStats.totalTasks}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{monthStats.completedTasks}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{monthStats.activeDays}</Text>
            <Text style={styles.statLabel}>Active Days</Text>
          </View>
        </View>

        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Categories</Text>
          <View style={styles.legendItems}>
            {Object.entries(categoryColors).map(([category, color]) => (
              <View key={category} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <Text style={styles.legendText}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </View>
            ))}
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
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  calendar: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  todayCell: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
  },
  selectedCell: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  otherMonthText: {
    color: '#9ca3af',
  },
  todayText: {
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  selectedText: {
    color: '#fff',
  },
  taskDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 4,
  },
  taskDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  moreTasks: {
    fontSize: 8,
    color: '#6b7280',
    marginLeft: 2,
  },
  taskCountBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  selectedBadge: {
    backgroundColor: '#fff',
  },
  taskCountText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  monthStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
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
  legend: {
    marginTop: 16,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
});