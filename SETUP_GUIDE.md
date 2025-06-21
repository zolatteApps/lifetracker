# LifeSync Setup Guide

## Project Structure

Your LifeSync project now has the following structure:
- **Web App**: Main React app in the root directory
- **Mobile App**: React Native (Expo) app in `/lifesyncc-mobile`
- **Shared Code**: Common types and services in `/shared`

## Firebase Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project called "LifeSync"
3. Enable Authentication with Email/Password and Google Sign-In
4. Create a Firestore Database (start in test mode)
5. Get your configuration from Project Settings

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Web App Environment Variables
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
REACT_APP_FIREBASE_PROJECT_ID=your_project_id_here
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
REACT_APP_FIREBASE_APP_ID=your_app_id_here
```

Create a `.env` file in the `/lifesyncc-mobile` directory:

```env
# Mobile App Environment Variables
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

### 3. Firestore Security Rules

Update your Firestore rules to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Goals belong to users
    match /goals/{goalId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Similar rules for other collections
    match /schedule/{scheduleId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    match /checkins/{checkinId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## Running the Applications

### Web App
```bash
# From root directory
npm start
```

### Mobile App
```bash
# From root directory
cd lifesyncc-mobile
npm start

# Then:
# Press 'i' for iOS simulator
# Press 'a' for Android emulator
# Scan QR code with Expo Go app on your phone
```

## Next Steps

1. **Set up Firebase**: Follow the steps above to configure Firebase
2. **Test Authentication**: Try creating an account and signing in
3. **Migrate Web Features**: The mobile app structure is ready for you to port features from the web app
4. **Add Push Notifications**: Use Expo's push notification service
5. **Deploy Web App**: Use Vercel or Netlify
6. **Deploy Mobile App**: Use Expo EAS Build for app stores

## Features Ready to Use

- ✅ Authentication (Sign up, Sign in, Sign out)
- ✅ Firebase integration for both platforms
- ✅ Shared types and services
- ✅ Basic navigation structure
- ✅ Dashboard with real-time data sync

## Features to Implement

- 📋 Goal creation and management UI
- 📅 Schedule view and management
- 🔔 Check-in reminders
- 📊 Analytics and progress tracking
- 🌙 Dark mode support
- 🔄 Offline support with sync

## Admin Panel

To add an admin panel:
1. Add a role check in the auth flow
2. Create admin-only routes
3. Build analytics dashboard
4. Add user management features

Need help with any specific feature? Just ask!