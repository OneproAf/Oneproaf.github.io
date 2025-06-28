# Deployment Configuration

## Backend URL Setup

To deploy your MoodScan AI application, you need to update the production backend URL in `frontend/config.js`.

### Current Configuration

The application automatically switches between development and production URLs:

- **Development**: `http://localhost:8000` (when running locally)
- **Production**: `https://moodscanai-backend.onrender.com` (when deployed)

### Steps to Deploy Backend

1. **Deploy your backend to Render.com** (or your preferred hosting service)
2. **Update the production URL** in `frontend/config.js`:

```javascript
// In frontend/config.js, line 8
return 'https://your-actual-backend-url.onrender.com';
```

3. **Set environment variables** on your backend hosting service:
   - `GEMINI_API_KEY` - Your Google Gemini API key
   - `SPOTIFY_CLIENT_ID` - Your Spotify API client ID
   - `SPOTIFY_CLIENT_SECRET` - Your Spotify API client secret
   - `VAPID_PUBLIC_KEY` - Your VAPID public key (optional)
   - `VAPID_PRIVATE_KEY` - Your VAPID private key (optional)

### Environment Detection

The application automatically detects the environment:
- If the hostname is `localhost` or `127.0.0.1` → uses development URL
- Otherwise → uses production URL

### API Endpoints

All API calls now use the `config.apiUrl()` function:
- `/api/analyze-mood` - Mood analysis
- `/api/chat` - AI psychologist chat
- `/api/get-music` - Music recommendations
- `/api/get-playlist-tracks` - Playlist tracks
- `/api/save-subscription` - Push notification subscription

This ensures your frontend works seamlessly in both development and production environments. 