import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  deleteDoc,
  increment,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  AppNotification,
  CreateGameInput,
  GameMatch,
  GameStatus,
  NotificationType,
  PilotFeedback,
  PublicPlayerProfile,
  UserProfile,
  UserRole,
  AccountStatus,
} from '../types';
import {
  BLUEPRINT_LIMITS,
  generateSafeDocId,
  sanitizeText,
  sanitizeUrl,
} from '../utils/validation';

function toMillis(val: unknown): number {
  if (!val) return 0;
  if (typeof val === 'object' && val !== null && 'toMillis' in val && typeof (val as { toMillis: () => number }).toMillis === 'function') {
    return (val as { toMillis: () => number }).toMillis();
  }
  if (typeof val === 'string') {
    const t = Date.parse(val);
    return Number.isNaN(t) ? 0 : t;
  }
  return 0;
}

export function subscribeToPublicGames(
  onData: (games: GameMatch[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'games';
  const q = query(
    collection(db, path),
    where('status', 'in', ['open', 'full', 'completed'])
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as GameMatch);
      list.sort((a, b) => a.dateTime.localeCompare(b.dateTime));
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // Logged via handleFirestoreError
      }
    }
  );
}

export function subscribeToHostedGames(
  hostId: string,
  onData: (games: GameMatch[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'games';
  const q = query(collection(db, path), where('hostId', '==', hostId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as GameMatch);
      list.sort((a, b) => b.dateTime.localeCompare(a.dateTime));
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // Logged via handleFirestoreError
      }
    }
  );
}

export function subscribeToPlayerProfiles(
  onData: (players: PublicPlayerProfile[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'player_profiles';
  const q = query(collection(db, path), where('status', '==', 'active'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as PublicPlayerProfile);
      list.sort((a, b) => a.fullName.localeCompare(b.fullName));
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // Logged via handleFirestoreError
      }
    }
  );
}

export function subscribeToNotifications(
  userId: string,
  onData: (notifications: AppNotification[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'notifications';
  const q = query(collection(db, path), where('recipientId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as AppNotification);
      list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // Logged via handleFirestoreError
      }
    }
  );
}

export async function createNotification(params: {
  recipientId: string;
  senderId: string;
  senderName: string;
  type: NotificationType;
  message: string;
  gameId?: string;
  gameTitle?: string;
}): Promise<void> {
  const notificationId = generateSafeDocId('notif');
  const path = `notifications/${notificationId}`;
  try {
    await setDoc(doc(db, 'notifications', notificationId), {
      notificationId,
      recipientId: params.recipientId,
      senderId: params.senderId,
      senderName: sanitizeText(params.senderName, BLUEPRINT_LIMITS.FULL_NAME_MAX) || 'Player',
      type: params.type,
      message: sanitizeText(params.message, BLUEPRINT_LIMITS.NOTIFICATION_MSG_MAX),
      gameId: params.gameId || '',
      gameTitle: sanitizeText(params.gameTitle || '', BLUEPRINT_LIMITS.GAME_TITLE_MAX),
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const path = `notifications/${notificationId}`;
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      isRead: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function markAllNotificationsRead(notifications: AppNotification[]): Promise<void> {
  const unread = notifications.filter((n) => !n.isRead);
  if (unread.length === 0) return;
  try {
    const batch = writeBatch(db);
    unread.forEach((n) => {
      batch.update(doc(db, 'notifications', n.notificationId), { isRead: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'notifications');
  }
}

export async function createGame(
  host: UserProfile,
  input: CreateGameInput
): Promise<string> {
  const gameId = generateSafeDocId('game');
  const path = `games/${gameId}`;

  const cleanTitle = sanitizeText(input.title, BLUEPRINT_LIMITS.GAME_TITLE_MAX);
  const cleanLocation = sanitizeText(input.location, BLUEPRINT_LIMITS.LOCATION_MAX);
  const cleanFeeNote = sanitizeText(input.convenienceFeeNote, BLUEPRINT_LIMITS.FEE_NOTE_MAX);
  const cleanNotes = sanitizeText(input.notes, BLUEPRINT_LIMITS.NOTES_MAX);
  const cleanWhatsapp = sanitizeUrl(input.whatsappLink, BLUEPRINT_LIMITS.WHATSAPP_LINK_MAX);
  const clampedMaxPlayers = Math.max(2, Math.min(30, Math.round(input.maxPlayers)));
  const clampedDuration = Math.max(15, Math.min(240, Math.round(input.durationMinutes)));
  const clampedDistance = Math.max(0, Math.min(10, Number(input.campusDistanceKm) || 0));

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'games', gameId), {
      gameId,
      hostId: host.uid,
      hostName: sanitizeText(host.fullName, BLUEPRINT_LIMITS.FULL_NAME_MAX),
      hostPhoto: sanitizeText(host.photoURL, BLUEPRINT_LIMITS.PHOTO_URL_MAX),
      sport: input.sport,
      title: cleanTitle,
      location: cleanLocation,
      campusDistanceKm: clampedDistance,
      dateTime: input.dateTime,
      timeWindow: input.timeWindow,
      durationMinutes: clampedDuration,
      maxPlayers: clampedMaxPlayers,
      currentPlayersCount: 1,
      playerIds: [host.uid],
      skillLevel: input.skillLevel,
      status: 'open',
      convenienceFeeNote: cleanFeeNote,
      notes: cleanNotes,
      whatsappLink: cleanWhatsapp,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.update(doc(db, 'users', host.uid), {
      gamesHostedCount: increment(1),
      gamesPlayedCount: increment(1),
    });

    batch.update(doc(db, 'player_profiles', host.uid), {
      gamesHostedCount: increment(1),
      gamesPlayedCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
    return gameId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function joinGame(gameId: string, user: UserProfile): Promise<void> {
  const path = `games/${gameId}`;
  let hostIdToNotify = '';
  let gameTitle = '';

  try {
    await runTransaction(db, async (tx) => {
      const gameRef = doc(db, 'games', gameId);
      const snap = await tx.get(gameRef);
      if (!snap.exists()) {
        throw new Error('This match no longer exists.');
      }
      const game = snap.data() as GameMatch;

      if (game.status !== 'open') {
        throw new Error('This match is no longer open for new players.');
      }
      if (game.playerIds.includes(user.uid)) {
        throw new Error('You have already joined this match.');
      }
      if (game.currentPlayersCount >= game.maxPlayers) {
        throw new Error('This match is already full.');
      }

      const nextPlayers = [...game.playerIds, user.uid];
      const nextCount = game.currentPlayersCount + 1;
      const nextStatus: GameStatus = nextCount >= game.maxPlayers ? 'full' : 'open';

      tx.update(gameRef, {
        playerIds: nextPlayers,
        currentPlayersCount: nextCount,
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });

      tx.update(doc(db, 'users', user.uid), {
        gamesPlayedCount: increment(1),
      });

      tx.update(doc(db, 'player_profiles', user.uid), {
        gamesPlayedCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      hostIdToNotify = game.hostId;
      gameTitle = game.title;
    });

    if (hostIdToNotify && hostIdToNotify !== user.uid) {
      await createNotification({
        recipientId: hostIdToNotify,
        senderId: user.uid,
        senderName: user.fullName,
        type: 'game_join',
        message: `${user.fullName} joined your match "${gameTitle}".`,
        gameId,
        gameTitle,
      });
    }
  } catch (error) {
    if (error instanceof Error && (
      error.message.includes('already') ||
      error.message.includes('no longer')
    )) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function leaveGame(gameId: string, user: UserProfile): Promise<void> {
  const path = `games/${gameId}`;
  let hostIdToNotify = '';
  let gameTitle = '';

  try {
    await runTransaction(db, async (tx) => {
      const gameRef = doc(db, 'games', gameId);
      const snap = await tx.get(gameRef);
      if (!snap.exists()) {
        throw new Error('This match no longer exists.');
      }
      const game = snap.data() as GameMatch;

      if (game.hostId === user.uid) {
        throw new Error('Hosts cannot leave their own match. You can cancel or edit it from My Games.');
      }
      if (!game.playerIds.includes(user.uid)) {
        throw new Error('You are not on the roster for this match.');
      }
      if (game.status === 'completed' || game.status === 'cancelled') {
        throw new Error('This match has already ended.');
      }

      const nextPlayers = game.playerIds.filter((id) => id !== user.uid);
      const nextCount = Math.max(1, game.currentPlayersCount - 1);

      tx.update(gameRef, {
        playerIds: nextPlayers,
        currentPlayersCount: nextCount,
        status: 'open',
        updatedAt: serverTimestamp(),
      });

      hostIdToNotify = game.hostId;
      gameTitle = game.title;
    });

    if (hostIdToNotify && hostIdToNotify !== user.uid) {
      await createNotification({
        recipientId: hostIdToNotify,
        senderId: user.uid,
        senderName: user.fullName,
        type: 'game_leave',
        message: `${user.fullName} stepped out of "${gameTitle}", opening a spot.`,
        gameId,
        gameTitle,
      });
    }
  } catch (error) {
    if (error instanceof Error && (
      error.message.includes('Hosts cannot') ||
      error.message.includes('not on the roster') ||
      error.message.includes('no longer') ||
      error.message.includes('already ended')
    )) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateHostedGame(
  gameId: string,
  updates: Partial<
    Pick<
      GameMatch,
      | 'title'
      | 'location'
      | 'campusDistanceKm'
      | 'dateTime'
      | 'timeWindow'
      | 'durationMinutes'
      | 'maxPlayers'
      | 'skillLevel'
      | 'convenienceFeeNote'
      | 'notes'
      | 'whatsappLink'
      | 'status'
      | 'playerIds'
      | 'currentPlayersCount'
    >
  >
): Promise<void> {
  const path = `games/${gameId}`;
  try {
    const cleanUpdates: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (updates.title !== undefined) cleanUpdates.title = sanitizeText(updates.title, BLUEPRINT_LIMITS.GAME_TITLE_MAX);
    if (updates.location !== undefined) cleanUpdates.location = sanitizeText(updates.location, BLUEPRINT_LIMITS.LOCATION_MAX);
    if (updates.campusDistanceKm !== undefined) cleanUpdates.campusDistanceKm = Math.max(0, Math.min(10, Number(updates.campusDistanceKm) || 0));
    if (updates.dateTime !== undefined) cleanUpdates.dateTime = updates.dateTime;
    if (updates.timeWindow !== undefined) cleanUpdates.timeWindow = updates.timeWindow;
    if (updates.durationMinutes !== undefined) cleanUpdates.durationMinutes = Math.max(15, Math.min(240, Math.round(updates.durationMinutes)));
    if (updates.maxPlayers !== undefined) cleanUpdates.maxPlayers = Math.max(2, Math.min(30, Math.round(updates.maxPlayers)));
    if (updates.skillLevel !== undefined) cleanUpdates.skillLevel = updates.skillLevel;
    if (updates.convenienceFeeNote !== undefined) cleanUpdates.convenienceFeeNote = sanitizeText(updates.convenienceFeeNote, BLUEPRINT_LIMITS.FEE_NOTE_MAX);
    if (updates.notes !== undefined) cleanUpdates.notes = sanitizeText(updates.notes, BLUEPRINT_LIMITS.NOTES_MAX);
    if (updates.whatsappLink !== undefined) cleanUpdates.whatsappLink = sanitizeUrl(updates.whatsappLink, BLUEPRINT_LIMITS.WHATSAPP_LINK_MAX);
    if (updates.status !== undefined) cleanUpdates.status = updates.status;
    if (updates.playerIds !== undefined) cleanUpdates.playerIds = updates.playerIds;
    if (updates.currentPlayersCount !== undefined) cleanUpdates.currentPlayersCount = updates.currentPlayersCount;

    await updateDoc(doc(db, 'games', gameId), cleanUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function cancelGameAndNotify(game: GameMatch, actor: UserProfile): Promise<void> {
  await updateHostedGame(game.gameId, { status: 'cancelled' });
  const recipients = game.playerIds.filter((uid) => uid !== actor.uid);
  await Promise.all(
    recipients.map((recipientId) =>
      createNotification({
        recipientId,
        senderId: actor.uid,
        senderName: actor.fullName,
        type: 'game_cancel',
        message: `Match cancelled: "${game.title}" (${game.sport} at ${game.location}).`,
        gameId: game.gameId,
        gameTitle: game.title,
      })
    )
  );
}

export async function removePlayerFromGame(
  game: GameMatch,
  playerIdToRemove: string,
  host: UserProfile
): Promise<void> {
  if (playerIdToRemove === game.hostId) {
    throw new Error('Host cannot be removed from their own match.');
  }
  const nextPlayers = game.playerIds.filter((id) => id !== playerIdToRemove);
  const nextCount = nextPlayers.length;
  const nextStatus: GameStatus = nextCount >= game.maxPlayers ? 'full' : 'open';

  await updateHostedGame(game.gameId, {
    playerIds: nextPlayers,
    currentPlayersCount: nextCount,
    status: nextStatus,
  });

  await createNotification({
    recipientId: playerIdToRemove,
    senderId: host.uid,
    senderName: host.fullName,
    type: 'system',
    message: `You were removed from "${game.title}" by host ${host.fullName}.`,
    gameId: game.gameId,
    gameTitle: game.title,
  });
}

export async function submitPilotFeedback(params: {
  user: UserProfile;
  gameId: string;
  savedTimeOverWhatsapp: boolean;
  rating: number;
  wouldUseAgain: boolean;
  willingToPay40INR: boolean;
  comments: string;
}): Promise<void> {
  const feedbackId = generateSafeDocId('fb');
  const path = `pilot_feedback/${feedbackId}`;
  try {
    await setDoc(doc(db, 'pilot_feedback', feedbackId), {
      feedbackId,
      userId: params.user.uid,
      userName: sanitizeText(params.user.fullName, BLUEPRINT_LIMITS.FULL_NAME_MAX),
      gameId: params.gameId || '',
      savedTimeOverWhatsapp: Boolean(params.savedTimeOverWhatsapp),
      rating: Math.max(1, Math.min(5, Math.round(params.rating))),
      wouldUseAgain: Boolean(params.wouldUseAgain),
      willingToPay40INR: Boolean(params.willingToPay40INR),
      comments: sanitizeText(params.comments, BLUEPRINT_LIMITS.FEEDBACK_COMMENTS_MAX),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// -------------------------------------------------------------------------
// Admin Operations
// -------------------------------------------------------------------------

export async function fetchAdminUsers(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, path));
    const users = snap.docs.map((d) => d.data() as UserProfile);
    users.sort((a, b) => a.fullName.localeCompare(b.fullName));
    return users;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchAllGamesForAdmin(): Promise<GameMatch[]> {
  const path = 'games';
  try {
    const snap = await getDocs(collection(db, path));
    const games = snap.docs.map((d) => d.data() as GameMatch);
    games.sort((a, b) => b.dateTime.localeCompare(a.dateTime));
    return games;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchAllPilotFeedback(): Promise<PilotFeedback[]> {
  const path = 'pilot_feedback';
  try {
    const snap = await getDocs(collection(db, path));
    const rows = snap.docs.map((d) => d.data() as PilotFeedback);
    rows.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
    return rows;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function adminUpdateUserStatus(
  targetUid: string,
  status: AccountStatus
): Promise<void> {
  const path = `users/${targetUid}`;
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', targetUid), { status });
    batch.update(doc(db, 'player_profiles', targetUid), {
      status,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function adminUpdateUserRole(
  targetUid: string,
  nextRole: UserRole,
  adminUid: string
): Promise<void> {
  const path = `users/${targetUid}`;
  try {
    await updateDoc(doc(db, 'users', targetUid), { role: nextRole });
    if (nextRole === 'admin') {
      await setDoc(doc(db, 'admins', targetUid), {
        uid: targetUid,
        grantedBy: adminUid,
        createdAt: serverTimestamp(),
      });
    } else {
      await deleteDoc(doc(db, 'admins', targetUid));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
