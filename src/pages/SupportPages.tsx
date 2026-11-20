import { Link } from 'react-router-dom';
import { PublicHeader, PublicFooter } from '../components/PublicHeader';

export function HelpSupportPage() {
  const faqs = [
    {
      q: 'Who can join PlayGrid?',
      a: 'PlayGrid is built for DBS Global University (DGU) students aged 18–25 in Dehradun. Sign up with your @dgu.ac.in email or Google account and verify your email to join or host matches.',
    },
    {
      q: 'Does PlayGrid book grounds or process payments?',
      a: 'No. In this MVP pilot, PlayGrid focuses strictly on player matching and match organization. Hosts may optionally list a per-player split note (such as ₹40 shuttle or turf share) settled directly at the ground.',
    },
    {
      q: 'Why does it ask me to verify my email before joining?',
      a: 'Email verification prevents spam accounts and ensures every player on a match roster is an identifiable student.',
    },
    {
      q: 'How do I invite specific teammates?',
      a: 'Open the Player Directory from the sidebar, filter by sport or skill level, and click "Invite to Game" on any active student profile.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          Campus Pilot Support
        </p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight">Help &amp; Support</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Need assistance with DGU match coordination, verification emails, or reporting an issue? Review common answers below or reach the campus pilot team.
        </p>

        <div className="mt-8 space-y-4">
          {faqs.map((item) => (
            <div
              key={item.q}
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{item.q}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {item.a}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold">Campus Coordinator Contact</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            DBS Global University Student Sports Pilot Desk · Selaqui / Manduwala Road, Dehradun, Uttarakhand.
          </p>
          <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Support Email: playgrid-support@dgu.ac.in
          </p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <PublicHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6">
        <div>
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            Data &amp; Privacy
          </p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-xs text-slate-500">Effective Date: November 2026</p>
        </div>

        <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              1. Information We Collect
            </h2>
            <p className="mt-1">
              PlayGrid collects your full name, email address, university affiliation, preferred sports, skill level, and optional profile photo to coordinate campus sports matches.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              2. PII Isolation
            </h2>
            <p className="mt-1">
              Your email address and personal settings are stored privately and are never displayed in the public Player Directory. Other verified students only see your name, preferred sports, skill level, availability, and match counts.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              3. Account Deletion
            </h2>
            <p className="mt-1">
              You may permanently delete your account and associated profile records at any time from Profile &amp; Settings after re-authenticating.
            </p>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <PublicHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6">
        <div>
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            Campus Code of Conduct
          </p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight">Terms &amp; Conditions</h1>
          <p className="mt-2 text-xs text-slate-500">Effective Date: November 2026</p>
        </div>

        <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              1. Scope of Service
            </h2>
            <p className="mt-1">
              PlayGrid is a student-to-student sports matching tool for DBS Global University (DGU). PlayGrid does not own sports venues, process financial transactions, or guarantee ground availability.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              2. Fair Play &amp; Attendance
            </h2>
            <p className="mt-1">
              Students who join a match are expected to attend on time or leave the match roster early so fellow students can claim the open slot. Repeated no-shows or abusive conduct may lead to account deactivation.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              3. Assumption of Risk
            </h2>
            <p className="mt-1">
              Participation in physical sports carries inherent risk. Students participate voluntarily and are responsible for their own safety and campus facility rules.
            </p>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <PublicHeader />
      <main className="mx-auto flex max-w-xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
        <p className="font-mono-nums text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          404 · Page Not Found
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Out of Bounds</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          The page or match link you requested does not exist on PlayGrid.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Link
            to="/"
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Back to Home
          </Link>
          <Link
            to="/dashboard"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Open Dashboard
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
