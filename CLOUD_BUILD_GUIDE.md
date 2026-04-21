# ☁️ Cloud Build with EAS (Expo Application Services)

## ✅ Current Status

**Step 1: Development Server** ✅ RUNNING
- Metro bundler is running on port 8081
- QR code is visible in the terminal
- Ready for Expo Go testing

**Step 2: EAS CLI** ✅ INSTALLED
- Version: 18.7.0
- Ready for cloud builds

**Step 3: Cloud Build** ⏳ READY TO START

---

## 🚀 Quick Start

### Option 1: Use Batch File (Automated)
```bash
CLOUD_BUILD.bat
```

### Option 2: Manual Steps (Follow Below)

---

## Step-by-Step Instructions

### 1. Test with Expo Go (Immediate - Do This First!)

**On Your Phone:**
1. Install "Expo Go" app from Play Store (Android) or App Store (iPhone)
2. Open Expo Go app
3. Tap "Scan QR Code"
4. Scan the QR code from your terminal (where Metro is running)
5. App will load on your phone!

**Test These Features:**
- ✅ Home screen loads
- ✅ Tap on an attraction (e.g., Colosseum)
- ✅ Play audio (should use new audio from R2)
- ✅ Change language in settings
- ✅ Test multiple languages

---

### 2. Login to Expo Account

Open a **NEW terminal** (keep Metro running):

```bash
eas login
```

**If you don't have an Expo account:**
```bash
eas register
```

Or create one at: https://expo.dev/signup

**Enter your credentials:**
- Email or username
- Password

---

### 3. Configure EAS Build

Check if `eas.json` exists:
```bash
type eas.json
```

If it doesn't exist, create it:
```bash
eas build:configure
```

This will:
- Create `eas.json` configuration file
- Set up build profiles
- Link your project to Expo

---

### 4. Start Cloud Build

**Preview Build (Recommended - Faster):**
```bash
eas build -p android --profile preview
```

**Production Build (For Play Store):**
```bash
eas build -p android --profile production
```

**What happens:**
1. EAS uploads your code to Expo servers
2. Build runs in the cloud (no RAM issues!)
3. Takes 10-20 minutes
4. You get a download link for the APK

---

### 5. Monitor Build Progress

**In Terminal:**
- You'll see build progress
- Build ID will be displayed
- Link to build dashboard

**In Browser:**
- Go to: https://expo.dev/accounts/[your-username]/projects/wondersofrome_app/builds
- Watch build progress in real-time
- See build logs

---

### 6. Download APK

**When build completes:**
1. Terminal will show download link
2. Click the link or copy to browser
3. Download the APK file
4. Transfer to your Android phone
5. Install and test!

**Example link:**
```
https://expo.dev/artifacts/eas/[build-id].apk
```

---

## 📋 Build Profiles Explained

### Preview Profile
- **Purpose**: Testing and development
- **Speed**: Faster (10-15 minutes)
- **Size**: Larger APK
- **Use**: Internal testing, QA

### Production Profile
- **Purpose**: Play Store release
- **Speed**: Slower (15-25 minutes)
- **Size**: Optimized, smaller APK
- **Use**: Final release, public distribution

---

## 🔧 Troubleshooting

### "eas: command not found"
```bash
npm install -g eas-cli
```

### "Not logged in"
```bash
eas login
```

### "Project not configured"
```bash
eas build:configure
```

### "Build failed"
Check build logs:
```bash
eas build:list
```

Then view specific build:
```bash
eas build:view [build-id]
```

### "Invalid credentials"
Update credentials:
```bash
eas credentials
```

---

## 📊 Expected Output

### During Build:
```
✔ Linked to project @your-username/wondersofrome_app
✔ Using remote Android credentials (Expo server)
✔ Compressing project files
✔ Uploading to EAS Build
✔ Queued build
✔ Build started
✔ Build in progress...
✔ Build completed!

Build artifact: https://expo.dev/artifacts/eas/abc123.apk
```

### Build Time:
- **Preview**: 10-15 minutes
- **Production**: 15-25 minutes

### APK Size:
- **Preview**: ~50-80 MB
- **Production**: ~30-50 MB (optimized)

---

## 🎯 What to Test After Installing APK

### Basic Functionality:
1. ✅ App launches without crashes
2. ✅ Home screen displays correctly
3. ✅ All 11 attractions visible
4. ✅ Map loads and displays markers

### Audio Testing:
1. ✅ Tap on "Colosseum"
2. ✅ Play audio - should hear new audio (no repetitions)
3. ✅ Audio plays smoothly
4. ✅ Pause/resume works
5. ✅ Progress bar updates

### Language Testing:
1. ✅ Open settings
2. ✅ Change to Spanish
3. ✅ UI updates to Spanish
4. ✅ Play audio in Spanish
5. ✅ Test Japanese, Arabic, etc.

### Offline Testing:
1. ✅ Turn off WiFi/data
2. ✅ App still works
3. ✅ Previously played audio works offline

---

## 📱 Installing APK on Android

### Method 1: Direct Download
1. Open download link on your Android phone
2. Download APK
3. Tap to install
4. Allow "Install from unknown sources" if prompted

### Method 2: Transfer from Computer
1. Download APK on computer
2. Connect phone via USB
3. Copy APK to phone
4. Open file manager on phone
5. Tap APK to install

### Method 3: QR Code
1. Generate QR code from download link
2. Scan with phone
3. Download and install

---

## 🔐 Signing & Credentials

EAS Build handles signing automatically:
- **Development**: Uses Expo's signing keys
- **Production**: Can use your own keys

To manage credentials:
```bash
eas credentials
```

---

## 💰 EAS Build Pricing

**Free Tier:**
- 30 builds per month
- Sufficient for testing and development

**Paid Plans:**
- More builds per month
- Priority queue
- Faster builds

Check: https://expo.dev/pricing

---

## 🎉 Success Checklist

- [ ] Metro bundler running
- [ ] Tested with Expo Go on phone
- [ ] Logged into EAS
- [ ] Started cloud build
- [ ] Build completed successfully
- [ ] Downloaded APK
- [ ] Installed APK on phone
- [ ] Tested all features
- [ ] Audio works correctly
- [ ] Languages switch properly

---

## 📞 Need Help?

### Check Build Status:
```bash
eas build:list
```

### View Build Logs:
```bash
eas build:view [build-id]
```

### Cancel Build:
```bash
eas build:cancel
```

### Expo Documentation:
- https://docs.expo.dev/build/introduction/
- https://docs.expo.dev/build-reference/eas-json/

---

## 🚀 Next Steps After Successful Build

1. ✅ Test APK thoroughly on multiple devices
2. ✅ Fix any issues found
3. ✅ Build production version
4. ✅ Prepare Play Store listing
5. ✅ Upload to Google Play Console
6. ✅ Submit for review
7. ✅ Launch! 🎉

---

**Generated**: April 21, 2026  
**Status**: Ready for cloud build!  
**Metro**: Running on port 8081  
**EAS CLI**: Installed (v18.7.0)
