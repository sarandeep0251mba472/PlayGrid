import { useState } from 'react';
import { MailWarning, RefreshCw, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { mapFirebaseError } from '../utils/errorMapper';

export function VerificationBanner() {
  const {
    firebaseUser,
    isEmailVerified,
    resendVerificationEmail,
    refreshVerificationStatus,
  } = useAuth();
  const { showToast } = useToast();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  if (!firebaseUser || isEmailVerified) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await resendVerificationEmail();
      showToast('Verification email sent', 'success', `Check ${firebaseUser.email} (including spam).`);
    } catch (err) {
      showToast('Could not send email', 'error', mapFirebaseError(err));
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = async () => {
    setChecking(true);
    try {
      const verified = await refreshVerificationStatus();
      if (verified) {
        showToast('Email verified', 'success', 'You can now host and join campus games.');
      } else {
        showToast('Still unverified', 'info', 'Click the link in your inbox first, then refresh.');
      }
    } catch (err) {
      showToast('Refresh failed', 'error', mapFirebaseError(err));
    } finally {
      setChecking(false);
    }
  };

  return (
    <div
      role="alert"
      className="mb-6 flex flex-col justify-between gap-4 rounded-xl border border-amber-300 bg-amber-50/90 px-4 py-3.5 text-amber-950 sm:flex-row sm:items-center dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <div className="flex items-start gap-3">
        <MailWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="text-sm font-semibold">
            Verify your email ({firebaseUser.email}) to join or host matches
          </p>
          <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-200/80">
            Status: Pending verification · Open the verification link sent to your inbox, then click Refresh Status.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <button
          type="button"
          disabled={sending}
          onClick={() => void handleResend()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 disabled:opacity-60 dark:border-amber-700 dark:bg-slate-900 dark:text-amber-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
        >
          <Send className="h-3.5 w-3.5" />
          {sending ? 'Sending...' : 'Resend Link'}
        </button>
        <button
          type="button"
          disabled={checking}
          onClick={() => void handleRefresh()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-800 disabled:opacity-60 dark:bg-amber-600 dark:hover:bg-amber-500 whitespace-nowrap shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Checking...' : 'Refresh Status'}
        </button>
      </div>
    </div>
  );
}
