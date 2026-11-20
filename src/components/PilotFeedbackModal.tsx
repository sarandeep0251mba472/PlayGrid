import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { submitPilotFeedback } from '../services/gameService';
import { mapFirebaseError } from '../utils/errorMapper';

interface PilotFeedbackModalProps {
  open: boolean;
  gameId?: string;
  gameTitle?: string;
  onClose: () => void;
}

export function PilotFeedbackModal({
  open,
  gameId = '',
  gameTitle,
  onClose,
}: PilotFeedbackModalProps) {
  const { userProfile, isEmailVerified } = useAuth();
  const { showToast } = useToast();
  const [savedTimeOverWhatsapp, setSavedTimeOverWhatsapp] = useState(true);
  const [wouldUseAgain, setWouldUseAgain] = useState(true);
  const [willingToPay40INR, setWillingToPay40INR] = useState(true);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    if (!isEmailVerified) {
      showToast('Verify email first', 'error', 'Please verify your email to submit pilot feedback.');
      return;
    }

    setSubmitting(true);
    try {
      await submitPilotFeedback({
        user: userProfile,
        gameId,
        savedTimeOverWhatsapp,
        rating,
        wouldUseAgain,
        willingToPay40INR,
        comments,
      });
      showToast('Feedback recorded', 'success', 'Thank you for helping validate PlayGrid at DGU.');
      setComments('');
      onClose();
    } catch (err) {
      showToast('Could not submit feedback', 'error', mapFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pilot-feedback-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              DGU Pilot Validation Check-In
            </p>
            <h2 id="pilot-feedback-title" className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">
              {gameTitle ? `How was "${gameTitle}"?` : 'Quick PlayGrid Pilot Survey'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close survey"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-5">
          {/* Question 1 */}
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              1. Did PlayGrid save you time compared to DGU WhatsApp groups?
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[
                { label: 'Yes, faster coordination', val: true },
                { label: 'No, same or slower', val: false },
              ].map((opt) => (
                <button
                  key={String(opt.val)}
                  type="button"
                  onClick={() => setSavedTimeOverWhatsapp(opt.val)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    savedTimeOverWhatsapp === opt.val
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question 2 */}
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              2. Would you use PlayGrid again for your next campus game?
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[
                { label: 'Yes, definitely', val: true },
                { label: 'Not sure / No', val: false },
              ].map((opt) => (
                <button
                  key={String(opt.val)}
                  type="button"
                  onClick={() => setWouldUseAgain(opt.val)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    wouldUseAgain === opt.val
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question 3 */}
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              3. Would you pay a small ₹40 convenience fee for verified match coordination?
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[
                { label: 'Yes, ₹40 is fair', val: true },
                { label: 'No, prefer free', val: false },
              ].map((opt) => (
                <button
                  key={String(opt.val)}
                  type="button"
                  onClick={() => setWillingToPay40INR(opt.val)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    willingToPay40INR === opt.val
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              4. Overall Experience Rating
            </p>
            <div className="mt-2 flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setRating(num)}
                  aria-label={`Rate ${num} out of 5`}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                    rating >= num
                      ? 'border-amber-400 bg-amber-50 text-amber-600 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                      : 'border-slate-200 text-slate-400 dark:border-slate-700'
                  }`}
                >
                  <Star className="h-4 w-4 fill-current" />
                </button>
              ))}
              <span className="ml-2 font-mono-nums text-xs font-semibold text-slate-600 dark:text-slate-400">
                {rating}/5
              </span>
            </div>
          </div>

          {/* Comments */}
          <div>
            <label htmlFor="pilot-comments" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Suggestions for DGU Campus Rollout (Optional)
            </label>
            <textarea
              id="pilot-comments"
              rows={3}
              maxLength={500}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Any ground missing, timing improvements, or sports you want next..."
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Survey'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
