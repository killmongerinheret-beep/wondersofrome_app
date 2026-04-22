# 🌍 Tunnel Mode - Test from Anywhere in the World!

## What is Tunnel Mode?

Tunnel mode creates a **public URL** that works from anywhere:
- ✅ Different WiFi networks
- ✅ Mobile data (4G/5G)
- ✅ Different countries
- ✅ Share with friends/testers globally

---

## 🚀 Quick Start

### Option 1: Use Batch File (Easiest)
```bash
START_TUNNEL_MODE.bat
```

### Option 2: Manual Command
```bash
npx expo start --tunnel
```

---

## 📋 Step-by-Step Instructions

### 1. Install ngrok (First Time Only)
```bash
npm install -g @expo/ngrok@latest
```

### 2. Start Tunnel
```bash
npx expo start --tunnel
```

### 3. Wait 1-2 Minutes
You'll see:
```
› Tunnel ready.
› Tunnel URL: https://abc123.ngrok.io
```

### 4. Scan QR Code or Use URL
The QR code and URL now work from **anywhere in the world**!

---

## 🌐 How to Connect

### On Your Phone (Anywhere):
1. Open Expo Go app
2. Scan the QR code
   OR
3. Tap "Enter URL manually"
4. Type the tunnel URL (e.g., `exp://abc123.ngrok.io`)
5. App loads!

### Share with Others:
Send them:
- The QR code screenshot
- The tunnel URL
- They can test from anywhere!

---

## ⚡ Comparison

### Local WiFi Mode (Default)
- ✅ Fast
- ✅ Low latency
- ❌ Same WiFi only
- ❌ Can't share globally
- **URL**: `exp://10.106.103.152:8081`

### Tunnel Mode
- ✅ Works from anywhere
- ✅ Share globally
- ✅ Mobile data works
- ❌ Slower
- ❌ Higher latency
- **URL**: `exp://abc123.ngrok.io`

---

## 🎯 When to Use Tunnel Mode

### Use Tunnel Mode When:
- Testing from different location
- Using mobile data
- Sharing with remote testers
- Not on same WiFi as computer
- Testing from another country

### Use Local Mode When:
- Testing on same WiFi
- Want faster performance
- Just you testing
- Computer and phone nearby

---

## 🔧 Troubleshooting

### "ngrok not installed"
```bash
npm install -g @expo/ngrok@latest
```

### "Tunnel failed to start"
- Check internet connection
- Try again (sometimes takes 2-3 attempts)
- Check firewall settings

### "Tunnel is slow"
- This is normal - tunnel adds latency
- Use local mode for faster testing
- Tunnel is for convenience, not speed

### "Tunnel URL expired"
- Tunnel URLs expire after some time
- Restart tunnel to get new URL
- Free ngrok has time limits

---

## 📊 Performance

### Local WiFi:
- Load time: 2-5 seconds
- Reload: 1-2 seconds
- Latency: <50ms

### Tunnel:
- Load time: 10-30 seconds
- Reload: 5-10 seconds
- Latency: 200-500ms

---

## 🌍 Use Cases

### 1. Remote Testing
```
You: In USA
Tester: In Europe
Solution: Use tunnel mode
```

### 2. Mobile Data Testing
```
Phone: On 4G/5G (not WiFi)
Computer: On WiFi
Solution: Use tunnel mode
```

### 3. Different Networks
```
Phone: On home WiFi
Computer: On office WiFi
Solution: Use tunnel mode
```

### 4. Share with Team
```
Send tunnel URL to team
Everyone can test simultaneously
From anywhere in the world
```

---

## 🔐 Security Notes

### Tunnel URLs are Public:
- Anyone with the URL can access your app
- Don't share sensitive data in development
- URLs expire after some time
- Use for testing only, not production

### Best Practices:
- Only share with trusted testers
- Don't commit tunnel URLs to git
- Restart tunnel to get new URL
- Use local mode when possible

---

## 💰 Costs

### Free Tier (ngrok):
- ✅ Unlimited tunnels
- ✅ Basic features
- ⚠️ Time limits per session
- ⚠️ URLs expire

### Paid Tier:
- ✅ Longer sessions
- ✅ Custom domains
- ✅ More concurrent connections
- Not needed for testing

---

## 🎯 Quick Commands

### Start Tunnel:
```bash
npx expo start --tunnel
```

### Stop Tunnel:
```
Press Ctrl+C in terminal
```

### Restart Tunnel:
```bash
# Stop with Ctrl+C, then:
npx expo start --tunnel
```

### Switch to Local:
```bash
npx expo start
```

### Switch to Tunnel:
```bash
npx expo start --tunnel
```

---

## 📱 Testing Workflow

### For Local Testing:
1. Use local WiFi mode (faster)
2. Test all features
3. Fix bugs
4. Iterate quickly

### For Remote Testing:
1. Switch to tunnel mode
2. Share URL with testers
3. Collect feedback
4. Switch back to local for fixes

---

## ✅ Success Checklist

- [ ] ngrok installed
- [ ] Tunnel started successfully
- [ ] Got tunnel URL (e.g., abc123.ngrok.io)
- [ ] QR code visible
- [ ] Scanned QR code or entered URL
- [ ] App loaded on phone
- [ ] Works from anywhere!

---

## 🚀 Next Steps

### After Testing with Tunnel:
1. ✅ Verify app works globally
2. ✅ Test on mobile data
3. ✅ Share with remote testers
4. ✅ Collect feedback
5. ✅ Build APK for distribution

### Build APK:
```bash
CLOUD_BUILD.bat
```

Then share APK file instead of tunnel URL.

---

## 📄 Related Files

- **START_TUNNEL_MODE.bat** - Start tunnel automatically
- **MANUAL_URL_GUIDE.txt** - Local WiFi connection
- **CLOUD_BUILD_GUIDE.md** - Build APK for sharing

---

**Generated**: April 21, 2026  
**Status**: Ready for global testing!  
**Command**: `npx expo start --tunnel`
