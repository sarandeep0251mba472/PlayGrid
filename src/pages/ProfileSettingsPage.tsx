import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Camera, KeyRound, Trash2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Avatar } from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { uploadUserAvatar } from '../services/storageService';
import {
  AVAILABILITY_OPTIONS,
  AvailabilityWindow,
  SKILL_LEVELS,
  SPORTS_LIST,
  SkillLevel,
  SportType,
} from '../types';
import { mapFirebaseError } from '../utils/errorMapper';

export function ProfileSettingsPage() {
  const {
    firebaseUser,
    userProfile,
    isEmailVerified,
    updateUserProfile,
    changeUserPassword,
    deleteAccount,
  } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('DBS Global University');
  const [bio, setBio] = useState('');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('Intermediate');
  const [availability, setAvailability] = useState<AvailabilityWindow>('Evenings');
  const [preferredSports, setPreferredSports] = useState<SportType[]>(['Cricket']);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete account modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!userProfile) return;
    setFullName(userProfile.fullName);
    setUniversity(userProfile.university);
    setBio(userProfile.bio);
    setSkillLevel(userProfile.skillLevel);
    setAvailability(userProfile.availability);
    setPreferredSports(userProfile.preferredSports);
    setNotifEnabled(userProfile.preferences?.notifications ?? true);
  }, [userProfile]);

  const usesPasswordProvider = Boolean(
    firebaseUser?.providerData.some((p) => p.providerId === 'password')
  );

  const toggleSport = (sport: SportType) => {
    setPreferredSports((prev) => {
      if (prev.includes(sport)) {
        return prev.length > 1 ? prev.filter((s) => s !== sport) : prev;
      }
      return [...prev, sport];
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser) return;
    if (!isEmailVerified) {
      showToast('Verify email first', 'error', 'Verify your email before uploading a profile photo.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const url = await uploadUserAvatar(firebaseUser.uid, file);
      await updateUserProfile({ photoURL: url });
      showToast('Avatar updated', 'success');
    } catch (err) {
      showToast('Avatar upload failed', 'error', mapFirebaseError(err));
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateUserProfile({
        fullName,
        university,
        bio,
        skillLevel,
        availability,
        preferredSports,
        preferences: {
          notifications: notifEnabled,
          theme,
        },
      });
      showToast('Profile saved', 'success', 'Your DGU athlete profile is up to date.');
    } catch (err) {
      showToast('Could not save profile', 'error', mapFirebaseError(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleThemeSwitch = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    toggleTheme();
    if (userProfile) {
      try {
        await updateUserProfile({
          preferences: {
            notifications: notifEnabled,
            theme: nextTheme,
          },
        });
      } catch {
        // Theme still toggles locally
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast('Weak password', 'error', 'New password must be at least 8 characters.');
      return;
    }
    setSavingPassword(true);
    try {
      await changeUserPassword(currentPassword, newPassword);
      showToast('Password updated', 'success');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      showToast('Password update failed', 'error', mapFirebaseError(err));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleting(true);
    try {
      await deleteAccount(deletePassword || undefined);
      showToast('Account deleted', 'info', 'Your PlayGrid account and profile have been removed.');
      navigate('/', { replace: true });
    } catch (err) {
      showToast('Account deletion failed', 'error', mapFirebaseError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell title="Profile & Settings">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Avatar & Identity Card */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar
                src={userProfile?.photoURL || firebaseUser?.photoURL || ''}
                name={userProfile?.fullName || 'Student'}
                size="lg"
              />
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {userProfile?.fullName}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {userProfile?.email} · Role: {userProfile?.role === 'admin' ? 'Admin' : 'Student'}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                  Email verification: {isEmailVerified ? 'Verified' : 'Pending verification'}
                </p>
              </div>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0">
              <Camera className="h-4 w-4" />
              <span>{uploadingAvatar ? 'Uploading...' : 'Upload Photo (< 2MB)'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploadingAvatar}
                onChange={(e) => void handleAvatarChange(e)}
                className="sr-only"
              />
            </label>
          </div>
        </section>

        {/* Profile Form */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Athlete Profile &amp; Preferences
          </h3>

          <form onSubmit={(e) => void handleSaveProfile(e)} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="prof-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <input
                  id="prof-name"
                  type="text"
                  required
                  maxLength={80}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <div>
                <label htmlFor="prof-uni" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  University / Campus
                </label>
                <input
                  id="prof-uni"
                  type="text"
                  required
                  maxLength={100}
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="prof-skill" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Skill Level
                </label>
                <select
                  id="prof-skill"
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                >
                  {SKILL_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="prof-avail" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Typical Play Availability
                </label>
                <select
                  id="prof-avail"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value as AvailabilityWindow)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                >
                  {AVAILABILITY_OPTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Preferred Sports
              </span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SPORTS_LIST.map((sport) => {
                  const selected = preferredSports.includes(sport);
                  return (
                    <button
                      key={sport}
                      type="button"
                      onClick={() => toggleSport(sport)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        selected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300'
                      }`}
                    >
                      {sport}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="prof-bio" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Bio &amp; Preferred Positions
              </label>
              <textarea
                id="prof-bio"
                rows={3}
                maxLength={280}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g., MBA 1st Year, play right wing in football and doubles badminton after 5 PM."
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={notifEnabled}
                  onChange={(e) => setNotifEnabled(e.target.checked)}
                  className="h-4 w-4 accent-emerald-600"
                />
                Enable in-app match invites &amp; roster notifications
              </label>

              <button
                type="button"
                onClick={() => void handleThemeSwitch()}
                className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Theme: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'} (Switch)
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </section>

        {/* Password Change */}
        {usesPasswordProvider && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <KeyRound className="h-4 w-4 text-slate-400" />
              Change Password
            </h3>

            <form onSubmit={(e) => void handleChangePassword(e)} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="cur-pass" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Current Password
                </label>
                <input
                  id="cur-pass"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <div>
                <label htmlFor="new-pass" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  New Password (min 8 chars)
                </label>
                <input
                  id="new-pass"
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="rounded-lg border border-slate-300 bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-100 dark:text-slate-900"
                >
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Danger Zone: Account Deletion */}
        <section className="rounded-xl border border-red-200 bg-white p-6 dark:border-red-900/60 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-red-700 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />
                Delete Account
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Permanently remove your PlayGrid profile, athlete directory card, and authentication record.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300 whitespace-nowrap shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete My Account
            </button>
          </div>
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-red-700 dark:text-red-400">
              Confirm Account Deletion
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              This permanently deletes your Firestore profile and Firebase Auth account. This action cannot be undone.
            </p>

            <form onSubmit={(e) => void handleDeleteAccount(e)} className="mt-5 space-y-4">
              {usesPasswordProvider ? (
                <div>
                  <label htmlFor="del-pass" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Re-enter your password to confirm
                  </label>
                  <input
                    id="del-pass"
                    type="password"
                    required
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Clicking confirm will prompt Google re-authentication before deleting your account.
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleting}
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {deleting ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
