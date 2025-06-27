import AsyncStorage from '@react-native-async-storage/async-storage';

interface RecurringTaskInfo {
  taskId: string;
  title: string;
  recurrenceId: string;
  recurrenceRule: any;
  startTime: string;
  endTime: string;
  category: string;
  createdAt: number; // Track when this was registered
}

const RECURRING_TASKS_KEY = '@recurring_tasks_registry';

export class RecurringTaskTracker {
  // Register a task as recurring
  static async registerRecurringTask(taskInfo: Omit<RecurringTaskInfo, 'createdAt'>): Promise<void> {
    try {
      const existingData = await this.getRecurringTasks();
      const fullTaskInfo: RecurringTaskInfo = {
        ...taskInfo,
        createdAt: Date.now()
      };
      existingData[taskInfo.recurrenceId] = fullTaskInfo;
      await AsyncStorage.setItem(RECURRING_TASKS_KEY, JSON.stringify(existingData));
      console.log('📝 Registered recurring task:', taskInfo.title, 'with recurrenceId:', taskInfo.recurrenceId);
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
      
      console.log(`🔎 TRACKER isTaskRecurring: Checking task "${task.title}" with recurrenceId: ${task.recurrenceId}`);
      
      // Check by recurrenceId first
      if (task.recurrenceId && recurringTasks[task.recurrenceId]) {
        console.log(`🔎 TRACKER: Matched by recurrenceId: ${task.recurrenceId}`);
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
          console.log(`🔎 TRACKER: Matched by properties for task "${task.title}" with stored recurrenceId: ${recurrenceId}`);
          return { isRecurring: true, recurrenceInfo: info };
        }
      }
      
      console.log(`🔎 TRACKER: No match found for task "${task.title}"`);
      return { isRecurring: false };
    } catch (error) {
      console.error('Error checking if task is recurring:', error);
      return { isRecurring: false };
    }
  }

  // Apply recurring info to tasks
  static async applyRecurringInfo(tasks: any[]): Promise<any[]> {
    const recurringTasks = await this.getRecurringTasks();
    console.log('🔍 TRACKER DEBUG: Registered recurring tasks:', Object.keys(recurringTasks).length);
    console.log('🔍 TRACKER DEBUG: Task details:', JSON.stringify(recurringTasks, null, 2));
    
    return Promise.all(tasks.map(async (task) => {
      console.log(`🔍 TRACKER DEBUG: Checking task "${task.title}" with id: ${task.id}`);
      const { isRecurring, recurrenceInfo } = await this.isTaskRecurring(task);
      
      if (isRecurring && recurrenceInfo) {
        console.log(`🔄 TRACKER MATCH FOUND: Applying recurring info to task: ${task.title}`);
        console.log(`🔄 TRACKER MATCH DETAILS:`, {
          taskId: task.id,
          taskTitle: task.title,
          matchedByRecurrenceId: task.recurrenceId === recurrenceInfo.recurrenceId,
          matchedByProperties: task.title === recurrenceInfo.title && 
                             task.startTime === recurrenceInfo.startTime && 
                             task.endTime === recurrenceInfo.endTime
        });
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
      console.log('🗑️ TRACKER: Before removal, tasks:', Object.keys(existingData));
      delete existingData[recurrenceId];
      await AsyncStorage.setItem(RECURRING_TASKS_KEY, JSON.stringify(existingData));
      console.log('🗑️ TRACKER: Removed recurring task:', recurrenceId);
      console.log('🗑️ TRACKER: After removal, tasks:', Object.keys(existingData));
    } catch (error) {
      console.error('Error removing recurring task:', error);
    }
  }
  
  // Remove a recurring task by matching properties (fallback when no recurrenceId)
  static async removeRecurringTaskByProperties(task: any): Promise<void> {
    try {
      const existingData = await this.getRecurringTasks();
      console.log('🗑️ TRACKER: Attempting to remove by properties:', task.title);
      
      // Find and remove all entries that match the task properties
      const keysToRemove: string[] = [];
      for (const [recurrenceId, info] of Object.entries(existingData)) {
        if (
          info.title === task.title &&
          info.startTime === task.startTime &&
          info.endTime === task.endTime &&
          info.category === task.category
        ) {
          keysToRemove.push(recurrenceId);
        }
      }
      
      keysToRemove.forEach(key => delete existingData[key]);
      await AsyncStorage.setItem(RECURRING_TASKS_KEY, JSON.stringify(existingData));
      console.log('🗑️ TRACKER: Removed', keysToRemove.length, 'matching tasks');
    } catch (error) {
      console.error('Error removing recurring task by properties:', error);
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