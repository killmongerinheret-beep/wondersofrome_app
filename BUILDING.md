## Build (Android + iOS)

### 1) Install EAS CLI

```powershell
npm i -g eas-cli
```

### 2) Login

```powershell
eas login
```

### 3) Pick which brand to build

This repo supports 2 store builds via `eas.json` profiles:

- `wondersofrome`
- `ticketsinrome`

The profile sets `EXPO_PUBLIC_SITE_ID` and the app IDs are generated in [app.config.js](file:///d:/bot/wondersofrome_app/app.config.js).

### 4) Build Android (AAB)

```powershell
eas build -p android --profile wondersofrome
```

or:

```powershell
eas build -p android --profile ticketsinrome
```

### 5) Build iOS (IPA)

```powershell
eas build -p ios --profile wondersofrome
```

or:

```powershell
eas build -p ios --profile ticketsinrome
```

### 6) Dev client (optional)

```powershell
eas build -p android --profile development
eas build -p ios --profile development
```

