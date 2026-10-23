import React, { useState } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { api } from '../api/client.js';

export default function ShareWinModal({ isOpen, onClose, habit, streak, onPostCreated }) {
  const defaultText = habit
    ? `Hari ini berhasil ${habit.title.toLowerCase()}, streak sudah ${streak || 1} hari! 🎉`
    : 'Hari ini berhasil menyelesaikan kebiasaan kecilku! 🎉';

  const [body, setBody] = useState(defaultText);
  const [postType, setPostType] = useState('daily_win');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (isOpen) {
      setBody(defaultText);
      setPostType('daily_win');
      setError(null);
    }
  }, [isOpen, defaultText]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.posts.create({
        body: body.trim(),
        post_type: postType,
        habit_id: habit ? habit.id : null,
      });
      if (onPostCreated) onPostCreated(res.data.post);
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal membagikan postingan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-pop">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-white/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </span>
            <div>
              <h3 className="font-bold text-lg leading-tight">Bagikan Kemenangan Kecil</h3>
              <p className="text-xs text-emerald-100">Rayakan konsistensi bersama komunitas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              {error}
            </div>
          )}

          {habit && (
            <div className="flex items-center space-x-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <span className="text-base">{habit.emoji}</span>
              <span className="font-medium text-slate-800">{habit.title}</span>
              <span className="text-amber-600 font-semibold ml-auto flex items-center gap-1">
                🔥 {streak || 1} hari
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pesan untuk Komunitas
            </label>
            <textarea
              rows={4}
              maxLength={500}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-slate-800"
              placeholder="Ceritakan sedikit rasa syukur atau refleksi aksimu..."
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>{body.length} / 500 karakter</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600">Tipe:</label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setPostType('daily_win')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  postType === 'daily_win'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                🎉 Daily Win
              </button>
              <button
                type="button"
                onClick={() => setPostType('reflection')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  postType === 'reflection'
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                💭 Refleksi
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Nanti Saja
            </button>
            <button
              type="submit"
              disabled={submitting || !body.trim()}
              className="flex items-center space-x-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md shadow-emerald-500/20 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Mengirim...' : 'Bagikan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
