import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, Shield, UserCheck, UserX, XCircle } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  adminUpdateUserRole,
  adminUpdateUserStatus,
  fetchAdminUsers,
  fetchAllGamesForAdmin,
  fetchAllPilotFeedback,
  updateHostedGame,
} from '../services/gameService';
import { GameMatch, PilotFeedback, UserProfile } from '../types';
import { mapFirebaseError } from '../utils/errorMapper';
import { formatMatchDateTime } from '../utils/validation';

export function AdminPage() {
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [games, setGames] = useState<GameMatch[]>([]);
  const [feedback, setFeedback] = useState<PilotFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [u, g, f] = await Promise.all([
        fetchAdminUsers(),
        fetchAllGamesForAdmin(),
        fetchAllPilotFeedback(),
      ]);
      setUsers(u);
      setGames(g);
      setFeedback(f);
    } catch (err) {
      showToast('Failed to load admin metrics', 'error', mapFirebaseError(err));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadAdminData();
  }, [loadAdminData]);

  const metrics = useMemo(() => {
    const activeGames = games.filter((g) => g.status === 'open' || g.status === 'full').length;
    const totalJoins = games.reduce((sum, g) => sum + g.currentPlayersCount, 0);
    const wtpCount = feedback.filter((f) => f.willingToPay40INR).length;
    const wtpPct = feedback.length > 0 ? Math.round((wtpCount / feedback.length) * 100) : 0;
    const savedTimePct =
      feedback.length > 0
        ? Math.round(
            (feedback.filter((f) => f.savedTimeOverWhatsapp).length / feedback.length) * 100
          )
        : 0;
    return {
      totalStudents: users.length,
      activeGames,
      totalJoins,
      wtpPct,
      savedTimePct,
    };
  }, [users, games, feedback]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const handleToggleStatus = async (target: UserProfile) => {
    if (target.uid === firebaseUser?.uid) {
      showToast('Action blocked', 'error', 'You cannot deactivate your own admin account.');
      return;
    }
    const nextStatus = target.status === 'active' ? 'deactivated' : 'active';
    setBusyKey(target.uid);
    try {
      await adminUpdateUserStatus(target.uid, nextStatus);
      setUsers((prev) =>
        prev.map((u) => (u.uid === target.uid ? { ...u, status: nextStatus } : u))
      );
      showToast(`User ${nextStatus}`, 'success', `${target.fullName} is now ${nextStatus}.`);
    } catch (err) {
      showToast('Status update failed', 'error', mapFirebaseError(err));
    } finally {
      setBusyKey(null);
    }
  };

  const handleToggleRole = async (target: UserProfile) => {
    if (!firebaseUser) return;
    if (target.uid === firebaseUser.uid) {
      showToast('Action blocked', 'error', 'You cannot demote yourself.');
      return;
    }
    const nextRole = target.role === 'admin' ? 'student' : 'admin';
    setBusyKey(target.uid);
    try {
      await adminUpdateUserRole(target.uid, nextRole, firebaseUser.uid);
      setUsers((prev) =>
        prev.map((u) => (u.uid === target.uid ? { ...u, role: nextRole } : u))
      );
      showToast('Role updated', 'success', `${target.fullName} is now ${nextRole}.`);
    } catch (err) {
      showToast('Role update failed', 'error', mapFirebaseError(err));
    } finally {
      setBusyKey(null);
    }
  };

  const handleCancelGame = async (gameId: string) => {
    setBusyKey(gameId);
    try {
      await updateHostedGame(gameId, { status: 'cancelled' });
      setGames((prev) =>
        prev.map((g) => (g.gameId === gameId ? { ...g, status: 'cancelled' } : g))
      );
      showToast('Match cancelled by admin', 'info');
    } catch (err) {
      showToast('Moderation failed', 'error', mapFirebaseError(err));
    } finally {
      setBusyKey(null);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'FeedbackID',
      'UserName',
      'GameID',
      'Rating',
      'SavedTimeOverWhatsApp',
      'WouldUseAgain',
      'WillingToPay40INR',
      'Comments',
    ];
    const rows = feedback.map((f) => [
      f.feedbackId,
      `"${f.userName.replace(/"/g, '""')}"`,
      f.gameId,
      String(f.rating),
      String(f.savedTimeOverWhatsapp),
      String(f.wouldUseAgain),
      String(f.willingToPay40INR),
      `"${f.comments.replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `playgrid-pilot-feedback-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell title="Admin Console">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          DGU Pilot Operations, User Moderation, and Validation Telemetry
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadAdminData()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            disabled={feedback.length === 0}
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export Pilot CSV
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500">Registered Students</p>
          <p className="font-mono-nums mt-2 text-2xl font-bold">{metrics.totalStudents}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500">Active Campus Games</p>
          <p className="font-mono-nums mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {metrics.activeGames}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500">Total Roster Joins</p>
          <p className="font-mono-nums mt-2 text-2xl font-bold">{metrics.totalJoins}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500">Saved Time vs WhatsApp</p>
          <p className="font-mono-nums mt-2 text-2xl font-bold">{metrics.savedTimePct}%</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500">Willing to Pay ₹40</p>
          <p className="font-mono-nums mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {metrics.wtpPct}%
          </p>
        </div>
      </div>

      {/* User Management */}
      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="text-xl font-bold">Student User Management</h2>
          <input
            type="search"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Filter by name or email..."
            className="w-full max-w-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                <th className="py-2.5 pr-4 font-semibold">Student</th>
                <th className="py-2.5 pr-4 font-semibold">Email</th>
                <th className="py-2.5 pr-4 font-semibold">Role</th>
                <th className="py-2.5 pr-4 font-semibold">Status</th>
                <th className="py-2.5 pr-4 text-right font-semibold">Played / Hosted</th>
                <th className="py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((u) => (
                <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-slate-100">
                    {u.fullName}
                  </td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                  <td className="py-3 pr-4 font-medium">{u.role}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`font-semibold ${
                        u.status === 'active'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="font-mono-nums py-3 pr-4 text-right">
                    {u.gamesPlayedCount} / {u.gamesHostedCount}
                  </td>
                  <td className="py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        disabled={busyKey === u.uid || u.uid === firebaseUser?.uid}
                        onClick={() => void handleToggleRole(u)}
                        className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        <Shield className="h-3 w-3" />
                        {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                      </button>
                      <button
                        type="button"
                        disabled={busyKey === u.uid || u.uid === firebaseUser?.uid}
                        onClick={() => void handleToggleStatus(u)}
                        className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        {u.status === 'active' ? (
                          <>
                            <UserX className="h-3 w-3 text-red-600" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3 w-3 text-emerald-600" />
                            Activate
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Game Moderation */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-bold">Game Moderation</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                <th className="py-2.5 pr-4 font-semibold">Match</th>
                <th className="py-2.5 pr-4 font-semibold">Sport</th>
                <th className="py-2.5 pr-4 font-semibold">Host</th>
                <th className="py-2.5 pr-4 font-semibold">Schedule</th>
                <th className="py-2.5 pr-4 font-semibold">Status</th>
                <th className="py-2.5 text-right font-semibold">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {games.map((g) => {
                const { dateLabel, timeLabel } = formatMatchDateTime(g.dateTime);
                return (
                  <tr key={g.gameId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-slate-100">
                      {g.title}
                    </td>
                    <td className="py-3 pr-4">{g.sport}</td>
                    <td className="py-3 pr-4">{g.hostName}</td>
                    <td className="font-mono-nums py-3 pr-4">
                      {dateLabel} {timeLabel}
                    </td>
                    <td className="py-3 pr-4 font-medium">{g.status}</td>
                    <td className="py-3 text-right">
                      {g.status === 'open' || g.status === 'full' ? (
                        <button
                          type="button"
                          disabled={busyKey === g.gameId}
                          onClick={() => void handleCancelGame(g.gameId)}
                          className="inline-flex items-center gap-1 rounded border border-red-200 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/60 dark:text-red-400"
                        >
                          <XCircle className="h-3 w-3" />
                          Cancel
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pilot Survey Responses */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-bold">
          Pilot Validation Feedback ({feedback.length} responses)
        </h2>
        {feedback.length === 0 ? (
          <p className="mt-3 text-xs text-slate-500">No survey responses submitted yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="py-2.5 pr-4 font-semibold">Student</th>
                  <th className="py-2.5 pr-4 font-semibold">Rating</th>
                  <th className="py-2.5 pr-4 font-semibold">Faster than WhatsApp</th>
                  <th className="py-2.5 pr-4 font-semibold">Use Again</th>
                  <th className="py-2.5 pr-4 font-semibold">Pay ₹40</th>
                  <th className="py-2.5 font-semibold">Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {feedback.map((f) => (
                  <tr key={f.feedbackId}>
                    <td className="py-2.5 pr-4 font-semibold">{f.userName}</td>
                    <td className="font-mono-nums py-2.5 pr-4">{f.rating}/5</td>
                    <td className="py-2.5 pr-4">{f.savedTimeOverWhatsapp ? 'Yes' : 'No'}</td>
                    <td className="py-2.5 pr-4">{f.wouldUseAgain ? 'Yes' : 'No'}</td>
                    <td className="py-2.5 pr-4">{f.willingToPay40INR ? 'Yes' : 'No'}</td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-400">
                      {f.comments || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
