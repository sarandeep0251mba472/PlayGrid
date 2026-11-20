import { Search } from 'lucide-react';
import {
  GameFilterState,
  SKILL_LEVELS,
  SPORTS_LIST,
  TIME_WINDOWS,
} from '../types';

interface GameFilterBarProps {
  filters: GameFilterState;
  onChange: (next: GameFilterState) => void;
}

export function GameFilterBar({ filters, onChange }: GameFilterBarProps) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      {/* Sport Segmented Selector */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange({ ...filters, sport: 'All' })}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
            filters.sport === 'All'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          All Sports
        </button>
        {SPORTS_LIST.map((sport) => (
          <button
            key={sport}
            type="button"
            onClick={() => onChange({ ...filters, sport })}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              filters.sport === sport
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {sport}
          </button>
        ))}
      </div>

      {/* Secondary Controls */}
      <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={filters.searchQuery}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
            placeholder="Search ground, title, host..."
            aria-label="Search matches"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-500"
          />
        </div>

        <select
          value={filters.skillLevel}
          onChange={(e) =>
            onChange({
              ...filters,
              skillLevel: e.target.value as GameFilterState['skillLevel'],
            })
          }
          aria-label="Filter by skill level"
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          <option value="All">All Skill Levels</option>
          {SKILL_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>

        <select
          value={filters.timeWindow}
          onChange={(e) =>
            onChange({
              ...filters,
              timeWindow: e.target.value as GameFilterState['timeWindow'],
            })
          }
          aria-label="Filter by time window"
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          <option value="All">Any Time Window</option>
          {TIME_WINDOWS.map((win) => (
            <option key={win} value={win}>
              {win}
            </option>
          ))}
        </select>

        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
          <span className="font-medium">Open slots only</span>
          <input
            type="checkbox"
            checked={filters.onlyOpenSlots}
            onChange={(e) => onChange({ ...filters, onlyOpenSlots: e.target.checked })}
            className="h-4 w-4 accent-emerald-600"
          />
        </label>
      </div>
    </div>
  );
}
