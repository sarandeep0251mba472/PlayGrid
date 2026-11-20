# PlayGrid Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **PII Isolation**: `users/{userId}` contains `email` and personal preferences and MUST only be readable by the owner (`request.auth.uid == userId`) or an administrator. Public teammate discovery uses `player_profiles/{userId}`, which contains zero PII.
2. **Self-Assigned Role Prevention**: During `users/{userId}` creation, `role` MUST equal `'student'` and `status` MUST equal `'active'`. Users cannot self-elevate to `'admin'` or modify `role` / `status`. Only verified administrators can promote/demote users via `admins/{userId}` and `users/{userId}`.
3. **Email Verification Gate**: All game creations, joins, leaves, invitations, notifications, and pilot feedback submissions require `request.auth.token.email_verified == true`.
4. **Atomic Capacity Guard**: A student joining a game MUST increase `currentPlayersCount` by exactly `1`, add only their own `request.auth.uid` to `playerIds`, never exceed `maxPlayers`, and automatically transition `status` to `'full'` if `currentPlayersCount == maxPlayers`.
5. **Host Sovereignty & Terminal State Lock**: Only the game's `hostId` (or an admin) can edit match details, remove players, or cancel/complete an active game. Once a game reaches `'completed'` or `'cancelled'`, non-admin mutations are strictly blocked.
6. **Temporal & ID Integrity**: All document IDs match `^[a-zA-Z0-9_-]+$` (`<= 128` chars). All `createdAt`, `updatedAt`, and `lastLoginAt` fields are verified against `request.time`.

## 2. The "Dirty Dozen" Attack Payloads (All Must Return `PERMISSION_DENIED`)
1. **Privilege Escalation on Signup**: `POST /users/attacker` with `{ role: "admin", status: "active", ... }` -> DENIED (`role` must be `"student"`).
2. **Profile Role Tampering**: `PATCH /users/studentA` with `{ role: "admin" }` -> DENIED (`affectedKeys` cannot include `role`).
3. **PII Harvesting**: `GET /users/studentB` as `studentA` -> DENIED (`isOwner` and `isAdmin` both false).
4. **Shadow Field Injection**: `POST /games/game1` with `{ ...validGame, isFeatured: true }` -> DENIED (`keys().hasOnly(...)` rejects unknown keys).
5. **Identity Spoofing on Game Create**: `POST /games/game1` as `studentA` with `{ hostId: "studentB" }` -> DENIED (`hostId == request.auth.uid`).
6. **Overbooking / Capacity Bypass**: `PATCH /games/game1` when `currentPlayersCount == maxPlayers` adding `studentC` -> DENIED (`existing().status == 'open' && existing().currentPlayersCount < existing().maxPlayers`).
7. **Unauthorized Player Injection**: `PATCH /games/game1` as `studentA` trying to add `studentB` to `playerIds` -> DENIED (`request.auth.uid in incoming().playerIds` and diff size is 1).
8. **Host Impersonation / Hijack**: `PATCH /games/game1` as `studentB` trying to set `status: "cancelled"` -> DENIED (`existing().hostId == request.auth.uid`).
9. **Terminal State Resurrection**: `PATCH /games/cancelledGame` as `host` setting `status: "open"` -> DENIED (`existing().status in ['open', 'full']`).
10. **Forged Timestamp Backdating**: `POST /pilot_feedback/fb1` with `createdAt: Timestamp(2020-01-01)` -> DENIED (`incoming().createdAt == request.time`).
11. **Notification Inbox Scraping**: `LIST /notifications` without `where('recipientId', '==', auth.uid)` -> DENIED (`resource.data.recipientId == request.auth.uid`).
12. **Resource Poisoning (Oversized String / Path ID)**: `POST /games/a_200_char_id...` or `notes` of 50KB -> DENIED (`isValidId` and `.size() <= 500`).
