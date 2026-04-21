# Deployment Guide - Multilingual Audio Tour App

## Summary

You already have:
- ✅ 12 languages fully translated
- ✅ 132 audio files generated
- ✅ 11 Rome attractions covered
- ✅ App structure ready

You just need to:
1. Clean up repetitive text
2. Upload to CDN
3. Configure app
4. Deploy!

## Step-by-Step Deployment

### Step 1: Clean and Restructure Content (30 minutes)

```powershell
# Install Python if not already installed
# Then run the cleanup script:

cd wondersofrome_app
python tools/cleanup_and_restructure.py
```

This will:
- Remove repetitive text artifacts
- Create structured JSON files
- Organize files by language/attraction
- Output to: `d:/wondersofrome/cleaned_content/`

### Step 2: Set Up Cloudflare R2 (15 minutes)

1. **Create Cloudflare Account**
   - Go to https://cloudflare.com
   - Sign up (free tier available)

2. **Create R2 Bucket**
   ```bash
   # In Cloudflare Dashboard:
   # R2 → Create Bucket → Name: "wondersofrome-audio"
   ```

3. **Get Access Credentials**
   - R2 → Manage R2 API Tokens
   - Create API Token
   - Save: Access Key ID and Secret Access Key

4. **Configure Public Access**
   - Enable public access for the bucket
   - Get public URL: `https://pub-xxxxx.r2.dev`

### Step 3: Upload Content to R2 (20 minutes)

```powershell
# Install AWS CLI (R2 is S3-compatible)
# Or use Cloudflare's wrangler CLI

# Using AWS CLI:
aws configure --profile r2
# Enter your R2 credentials

# Upload all content
aws s3 sync d:/wondersofrome/cleaned_content/ s3://wondersofrome-audio/ --profile r2 --endpoint-url https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
```

### Step 4: Configure App (10 minutes)

Create `.env` file in `wondersofrome_app/`:

```env
# CDN Configuration
EXPO_PUBLIC_AUDIO_CDN_BASE_URL=https://pub-xxxxx.r2.dev

# Branding
EXPO_PUBLIC_BRAND_DOMAIN=https://wondersofrome.com
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://wondersofrome.com/privacy
EXPO_PUBLIC_TERMS_URL=https://wondersofrome.com/terms
EXPO_PUBLIC_SUPPORT_URL=https://wondersofrome.com/contact

# Languages
EXPO_PUBLIC_SUPPORTED_LANGUAGES=en,es,fr,de,it,pt,zh,ja,ko,ar,ru,pl

# Content Provider
EXPO_PUBLIC_CONTENT_PROVIDER=cdn
EXPO_PUBLIC_SITE_ID=wondersofrome
```

### Step 5: Test Locally (15 minutes)

```powershell
cd wondersofrome_app
npm start
```

Test:
- Language switching
- Audio playback
- Offline downloads
- All 11 attractions

### Step 6: Build Production APK (10 minutes)

```powershell
# For Android
cd wondersofrome_app
npx expo run:android --variant release

# Or use EAS for both platforms
eas build -p android --profile production
eas build -p ios --profile production
```

### Step 7: Deploy to Stores (Variable time)

**Google Play Store:**
1. Create developer account ($25 one-time)
2. Create app listing
3. Upload APK/AAB
4. Fill in store details
5. Submit for review

**Apple App Store:**
1. Create developer account ($99/year)
2. Create app in App Store Connect
3. Upload IPA
4. Fill in store details
5. Submit for review

## File Structure After Deployment

```
R2 Bucket (wondersofrome-audio):
├── en/
│   ├── colosseum/
│   │   ├── deep.mp3 (13.2 MB)
│   │   └── deep.json (metadata + script)
│   ├── forum/
│   │   ├── deep.mp3
│   │   └── deep.json
│   └── ... (9 more attractions)
├── es/
│   └── ... (same structure)
├── fr/
│   └── ... (same structure)
└── ... (9 more languages)

Total: ~220 MB
```

## Cost Breakdown

### One-Time Costs:
- ✅ Translation: $0 (already done)
- ✅ TTS Generation: $0 (already done)
- Google Play Developer: $25
- Apple Developer: $99/year (optional)
- **Total: $25-124**

### Monthly Costs:
- R2 Storage (220MB): $0.02
- R2 Bandwidth: $0 (free!)
- **Total: $0.02/month**

### Annual Costs:
- Storage: $0.24/year
- Apple Developer (if iOS): $99/year
- **Total: $0.24-99.24/year**

## Testing Checklist

Before deploying:

- [ ] All 12 languages load correctly
- [ ] Audio plays in each language
- [ ] Offline download works
- [ ] Language switching works
- [ ] All 11 attractions accessible
- [ ] wondersofrome.com links work
- [ ] App doesn't crash
- [ ] Permissions work (location, storage)
- [ ] Maps display correctly
- [ ] QR code scanning works (if applicable)

## Troubleshooting

### Audio won't play:
- Check R2 bucket is public
- Verify CDN URL in .env
- Check CORS settings on R2

### Language not showing:
- Verify language code in EXPO_PUBLIC_SUPPORTED_LANGUAGES
- Check files exist in R2 bucket
- Clear app cache

### Download fails:
- Check storage permissions
- Verify file sizes aren't too large
- Check network connectivity

## Next Steps After Deployment

1. **Monitor Usage**
   - Check R2 analytics
   - Monitor app crashes
   - Track user feedback

2. **Marketing**
   - List on wondersofrome.com
   - Social media promotion
   - Partner with tour guides

3. **Updates**
   - Add more attractions
   - Improve translations
   - Add new features

4. **Monetization** (Optional)
   - Premium content
   - In-app purchases
   - Partnerships with hotels/restaurants

## Support

For issues:
- Check app logs
- Review R2 access logs
- Test on multiple devices
- Contact: support@wondersofrome.com

---

**Estimated Total Time: 2-3 hours**
**Estimated Total Cost: $25-124 one-time + $0.02/month**

Ready to deploy? Start with Step 1!
