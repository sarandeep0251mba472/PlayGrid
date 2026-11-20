import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createGame } from '../services/gameService';
import {
  SKILL_LEVELS,
  SPORTS_LIST,
  SkillLevel,
  SportType,
  TIME_WINDOWS,
  TimeWindow,
} from '../types';
import { mapFirebaseError } from '../utils/errorMapper';
import {
  DGU_VENUE_PRESETS,
  getDefaultDateTimeInput,
  inferTimeWindowFromDateTime,
} from '../utils/validation';

export function CreateGamePage() {
  const { userProfile, isEmailVerified } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const initialDate = getDefaultDateTimeInput();
  const [sport, setSport] = useState<SportType>('Cricket');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState(DGU_VENUE_PRESETS[0].name);
  const [campusDistanceKm, setCampusDistanceKm] = useState<number>(DGU_VENUE_PRESETS[0].distanceKm);
  const [dateTime, setDateTime] = useState(initialDate);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(
    inferTimeWindowFromDateTime(initialDate)
  );
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('Intermediate');
  const [convenienceFeeNote, setConvenienceFeeNote] = useState('');
  const [notes, setNotes] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePresetPick = (name: string, distanceKm: number) => {
    setLocation(name);
    setCampusDistanceKm(distanceKm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!userProfile) return;
    if (!isEmailVerified) {
      setErrorMsg('Please verify your email address before organizing a match.');
      return;
    }
    if (title.trim().length < 3) {
      setErrorMsg('Game title must be at least 3 characters.');
      return;
    }
    if (location.trim().length < 3) {
      setErrorMsg('Please enter a ground or venue location.');
      return;
    }
    if (maxPlayers < 2 || maxPlayers > 30) {
      setErrorMsg('Total players needed must be between 2 and 30.');
      return;
    }
    if (campusDistanceKm < 0 || campusDistanceKm > 10) {
      setErrorMsg('Ground distance must be within 10 km of DGU campus.');
      return;
    }
    if (whatsappLink.trim() && !whatsappLink.trim().startsWith('https://')) {
      setErrorMsg('Coordination link must start with https:// (or leave blank).');
      return;
    }

    setSubmitting(true);
    try {
      await createGame(userProfile, {
        sport,
        title,
        location,
        campusDistanceKm,
        dateTime,
        timeWindow,
        durationMinutes,
        maxPlayers,
        skillLevel,
        convenienceFeeNote,
        notes,
        whatsappLink,
      });
      showToast('Match published', 'success', 'Your game is now live on the DGU campus feed.');
      navigate('/my-games');
    } catch (err) {
      setErrorMsg(mapFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell title="Organize a Match">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          Host Setup · DGU Dehradun (Within 10 km)
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Post a New Campus Game
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          You are automatically added as slot 1 of the squad. Verified DGU students can join until the roster fills.
        </p>

        {errorMsg && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-5">
          {/* Sport */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Sport
            </span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SPORTS_LIST.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSport(s)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    sport === s
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="game-title" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Match Title
            </label>
            <input
              id="game-title"
              type="text"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Evening 6v6 Turf Football · Open to MBA/BTech"
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          {/* Ground Presets */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Quick Campus &amp; Nearby Ground Presets
            </span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {DGU_VENUE_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handlePresetPick(preset.name, preset.distanceKm)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                    location === preset.name
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  {preset.name} ({preset.distanceKm} km)
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="game-location" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ground / Venue Name
              </label>
              <input
                id="game-location"
                type="text"
                required
                maxLength={120}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="game-distance" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Distance from DGU (km)
              </label>
              <input
                id="game-distance"
                type="number"
                min={0}
                max={10}
                step={0.1}
                required
                value={campusDistanceKm}
                onChange={(e) => setCampusDistanceKm(Number(e.target.value))}
                className="font-mono-nums mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="game-datetime" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Date &amp; Start Time
              </label>
              <input
                id="game-datetime"
                type="datetime-local"
                required
                value={dateTime}
                onChange={(e) => {
                  setDateTime(e.target.value);
                  setTimeWindow(inferTimeWindowFromDateTime(e.target.value));
                }}
                className="font-mono-nums mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="game-window" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Time Window
              </label>
              <select
                id="game-window"
                value={timeWindow}
                onChange={(e) => setTimeWindow(e.target.value as TimeWindow)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {TIME_WINDOWS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="game-duration" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Duration
              </label>
              <select
                id="game-duration"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {[30, 45, 60, 90, 120, 150, 180].map((m) => (
                  <option key={m} value={m}>
                    {m} minutes
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="game-max" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Total Players Needed (2–30)
              </label>
              <input
                id="game-max"
                type="number"
                min={2}
                max={30}
                required
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="font-mono-nums mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="game-skill" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Skill Level
              </label>
              <select
                id="game-skill"
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {SKILL_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="game-fee" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Optional Split / Convenience Fee Note
            </label>
            <input
              id="game-fee"
              type="text"
              maxLength={120}
              value={convenienceFeeNote}
              onChange={(e) => setConvenienceFeeNote(e.target.value)}
              placeholder="e.g., Free campus ground or ₹40 per player shuttle/turf split"
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div>
            <label htmlFor="game-wa" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Optional WhatsApp Coordination Link (Visible only to joined players)
            </label>
            <input
              id="game-wa"
              type="url"
              maxLength={200}
              value={whatsappLink}
              onChange={(e) => setWhatsappLink(e.target.value)}
              placeholder="https://chat.whatsapp.com/..."
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div>
            <label htmlFor="game-notes" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Match Notes &amp; Gear Info
            </label>
            <textarea
              id="game-notes"
              rows={3}
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bring non-marking shoes, extra tennis balls, meet near Main Gate 10 mins early..."
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !isEmailVerified}
              className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? 'Publishing...' : 'Publish Match'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
