# 🚀 Launch App with Expo Go (Easiest Method)

## ❌ Problem
Your computer doesn't have enough memory to build the Android app:
- Error: "Insufficient memory for Java Runtime Environment"
- Error: "The paging file is too small"

## ✅ Solution: Use Expo Go (No Build Required!)

### Step 1: Install Expo Go on Your Phone

**Android:**
1. Open Google Play Store
2. Search for "Expo Go"
3. Install the app

**iPhone:**
1. Open App Store
2. Search for "Expo Go"
3. Install the app

### Step 2: Start Metro Bundler

Metro is already running! You should see a QR code in the terminal.

If not, run:
```bash
npm start
```

### Step 3: Scan QR Code

**Android:**
1. Open Expo Go app
2. Tap "Scan QR Code"
3. Scan the QR code from your terminal

**iPhone:**
1. Open Camera app
2. Point at the QR code
3. Tap the notification to open in Expo Go

### Step 4: Test the App!

The app will load on your phone. Test:
- ✅ Home screen loads
- ✅ Tap on an attraction (e.g., Colosseum)
- ✅ Play audio
- ✅ Change language in settings

---

## Alternative: Fix Memory Issue (Advanced)

If you want to build on emulator, you need to:

### Option 1: Increase Paging File (Windows)
1. Search "View advanced system settings"
2. Click "Settings" under Performance
3. Go to "Advanced" tab
4. Click "Change" under Virtual memory
5. Uncheck "Automatically manage"
6. Select drive and choose "Custom size"
7. Set Initial: 8192 MB, Maximum: 16384 MB
8. Click "Set" → "OK"
9. Restart computer

### Option 2: Reduce Gradle Memory
Edit `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError
org.gradle.daemon=true
org.gradle.parallel=false
```

Then try again:
```bash
npx expo run:android
```

---

## Current Status

✅ Metro bundler is running (port 8082)
✅ Emulator is running (emulator-5554)
❌ Build failed due to memory

**Recommendation**: Use Expo Go on your phone - it's faster and easier!

---

## QR Code Location

Look for the QR code in your terminal where you ran `npm start`.

It looks like this:
```
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█ ▄▄▄▄▄ █▄▄████▀ ▄▀█▄██  ▄ ██▄█ ▄▄▄▄▄ █
█ █   █ █ ▀█ ▄▄▄▄█▀▀▄▀█▀▀   ███ █   █ █
...
```

Or open in browser: http://localhost:8081

---

**Generated**: April 21, 2026  
**Recommendation**: Use Expo Go - it's the easiest way to test!
