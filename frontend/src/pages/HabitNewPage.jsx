import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import { api } from '../api/client.js';

const EMOJI_OPTIONS = [
  '🌱', '📖', '💧', '🏃', '🧘', '✍️', '🍎', '💤', '🧠', '🎯', '🧹', '🚶', '💪', '☕', '🎵'
];

const COLOR_OPTIONS = [
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#F59E0B', // Amber
  '#F43F5E', // Rose
  '#0EA5E9', // Sky
  '#8B5CF6', // Violet
  '#14B8A6', // Teal
  '#F97316', // Orange
];

export default function HabitNewPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [anchorCue, setAnchorCue] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🌱');
  const [color, setColor] = useState('#10B981');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await api.habits.create({
        title: title.trim(),
        anchor_cue: anchorCue.trim() || null,
        description: description.trim() || null,
        emoji,
        color,
      });
      navigate('/today');
    } catch (err) {
      if (err.code === 'HABIT_LIMIT_REACHED') {
        setError('Maksimal 10 kebiasaan aktif tercapai. Arsipkan salah satu terlebih dahulu.');
      } else if (err.details && err.details.length > 0) {
        setError(err.details.map((d) => d.message).join(', '));
      } else {
        setError(err.message || 'Gagal membuat kebiasaan.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Kembali"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Buat Kebiasaan Mikro
          </h1>
          <p className="text-xs text-slate-600">Mulai dari langkah terkecil yang mustahil untuk gagal</p>
        </div>
      </div>

      {/* Educational Tip Box */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start space-x-3 text-amber-900 text-xs">
        <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Tips Atomic Habits: Jadikan Sangat Mudah</p>
          <p className="text-amber-800 leading-relaxed">
            Alih-alih "Olahraga 1 jam", tulis <strong>"Push-up 3 kali"</strong> atau <strong>"Peregangan 2 menit"</strong>.
            Konsistensi aksi kecil jauh lebih bernilai daripada intensitas sesaat.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Emoji & Color Selection */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700">Pilih Ikon & Warna</label>
          <div className="flex items-center space-x-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0"
              style={{ backgroundColor: `${color}20` }}
            >
              {emoji}
            </div>

            {/* Colors */}
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Pilih warna ${c}`}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-110 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Emoji row */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                type="button"
                aria-label={`Pilih ikon ${e}`}
                onClick={() => setEmoji(e)}
                className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                  emoji === e ? 'bg-slate-200 scale-105 shadow-xs' : 'hover:bg-slate-100'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="new-habit-title" className="block text-xs font-semibold text-slate-700 mb-1">
            Aksi Mikro (Wajib)
          </label>
          <input
            id="new-habit-title"
            type="text"
            required
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Buat sekecil mungkin: contoh: Baca 1 halaman buku"
            className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800"
          />
          <p className="text-[11px] text-slate-600 font-medium mt-1">1–80 karakter</p>
        </div>

        {/* Anchor Cue */}
        <div>
          <label htmlFor="new-habit-anchor" className="block text-xs font-semibold text-slate-700 mb-1">
            Pemicu Rutin / Anchor Cue (Opsional)
          </label>
          <input
            id="new-habit-anchor"
            type="text"
            maxLength={120}
            value={anchorCue}
            onChange={(e) => setAnchorCue(e.target.value)}
            placeholder='Contoh: "Setelah menyikat gigi malam" atau "Setelah menyeduh kopi pagi"'
            className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800"
          />
          <p className="text-[11px] text-slate-600 font-medium mt-1">
            Kaitkan dengan rutinitas yang sudah Anda lakukan setiap hari.
          </p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="new-habit-desc" className="block text-xs font-semibold text-slate-700 mb-1">
            Catatan Tambahan (Opsional)
          </label>
          <textarea
            id="new-habit-desc"
            rows={2}
            maxLength={200}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contoh: Mengembangkan wawasan tanpa merasa terbebani."
            className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-slate-800"
          />
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-emerald-700/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Menyimpan...' : 'Simpan Kebiasaan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
