import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Check,
  Flame,
  PlusCircle,
  Sparkles,
  RotateCcw,
  Clock,
  ArrowRight,
  Smile,
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import ShareWinModal from '../components/ShareWinModal.jsx';

export default function TodayPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ date: '', progress: { total: 0, completed: 0, percentage: 0 }, habits: [] });
  const [error, setError] = useState(null);
  const [selectedHabitForShare, setSelectedHabitForShare] = useState(null);
  const [shareStreak, setShareStreak] = useState(1);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [checkingId, setCheckingId] = useState(null);

  const fetchDashboard = async () => {
    try {
      const res = await api.habits.today();
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Gagal memuat dashboard hari ini.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCheckIn = async (habit) => {
    setCheckingId(habit.id);
    const wasCompleted = habit.completed_today;

    try {
      if (wasCompleted) {
        // Undo check-in
        const res = await api.logs.delete(habit.id, data.date);
        setData((prev) => {
          const newHabits = prev.habits.map((h) =>
            h.id === habit.id
              ? { ...h, completed_today: false, streak: res.data.streak }
              : h
          );
          const completedCount = newHabits.filter((h) => h.completed_today).length;
          return {
            ...prev,
            habits: newHabits,
            progress: {
              ...prev.progress,
              completed: completedCount,
              percentage: prev.progress.total > 0 ? Math.round((completedCount / prev.progress.total) * 100) : 0,
            },
          };
        });
      } else {
        // Perform check-in
        const res = await api.logs.create(habit.id);
        const newStreak = res.data.streak;

        // Confetti burst for micro-celebration!
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10B981', '#34D399', '#6366F1', '#F59E0B'],
        });

        setData((prev) => {
          const newHabits = prev.habits.map((h) =>
            h.id === habit.id
              ? { ...h, completed_today: true, streak: newStreak }
              : h
          );
          const completedCount = newHabits.filter((h) => h.completed_today).length;
          return {
            ...prev,
            habits: newHabits,
            progress: {
              ...prev.progress,
              completed: completedCount,
              percentage: prev.progress.total > 0 ? Math.round((completedCount / prev.progress.total) * 100) : 0,
            },
          };
        });

        // Prompt user to share win to community!
        setSelectedHabitForShare(habit);
        setShareStreak(newStreak.current_streak);
        setIsShareModalOpen(true);
      }
    } catch (err) {
      alert(err.message || 'Gagal mengubah status check-in.');
    } finally {
      setCheckingId(null);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  };

  const formatIndonesianDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr + 'T12:00:00');
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-white rounded-3xl p-5 border border-slate-200/80"></div>
        <div className="h-32 bg-white rounded-3xl p-5 border border-slate-200/80"></div>
        <div className="space-y-3">
          <div className="h-20 bg-white rounded-2xl border border-slate-200/80"></div>
          <div className="h-20 bg-white rounded-2xl border border-slate-200/80"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {getGreeting()}, {user?.display_name || 'Kawan'} 👋
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          {formatIndonesianDate(data.date)}
        </p>
      </div>

      {/* Daily Progress Card */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-6 shadow-xl shadow-emerald-700/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-white/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </span>
            <div>
              <h2 className="text-base font-bold">Progres Hari Ini</h2>
              <p className="text-xs text-emerald-100">
                {data.progress.total > 0
                  ? `${data.progress.completed} dari ${data.progress.total} kebiasaan selesai`
                  : 'Belum ada kebiasaan aktif'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black">{data.progress.percentage}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden p-0.5 backdrop-blur-xs">
          <div
            className="h-full bg-white rounded-full transition-all duration-500 ease-out shadow-xs"
            style={{ width: `${data.progress.percentage}%` }}
          ></div>
        </div>

        <p className="text-xs text-emerald-100 mt-3 font-medium">
          {data.progress.percentage === 100 && data.progress.total > 0
            ? '🎉 Luar biasa! Semua langkah kecil hari ini tuntas.'
            : data.progress.completed > 0
            ? '💪 Bagus sekali, teruskan momentum aksimu!'
            : '🌱 Mulai dari satu aksi terkecil hari ini.'}
        </p>
      </div>

      {/* Habits List */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base font-bold text-slate-800">Kebiasaan Hari Ini</h2>
          <span className="text-xs text-slate-500 font-medium">
            Ketuk untuk menyelesaikan
          </span>
        </div>

        {data.habits.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-xs space-y-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-2xl">
              🌱
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Belum Ada Kebiasaan</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                Buat kebiasaan pertamamu. Mulai sekecil mungkin agar mudah konsisten setiap hari!
              </p>
            </div>
            <button
              onClick={() => navigate('/habits/new')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Kebiasaan Pertama</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {data.habits.map((habit) => {
              const isDone = habit.completed_today;
              const isChecking = checkingId === habit.id;

              return (
                <div
                  key={habit.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${
                    isDone
                      ? 'bg-emerald-50/70 border-emerald-200/80 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:border-emerald-300 shadow-xs'
                  }`}
                >
                  {/* Left Habit Info */}
                  <div
                    onClick={() => navigate(`/habits/${habit.id}`)}
                    className="flex items-center space-x-3.5 flex-1 min-w-0 mr-3 cursor-pointer group"
                  >
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-105"
                      style={{ backgroundColor: `${habit.color}18` }}
                    >
                      {habit.emoji}
                    </div>
                    <div className="truncate">
                      <h4
                        className={`text-sm font-bold truncate transition-colors ${
                          isDone ? 'text-emerald-950 line-through opacity-75' : 'text-slate-800'
                        }`}
                      >
                        {habit.title}
                      </h4>
                      {habit.anchor_cue ? (
                        <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                          <span>⚓</span>
                          <span>{habit.anchor_cue}</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400">Ketuk untuk lihat detail</p>
                      )}
                    </div>
                  </div>

                  {/* Right Streak & Check Button */}
                  <div className="flex items-center space-x-3 shrink-0">
                    {/* Streak badge */}
                    <div className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                      <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{habit.streak?.current_streak || 0}</span>
                    </div>

                    {/* Check-in Button (Touch target >= 44x44px as required by PRD 6.4 & 7.4) */}
                    <button
                      onClick={() => handleCheckIn(habit)}
                      disabled={isChecking}
                      title={isDone ? 'Batalkan check-in' : 'Centang selesai'}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${
                        isDone
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/50'
                          : 'bg-slate-100 hover:bg-emerald-100 text-slate-400 hover:text-emerald-600 border border-slate-200'
                      }`}
                    >
                      {isChecking ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Check className={`w-5 h-5 ${isDone ? 'stroke-[3]' : 'stroke-[2]'}`} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Share Win Modal Prompt */}
      <ShareWinModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        habit={selectedHabitForShare}
        streak={shareStreak}
        onPostCreated={() => {
          navigate('/community');
        }}
      />
    </div>
  );
}
