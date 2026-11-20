export type SportType =
  | 'Cricket'
  | 'Football'
  | 'Badminton'
  | 'Basketball'
  | 'Volleyball'
  | 'Table Tennis';

export const SPORTS_LIST: readonly SportType[] = [
  'Cricket',
  'Football',
  'Badminton',
  'Basketball',
  'Volleyball',
  'Table Tennis',
] as const;

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Competitive';

export const SKILL_LEVELS: readonly SkillLevel[] = [
  'Beginner',
  'Intermediate',
  'Competitive',
] as const;

export type TimeWindow = 'Mornings' | 'Free Periods' | 'Evenings' | 'Weekends';

export const TIME_WINDOWS: readonly TimeWindow[] = [
  'Mornings',
  'Free Periods',
  'Evenings',
  'Weekends',
] as const;

export type AvailabilityWindow =
  | 'Mornings'
  | 'Free Periods'
  | 'Evenings'
  | 'Weekends'
  | 'Flexible';

export const AVAILABILITY_OPTIONS: readonly AvailabilityWindow[] = [
  'Mornings',
  'Free Periods',
  'Evenings',
  'Weekends',
  'Flexible',
] as const;

export type GameStatus = 'open' | 'full' | 'completed' | 'cancelled';

export type UserRole = 'student' | 'admin';
export type AccountStatus = 'active' | 'deactivated';

export type NotificationType =
  | 'game_join'
  | 'game_leave'
  | 'game_cancel'
  | 'game_invite'
  | 'system';

export interface UserPreferences {
  notifications: boolean;
  theme: 'light' | 'dark';
}

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  photoURL: string;
  role: UserRole;
  status: AccountStatus;
  university: string;
  preferredSports: SportType[];
  skillLevel: SkillLevel;
  bio: string;
  availability: AvailabilityWindow;
  gamesPlayedCount: number;
  gamesHostedCount: number;
  preferences: UserPreferences;
  createdAt: unknown;
  lastLoginAt: unknown;
}

export interface PublicPlayerProfile {
  uid: string;
  fullName: string;
  photoURL: string;
  status: AccountStatus;
  university: string;
  preferredSports: SportType[];
  skillLevel: SkillLevel;
  bio: string;
  availability: AvailabilityWindow;
  gamesPlayedCount: number;
  gamesHostedCount: number;
  updatedAt: unknown;
}

export interface GameMatch {
  gameId: string;
  hostId: string;
  hostName: string;
  hostPhoto: string;
  sport: SportType;
  title: string;
  location: string;
  campusDistanceKm: number;
  dateTime: string;
  timeWindow: TimeWindow;
  durationMinutes: number;
  maxPlayers: number;
  currentPlayersCount: number;
  playerIds: string[];
  skillLevel: SkillLevel;
  status: GameStatus;
  convenienceFeeNote: string;
  notes: string;
  whatsappLink: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface AppNotification {
  notificationId: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  type: NotificationType;
  message: string;
  gameId: string;
  gameTitle: string;
  isRead: boolean;
  createdAt: unknown;
}

export interface PilotFeedback {
  feedbackId: string;
  userId: string;
  userName: string;
  gameId: string;
  savedTimeOverWhatsapp: boolean;
  rating: number;
  wouldUseAgain: boolean;
  willingToPay40INR: boolean;
  comments: string;
  createdAt: unknown;
}

export interface GameFilterState {
  sport: SportType | 'All';
  skillLevel: SkillLevel | 'All';
  timeWindow: TimeWindow | 'All';
  onlyOpenSlots: boolean;
  searchQuery: string;
}

export interface PlayerFilterState {
  sport: SportType | 'All';
  skillLevel: SkillLevel | 'All';
  availability: AvailabilityWindow | 'All';
  searchQuery: string;
}

export interface CreateGameInput {
  sport: SportType;
  title: string;
  location: string;
  campusDistanceKm: number;
  dateTime: string;
  timeWindow: TimeWindow;
  durationMinutes: number;
  maxPlayers: number;
  skillLevel: SkillLevel;
  convenienceFeeNote: string;
  notes: string;
  whatsappLink: string;
}
