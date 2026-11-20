import { Calendar, Clock, ExternalLink, MapPin, Users } from 'lucide-react';
import { GameMatch } from '../types';
import { formatMatchDateTime, getSkillTextTone } from '../utils/validation';
import { Avatar } from './Avatar';

interface GameCardProps {
  game: GameMatch;
  currentUserId?: string;
  busy?: boolean;
  onJoin?: (game: GameMatch) => void;
  onLeave?: (game: GameMatch) => void;
  onGuestPrompt?: () => void;
  onViewDetails?: (game: GameMatch) => void;
}

export function GameCard({
  game,
  currentUserId,
  busy = false,
  onJoin,
  onLeave,
  onGuestPrompt,
  onViewDetails,
}: GameCardProps) {
  const { dateLabel, timeLabel } = formatMatchDateTime(game.dateTime);
  const isHost = Boolean(currentUserId && game.hostId === currentUserId);
  const hasJoined = Boolean(currentUserId && game.playerIds.includes(currentUserId));
  const spotsLeft = Math.max(0, game.maxPlayers - game.currentPlayersCount);
  const fillPercent = Math.min(
    100,
    Math.round((game.currentPlayersCount / Math.max(1, game.maxPlayers)) * 100)
  );

  const statusText =
    game.status === 'cancelled'
      ? 'Cancelled'
      : game.status === 'completed'
      ? 'Completed'
      : game.status === 'full'
      ? 'Squad Full'
      : spotsLeft === 1
      ? '1 Spot Left'
      : `${spotsLeft} Spots Open`;

  const statusClass =
    game.status === 'cancelled'
      ? 'text-red-600 dark:text-red-400'
      : game.status === 'completed'
      ? 'text-slate-500 dark:text-slate-400'
      : game.status === 'full'
      ? 'text-amber-700 dark:text-amber-400'
      : 'text-emerald-700 dark:text-emerald-400';

  return (
    <article className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <div>
        {/* Quiet unboxed 1-line metadata kicker */}
        <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {game.sport}
            </span>
            <span aria-hidden="true">·</span>
            <span className={`font-medium ${getSkillTextTone(game.skillLevel)}`}>
              {game.skillLevel}
            </span>
            <span aria-hidden="true">·</span>
            <span>{game.campusDistanceKm.toFixed(1)} km</span>
          </div>
          <span className={`font-semibold shrink-0 ${statusClass}`}>{statusText}</span>
        </div>

        {/* Title */}
        <h3 className="mt-2.5 text-lg font-bold leading-snug text-slate-900 dark:text-slate-50">
          {game.title}
        </h3>

        {/* Ground & Time */}
        <div className="mt-3 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">{game.location}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              {dateLabel}
              {timeLabel ? ` · ${timeLabel}` : ''}
            </span>
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {game.durationMinutes} min ({game.timeWindow})
            </span>
          </div>
        </div>

        {/* Convenience Fee / Match Notes */}
        {(game.convenienceFeeNote || game.notes) && (
          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {game.convenienceFeeNote ? `${game.convenienceFeeNote} · ` : ''}
            {game.notes}
          </p>
        )}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
        {/* Player Capacity & Progress */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar src={game.hostPhoto} name={game.hostName} size="sm" />
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800 dark:text-slate-200">
                {isHost ? 'Hosted by you' : `Host: ${game.hostName}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 font-mono-nums text-xs font-semibold text-slate-800 dark:text-slate-200 shrink-0">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            <span>
              {game.currentPlayersCount}/{game.maxPlayers} Players
            </span>
          </div>
        </div>

        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full transition-all duration-200 ${
              game.status === 'full'
                ? 'bg-amber-500'
                : game.status === 'cancelled'
                ? 'bg-red-500'
                : 'bg-emerald-600 dark:bg-emerald-500'
            }`}
            style={{ width: `${fillPercent}%` }}
          />
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between gap-2">
          {onViewDetails ? (
            <button
              type="button"
              onClick={() => onViewDetails(game)}
              className="text-xs font-semibold text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-slate-100 whitespace-nowrap shrink-0"
            >
              Roster &amp; Info
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            {hasJoined && game.whatsappLink && (
              <a
                href={game.whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                Group
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            {!currentUserId && onGuestPrompt && (
              <button
                type="button"
                onClick={onGuestPrompt}
                disabled={game.status !== 'open'}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 whitespace-nowrap shrink-0"
              >
                {game.status === 'open' ? 'Sign in to Join' : 'Squad Full'}
              </button>
            )}

            {currentUserId && isHost && (
              <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0">
                Your Match
              </span>
            )}

            {currentUserId && !isHost && hasJoined && onLeave && game.status !== 'cancelled' && game.status !== 'completed' && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onLeave(game)}
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70 whitespace-nowrap shrink-0"
              >
                {busy ? 'Updating...' : 'Leave Game'}
              </button>
            )}

            {currentUserId && !isHost && !hasJoined && onJoin && (
              <button
                type="button"
                disabled={busy || game.status !== 'open'}
                onClick={() => onJoin(game)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 whitespace-nowrap shrink-0"
              >
                {busy ? 'Joining...' : game.status === 'open' ? 'Join Game' : 'Squad Full'}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
