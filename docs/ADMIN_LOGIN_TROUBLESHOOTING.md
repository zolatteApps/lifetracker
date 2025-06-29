# Admin Login Troubleshooting Guide

## Quick Fix

If you're experiencing admin login issues:

```bash
# Run the admin setup script
node scripts/setup-admin.js
```

This will reset the admin credentials to:
- **Email:** admin@gmail.com
- **Password:** admin123

## Common Issues and Solutions

### 1. "Invalid credentials" Error

**Cause:** Password mismatch or corrupted password hash
**Solution:** Run `node scripts/setup-admin.js`

### 2. Intermittent Login Failures

**Cause:** MongoDB connection issues
**Solution:** 
- Check database connection: `curl http://localhost:5000/api/health/db-status`
- Restart server if status shows "unhealthy"

### 3. Token Errors

**Cause:** JWT secret mismatch or expired tokens
**Solution:** 
- Clear browser cookies/localStorage
- Ensure JWT_SECRET is set in .env file

## Monitoring Tools

### 1. Database Status Check
```bash
curl http://localhost:5000/api/health/db-status
```

Expected response:
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "readyStateText": "connected",
    "adminUsers": 1
  }
}
```

### 2. General Health Check
```bash
curl http://localhost:5000/api/health
```

### 3. Test Admin Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"admin123"}'
```

## Prevention Measures

1. **Environment Variables**
   - Set a strong `JWT_SECRET` in .env
   - Ensure `MONGODB_URI` is correctly configured

2. **Regular Monitoring**
   - Check `/api/health/db-status` endpoint periodically
   - Monitor server logs for connection errors

3. **Database Connection**
   - The connection now has retry logic (3 attempts)
   - Stale connections are automatically cleared
   - Connection timeouts are properly configured

## Architecture Improvements Made

1. **MongoDB Connection Manager** (`api/lib/mongodb.js`)
   - Validates connection state before use
   - Clears failed connections from cache
   - Implements proper timeout handling

2. **Login Endpoint** (`api/auth/login.js`)
   - Added retry logic for database operations
   - Better error messages for debugging
   - Connection state validation

3. **Health Monitoring** (`api/health/db-status.js`)
   - Real-time database connection status
   - Admin user count verification
   - Connection state details

## If Issues Persist

1. Check MongoDB Atlas:
   - Ensure cluster is running
   - Verify network access (IP whitelist)
   - Check connection limits

2. Verify Environment:
   ```bash
   node -e "console.log({
     JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
     MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
     NODE_ENV: process.env.NODE_ENV
   })"
   ```

3. Test Direct Database Connection:
   ```bash
   node -e "
   require('dotenv').config();
   const mongoose = require('mongoose');
   mongoose.connect(process.env.MONGODB_URI)
     .then(() => console.log('✅ Direct connection successful'))
     .catch(err => console.error('❌ Connection failed:', err.message));
   "
   ```

## Admin Credentials

- **Email:** admin@gmail.com
- **Password:** admin123
- **Role:** admin
- **Database:** lifesyncc
- **User ID:** 685994e6b0f80cfa066867d2