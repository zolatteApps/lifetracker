import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Goal, COLLECTIONS } from '../types';

export class GoalsService {
  // Create a new goal
  static async createGoal(userId: string, goalData: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Goal> {
    try {
      const goalRef = doc(collection(db, COLLECTIONS.GOALS));
      const goal: Goal = {
        ...goalData,
        id: goalRef.id,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(goalRef, {
        ...goal,
        createdAt: Timestamp.fromDate(goal.createdAt),
        updatedAt: Timestamp.fromDate(goal.updatedAt),
        dueDate: goal.dueDate ? Timestamp.fromDate(goal.dueDate) : null
      });

      return goal;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Get all goals for a user
  static async getUserGoals(userId: string): Promise<Goal[]> {
    try {
      const goalsQuery = query(
        collection(db, COLLECTIONS.GOALS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(goalsQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          dueDate: data.dueDate ? data.dueDate.toDate() : undefined
        } as Goal;
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Get goals by category
  static async getGoalsByCategory(userId: string, category: Goal['category']): Promise<Goal[]> {
    try {
      const goalsQuery = query(
        collection(db, COLLECTIONS.GOALS),
        where('userId', '==', userId),
        where('category', '==', category),
        orderBy('priority', 'desc'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(goalsQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          dueDate: data.dueDate ? data.dueDate.toDate() : undefined
        } as Goal;
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Update goal
  static async updateGoal(goalId: string, updates: Partial<Goal>): Promise<void> {
    try {
      const goalRef = doc(db, COLLECTIONS.GOALS, goalId);
      
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      };

      if (updates.dueDate) {
        updateData.dueDate = Timestamp.fromDate(updates.dueDate);
      }

      await updateDoc(goalRef, updateData);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Update goal progress
  static async updateGoalProgress(goalId: string, progress: number, currentValue?: number): Promise<void> {
    try {
      const updates: any = {
        progress,
        updatedAt: Timestamp.fromDate(new Date())
      };

      if (currentValue !== undefined) {
        updates.currentValue = currentValue;
      }

      if (progress >= 100) {
        updates.completed = true;
      }

      await updateDoc(doc(db, COLLECTIONS.GOALS, goalId), updates);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Delete goal
  static async deleteGoal(goalId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.GOALS, goalId));
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Get goal by ID
  static async getGoalById(goalId: string): Promise<Goal | null> {
    try {
      const goalDoc = await getDoc(doc(db, COLLECTIONS.GOALS, goalId));
      
      if (!goalDoc.exists()) {
        return null;
      }

      const data = goalDoc.data();
      return {
        ...data,
        id: goalDoc.id,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        dueDate: data.dueDate ? data.dueDate.toDate() : undefined
      } as Goal;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Get active goals count by category
  static async getActiveGoalsCountByCategory(userId: string): Promise<Record<Goal['category'], number>> {
    try {
      const goals = await this.getUserGoals(userId);
      const activeGoals = goals.filter(goal => !goal.completed);
      
      return {
        physical: activeGoals.filter(g => g.category === 'physical').length,
        mental: activeGoals.filter(g => g.category === 'mental').length,
        financial: activeGoals.filter(g => g.category === 'financial').length,
        social: activeGoals.filter(g => g.category === 'social').length
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}