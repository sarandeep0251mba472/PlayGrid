import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, ClipboardCheck, PlusCircle } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { GameCard } from '../components/GameCard';
import { GameFilterBar } from '../components/GameFilterBar';
import { GameDetailsModal } from '../components/GameDetailsModal';
import { PilotFeedbackModal } from '../components/PilotFeedbackModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePublicGames } from '../hooks/useGames';
import { usePlayers } from '../hooks/usePlayers';
import { joinGame, leaveGame } from '../services/gameService';
import { GameFilterState, GameMatch, PublicPlayerProfile } from '../types';
import { mapFirebaseError } from '../utils/errorMapper';
import { formatMatchDateTime } from '../utils/validation';

export function DashboardPage() {
  const { firebaseUser, userProfile, isEmailVerified } = useAuth();
  const { showToast } = useToast();
  const { games, loading, error } = usePublicGames();
  const { players } = usePlayers(Boolean(firebaseUser));

  const [filters, setFilters] = useState<GameFilterState>({
    sport: 'All',
    skillLevel: 'All',
    timeWindow: 'All',
    onlyOpenSlots: false,
    searchQuery: '',
  });
  const [busyGameId, setBusyGameId] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameMatch | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackGame, setFeedbackGame] = useState<GameMatch | null>(null);

  const playersById = useMemo(() => {
    const map: Record<string, PublicPlayerProfile> = {};
    players.forEach((p) => {
      map[p.uid] = p;
    });
    return map;
  }, [players]);

  const activeGames = useMemo(
    () => games.filter((g) => g.status === 'open' || g.status === 'full'),
    [games]
  );

  const upcomingJoined = useMemo(() => {
    if (!firebaseUser) return [];
    return activeGames.filter((g) => g.playerIds.includes(firebaseUser.uid));
  }, [activeGames, firebaseUser]);

  const nextMatch = upcomingJoined[0] || null;

  const filteredGames = useMemo(() => {
    const q = filters.searchQuery.trim().toLowerCase();
    return activeGames.filter((g) => {
      if (filters.sport !== 'All' && g.sport !== filters.sport) return false;
      if (filters.skillLevel !== 'All' && g.skillLevel !== filters.skillLevel) return false;
      if (filters.timeWindow !== 'All' && g.timeWindow !== filters.timeWindow) return false;
      if (filters.onlyOpenSlots && g.status !== 'open') return false;
      if (q) {
        const hay = `${g.title} ${g.location} ${g.hostName} ${g.sport}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [activeGames, filters]);

  const handleJoin = async (game: GameMatch) => {
    if (!userProfile) return;
    if (!isEmailVerified) {
      showToast('Email verification required', 'error', 'Verify your email above before joining a match.');
      return;
    }
    setBusyGameId(game.gameId);
    try {
      await joinGame(game.gameId, userProfile);
      showToast('Joined match', 'success', `Your spot is confirmed for "${game.title}".`);
    } catch (err) {
      showToast('Could not join match', 'error', mapFirebaseError(err));
    } finally {
      setBusyGameId(null);
    }
  };

  const handleLeave = async (game: GameMatch) => {
    if (!userProfile) return;
    setBusyGameId(game.gameId);
    try {
      await leaveGame(game.gameId, userProfile);
      showToast('Left match', 'info', `Spot released for "${game.title}".`);
    } catch (err) {
      showToast('Could not leave match', 'error', mapFirebaseError(err));
    } finally {
      setBusyGameId(null);
    }
  };

  const nextTiming = nextMatch ? formatMatchDateTime(nextMatch.dateTime) : null;

  return (
    <AppShell title="Campus Game Feed">
      {/* Welcome & Quick Stats */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {userProfile?.university || 'DBS Global University'} · Dehradun
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Ready to play, {userProfile?.fullName?.split(' ')[0] || 'Athlete'}?
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
              {nextMatch && nextTiming ? (
                <>
                  Next up: <strong className="text-slate-900 dark:text-slate-100">{nextMatch.title}</strong> ({nextTiming.dateLabel} · {nextTiming.timeLabel}) at {nextMatch.location}.
                </>
              ) : (
                'Browse open campus games below or organize a new session in under 30 seconds.'
              )}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to="/create-game"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 whitespace-nowrap"
            >
              <PlusCircle className="h-4 w-4" />
              Organize a Match
            </Link>
            <button
              type="button"
              onClick={() => {
                setFeedbackGame(null);
                setFeedbackOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap"
            >
              <ClipboardCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Pilot Feedback Survey
            </button>
          </div>
        </div>

        {/* 3 Compact Athlete Metrics */}
        <div className="grid grid-cols-3 gap-3 lg:col-span-5">
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Games Joined
            </span>
            <p className="font-mono-nums mt-3 text-3xl font-bold text-slate-900 dark:text-white">
              {userProfile?.gamesPlayedCount ?? 0}
            </p>
          </div>
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Games Hosted
            </span>
            <p className="font-mono-nums mt-3 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {userProfile?.gamesHostedCount ?? 0}
            </p>
          </div>
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Primary Sport
            </span>
            <p className="mt-3 truncate text-base font-bold text-slate-900 dark:text-white">
              {userProfile?.preferredSports?.[0] || 'Cricket'}
            </p>
          </div>
        </div>
      </section>

      {/* Upcoming Reminder Strip */}
      {upcomingJoined.length > 0 && (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <CalendarClock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                You are confirmed for{' '}
                <span className="font-mono-nums">{upcomingJoined.length}</span> upcoming{' '}
                {upcomingJoined.length === 1 ? 'match' : 'matches'}
              </span>
            </div>
            <Link
              to="/my-games"
              className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
            >
              View Schedule &amp; Manage →
            </Link>
          </div>
        </section>
      )}

      {/* Filters & Feed */}
      <section className="mt-6">
        <GameFilterBar filters={filters} onChange={setFilters} />

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-64 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60"
              />
            ))}
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {activeGames.length === 0
                ? 'No live campus games yet'
                : 'No matches match your filters'}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
              {activeGames.length === 0
                ? 'Start the first pickup game for DGU students today and invite players from the directory.'
                : 'Reset one or more filters to view all upcoming games near campus.'}
            </p>
            <div className="mt-5 flex justify-center gap-3">
              {activeGames.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setFilters({
                      sport: 'All',
                      skillLevel: 'All',
                      timeWindow: 'All',
                      onlyOpenSlots: false,
                      searchQuery: '',
                    })
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Clear Filters
                </button>
              )}
              <Link
                to="/create-game"
                className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Host a Game
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredGames.map((game) => (
              <GameCard
                key={game.gameId}
                game={game}
                currentUserId={firebaseUser?.uid}
                busy={busyGameId === game.gameId}
                onJoin={(g) => void handleJoin(g)}
                onLeave={(g) => void handleLeave(g)}
                onViewDetails={(g) => setSelectedGame(g)}
              />
            ))}
          </div>
        )}
      </section>

      <GameDetailsModal
        game={selectedGame}
        playersById={playersById}
        currentUserId={firebaseUser?.uid}
        onClose={() => setSelectedGame(null)}
        onOpenFeedback={(g) => {
          setFeedbackGame(g);
          setFeedbackOpen(true);
        }}
      />

      <PilotFeedbackModal
        open={feedbackOpen}
        gameId={feedbackGame?.gameId || ''}
        gameTitle={feedbackGame?.title}
        onClose={() => setFeedbackOpen(false)}
      />
    </AppShell>
  );
}
