import { Calendar, Clock, ExternalLink, MapPin, ShieldCheck, Users, X } from 'lucide-react';
import { GameMatch, PublicPlayerProfile } from '../types';
import { formatMatchDateTime } from '../utils/validation';
import { Avatar } from './Avatar';

interface GameDetailsModalProps {
  game: GameMatch | null;
  playersById: Record<string, PublicPlayerProfile>;
  currentUserId?: string;
  onClose: () => void;
  onOpenFeedback?: (game: GameMatch) => void;
}

export function GameDetailsModal({
  game,
  playersById,
  currentUserId,
  onClose,
  onOpenFeedback,
}: GameDetailsModalProps) {
  if (!game) return null;

  const { dateLabel, timeLabel } = formatMatchDateTime(game.dateTime);
  const isMember = Boolean(currentUserId && game.playerIds.includes(currentUserId));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-details-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {game.sport} · {game.skillLevel} · {game.campusDistanceKm.toFixed(1)} km from DGU
            </p>
            <h2
              id="game-details-title"
              className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50"
            >
              {game.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close match details"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400" />
            <span>{game.location}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <Calendar className="h-3.5 w-3.5" />
              {dateLabel}
              {timeLabel ? ` at ${timeLabel}` : ''}
            </span>
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <Clock className="h-3.5 w-3.5" />
              {game.durationMinutes} mins ({game.timeWindow})
            </span>
          </div>
          {game.convenienceFeeNote && (
            <p className="pt-1 text-xs font-medium text-slate-700 dark:text-slate-300">
              Cost / Split Note: {game.convenienceFeeNote}
            </p>
          )}
          {game.notes && (
            <p className="pt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              {game.notes}
            </p>
          )}
        </div>

        {isMember && game.whatsappLink && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
              Squad Coordination Link
            </span>
            <a
              href={game.whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
            >
              Open Group Chat
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {/* Joined Roster */}
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Users className="h-4 w-4 text-slate-400" />
              Joined Roster
            </h3>
            <span className="font-mono-nums text-xs font-semibold text-slate-600 dark:text-slate-400">
              {game.currentPlayersCount}/{game.maxPlayers} Confirmed
            </span>
          </div>

          <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {game.playerIds.map((uid) => {
              const p = playersById[uid];
              const displayName =
                uid === game.hostId
                  ? game.hostName
                  : p?.fullName || 'DGU Student Player';
              const displayPhoto = uid === game.hostId ? game.hostPhoto : p?.photoURL || '';
              return (
                <li
                  key={uid}
                  className="flex items-center justify-between px-3.5 py-2.5 text-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar src={displayPhoto} name={displayName} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                        {displayName}
                      </p>
                      {p && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {p.skillLevel} · {p.university}
                        </p>
                      )}
                    </div>
                  </div>
                  {uid === game.hostId && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Host
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          {isMember && onOpenFeedback ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFeedback(game);
              }}
              className="text-xs font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
            >
              Rate this match (Pilot Survey)
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
