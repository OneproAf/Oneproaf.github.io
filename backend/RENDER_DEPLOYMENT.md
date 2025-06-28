# Render.com Deployment Guide

## Step-by-Step Backend Deployment

### 1. Create Render.com Account
- Go to [render.com](https://render.com)
- Sign up with your GitHub account

### 2. Create New Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `OneproAf/Oneproaf.github.io`
3. Configure the service:
   - **Name**: `moodscanai-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid if needed)

### 3. Set Environment Variables
Add these environment variables in Render.com dashboard:

```
GEMINI_API_KEY=your_actual_gemini_api_key_here
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
```

### 4. Get Your API Keys

#### Google Gemini API Key:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key and add it as `GEMINI_API_KEY`

#### Spotify API Keys:
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Get Client ID and Client Secret
4. Add them as environment variables

### 5. Deploy
1. Click "Create Web Service"
2. Wait for deployment to complete
3. Copy your service URL (e.g., `https://moodscanai-backend.onrender.com`)

### 6. Update Frontend Config
Once deployed, update `frontend/config.js`:
```javascript
// Change this line:
return 'https://your-actual-backend-url.onrender.com';
```

### 7. Test Deployment
Test your API endpoints:
```bash
curl https://your-backend-url.onrender.com/api/get-advice?mood=Happy
```

## Troubleshooting

### Common Issues:
1. **Build fails**: Check that all dependencies are in package.json
2. **Environment variables**: Make sure all required variables are set
3. **CORS errors**: Backend is already configured for your Netlify domain
4. **API key errors**: Ensure your Gemini API key is valid

### Support:
- Render.com documentation: https://render.com/docs
- Check deployment logs in Render.com dashboard 