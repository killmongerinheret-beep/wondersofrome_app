# 🚀 Launch App in Android Studio Emulator

## Quick Start (Easiest Way)

### Option 1: Use Batch File (Automated)
```bash
LAUNCH_ANDROID_EMULATOR.bat
```

This will:
1. Start Metro bundler
2. Build the app
3. Launch on emulator

---

## Option 2: Manual Steps (Step-by-Step)

### Step 1: Start Android Emulator

#### Method A: From Android Studio
1. Open Android Studio
2. Click **"Device Manager"** (phone icon on right sidebar)
3. If you have an emulator:
   - Click ▶️ (Play button) next to an existing device
4. If you DON'T have an emulator:
   - Click **"Create Device"**
   - Select **"Phone"** → **"Pixel 5"** (recommended)
   - Click **"Next"**
   - Select **"Tiramisu"** (Android 13) or latest
   - Click **"Next"** → **"Finish"**
   - Click ▶️ to start it

#### Method B: From Command Line
```bash
# List available emulators
emulator -list-avds

# Start an emulator (replace with your emulator name)
emulator -avd Pixel_5_API_33
```

### Step 2: Start Metro Bundler

Open a terminal in the project folder:

```bash
cd wondersofrome_app
npm start
```

**Keep this terminal open!** You should see:
```
Welcome to Metro!
Fast - Scalable - Integrated

r - reload the app
d - open developer menu
```

### Step 3: Build and Launch App

Open a **NEW terminal** (keep Metro running):

```bash
cd wondersofrome_app
npx react-native run-android
```

This will:
1. Build the Android app
2. Install it on the emulator
3. Launch the app

**Wait 2-5 minutes** for the first build.

---

## Option 3: Open in Android Studio (Full IDE)

### Step 1: Open Project in Android Studio
1. Open Android Studio
2. Click **"Open"**
3. Navigate to: `C:\wondersofrome_app\wondersofrome_app\android`
4. Click **"OK"**

### Step 2: Wait for Gradle Sync
- Android Studio will sync Gradle (2-5 minutes)
- Wait for "Gradle sync finished" message

### Step 3: Start Metro Bundler
Open terminal in Android Studio (bottom):
```bash
cd ..
npm start
```

### Step 4: Run App
1. Click the green ▶️ **"Run"** button (top toolbar)
2. Select your emulator from the dropdown
3. Click **"OK"**

---

## Troubleshooting

### ❌ "No emulator found"
**Solution**: Start an emulator first
```bash
# List emulators
emulator -list-avds

# Start one
emulator -avd Pixel_5_API_33
```

### ❌ "ANDROID_HOME not set"
**Solution**: Set environment variable

**Windows**:
1. Search "Environment Variables" in Start menu
2. Click "Environment Variables"
3. Add new System variable:
   - Name: `ANDROID_HOME`
   - Value: `C:\Users\YourUsername\AppData\Local\Android\Sdk`
4. Restart terminal

**Check it worked**:
```bash
echo %ANDROID_HOME%
```

### ❌ "SDK location not found"
**Solution**: Create `local.properties` file

```bash
cd wondersofrome_app/android
echo sdk.dir=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk > local.properties
```

Replace `YourUsername` with your actual Windows username.

### ❌ "Build failed" or Gradle errors
**Solution**: Clean and rebuild
```bash
cd wondersofrome_app/android
./gradlew clean
cd ..
npx react-native run-android
```

### ❌ "Metro bundler not running"
**Solution**: Start Metro first
```bash
cd wondersofrome_app
npm start
```

Then in a NEW terminal:
```bash
cd wondersofrome_app
npx react-native run-android
```

### ❌ "App crashes on startup"
**Solution**: Check logs
```bash
# View Android logs
npx react-native log-android
```

Or in Android Studio: **View → Tool Windows → Logcat**

### ❌ "Red screen error in app"
**Solution**: Reload the app
- Press **R** twice in Metro terminal
- Or shake the device and select "Reload"

---

## Quick Commands Reference

### Start Emulator
```bash
emulator -list-avds                    # List emulators
emulator -avd Pixel_5_API_33           # Start emulator
```

### Start Metro
```bash
cd wondersofrome_app
npm start                              # Start Metro bundler
```

### Build & Run
```bash
cd wondersofrome_app
npx react-native run-android           # Build and launch
```

### Clean Build
```bash
cd wondersofrome_app/android
./gradlew clean                        # Clean build
cd ..
npx react-native run-android           # Rebuild
```

### View Logs
```bash
npx react-native log-android           # View logs
adb logcat                             # Raw Android logs
```

### Reload App
```bash
# In Metro terminal, press:
r                                      # Reload
d                                      # Open dev menu
```

---

## Expected Output

### When Metro Starts:
```
Welcome to Metro!
Fast - Scalable - Integrated

r - reload the app
d - open developer menu
i - run on iOS
a - run on Android
```

### When Build Succeeds:
```
BUILD SUCCESSFUL in 2m 34s
Installing APK 'app-debug.apk' on 'Pixel_5_API_33'
Installed on 1 device.
```

### When App Launches:
- Emulator shows the app
- You see the splash screen
- App loads the home screen

---

## Performance Tips

### Speed Up Builds
1. **Enable Gradle daemon**:
   ```bash
   # Add to android/gradle.properties
   org.gradle.daemon=true
   org.gradle.parallel=true
   org.gradle.configureondemand=true
   ```

2. **Increase Gradle memory**:
   ```bash
   # Add to android/gradle.properties
   org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m
   ```

3. **Use development build**:
   ```bash
   npx react-native run-android --variant=debug
   ```

### Speed Up Emulator
1. Use **x86_64** system image (not ARM)
2. Enable **Hardware acceleration** in BIOS
3. Allocate more RAM (4GB+) in emulator settings
4. Use **Cold Boot** instead of snapshot

---

## Testing the App

### What to Test:
1. ✅ App launches without crashes
2. ✅ Home screen loads
3. ✅ Audio playback works
4. ✅ Language switching works
5. ✅ Map displays correctly
6. ✅ Attractions list shows all 11 items

### Test Audio:
1. Tap on an attraction (e.g., "Colosseum")
2. Tap the play button
3. Audio should start playing
4. Check if it's the NEW audio (no repetitions, no branding)

### Test Languages:
1. Open settings
2. Change language (e.g., Spanish, Japanese)
3. Check if UI updates
4. Test audio in that language

---

## Next Steps After Launch

1. ✅ **Test all features** in the emulator
2. ✅ **Test on physical device** (more accurate)
3. ✅ **Build release APK** for distribution
4. ✅ **Upload to Google Play Store**

---

## Need Help?

### Check These Files:
- `wondersofrome_app/android/app/build.gradle` - Build config
- `wondersofrome_app/android/gradle.properties` - Gradle settings
- `wondersofrome_app/android/local.properties` - SDK location

### Useful Commands:
```bash
adb devices                            # List connected devices
adb shell                              # Access device shell
adb install app-debug.apk              # Install APK manually
adb uninstall com.wondersofrome.romeaudioguide  # Uninstall app
```

---

**Generated**: April 21, 2026  
**Status**: Ready to launch! 🚀
