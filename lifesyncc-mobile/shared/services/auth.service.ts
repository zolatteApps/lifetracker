import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  OAuthCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, COLLECTIONS } from '../types';

export class AuthService {
  // Sign up with email and password
  static async signUp(email: string, password: string, displayName?: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update display name if provided
      if (displayName) {
        await updateProfile(firebaseUser, { displayName });
      }

      // Create user document in Firestore
      const userData: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: displayName || firebaseUser.displayName || undefined,
        photoURL: firebaseUser.photoURL || undefined,
        createdAt: new Date(),
        lastActive: new Date(),
        role: 'user'
      };

      await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), userData);

      return userData;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      // Update last active
      await updateDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
        lastActive: new Date()
      });

      return userDoc.data() as User;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Sign in with Google (Web)
  static async signInWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return this.handleSocialSignIn(result.user);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Sign in with Google (Mobile - requires credential from expo-auth-session)
  static async signInWithGoogleCredential(credential: OAuthCredential): Promise<User> {
    try {
      const result = await signInWithCredential(auth, credential);
      return this.handleSocialSignIn(result.user);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Handle social sign in
  private static async handleSocialSignIn(firebaseUser: FirebaseUser): Promise<User> {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
    
    if (userDoc.exists()) {
      // Update last active
      await updateDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
        lastActive: new Date()
      });
      return userDoc.data() as User;
    } else {
      // Create new user
      const userData: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || undefined,
        photoURL: firebaseUser.photoURL || undefined,
        createdAt: new Date(),
        lastActive: new Date(),
        role: 'user'
      };

      await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), userData);
      return userData;
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Reset password
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser) {
      return null;
    }

    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
    
    if (!userDoc.exists()) {
      return null;
    }

    return userDoc.data() as User;
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
        if (userDoc.exists()) {
          callback(userDoc.data() as User);
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }
}