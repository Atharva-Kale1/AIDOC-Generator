# AI Document Generator - Complete Setup Guide

## Prerequisites
- Python 3.8+
- Node.js 20.10.0 (or upgrade to 20.19+)
- Google Gemini API Key
- Firebase Project with Authentication enabled

## Step 1: Firebase Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** → **Email/Password**

### 1.2 Get Service Account Key (Backend)
1. Go to **Project Settings** → **Service Accounts**
2. Click **Generate New Private Key**
3. Save the file as `serviceAccountKey.json` in the `backend/` directory

### 1.3 Get Web App Config (Frontend)
1. Go to **Project Settings** → **General**
2. Add a Web App (</>)
3. Copy the `firebaseConfig` object
4. Verify it matches the config in `frontend/src/firebase.js`

## Step 2: Backend Setup

### 2.1 Navigate to Backend
```bash
cd backend
```

### 2.2 Install Dependencies
```bash
pip install -r requirements.txt
```

### 2.3 Create .env File
Create a file named `.env` in the `backend/` directory:
```
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7
```

### 2.4 Verify Files
Ensure these files exist in `backend/`:
- `serviceAccountKey.json` ✓
- `.env` ✓
- `main.py` ✓

### 2.5 Start Backend Server
```bash
uvicorn main:app --reload
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

## Step 3: Frontend Setup

### 3.1 Navigate to Frontend
```bash
cd frontend
```

### 3.2 Install Dependencies
```bash
npm install
```

### 3.3 Start Frontend Server
```bash
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

## Step 4: Test the Application

### 4.1 Open Browser
Navigate to `http://localhost:5173`

### 4.2 Register a New User
1. Click **Register**
2. Enter email and password
3. Click **Register** button

### 4.3 Login
1. Use the credentials you just created
2. Click **Sign in**

### 4.4 Create a Project
1. Click **New Project**
2. Select document type (Word or PowerPoint)
3. Enter a topic (e.g., "AI in Healthcare")
4. Click **Create & Generate Outline**

## Troubleshooting

### Error: "ERR_CONNECTION_REFUSED"
**Cause:** Backend server is not running
**Solution:** 
1. Open a terminal in `backend/` directory
2. Run `uvicorn main:app --reload`
3. Verify you see "Application startup complete"

### Error: "401 Unauthorized"
**Cause:** Firebase authentication issue
**Solution:**
1. Verify `serviceAccountKey.json` exists in `backend/`
2. Check that you're logged in on the frontend
3. Clear browser cache and try again

### Error: "500 Internal Server Error"
**Cause:** Missing Gemini API key or Firebase credentials
**Solution:**
1. Check `backend/.env` has `GEMINI_API_KEY`
2. Verify `serviceAccountKey.json` is valid JSON
3. Check backend terminal for error messages

### Error: "Firebase: Error (auth/invalid-api-key)"
**Cause:** Invalid Firebase configuration
**Solution:**
1. Verify `frontend/src/firebase.js` has correct config
2. Regenerate Firebase web app credentials if needed

## Current Status Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] `serviceAccountKey.json` in `backend/`
- [ ] `.env` file with `GEMINI_API_KEY` in `backend/`
- [ ] Can register a new user
- [ ] Can login successfully
- [ ] Can create a new project
- [ ] Can generate content with AI

## Quick Commands Reference

### Backend
```bash
cd backend
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm run dev
```

### Stop Servers
Press `Ctrl+C` in the terminal running the server
