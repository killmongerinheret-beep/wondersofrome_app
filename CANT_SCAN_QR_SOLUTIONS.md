# 🔧 Can't Scan QR Code? Try These Solutions

## ✅ Solution 1: Manual URL (Easiest!)

**Instead of scanning, type the URL manually:**

### On iPhone:
1. Open **Expo Go** app
2. Tap **"Enter URL manually"** (at the bottom)
3. Type exactly: `exp://10.106.103.152:8081`
4. Tap **"Connect"**

### On Android:
1. Open **Expo Go** app
2. Tap **"Enter URL manually"**
3. Type exactly: `exp://10.106.103.152:8081`
4. Tap **"Connect"**

---

## ✅ Solution 2: Use Browser Link

1. On your phone, open Safari (iPhone) or Chrome (Android)
2. Type: `http://10.106.103.152:8081`
3. You'll see a page with options
4. Tap **"Open in Expo Go"**

---

## ✅ Solution 3: Check WiFi Connection

**Both devices must be on the SAME WiFi network!**

### Check Your Computer:
```
WiFi Network: [Your WiFi Name]
IP Address: 10.106.103.152
```

### Check Your Phone:
- Settings → WiFi
- Make sure connected to SAME network as computer
- Not on mobile data!

---

## ✅ Solution 4: Try Different QR Scanner

### On iPhone:
**Don't use Camera app!** Use Expo Go app:
1. Open **Expo Go** app
2. Tap **"Scan QR Code"** button
3. Point at QR code in terminal
4. Make sure QR code is clear and well-lit

### On Android:
1. Open **Expo Go** app
2. Tap **"Scan QR Code"**
3. Point at QR code
4. Hold steady for 2-3 seconds

---

## ✅ Solution 5: Restart Everything

### Restart Metro Bundler:
1. In terminal, press `Ctrl+C` to stop
2. Run: `npx expo start --go`
3. Wait for new QR code
4. Try scanning again

### Restart Expo Go App:
1. Close Expo Go app completely
2. Reopen it
3. Try scanning again

---

## ✅ Solution 6: Use Tunnel Mode (If on different networks)

If your phone and computer are on different networks:

1. Stop Metro: Press `Ctrl+C`
2. Run: `npx expo start --tunnel`
3. Wait 1-2 minutes for tunnel to start
4. Scan the new QR code

---

## 🎯 Quick Test URLs

Try these URLs in Expo Go app (Enter URL manually):

### Primary URL:
```
exp://10.106.103.152:8081
```

### Alternative URL:
```
exp://172.26.224.1:8081
```

### Web URL (in browser):
```
http://10.106.103.152:8081
```

---

## 🔍 Common Issues

### "Connection Refused"
- ✅ Check WiFi - same network?
- ✅ Check firewall - allow port 8081
- ✅ Try tunnel mode: `npx expo start --tunnel`

### "QR Code Invalid"
- ✅ Use Expo Go app, not Camera app
- ✅ Make sure Metro is running
- ✅ Try manual URL instead

### "Can't Connect to Metro"
- ✅ Check if Metro is running (look for QR code in terminal)
- ✅ Restart Metro: `npx expo start --go`
- ✅ Check Windows Firewall

### "Network Error"
- ✅ Both on same WiFi?
- ✅ Phone not on mobile data?
- ✅ Try tunnel mode

---

## 🚀 Recommended: Use Manual URL

**Easiest and most reliable method:**

1. Open Expo Go app
2. Tap "Enter URL manually"
3. Type: `exp://10.106.103.152:8081`
4. Done!

**No QR scanning needed!**

---

## 📱 Step-by-Step with Screenshots

### iPhone:
```
1. Open Expo Go
2. Bottom of screen: "Enter URL manually"
3. Keyboard appears
4. Type: exp://10.106.103.152:8081
5. Tap "Connect" or "Go"
6. App loads!
```

### Android:
```
1. Open Expo Go
2. Tap "Enter URL manually"
3. Type: exp://10.106.103.152:8081
4. Tap "Connect"
5. App loads!
```

---

## 🔧 Still Not Working?

### Try Tunnel Mode:
```bash
npx expo start --tunnel
```

This creates a public URL that works from anywhere (slower but more reliable).

### Check Firewall:
1. Windows Security → Firewall
2. Allow Node.js through firewall
3. Allow port 8081

### Use USB Connection (Android only):
```bash
adb reverse tcp:8081 tcp:8081
npx expo start --localhost
```

---

## ✅ What Should Work

**These URLs should work in Expo Go:**
- `exp://10.106.103.152:8081` ✅
- `exp://172.26.224.1:8081` ✅

**These URLs should work in browser:**
- `http://10.106.103.152:8081` ✅
- `http://localhost:8081` ✅ (on computer only)

---

## 🎉 Success Checklist

- [ ] Expo Go app installed
- [ ] Phone and computer on same WiFi
- [ ] Metro bundler running (QR code visible)
- [ ] Tried manual URL: `exp://10.106.103.152:8081`
- [ ] App loaded on phone!

---

**Recommended: Just use the manual URL method - it's faster and more reliable than QR scanning!**

---

**Generated**: April 21, 2026  
**Metro URL**: exp://10.106.103.152:8081  
**Web URL**: http://10.106.103.152:8081
