# PlayGrid — Campus Sports Player-Matching Platform (DGU Dehradun)

PlayGrid helps students aged 18–25 at **DBS Global University (DGU), Dehradun** discover open pickup games, organize matches within a 10 km campus radius, invite teammates, and validate pilot demand—without fragmented WhatsApp groups.

---

## Architecture & Directory Structure

```text
/src
  /components      # AppShell, GameCard, GameFilterBar, GameDetailsModal, PilotFeedbackModal, CourtArt, ErrorBoundary, ProtectedRoute
  /context         # AuthContext.tsx, ThemeContext.tsx, ToastContext.tsx
  /hooks           # useGames.ts, usePlayers.ts, useNotifications.ts
  /pages           # LandingPage, LoginPage, RegisterPage, DashboardPage, CreateGamePage, PlayerDirectoryPage, MyGamesPage, ProfileSettingsPage, AdminPage, SupportPages
  /services        # firebase.ts, gameService.ts, storageService.ts
  /types           # index.ts (TypeScript domain models)
  /utils           # validation.ts (XSS sanitization & blueprint constraints), errorMapper.ts
/firebase-blueprint.json
/firestore.rules
/storage.rules
/security_spec.md
```

---

## Firestore Database Schema

Full JSON Schema definitions live in `firebase-blueprint.json`:

1. **`users/{userId}`** (PII-isolated: readable only by owner or admin)
   - `uid`, `fullName`, `email`, `photoURL`, `role` (`"student" | "admin"`), `status` (`"active" | "deactivated"`), `university`, `preferredSports`, `skillLevel`, `bio`, `availability`, `gamesPlayedCount`, `gamesHostedCount`, `preferences` (`notifications`, `theme`), `createdAt`, `lastLoginAt`.
2. **`player_profiles/{userId}`** (Public athlete directory card—no PII)
   - `uid`, `fullName`, `photoURL`, `status`, `university`, `preferredSports`, `skillLevel`, `bio`, `availability`, `gamesPlayedCount`, `gamesHostedCount`, `updatedAt`.
3. **`admins/{userId}`**
   - `uid`, `grantedBy`, `createdAt`.
4. **`games/{gameId}`**
   - `gameId`, `hostId`, `hostName`, `hostPhoto`, `sport`, `title`, `location`, `campusDistanceKm`, `dateTime`, `timeWindow`, `durationMinutes`, `maxPlayers`, `currentPlayersCount`, `playerIds`, `skillLevel`, `status` (`"open" | "full" | "completed" | "cancelled"`), `convenienceFeeNote`, `notes`, `whatsappLink`, `createdAt`, `updatedAt`.
5. **`notifications/{notificationId}`**
   - `notificationId`, `recipientId`, `senderId`, `senderName`, `type`, `message`, `gameId`, `gameTitle`, `isRead`, `createdAt`.
6. **`pilot_feedback/{feedbackId}`**
   - `feedbackId`, `userId`, `userName`, `gameId`, `savedTimeOverWhatsapp`, `rating`, `wouldUseAgain`, `willingToPay40INR`, `comments`, `createdAt`.

---

## Step-by-Step Firebase Console Setup

1. **Authentication Providers**:
   - Open **Firebase Console → Authentication → Sign-in method**.
   - Ensure **Google** is enabled.
   - Click **Add new provider → Email/Password**, enable **Email/Password**, and save.
   - Under **Authentication → Settings → Authorized domains**, ensure your development and production hosting domains are listed.
2. **Firebase Storage (for Profile Avatars)**:
   - Open **Firebase Console → Storage** and click **Get started**.
   - Deploy `storage.rules` using the Firebase CLI: `firebase deploy --only storage`.
3. **Firestore Security Rules**:
   - `firestore.rules` is already validated with `@firebase/eslint-plugin-security-rules` and deployed. To redeploy after edits: `firebase deploy --only firestore:rules`.
   - Review `firestore.rules` and `security_spec.md` before sharing the app broadly.

---

## Local Development & Deployment

```bash
npm install
npm run lint
npm run build
```

For production Firebase Hosting deployment:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # Choose dist as public directory, single-page app rewrite = Yes
npm run build
firebase deploy
```

---

## Verification Checklist

- [ ] **Authentication**: Email/Password sign-up sends verification email; Google Sign-In works via popup; Remember Me toggles local vs session persistence; Forgot Password sends reset email.
- [ ] **Protected & Guest Routes**: Unauthenticated users can view `/` and browse live matches, and are prompted to sign in when attempting to join or host; `/dashboard`, `/create-game`, `/players`, `/my-games`, `/profile`, and `/admin` enforce auth/role guards.
- [ ] **Game Discovery & Atomic Slots**: Filters work across Sport, Skill Level, Time Window, Open Slots, and search; joining and leaving games updates `playerIds` and `currentPlayersCount` atomically via Firestore transactions without overbooking.
- [ ] **Match Management**: Hosts can edit match details, remove players, mark matches completed, or cancel matches with automatic notifications to joined players.
- [ ] **Player Directory & Notifications**: Students can filter peers and send in-app `game_invite` nudges; notification bell tracks unread counts and marks read.
- [ ] **Pilot Validation & Admin Console**: Pilot survey persists to `pilot_feedback`; admins can view metrics, toggle user status/roles, moderate games, and export pilot survey CSV.
