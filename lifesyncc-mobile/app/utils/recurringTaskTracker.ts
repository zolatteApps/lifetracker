import AsyncStorage from '@react-native-async-storage/async-storage';

interface RecurringTaskInfo {
  taskId: string;
  title: string;
  recurrenceId: string;
  recurrenceRule: any;
  startTime: string;
  endTime: string;
  category: string;
}

const RECURRING_TASKS_KEY = '@recurring_tasks_registry';

export class RecurringTaskTracker {
  // Register a task as recurring
  static async registerRecurringTask(taskInfo: RecurringTaskInfo): Promise<void> {
    try {
      const existingData = await this.getRecurringTasks();
      existingData[taskInfo.recurrenceId] = taskInfo;
      await AsyncStorage.setItem(RECURRING_TASKS_KEY, JSON.stringify(existingData));
      console.log('📝 Registered recurring task:', taskInfo.title);
    } catch (error) {
      console.error('Error registering recurring task:', error);
    }
  }

  // Get all recurring tasks
  static async getRecurringTasks(): Promise<Record<string, RecurringTaskInfo>> {
    try {
      const data = await AsyncStorage.getItem(RECURRING_TASKS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error getting recurring tasks:', error);
      return {};
    }
  }

  // Check if a task is recurring by matching properties
  static async isTaskRecurring(task: any): Promise<{ isRecurring: boolean; recurrenceInfo?: RecurringTaskInfo }> {
    try {
      const recurringTasks = await this.getRecurringTasks();
      
      // Check by recurrenceId first
      if (task.recurrenceId && recurringTasks[task.recurrenceId]) {
        return { isRecurring: true, recurrenceInfo: recurringTasks[task.recurrenceId] };
      }
      
      // Check by matching properties (title, time, category)
      for (const [recurrenceId, info] of Object.entries(recurringTasks)) {
        if (
          info.title === task.title &&
          info.startTime === task.startTime &&
          info.endTime === task.endTime &&
          info.category === task.category
        ) {
          return { isRecurring: true, recurrenceInfo: info };
        }
      }
      
      return { isRecurring: false };
    } catch (error) {
      console.error('Error checking if task is recurring:', error);
      return { isRecurring: false };
    }
  }

  // Apply recurring info to tasks
  static async applyRecurringInfo(tasks: any[]): Promise<any[]> {
    const recurringTasks = await this.getRecurringTasks();
    
    return Promise.all(tasks.map(async (task) => {
      const { isRecurring, recurrenceInfo } = await this.isTaskRecurring(task);
      
      if (isRecurring && recurrenceInfo) {
        console.log(`🔄 Applying recurring info to task: ${task.title}`);
        return {
          ...task,
          recurring: true,
          recurrenceId: recurrenceInfo.recurrenceId,
          recurrenceRule: recurrenceInfo.recurrenceRule
        };
      }
      
      return task;
    }));
  }

  // Remove a recurring task
  static async removeRecurringTask(recurrenceId: string): Promise<void> {
    try {
      const existingData = await this.getRecurringTasks();
      delete existingData[recurrenceId];
      await AsyncStorage.setItem(RECURRING_TASKS_KEY, JSON.stringify(existingData));
      console.log('🗑️ Removed recurring task:', recurrenceId);
    } catch (error) {
      console.error('Error removing recurring task:', error);
    }
  }

  // Clear all recurring tasks (for debugging)
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(RECURRING_TASKS_KEY);
      console.log('🧹 Cleared all recurring tasks');
    } catch (error) {
      console.error('Error clearing recurring tasks:', error);
    }
  }
}