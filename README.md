# Tremor Diagnostic App - Showcase

This is a **frontend-only** showcase of the Tremor Diagnostic Application.

## ⚠️ Important: This is Frontend Only

**GitHub Pages can only host static files** (HTML, CSS, JavaScript). It **cannot run Python backend code**.

### What's Here:
- ✅ Frontend React app (built with Vite)
- ✅ All UI components and screens
- ❌ No Python backend files (GitHub Pages can't run them)

### To Make It Work Like Your Local Setup:

You need **two separate deployments**:

1. **Frontend** (this repository) → GitHub Pages ✅ (already done)
2. **Backend** (Python/FastAPI) → Needs separate hosting:
   - **Render** (free tier available): https://render.com
   - **Railway**: https://railway.app
   - **Heroku**: https://heroku.com
   - **Fly.io**: https://fly.io

### Current Status:

- **Frontend**: ✅ Deployed at `https://oskarb357.github.io/tremor-showcase/`
- **Backend**: ❌ Not deployed (needs separate hosting)

### To Connect Frontend to Backend:

Once you deploy the backend, update the frontend's backend URL in:
- `ProcessingScreen.tsx` - Change `BACKEND_URL` from `http://localhost:8000` to your deployed backend URL
- Or use environment variables: `VITE_BACKEND_URL`

### About GitHub Actions Cancellation:

The cancellation you saw is **normal**. When multiple commits are pushed quickly, GitHub cancels older deployments and only deploys the latest one. The latest deployment should succeed.

## Local Development

To run locally with both frontend and backend:

```bash
# Terminal 1: Backend
cd tremor/backend-main
python3 main.py

# Terminal 2: Frontend  
cd tremor/Frontendv35-main
npm run dev
```
