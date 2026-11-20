import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Send, X } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Avatar } from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePublicGames } from '../hooks/useGames';
import { usePlayers } from '../hooks/usePlayers';
import { createNotification } from '../services/gameService';
import {
  AVAILABILITY_OPTIONS,
  PlayerFilterState,
  PublicPlayerProfile,
  SKILL_LEVELS,
  SPORTS_LIST,
} from '../types';
import { mapFirebaseError } from '../utils/errorMapper';
import { getSkillTextTone } from '../utils/validation';

export function PlayerDirectoryPage() {
  const { firebaseUser, userProfile, isEmailVerified } = useAuth();
  const { showToast } = useToast();
  const { players, loading } = usePlayers(Boolean(firebaseUser));
  const { games } = usePublicGames();

  const [filters, setFilters] = useState<PlayerFilterState>({
    sport: 'All',
    skillLevel: 'All',
    availability: 'All',
    searchQuery: '',
  });

  const [inviteTarget, setInviteTarget] = useState<PublicPlayerProfile | null>(null);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  const openGamesToInvite = useMemo(() => {
    if (!firebaseUser) return [];
    return games.filter(
      (g) => g.status === 'open' && g.playerIds.includes(firebaseUser.uid)
    );
  }, [games, firebaseUser]);

  const filteredPlayers = useMemo(() => {
    const q = filters.searchQuery.trim().toLowerCase();
    return players.filter((p) => {
      if (p.uid === firebaseUser?.uid) return false;
      if (filters.sport !== 'All' && !p.preferredSports.includes(filters.sport)) return false;
      if (filters.skillLevel !== 'All' && p.skillLevel !== filters.skillLevel) return false;
      if (filters.availability !== 'All' && p.availability !== filters.availability) return false;
      if (q) {
        const hay = `${p.fullName} ${p.bio} ${p.preferredSports.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [players, filters, firebaseUser?.uid]);

  const handleOpenInvite = (player: PublicPlayerProfile) => {
    if (!isEmailVerified) {
      showToast('Verify email first', 'error', 'Verify your email to send match invites.');
      return;
    }
    setInviteTarget(player);
    setSelectedGameId(openGamesToInvite[0]?.gameId || '');
  };

  const handleSendInvite = async () => {
    if (!inviteTarget || !userProfile || !selectedGameId) return;
    const game = openGamesToInvite.find((g) => g.gameId === selectedGameId);
    if (!game) return;

    setSendingInvite(true);
    try {
      await createNotification({
        recipientId: inviteTarget.uid,
        senderId: userProfile.uid,
        senderName: userProfile.fullName,
        type: 'game_invite',
        message: `${userProfile.fullName} invited you to join "${game.title}" (${game.sport} at ${game.location}).`,
        gameId: game.gameId,
        gameTitle: game.title,
      });
      showToast('Invite sent', 'success', `${inviteTarget.fullName} received your in-app nudge.`);
      setInviteTarget(null);
    } catch (err) {
      showToast('Invite failed', 'error', mapFirebaseError(err));
    } finally {
      setSendingInvite(false);
    }
  };

  return (
    <AppShell title="DGU Player Directory">
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilters({ ...filters, sport: 'All' })}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              filters.sport === 'All'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            All Sports
          </button>
          {SPORTS_LIST.map((sport) => (
            <button
              key={sport}
              type="button"
              onClick={() => setFilters({ ...filters, sport })}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filters.sport === sport
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {sport}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              placeholder="Search student name or position..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <select
            value={filters.skillLevel}
            onChange={(e) =>
              setFilters({
                ...filters,
                skillLevel: e.target.value as PlayerFilterState['skillLevel'],
              })
            }
            aria-label="Filter players by skill level"
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="All">All Skill Levels</option>
            {SKILL_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          <select
            value={filters.availability}
            onChange={(e) =>
              setFilters({
                ...filters,
                availability: e.target.value as PlayerFilterState['availability'],
              })
            }
            aria-label="Filter players by availability"
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="All">Any Availability</option>
            {AVAILABILITY_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-44 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60"
            />
          ))}
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No matching student athletes found
          </h3>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
            Adjust your sport or skill filters, or invite classmates to register on PlayGrid.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlayers.map((player) => (
            <article
              key={player.uid}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-start gap-3">
                  <Avatar src={player.photoURL} name={player.fullName} size="md" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold text-slate-900 dark:text-white">
                      {player.fullName}
                    </h3>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      <span className={`font-semibold ${getSkillTextTone(player.skillLevel)}`}>
                        {player.skillLevel}
                      </span>{' '}
                      · {player.availability}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-xs font-medium text-slate-700 dark:text-slate-300">
                  Sports: {player.preferredSports.join(' · ')}
                </p>

                {player.bio && (
                  <p className="mt-2 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                    {player.bio}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <span className="font-mono-nums text-xs text-slate-500 dark:text-slate-400">
                  {player.gamesPlayedCount} played · {player.gamesHostedCount} hosted
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenInvite(player)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 whitespace-nowrap"
                >
                  <Send className="h-3 w-3" />
                  Nudge / Invite
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {inviteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Invite {inviteTarget.fullName}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Send an instant in-app notification to join an open match.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInviteTarget(null)}
                aria-label="Close invite dialog"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {openGamesToInvite.length === 0 ? (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                <p>You are not part of any open matches right now.</p>
                <Link
                  to="/create-game"
                  className="mt-3 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Host a Match First
                </Link>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div>
                  <label htmlFor="invite-game-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Select Open Match
                  </label>
                  <select
                    id="invite-game-select"
                    value={selectedGameId}
                    onChange={(e) => setSelectedGameId(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    {openGamesToInvite.map((g) => (
                      <option key={g.gameId} value={g.gameId}>
                        {g.sport}: {g.title} ({g.currentPlayersCount}/{g.maxPlayers})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setInviteTarget(null)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={sendingInvite}
                    onClick={() => void handleSendInvite()}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {sendingInvite ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
