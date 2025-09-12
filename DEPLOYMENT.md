# 🚀 Free Deployment Guide for UNO Multiplayer

## 🆓 Best Free Platform: Render

### Why Render?
- ✅ **100% Free Tier** (750 hours/month)
- ✅ **WebSocket Support** (perfect for multiplayer)
- ✅ **Easy Setup** (GitHub integration)
- ✅ **Automatic SSL** (HTTPS)
- ⚠️ **Sleeps after 15min** (wakes up when accessed)

## 📋 Deployment Steps

### Step 1: Prepare Your Code
```bash
# Make sure you're in the project root
cd D:\End_sem_3\UNO_GAME

# Add all files to git
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy on Render
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Use these settings:
   - **Name**: `uno-multiplayer`
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

### Step 3: Environment Variables
Add these in Render dashboard:
- `NODE_ENV` = `production`
- `PORT` = `10000`

### Step 4: Deploy!
Click "Create Web Service" and wait 2-3 minutes.

## 🎮 After Deployment

Your game will be available at:
`https://your-app-name.onrender.com`

### Share with Players:
- **Host**: Use the Render URL
- **Players**: Use the same URL to join
- **No WiFi requirement** (works globally!)

## ⚠️ Free Tier Limitations

1. **Sleep Mode**: App sleeps after 15 minutes of inactivity
   - **Solution**: First player visit wakes it up (takes ~30 seconds)
   
2. **Monthly Hours**: 750 hours free
   - **Solution**: Usually enough for casual gaming

3. **Performance**: Slightly slower than paid tiers
   - **Solution**: Still very playable for UNO

## 🔄 Alternative: Railway (Credit-Based Free)

If you want to try Railway:
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Deploy from repository
4. Get $5 credit monthly (usually enough)

## 🎯 Recommendation

**Start with Render** - it's the most straightforward free option for your multiplayer game!

---

## 📞 Need Help?

If you encounter any issues:
1. Check Render logs in dashboard
2. Ensure all files are committed to GitHub
3. Verify environment variables are set
4. Test the health endpoint: `https://your-app.onrender.com/health`
