import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, LogOut, Check, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';

const TIMEZONE_OPTIONS = [
  { value: 'Asia/Jakarta', label: 'WIB — Asia/Jakarta (GMT+7)' },
  { value: 'Asia/Makassar', label: 'WITA — Asia/Makassar (GMT+8)' },
  { value: 'Asia/Jayapura', label: 'WIT — Asia/Jayapura (GMT+9)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+8)' },
  { value: 'UTC', label: 'UTC (GMT+0)' },
];

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Jakarta');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const res = await api.auth.updateMe({
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        timezone,
      });
      updateUser(res.data.user);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Gagal menyimpan perubahan.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Pengaturan Profil</h1>
        <p className="text-xs text-slate-600 font-medium mt-0.5">
          Kelola identitas dan preferensi zona waktu harianmu
        </p>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Profil berhasil diperbarui!</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Read-only account info */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
          <div>
            <p className="text-slate-600">Username & Email</p>
            <p className="font-bold text-slate-800 mt-0.5">@{user?.username}</p>
            <p className="text-slate-600 text-[11px]">{user?.email}</p>
          </div>
          <span className="px-2.5 py-1 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold">
            Tetap
          </span>
        </div>

        {/* Display Name */}
        <div>
          <label htmlFor="settings-display-name" className="block text-xs font-semibold text-slate-700 mb-1">
            Nama Tampilan
          </label>
          <input
            id="settings-display-name"
            name="display_name"
            type="text"
            required
            maxLength={50}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800"
          />
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="settings-bio" className="block text-xs font-semibold text-slate-700 mb-1">
            Bio (Maksimal 160 Karakter)
          </label>
          <textarea
            id="settings-bio"
            name="bio"
            rows={3}
            maxLength={160}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tuliskan tujuan atau moto kecilmu..."
            className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-slate-800"
          />
          <p className="text-[11px] text-slate-600 mt-1">{bio.length} / 160 karakter</p>
        </div>

        {/* Timezone */}
        <div>
          <label htmlFor="settings-timezone" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-slate-600" />
            <span>Zona Waktu (Menentukan pergantian "Hari Ini")</span>
          </label>
          <select
            id="settings-timezone"
            name="timezone"
            aria-label="Zona Waktu"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-600 mt-1">
            Streak harian dan penanda check-in dihitung berdasarkan zona waktu ini.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center space-x-2 w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-emerald-700/20 active:scale-[0.98] transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </form>

      {/* Logout Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Sesi Akun</h2>
          <p className="text-xs text-slate-600">Keluar dari akun di perangkat ini</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
}
