# CampusConnect — Instagram Social Media Automation

## Overview

CampusConnect includes a complete Instagram social media automation system that lets users:

- **Pre-event**: Promote an upcoming event on Instagram with an AI-generated caption
- **Post-event**: Share event results/highlights on Instagram after completion

The system works fully in **mock mode** (no Meta credentials needed) and switches to real Instagram publishing by changing one environment variable.

---

## Environment Variables

Add these to `server/.env`:

```env
# Social Publishing Mode
# "mock"  = full demo, no Meta credentials needed (default)
# "real"  = live Instagram publishing
META_SOCIAL_MODE=mock

# Instagram / Meta OAuth (required only when META_SOCIAL_MODE=real)
INSTAGRAM_APP_ID=your_meta_app_id
INSTAGRAM_APP_SECRET=your_meta_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:5001/api/instagram/callback
CLIENT_URL=http://localhost:5174

# Token encryption — generate with:
# node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
INSTAGRAM_TOKEN_ENCRYPTION_KEY=your_base64_32_byte_key

# Public server URL (only needed in real mode when images are stored locally)
# PUBLIC_URL=https://your-production-domain.com
```

---

## Running the Project

**Backend:**
```bash
cd server
npm run dev
```

**Frontend:**
```bash
cd client
npm run dev
```

---

## API Endpoints

### Instagram Account Connection
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/instagram/connect` | Initiate OAuth flow (redirects to Meta) |
| GET | `/api/instagram/callback` | OAuth callback (Meta redirects here) |
| GET | `/api/instagram/account` | Get connected account info |
| DELETE | `/api/instagram/account` | Disconnect Instagram account |

### Social Post Drafts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/social/mode` | Get current provider mode (mock/real) |
| GET | `/api/social/events/:eventId/drafts` | List all drafts for an event |
| GET | `/api/social/events/:eventId/drafts/:postType` | Get draft by type (EVENT_PROMOTION / EVENT_RESULT) |
| POST | `/api/social/events/:eventId/drafts` | Create a new draft |
| GET | `/api/social/events/:eventId/history` | Get publishing history for an event |
| GET | `/api/social/drafts/:draftId` | Get a specific draft |
| PATCH | `/api/social/drafts/:draftId` | Update draft (caption, hashtags, posterUrl, etc.) |
| POST | `/api/social/drafts/:draftId/generate-caption` | Generate AI caption via Gemini |
| POST | `/api/social/drafts/:draftId/approve` | Approve draft for publishing |
| POST | `/api/social/drafts/:draftId/publish` | Publish immediately |
| POST | `/api/social/drafts/:draftId/schedule` | Schedule for future publishing |

---

## Pre-Event Promotion Workflow

```
Event Creation Form
  └─ ☑ Promote this event on Instagram
        ↓
  Event submitted successfully
        ↓
  InstagramPostPanel appears (EVENT_PROMOTION)
        ↓
  Select image (event poster / upload custom)
        ↓
  Generate Caption with AI (Gemini)
        ↓
  Edit caption / hashtags
        ↓
  Approve
        ↓
  Publish Now  OR  Schedule
        ↓
  Mock: "Demo Instagram post published (MOCK PROVIDER)"
  Real: Post published to Instagram
```

## Post-Event Result Workflow

```
Event Completion submitted
  └─ AI Report generated
        ↓
  Event Report Page
        ↓
  InstagramPostPanel appears (EVENT_RESULT)
        ↓
  Select image (event poster / AI poster / upload custom)
        ↓
  Generate Caption with AI (uses completion + report data)
        ↓
  Edit caption / hashtags
        ↓
  Approve
        ↓
  Publish Now  OR  Schedule
        ↓
  Mock: "Demo Instagram post published (MOCK PROVIDER)"
  Real: Post published to Instagram
```

---

## Mock Mode

When `META_SOCIAL_MODE=mock`:
- No Meta credentials are needed
- The full workflow runs end-to-end
- Publishing returns a fake `MOCK_MEDIA_XXXXXXXX` media ID
- The result is clearly marked `isMock: true` in the database and UI
- The UI shows: **"MOCK PROVIDER — This was a demo publish, not a real Instagram post."**

---

## Switching to Real Instagram Publishing

1. Create a Meta Developer App at https://developers.facebook.com/apps/
2. Add the **Instagram** product
3. Set permissions: `instagram_business_basic`, `instagram_business_content_publish`
4. Set the OAuth Redirect URI to: `http://localhost:5001/api/instagram/callback` (or your production URL)
5. Update `server/.env`:
   ```env
   META_SOCIAL_MODE=real
   INSTAGRAM_APP_ID=your_app_id
   INSTAGRAM_APP_SECRET=your_app_secret
   INSTAGRAM_REDIRECT_URI=https://your-domain.com/api/instagram/callback
   ```
6. The user must connect their **Instagram Professional account** via Profile → Connect Instagram
7. Images must be publicly accessible HTTPS URLs (use Cloudinary, or set `PUBLIC_URL`)

### Meta App Dashboard Configuration
- **App Type**: Business
- **OAuth Redirect URI**: `https://your-domain.com/api/instagram/callback`
- **Required Permissions**: `instagram_business_basic`, `instagram_business_content_publish`
- **App Review**: Required before publishing to accounts other than the app owner

---

## Database Models Added

| Model | Purpose |
|-------|---------|
| `SocialPostDraft` | Tracks each Instagram post through its full lifecycle |
| `SocialPublishingRecord` | Immutable history of every publish attempt |
| `SocialAccount` | Stores encrypted Instagram access tokens (existing, enhanced) |

---

## Files Created

### Backend
- `server/src/models/SocialPostDraft.js`
- `server/src/models/SocialPublishingRecord.js`
- `server/src/services/instagram/instagramProvider.js` — Real + Mock provider abstraction
- `server/src/services/instagram/tokenCrypto.js` — AES-256-GCM token decryption
- `server/src/services/social/socialCaptionService.js` — Gemini caption generation
- `server/src/services/social/mediaResolver.js` — Safe media URL resolution
- `server/src/services/social/socialPostService.js` — Core draft/publish logic
- `server/src/services/social/socialSchedulingService.js` — DB-backed scheduler
- `server/src/controllers/socialPostController.js`
- `server/src/routes/social.routes.js`

### Frontend
- `client/src/services/socialService.js`
- `client/src/components/InstagramPostPanel.jsx`

### Modified
- `server/src/app.js` — Added `/api/social` routes
- `server/src/server.js` — Starts scheduler on boot
- `server/.env` — Added social env vars
- `.env.example` — Documented all new variables
- `client/src/pages/events/EventReportPage.jsx` — Added Instagram result panel
- `client/src/pages/events/CreateEventPage.jsx` — Added promotion toggle + panel
