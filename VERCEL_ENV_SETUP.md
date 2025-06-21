# Vercel Environment Variables Setup

When deploying to Vercel, you need to add the following environment variables:

## Required Environment Variables

1. **MONGODB_URI**
   - Your MongoDB connection string
   - Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/lifesyncc`

2. **JWT_SECRET**
   - A secure random string for JWT signing
   - Generate one using: `openssl rand -base64 32`

3. **REACT_APP_API_URL** (for frontend)
   - In production: `https://your-vercel-app.vercel.app`
   - This will be your Vercel deployment URL

## How to Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Navigate to "Environment Variables"
4. Add each variable:
   - Key: `MONGODB_URI`
   - Value: Your MongoDB connection string
   - Environment: Select all (Production, Preview, Development)
5. Repeat for `JWT_SECRET` and `REACT_APP_API_URL`

## API Endpoints

After deployment, your API endpoints will be:
- Login: `https://your-app.vercel.app/api/auth/login`
- Register: `https://your-app.vercel.app/api/auth/register`
- User Profile: `https://your-app.vercel.app/api/auth/user`

## Update Frontend Configuration

Update `src/config/api.ts` to use the Vercel URL in production:

```typescript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```