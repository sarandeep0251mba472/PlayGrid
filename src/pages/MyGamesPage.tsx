import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Edit3, Trash2, UserMinus, X } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { GameCard } from '../components/GameCard';
import { GameDetailsModal } from '../components/GameDetailsModal';
import { PilotFeedbackModal } from '../components/PilotFeedbackModal';
import { Avatar } from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useHostedGames, usePublicGames } from '../hooks/useGames';
import { usePlayers } from '../hooks/usePlayers';
import {
  cancelGameAndNotify,
  leaveGame,
  removePlayerFromGame,
  updateHostedGame,
} from '../services/gameService';
import { GameMatch, PublicPlayerProfile, SKILL_LEVELS, SkillLevel } from '../types';
import { mapFirebaseError } from '../utils/errorMapper';
import { formatMatchDateTime, inferTimeWindowFromDateTime } from '../utils/validation';

type TabKey = 'joined' | 'hosted' | 'past';

export function MyGamesPage() {
  const { firebaseUser, userProfile } = useAuth();
  const { showToast } = useToast();
  const { games, loading: publicLoading } = usePublicGames();
  const { hostedGames, loading: hostedLoading } = useHostedGames(firebaseUser?.uid);
  const { players } = usePlayers(Boolean(firebaseUser));

  const [tab, setTab] = useState<TabKey>('joined');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [detailsGame, setDetailsGame] = useState<GameMatch | null>(null);
  const [feedbackGame, setFeedbackGame] = useState<GameMatch | null>(null);

  // Edit Hosted Match modal state
  const [editingGame, setEditingGame] = useState<GameMatch | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDateTime, setEditDateTime] = useState('');
  const [editMaxPlayers, setEditMaxPlayers] = useState(10);
  const [editSkill, setEditSkill] = useState<SkillLevel>('Intermediate');
  const [editNotes, setEditNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const playersById = useMemo(() => {
    const map: Record<string, PublicPlayerProfile> = {};
    players.forEach((p) => {
      map[p.uid] = p;
    });
    return map;
  }, [players]);

  const upcomingJoined = useMemo(() => {
    if (!firebaseUser) return [];
    return games.filter(
      (g) =>
        (g.status === 'open' || g.status === 'full') &&
        g.playerIds.includes(firebaseUser.uid) &&
        g.hostId !== firebaseUser.uid
    );
  }, [games, firebaseUser]);

  const activeHosted = useMemo(
    () => hostedGames.filter((g) => g.status === 'open' || g.status === 'full'),
    [hostedGames]
  );

  const pastGames = useMemo(() => {
    if (!firebaseUser) return [];
    const seen = new Set<string>();
    const combined: GameMatch[] = [];
    [...hostedGames, ...games].forEach((g) => {
      if (seen.has(g.gameId)) return;
      if (
        (g.status === 'completed' || g.status === 'cancelled') &&
        (g.hostId === firebaseUser.uid || g.playerIds.includes(firebaseUser.uid))
      ) {
        seen.add(g.gameId);
        combined.push(g);
      }
    });
    return combined.sort((a, b) => b.dateTime.localeCompare(a.dateTime));
  }, [games, hostedGames, firebaseUser]);

  const handleLeave = async (game: GameMatch) => {
    if (!userProfile) return;
    setBusyId(game.gameId);
    try {
      await leaveGame(game.gameId, userProfile);
      showToast('Left match', 'info', `You left "${game.title}".`);
    } catch (err) {
      showToast('Could not leave match', 'error', mapFirebaseError(err));
    } finally {
      setBusyId(null);
    }
  };

  const openEditModal = (game: GameMatch) => {
    setEditingGame(game);
    setEditTitle(game.title);
    setEditLocation(game.location);
    setEditDateTime(game.dateTime);
    setEditMaxPlayers(game.maxPlayers);
    setEditSkill(game.skillLevel);
    setEditNotes(game.notes);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGame) return;
    if (editMaxPlayers < editingGame.currentPlayersCount) {
      showToast(
        'Invalid player limit',
        'error',
        `Cannot reduce slots below current joined players (${editingGame.currentPlayersCount}).`
      );
      return;
    }

    setSavingEdit(true);
    try {
      const nextStatus =
        editMaxPlayers === editingGame.currentPlayersCount ? 'full' : 'open';
      await updateHostedGame(editingGame.gameId, {
        title: editTitle,
        location: editLocation,
        dateTime: editDateTime,
        timeWindow: inferTimeWindowFromDateTime(editDateTime),
        maxPlayers: editMaxPlayers,
        skillLevel: editSkill,
        notes: editNotes,
        status: nextStatus,
      });
      showToast('Match updated', 'success');
      setEditingGame(null);
    } catch (err) {
      showToast('Update failed', 'error', mapFirebaseError(err));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleRemovePlayer = async (game: GameMatch, playerId: string) => {
    if (!userProfile) return;
    setBusyId(game.gameId);
    try {
      await removePlayerFromGame(game, playerId, userProfile);
      showToast('Player removed', 'info', 'Slot reopened on campus feed.');
      setEditingGame((prev) =>
        prev
          ? {
              ...prev,
              playerIds: prev.playerIds.filter((id) => id !== playerId),
              currentPlayersCount: Math.max(1, prev.currentPlayersCount - 1),
              status: 'open',
            }
          : null
      );
    } catch (err) {
      showToast('Could not remove player', 'error', mapFirebaseError(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkCompleted = async (game: GameMatch) => {
    setBusyId(game.gameId);
    try {
      await updateHostedGame(game.gameId, { status: 'completed' });
      showToast('Match completed', 'success', 'Share quick pilot feedback on your experience!');
      setFeedbackGame(game);
    } catch (err) {
      showToast('Update failed', 'error', mapFirebaseError(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleCancelGame = async (game: GameMatch) => {
    if (!userProfile) return;
    setBusyId(game.gameId);
    try {
      await cancelGameAndNotify(game, userProfile);
      showToast('Match cancelled', 'info', 'Joined players have been notified.');
    } catch (err) {
      showToast('Cancellation failed', 'error', mapFirebaseError(err));
    } finally {
      setBusyId(null);
    }
  };

  const loading = publicLoading || hostedLoading;

  return (
    <AppShell title="My Games & Schedule">
      {/* Segmented Tabs */}
      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {[
          { key: 'joined' as const, label: `Upcoming Joined (${upcomingJoined.length})` },
          { key: 'hosted' as const, label: `Hosted by Me (${activeHosted.length})` },
          { key: 'past' as const, label: `Past Games (${pastGames.length})` },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              tab === item.key
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-56 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60"
            />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          {tab === 'joined' && (
            <>
              {upcomingJoined.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
                  <h2 className="text-lg font-bold">No upcoming joined matches</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Explore open campus games on the feed and claim your spot in one click.
                  </p>
                  <Link
                    to="/dashboard"
                    className="mt-4 inline-flex rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Browse Campus Feed
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingJoined.map((g) => (
                    <GameCard
                      key={g.gameId}
                      game={g}
                      currentUserId={firebaseUser?.uid}
                      busy={busyId === g.gameId}
                      onLeave={(match) => void handleLeave(match)}
                      onViewDetails={(match) => setDetailsGame(match)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'hosted' && (
            <>
              {activeHosted.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
                  <h2 className="text-lg font-bold">No active games hosted by you</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Organize a match at DGU turf, badminton hall, or a nearby Dehradun court.
                  </p>
                  <Link
                    to="/create-game"
                    className="mt-4 inline-flex rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Create New Game
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeHosted.map((g) => {
                    const { dateLabel, timeLabel } = formatMatchDateTime(g.dateTime);
                    return (
                      <div
                        key={g.gameId}
                        className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            {g.sport} · {g.skillLevel} · {g.status === 'full' ? 'Squad Full' : 'Open'}
                          </p>
                          <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                            {g.title}
                          </h3>
                          <p className="mt-1 font-mono-nums text-xs text-slate-600 dark:text-slate-400">
                            {dateLabel} {timeLabel ? `· ${timeLabel}` : ''} · {g.location} ·{' '}
                            {g.currentPlayersCount}/{g.maxPlayers} players
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditModal(g)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit &amp; Roster
                          </button>
                          <button
                            type="button"
                            disabled={busyId === g.gameId}
                            onClick={() => void handleMarkCompleted(g)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Complete
                          </button>
                          <button
                            type="button"
                            disabled={busyId === g.gameId}
                            onClick={() => void handleCancelGame(g)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Cancel Match
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {tab === 'past' && (
            <>
              {pastGames.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
                  <h2 className="text-lg font-bold">No completed or cancelled matches yet</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Past matches you hosted or joined will appear here along with post-match feedback options.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {pastGames.map((g) => (
                    <div key={g.gameId} className="space-y-2">
                      <GameCard
                        game={g}
                        currentUserId={firebaseUser?.uid}
                        onViewDetails={(match) => setDetailsGame(match)}
                      />
                      {g.status === 'completed' && (
                        <button
                          type="button"
                          onClick={() => setFeedbackGame(g)}
                          className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                        >
                          Rate Match &amp; Pilot Survey
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Edit Hosted Match & Roster Modal */}
      {editingGame && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold">Manage Match &amp; Roster</h2>
              <button
                type="button"
                onClick={() => setEditingGame(null)}
                aria-label="Close edit modal"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => void handleSaveEdit(e)} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Match Title
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ground / Location
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={editDateTime}
                    onChange={(e) => setEditDateTime(e.target.value)}
                    className="font-mono-nums mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Max Players
                  </label>
                  <input
                    type="number"
                    min={editingGame.currentPlayersCount}
                    max={30}
                    required
                    value={editMaxPlayers}
                    onChange={(e) => setEditMaxPlayers(Number(e.target.value))}
                    className="font-mono-nums mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Skill Level
                  </label>
                  <select
                    value={editSkill}
                    onChange={(e) => setEditSkill(e.target.value as SkillLevel)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    {SKILL_LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Match Notes
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              {/* Roster Management */}
              <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Joined Players ({editingGame.currentPlayersCount}/{editingGame.maxPlayers})
                </p>
                <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                  {editingGame.playerIds.map((uid) => {
                    const p = playersById[uid];
                    const name = uid === editingGame.hostId ? editingGame.hostName : p?.fullName || 'DGU Student';
                    return (
                      <li key={uid} className="flex items-center justify-between px-3 py-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar src={p?.photoURL || ''} name={name} size="sm" />
                          <span className="truncate font-medium">{name}</span>
                        </div>
                        {uid === editingGame.hostId ? (
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">Host</span>
                        ) : (
                          <button
                            type="button"
                            disabled={busyId === editingGame.gameId}
                            onClick={() => void handleRemovePlayer(editingGame, uid)}
                            className="inline-flex items-center gap-1 rounded px-2 py-1 font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGame(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <GameDetailsModal
        game={detailsGame}
        playersById={playersById}
        currentUserId={firebaseUser?.uid}
        onClose={() => setDetailsGame(null)}
        onOpenFeedback={(g) => setFeedbackGame(g)}
      />

      <PilotFeedbackModal
        open={Boolean(feedbackGame)}
        gameId={feedbackGame?.gameId || ''}
        gameTitle={feedbackGame?.title}
        onClose={() => setFeedbackGame(null)}
      />
    </AppShell>
  );
}
