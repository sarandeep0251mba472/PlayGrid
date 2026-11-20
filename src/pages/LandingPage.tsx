import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Moon, Sun } from 'lucide-react';
import { PublicHeader, PublicFooter } from '../components/PublicHeader';
import { HeroFieldIllustration, SportCourtThumb } from '../components/CourtArt';
import { GameCard } from '../components/GameCard';
import { GameFilterBar } from '../components/GameFilterBar';
import { usePublicGames } from '../hooks/useGames';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { GameFilterState, SPORTS_LIST } from '../types';

export function LandingPage() {
  const { firebaseUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { games, loading, error } = usePublicGames();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<GameFilterState>({
    sport: 'All',
    skillLevel: 'All',
    timeWindow: 'All',
    onlyOpenSlots: false,
    searchQuery: '',
  });

  const activeGames = useMemo(
    () => games.filter((g) => g.status === 'open' || g.status === 'full'),
    [games]
  );

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

  const openSpotsTotal = useMemo(
    () =>
      activeGames.reduce(
        (sum, g) => sum + Math.max(0, g.maxPlayers - g.currentPlayersCount),
        0
      ),
    [activeGames]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <PublicHeader />

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 lg:pt-14">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            DBS Global University (DGU) · Dehradun Campus Pilot
          </p>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
          <div className="flex flex-col justify-center lg:col-span-6">
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-slate-900 text-balance sm:text-5xl lg:text-[3.5rem] dark:text-white">
              Find players, join games, and play your favourite sport at DGU without the WhatsApp hassle.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Skip the buried group texts and last-minute dropouts. Browse open campus matches within 10 km of DBS Global University, check live slot counts, and lock in your spot in one click.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to={firebaseUser ? '/dashboard' : '/register'}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 whitespace-nowrap shrink-0"
              >
                {firebaseUser ? 'Go to Campus Feed' : 'Create Student Account'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#discover"
                className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                Browse Live Games
              </a>
            </div>
          </div>

          <div className="lg:col-span-6">
            <HeroFieldIllustration />
          </div>
        </div>

        {/* 4-column Campus Strip below Hero Split */}
        <div className="mt-10 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Matches</p>
            <p className="font-mono-nums mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {activeGames.length}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Open Player Slots</p>
            <p className="font-mono-nums mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {openSpotsTotal}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Sports Supported</p>
            <p className="font-mono-nums mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {SPORTS_LIST.length}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Campus Radius</p>
            <p className="font-mono-nums mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              10 km
            </p>
          </div>
        </div>
      </section>

      {/* Live Campus Game Discovery Preview */}
      <section
        id="discover"
        className="border-t border-slate-200 bg-white py-14 dark:border-slate-800 dark:bg-slate-900/50"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Live Campus Schedule
              </p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Upcoming Matches Near DGU Dehradun
              </h2>
            </div>
            <Link
              to={firebaseUser ? '/create-game' : '/register'}
              className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400 whitespace-nowrap"
            >
              {firebaseUser ? 'Host a new game →' : 'Sign up to host or join →'}
            </Link>
          </div>

          <div className="mt-6">
            <GameFilterBar filters={filters} onChange={setFilters} />
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-64 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60"
                />
              ))}
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-10 text-center dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {activeGames.length === 0
                  ? 'No upcoming campus matches posted yet'
                  : 'No matches fit these filters'}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
                {activeGames.length === 0
                  ? 'Be the first DGU student to organize an evening cricket, football, or badminton session.'
                  : 'Try clearing one of your sport, skill level, or time window filters.'}
              </p>
              <Link
                to={firebaseUser ? '/create-game' : '/register'}
                className="mt-5 inline-flex rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                {firebaseUser ? 'Host First Match' : 'Join & Host a Match'}
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredGames.slice(0, 6).map((game) => (
                <GameCard
                  key={game.gameId}
                  game={game}
                  currentUserId={firebaseUser?.uid}
                  onGuestPrompt={() => navigate('/login')}
                  onJoin={() => navigate('/dashboard')}
                  onLeave={() => navigate('/dashboard')}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How PlayGrid Works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            Built for 18–25 Campus Athletes
          </p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            How PlayGrid Replaces WhatsApp Chaos
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="h-24 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800">
              <SportCourtThumb sport="Cricket" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              01. Pick Your Sport &amp; Free Window
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Filter live DGU matches by Cricket, Football, Badminton, Basketball, Volleyball, or Table Tennis across evenings, weekends, or free periods.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="h-24 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800">
              <SportCourtThumb sport="Football" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              02. Lock In One-Click Atomic Slots
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              See exact player counts like 7/10 joined and skill tags before heading to the ground. Slots update in real time so squads never overbook.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="h-24 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800">
              <SportCourtThumb sport="Badminton" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              03. Nudge Teammates &amp; Play
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Short one player for doubles? Browse the DGU Player Directory by skill level and send an in-app match invite right from your dashboard.
            </p>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
