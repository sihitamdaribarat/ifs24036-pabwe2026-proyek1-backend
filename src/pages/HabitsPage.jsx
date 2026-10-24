import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Flame,
  PlusCircle,
  RotateCcw,
  ChevronRight,
  Award,
} from 'lucide-react';
import { api } from '../api/client.js';

export default function HabitsPage() {
  const navigate = useNavigate();

  const [status, setStatus] = useState('active'); // 'active' | 'archived'
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHabits = async () => {
    setLoading(true);
    try {
      const res = await api.habits.list(status);
      setHabits(res.data.habits || []);
    } catch (err) {
      setError(err.message || 'Gagal memuat daftar kebiasaan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, [status]);

  const handleRestore = async (id, e) => {
    e.stopPropagation();
    try {
      await api.habits.restore(id);
      fetchHabits();
    } catch (err) {
      alert(err.message || 'Gagal memulihkan kebiasaan.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Kebiasaan Saya</h1>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            Kelola dan pantau rangkaian konsistensimu
          </p>
        </div>

        {status === 'active' && (
          <button type="button"
            onClick={() => navigate('/habits/new')}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Filter Tabs & Limit Indicator */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex space-x-2">
          <button type="button"
            onClick={() => setStatus('active')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              status === 'active'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            Aktif
          </button>
          <button type="button"
            onClick={() => setStatus('archived')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              status === 'archived'
                ? 'bg-slate-200 text-slate-800'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            Diarsipkan
          </button>
        </div>

        {status === 'active' && (
          <div className="text-xs text-slate-600 font-medium">
            <span className="font-bold text-slate-700">{habits.length}</span> / 10 batas aktif
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-24 bg-white rounded-2xl border border-slate-200"></div>
          <div className="h-24 bg-white rounded-2xl border border-slate-200"></div>
        </div>
      ) : habits.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center mx-auto text-xl">
            {status === 'active' ? '🌱' : '📁'}
          </div>
          <h2 className="font-bold text-slate-800 text-sm">
            {status === 'active' ? 'Belum Ada Kebiasaan Aktif' : 'Tidak Ada Kebiasaan Arsip'}
          </h2>
          <p className="text-xs text-slate-600 max-w-xs mx-auto">
            {status === 'active'
              ? 'Mulai perjalananmu dengan membuat aksi mikro yang sangat ringan.'
              : 'Kebiasaan yang dinonaktifkan akan disimpan di sini.'}
          </p>
          {status === 'active' && (
            <button type="button"
              onClick={() => navigate('/habits/new')}
              className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-emerald-800 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Sekarang</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-emerald-300 hover:shadow-sm transition-all flex items-center justify-between group"
            >
              <Link
                to={`/habits/${habit.id}`}
                className="flex items-center space-x-3.5 flex-1 min-w-0 mr-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: `${habit.color}18` }}
                >
                  {habit.emoji}
                </div>
                <div className="truncate">
                  <h2 className="text-sm font-bold text-slate-800 truncate">{habit.title}</h2>
                  {habit.anchor_cue && (
                    <p className="text-[11px] text-slate-600 truncate flex items-center gap-1 mt-0.5">
                      <span>⚓</span>
                      <span>{habit.anchor_cue}</span>
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-slate-600 mt-1">
                    <span className="flex items-center gap-1 font-semibold text-amber-700">
                      <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{habit.streak?.current_streak || 0} hari aktif</span>
                    </span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <Award className="w-3 h-3 text-slate-600" />
                      <span>Rekor: {habit.streak?.longest_streak || 0} hari</span>
                    </span>
                  </div>
                </div>
              </Link>

              {/* Action buttons */}
              <div className="shrink-0 flex items-center space-x-2">
                {status === 'archived' ? (
                  <button type="button"
                    onClick={(e) => handleRestore(habit.id, e)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Pulihkan</span>
                  </button>
                ) : (
                  <ChevronRight aria-hidden="true" className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
