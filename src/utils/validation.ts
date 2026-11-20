import { SkillLevel, SportType, TimeWindow } from '../types';

export const BLUEPRINT_LIMITS = {
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  DATE_TIME_PATTERN: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/,
  FULL_NAME_MIN: 2,
  FULL_NAME_MAX: 80,
  EMAIL_MAX: 160,
  BIO_MAX: 280,
  UNIVERSITY_MAX: 100,
  PHOTO_URL_MAX: 500,
  GAME_TITLE_MIN: 3,
  GAME_TITLE_MAX: 100,
  LOCATION_MIN: 3,
  LOCATION_MAX: 120,
  FEE_NOTE_MAX: 120,
  NOTES_MAX: 500,
  WHATSAPP_LINK_MAX: 200,
  NOTIFICATION_MSG_MAX: 240,
  FEEDBACK_COMMENTS_MAX: 500,
  MAX_AVATAR_BYTES: 2 * 1024 * 1024, // 2MB
} as const;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export interface CampusVenuePreset {
  name: string;
  distanceKm: number;
  sports: SportType[];
}

export const DGU_VENUE_PRESETS: CampusVenuePreset[] = [
  { name: 'DGU Main Sports Turf', distanceKm: 0.1, sports: ['Football', 'Cricket'] },
  { name: 'DGU Basketball Half-Court', distanceKm: 0.2, sports: ['Basketball'] },
  { name: 'DGU Indoor Badminton Hall', distanceKm: 0.2, sports: ['Badminton'] },
  { name: 'DGU Volleyball Sand Court', distanceKm: 0.3, sports: ['Volleyball'] },
  { name: 'DGU Student Recreation TT Room', distanceKm: 0.1, sports: ['Table Tennis'] },
  { name: 'Manduwala Turf & Box Cricket Ground', distanceKm: 2.4, sports: ['Cricket', 'Football'] },
  { name: 'Selaqui Athletic & Badminton Arena', distanceKm: 4.8, sports: ['Badminton', 'Basketball', 'Table Tennis'] },
  { name: 'Premnagar Sports Complex', distanceKm: 6.5, sports: ['Cricket', 'Football', 'Volleyball'] },
  { name: 'Rajpur Road Indoor Court', distanceKm: 9.2, sports: ['Badminton', 'Table Tennis', 'Basketball'] },
];

/**
 * Strips HTML tags and control characters and trims/truncates to schema maxLength.
 */
export function sanitizeText(value: string, maxLength: number): string {
  return value
    .replace(/<[^>]*>?/gm, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

export function sanitizeUrl(value: string, maxLength: number): string {
  const cleaned = sanitizeText(value, maxLength);
  if (!cleaned) return '';
  if (cleaned.startsWith('https://') || cleaned.startsWith('http://')) {
    return cleaned;
  }
  return '';
}

export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return 'Please upload a JPEG, PNG, or WebP image file.';
  }
  if (file.size > BLUEPRINT_LIMITS.MAX_AVATAR_BYTES) {
    return 'Image file size must be strictly under 2 MB.';
  }
  return null;
}

export function generateSafeDocId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function formatMatchDateTime(isoDateTime: string): {
  dateLabel: string;
  timeLabel: string;
  isPast: boolean;
} {
  const parsed = new Date(isoDateTime);
  if (Number.isNaN(parsed.getTime())) {
    return { dateLabel: isoDateTime, timeLabel: '', isPast: false };
  }
  const now = new Date();
  const dateLabel = parsed.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const timeLabel = parsed.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return {
    dateLabel,
    timeLabel,
    isPast: parsed.getTime() < now.getTime(),
  };
}

export function inferTimeWindowFromDateTime(isoDateTime: string): TimeWindow {
  const parsed = new Date(isoDateTime);
  if (Number.isNaN(parsed.getTime())) return 'Evenings';
  const day = parsed.getDay();
  const hour = parsed.getHours();
  if (day === 0 || day === 6) return 'Weekends';
  if (hour < 10) return 'Mornings';
  if (hour >= 10 && hour < 16) return 'Free Periods';
  return 'Evenings';
}

export function validateEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isDguEmail(email: string): boolean {
  const lower = email.trim().toLowerCase();
  return lower.endsWith('@dgu.ac.in') || lower.endsWith('@dbsuniversity.ac.in');
}

export function getSkillTextTone(level: SkillLevel): string {
  switch (level) {
    case 'Beginner':
      return 'text-sky-700 dark:text-sky-400';
    case 'Intermediate':
      return 'text-emerald-700 dark:text-emerald-400';
    case 'Competitive':
      return 'text-amber-700 dark:text-amber-400';
  }
}

export function getDefaultDateTimeInput(): string {
  const d = new Date(Date.now() + 3 * 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
}
