import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame, Calendar } from 'lucide-react';
import { api } from '../api/client.js';

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      const res = await api.users.getProfile(username);
      setProfileData(res.data);

      const postsRes = await api.posts.list({ username, limit: 10 });
      setUserPosts(postsRes.data.posts || []);
    } catch (err) {
      setError(err.message || 'Pengguna tidak ditemukan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-40 bg-white rounded-3xl"></div>
        <div className="h-28 bg-white rounded-3xl"></div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
        <p className="text-rose-600 font-semibold text-sm">{error || 'Pengguna tidak ditemukan'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
        >
          Kembali
        </button>
      </div>
    );
  }

  const { user, habits } = profileData;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold text-slate-800">Profil Pengguna</span>
      </div>

      {/* User Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            {user.display_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 leading-tight">
              {user.display_name}
            </h1>
            <p className="text-xs text-slate-400 font-medium">@{user.username}</p>
            {user.bio ? (
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{user.bio}</p>
            ) : (
              <p className="text-xs text-slate-400 italic mt-1">Belum menulis bio.</p>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Bergabung {new Date(user.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
          </span>
          <span className="flex items-center gap-1">
            <span>Zona Waktu:</span>
            <span className="font-semibold text-slate-700">{user.timezone}</span>
          </span>
        </div>
      </div>

      {/* Active Habits Section */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-800">
          Kebiasaan Aktif ({habits.length})
        </h2>
        {habits.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center text-xs text-slate-400 border border-slate-200">
            Belum ada kebiasaan aktif yang ditampilkan.
          </div>
        ) : (
          <div className="space-y-2.5">
            {habits.map((habit) => (
              <div
                key={habit.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: `${habit.color}20` }}
                  >
                    {habit.emoji}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">{habit.title}</h3>
                    {habit.anchor_cue && (
                      <p className="text-[10px] text-slate-400">⚓ {habit.anchor_cue}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                  <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{habit.streak?.current_streak || 0} hari</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shared Wins Feed */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-800">
          Kemenangan & Refleksi Terbaru
        </h2>
        {userPosts.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center text-xs text-slate-400 border border-slate-200">
            Belum ada postingan komunitas.
          </div>
        ) : (
          <div className="space-y-3">
            {userPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      post.post_type === 'daily_win'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-indigo-50 text-indigo-700'
                    }`}
                  >
                    {post.post_type === 'daily_win' ? '🎉 Daily Win' : '💭 Refleksi'}
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    {new Date(post.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed">{post.body}</p>
                <div className="flex items-center space-x-3 text-[11px] text-slate-500 pt-1">
                  <span>🎉 {post.reaction_count} reaksi</span>
                  <span>💬 {post.comment_count} komentar</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
