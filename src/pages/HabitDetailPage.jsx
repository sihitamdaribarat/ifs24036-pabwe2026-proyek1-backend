import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Flame,
  Award,
  Calendar,
  CheckCircle2,
  Edit2,
  Archive,
  Save,
} from 'lucide-react';
import { api } from '../api/client.js';

export default function HabitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [habit, setHabit] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editAnchor, setEditAnchor] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editEmoji, setEditEmoji] = useState('🌱');
  const [editColor, setEditColor] = useState('#10B981');
  const [saving, setSaving] = useState(false);

  // Backdate check-in state
  const [backdateNote, setBackdateNote] = useState('');
  const [submittingLog, setSubmittingLog] = useState(false);

  const fetchDetail = async () => {
    try {
      const habitRes = await api.habits.get(id);
      setHabit(habitRes.data.habit);
      setEditTitle(habitRes.data.habit.title);
      setEditAnchor(habitRes.data.habit.anchor_cue || '');
      setEditDesc(habitRes.data.habit.description || '');
      setEditEmoji(habitRes.data.habit.emoji || '🌱');
      setEditColor(habitRes.data.habit.color || '#10B981');

      const logsRes = await api.logs.list(id);
      setLogs(logsRes.data.logs || []);
    } catch (err) {
      setError(err.message || 'Gagal memuat detail kebiasaan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.habits.update(id, {
        title: editTitle.trim(),
        anchor_cue: editAnchor.trim() || null,
        description: editDesc.trim() || null,
        emoji: editEmoji,
        color: editColor,
      });
      setHabit(res.data.habit);
      setIsEditing(false);
    } catch (err) {
      alert(err.message || 'Gagal memperbarui kebiasaan.');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Arsipkan kebiasaan ini? Riwayat log tetap tersimpan.')) return;
    try {
      await api.habits.archive(id);
      navigate('/habits');
    } catch (err) {
      alert(err.message || 'Gagal mengarsipkan kebiasaan.');
    }
  };

  // Generate 30 days grid
  const getDaysGrid = () => {
    const days = [];
    const loggedDates = new Set(logs.map((l) => l.log_date));
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        dateStr,
        dayNum: d.getDate(),
        month: d.toLocaleDateString('id-ID', { month: 'short' }),
        isLogged: loggedDates.has(dateStr),
        isToday: i === 0,
        isYesterday: i === 1,
      });
    }
    return days;
  };

  const handleBackdateCheckin = async (targetDate) => {
    setSubmittingLog(true);
    try {
      await api.logs.create(id, {
        log_date: targetDate,
        note: backdateNote.trim() || null,
      });
      setBackdateNote('');
      fetchDetail();
    } catch (err) {
      alert(err.message || 'Gagal mencatat log.');
    } finally {
      setSubmittingLog(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-white rounded-xl"></div>
        <div className="h-40 bg-white rounded-3xl"></div>
      </div>
    );
  }

  if (error || !habit) {
    return (
      <div className="p-6 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
        <p className="text-rose-600 font-medium text-sm">{error || 'Kebiasaan tidak ditemukan'}</p>
        <button
          onClick={() => navigate('/habits')}
          className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800"
        >
          Kembali ke Daftar Kebiasaan
        </button>
      </div>
    );
  }

  const daysGrid = getDaysGrid();
  const yesterday = daysGrid.find((d) => d.isYesterday);

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/habits')}
          aria-label="Kembali ke daftar kebiasaan"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Batal' : 'Edit'}</span>
          </button>
          {!habit.archived_at && (
            <button
              onClick={handleArchive}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Arsipkan</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Habit Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        {isEditing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label htmlFor="edit-habit-title" className="block text-xs font-semibold text-slate-700 mb-1">Aksi Mikro</label>
              <input
                id="edit-habit-title"
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              />
            </div>
            <div>
              <label htmlFor="edit-habit-anchor" className="block text-xs font-semibold text-slate-700 mb-1">Anchor Cue</label>
              <input
                id="edit-habit-anchor"
                type="text"
                value={editAnchor}
                onChange={(e) => setEditAnchor(e.target.value)}
                placeholder="Setelah saya..."
                className="w-full text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              />
            </div>
            <div>
              <label htmlFor="edit-habit-desc" className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi</label>
              <textarea
                id="edit-habit-desc"
                rows={2}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-slate-800"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-1 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-start space-x-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{ backgroundColor: `${habit.color}20` }}
            >
              {habit.emoji}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{habit.title}</h1>
              {habit.anchor_cue && (
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                  <span>⚓ Pemicu:</span>
                  <span className="text-slate-700">{habit.anchor_cue}</span>
                </p>
              )}
              {habit.description && (
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {habit.description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/60">
            <div className="flex items-center space-x-1.5 text-amber-800 text-xs font-bold mb-1">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>Streak Saat Ini</span>
            </div>
            <div className="text-2xl font-black text-amber-900">
              {habit.streak?.current_streak || 0} <span className="text-xs font-semibold">hari</span>
            </div>
          </div>

          <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200/60">
            <div className="flex items-center space-x-1.5 text-indigo-800 text-xs font-bold mb-1">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>Streak Terpanjang</span>
            </div>
            <div className="text-2xl font-black text-indigo-900">
              {habit.streak?.longest_streak || 0} <span className="text-xs font-semibold">hari</span>
            </div>
          </div>
        </div>
      </div>

      {/* 30-Day Consistency Grid */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-800">Riwayat 30 Hari Terakhir</h2>
          </div>
          <span className="text-xs text-slate-400">{logs.length} kali selesai</span>
        </div>

        {/* Visual Dots */}
        <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
          {daysGrid.map((d) => (
            <div
              key={d.dateStr}
              title={`${d.dateStr}: ${d.isLogged ? 'Selesai' : 'Kosong'}`}
              className={`h-11 rounded-xl flex flex-col items-center justify-center border text-[10px] transition-transform hover:scale-105 ${
                d.isLogged
                  ? 'bg-emerald-500 text-white border-emerald-600 font-bold'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              } ${d.isToday ? 'ring-2 ring-emerald-500 ring-offset-1' : ''}`}
            >
              <span>{d.dayNum}</span>
              <span className="text-[9px] opacity-75">{d.month}</span>
            </div>
          ))}
        </div>

        {/* Backdate Check-in for Yesterday (H-1) */}
        {yesterday && !yesterday.isLogged && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Kemarin Belum Sempat Dicatat?</p>
                <p className="text-[11px] text-slate-500">
                  LangkahKecil memperbolehkan back-date untuk kemarin ({yesterday.dateStr}).
                </p>
              </div>
              <button
                onClick={() => handleBackdateCheckin(yesterday.dateStr)}
                disabled={submittingLog}
                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{submittingLog ? 'Menyimpan...' : 'Catat Kemarin'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logs Table / List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-800">Catatan Check-in</h2>
        {logs.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">Belum ada catatan log.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800">{log.log_date}</span>
                  {log.note && <p className="text-slate-500 text-[11px] mt-0.5">{log.note}</p>}
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                  Selesai ✓
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
