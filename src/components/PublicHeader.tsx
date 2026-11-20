import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function PublicHeader() {
  const { firebaseUser } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
        {/* Zone 1: Single text element wordmark */}
        <Link
          to="/"
          className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
        >
          PlayGrid
        </Link>

        {/* Zone 2: 4 concise single-line text links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a
            href="/#discover"
            className="hover:text-slate-900 hover:underline underline-offset-4 dark:hover:text-white whitespace-nowrap shrink-0"
          >
            Discover Games
          </a>
          <a
            href="/#how-it-works"
            className="hover:text-slate-900 hover:underline underline-offset-4 dark:hover:text-white whitespace-nowrap shrink-0"
          >
            How It Works
          </a>
          <Link
            to="/help"
            className="hover:text-slate-900 hover:underline underline-offset-4 dark:hover:text-white whitespace-nowrap shrink-0"
          >
            Help &amp; Support
          </Link>
          <Link
            to={firebaseUser ? '/dashboard' : '/login'}
            className="hover:text-slate-900 hover:underline underline-offset-4 dark:hover:text-white whitespace-nowrap shrink-0"
          >
            {firebaseUser ? 'Dashboard' : 'Sign In'}
          </Link>
        </nav>

        {/* Zone 3: 1 primary CTA */}
        <div className="shrink-0">
          <Link
            to={firebaseUser ? '/dashboard' : '/register'}
            className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 whitespace-nowrap shrink-0"
          >
            {firebaseUser ? 'Open Dashboard' : 'Join DGU Campus'}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-10 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6">
        <div>
          <p className="font-display text-xl font-bold text-slate-900 dark:text-white">
            PlayGrid
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Student sports player-matching pilot for DBS Global University (DGU), Dehradun.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-400">
          <Link to="/help" className="hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap">
            Help &amp; Support
          </Link>
          <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap">
            Terms &amp; Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
}
