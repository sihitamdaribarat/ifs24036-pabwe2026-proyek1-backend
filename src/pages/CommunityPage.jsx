import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  MessageCircle,
  Trash2,
  Flame,
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function CommunityPage() {
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'daily_win' | 'reflection'

  // Composer state
  const [body, setBody] = useState('');
  const [postType, setPostType] = useState('daily_win');
  const [selectedHabitId, setSelectedHabitId] = useState('');
  const [userHabits, setUserHabits] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [composerError, setComposerError] = useState(null);

  // Active expanded comments map { [postId]: { list: [], open: boolean, input: '', loading: boolean } }
  const [commentsState, setCommentsState] = useState({});

  const fetchUserHabits = async () => {
    try {
      const res = await api.habits.list('active');
      setUserHabits(res.data.habits || []);
    } catch (e) {
      // ignore
    }
  };

  const fetchPosts = async (reset = false, nextCursor = null) => {
    if (reset) setLoading(true);

    const params = { limit: 15 };
    if (filterType !== 'all') params.post_type = filterType;
    if (nextCursor) params.cursor = nextCursor;

    try {
      const res = await api.posts.list(params);
      const newPosts = res.data.posts || [];
      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
      setCursor(res.meta?.next_cursor || null);
      setHasMore(res.meta?.has_more || false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserHabits();
  }, []);

  useEffect(() => {
    fetchPosts(true);
  }, [filterType]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;

    setSubmitting(true);
    setComposerError(null);

    try {
      const res = await api.posts.create({
        body: body.trim(),
        post_type: postType,
        habit_id: selectedHabitId ? parseInt(selectedHabitId, 10) : null,
      });

      setPosts((prev) => [res.data.post, ...prev]);
      setBody('');
      setSelectedHabitId('');
    } catch (err) {
      setComposerError(err.message || 'Gagal membagikan postingan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReaction = async (postId, type) => {
    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const wasCurrent = p.my_reaction === type;
        const newReaction = wasCurrent ? null : type;
        let newCount = p.reaction_count;
        if (wasCurrent) newCount = Math.max(0, newCount - 1);
        else if (!p.my_reaction) newCount += 1;

        return {
          ...p,
          my_reaction: newReaction,
          reaction_count: newCount,
        };
      })
    );

    try {
      const post = posts.find((p) => p.id === postId);
      if (post?.my_reaction === type) {
        await api.posts.reaction.remove(postId);
      } else {
        await api.posts.reaction.set(postId, type);
      }
    } catch (err) {
      // Revert if error
      fetchPosts(true);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Hapus postingan ini?')) return;
    try {
      await api.posts.delete(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      alert(err.message || 'Gagal menghapus postingan.');
    }
  };

  // Comments handlers
  const toggleComments = async (postId) => {
    const current = commentsState[postId] || { open: false, list: [], input: '' };

    if (!current.open) {
      // Fetch comments
      setCommentsState((prev) => ({
        ...prev,
        [postId]: { ...current, open: true, loading: true },
      }));

      try {
        const res = await api.posts.comments.list(postId);
        setCommentsState((prev) => ({
          ...prev,
          [postId]: {
            ...current,
            open: true,
            loading: false,
            list: res.data.comments || [],
          },
        }));
      } catch (err) {
        setCommentsState((prev) => ({
          ...prev,
          [postId]: { ...current, open: true, loading: false },
        }));
      }
    } else {
      setCommentsState((prev) => ({
        ...prev,
        [postId]: { ...current, open: false },
      }));
    }
  };

  const handleAddComment = async (postId, e) => {
    e.preventDefault();
    const current = commentsState[postId];
    if (!current || !current.input.trim()) return;

    try {
      const res = await api.posts.comments.create(postId, { body: current.input.trim() });
      setCommentsState((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          input: '',
          list: [...(prev[postId]?.list || []), res.data.comment],
        },
      }));

      // Update comment count on post
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p))
      );
    } catch (err) {
      alert(err.message || 'Gagal menambahkan komentar.');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Hapus komentar?')) return;
    try {
      await api.posts.comments.delete(commentId);
      setCommentsState((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          list: prev[postId]?.list.filter((c) => c.id !== commentId) || [],
        },
      }));
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comment_count: Math.max(0, p.comment_count - 1) } : p))
      );
    } catch (err) {
      alert(err.message || 'Gagal menghapus komentar.');
    }
  };

  const formatRelativeTime = (isoString) => {
    try {
      const now = new Date();
      const past = new Date(isoString);
      const diffSec = Math.floor((now - past) / 1000);

      if (diffSec < 60) return 'baru saja';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} mnt lalu`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour} jam lalu`;
      const diffDay = Math.floor(diffHour / 24);
      return `${diffDay} hr lalu`;
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Komunitas LangkahKecil</h1>
        <p className="text-xs text-slate-600 font-medium mt-0.5">
          Saling menyemangati, merayakan aksi mikro, dan menjaga komitmen
        </p>
      </div>

      {/* Composer Card */}
      <form onSubmit={handleCreatePost} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        {composerError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {composerError}
          </div>
        )}

        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
            {user?.display_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="text-xs font-semibold text-slate-700">
            {user?.display_name} — Bagikan Kemenangan atau Refleksimu
          </span>
        </div>

        <textarea
          rows={3}
          maxLength={500}
          value={body}
          aria-label="Ceritakan aksi kecilmu hari ini"
          onChange={(e) => setBody(e.target.value)}
          placeholder="Ceritakan aksi kecilmu hari ini, apa yang berhasil kamu lakukan?"
          className="w-full text-sm p-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-slate-800"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Post Type Buttons */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPostType('daily_win')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  postType === 'daily_win'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                🎉 Daily Win
              </button>
              <button
                type="button"
                onClick={() => setPostType('reflection')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  postType === 'reflection'
                    ? 'bg-white text-indigo-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                💭 Refleksi
              </button>
            </div>

            {/* Habit selector */}
            {userHabits.length > 0 && (
              <select
                id="select-post-habit"
                aria-label="Kaitkan kebiasaan (opsional)"
                value={selectedHabitId}
                onChange={(e) => setSelectedHabitId(e.target.value)}
                className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
              >
                <option value="">Kaitkan kebiasaan (opsional)</option>
                {userHabits.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.emoji} {h.title} (🔥 {h.streak?.current_streak || 0})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center space-x-3 ml-auto">
            <span className="text-[11px] text-slate-600 font-medium">{body.length}/500</span>
            <button
              type="submit"
              disabled={submitting || !body.trim()}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-emerald-700/20 transition-all active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Mengirim...' : 'Kirim'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button type="button"
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filterType === 'all'
              ? 'bg-slate-800 text-white'
              : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          Semua
        </button>
        <button type="button"
          onClick={() => setFilterType('daily_win')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filterType === 'daily_win'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          🎉 Daily Wins
        </button>
        <button type="button"
          onClick={() => setFilterType('reflection')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filterType === 'reflection'
              ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
              : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          💭 Refleksi
        </button>
      </div>

      {/* Posts Feed */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-white rounded-3xl border border-slate-200"></div>
          <div className="h-32 bg-white rounded-3xl border border-slate-200"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-600 text-xs">
          Belum ada postingan di kategori ini. Jadilah yang pertama berbagi!
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isAuthor = post.author?.id === user?.id;
            const commentsInfo = commentsState[post.id] || { open: false, list: [], input: '' };

            return (
              <div
                key={post.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3.5 transition-all"
              >
                {/* Author row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Link
                      to={`/u/${post.author?.username}`}
                      className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity"
                    >
                      {post.author?.display_name?.charAt(0).toUpperCase()}
                    </Link>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/u/${post.author?.username}`}
                          className="text-xs font-bold text-slate-800 hover:text-emerald-700"
                        >
                          {post.author?.display_name}
                        </Link>
                        <span className="text-[11px] text-slate-600">
                          @{post.author?.username}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600">
                        {formatRelativeTime(post.created_at)}
                        {post.is_edited && ' · diedit'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        post.post_type === 'daily_win'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {post.post_type === 'daily_win' ? '🎉 Daily Win' : '💭 Refleksi'}
                    </span>
                    {isAuthor && (
                      <button type="button"
                        onClick={() => handleDeletePost(post.id)}
                        title="Hapus postingan"
                        aria-label="Hapus postingan"
                        className="p-1 text-slate-600 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Habit tag if present */}
                {post.habit && (
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span>{post.habit.emoji}</span>
                    <span className="font-semibold text-slate-800">{post.habit.title}</span>
                    {post.streak_snapshot !== null && (
                      <span className="text-amber-700 font-bold flex items-center gap-0.5">
                        <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{post.streak_snapshot} hari</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Body */}
                <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {post.body}
                </p>

                {/* Reactions & Comments Row */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  {/* Reaction buttons */}
                  <div className="flex items-center space-x-1.5">
                    <button type="button"
                      onClick={() => handleReaction(post.id, 'cheer')}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        post.my_reaction === 'cheer'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300 scale-105'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span>🎉</span>
                      <span>Cheer</span>
                    </button>

                    <button type="button"
                      onClick={() => handleReaction(post.id, 'clap')}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        post.my_reaction === 'clap'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300 scale-105'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span>👏</span>
                      <span>Clap</span>
                    </button>

                    <button type="button"
                      onClick={() => handleReaction(post.id, 'fire')}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        post.my_reaction === 'fire'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300 scale-105'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span>🔥</span>
                      <span>Fire</span>
                    </button>

                    {post.reaction_count > 0 && (
                      <span className="text-[11px] font-bold text-slate-600 ml-1.5">
                        {post.reaction_count} reaksi
                      </span>
                    )}
                  </div>

                  {/* Comment Toggle */}
                  <button type="button"
                    onClick={() => toggleComments(post.id)}
                    aria-label={`Lihat ${post.comment_count} komentar`}
                    className="flex items-center space-x-1.5 text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="font-semibold">{post.comment_count}</span>
                  </button>
                </div>

                {/* Collapsible Comments Section */}
                {commentsInfo.open && (
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    {commentsInfo.loading ? (
                      <p className="text-xs text-slate-600">Memuat komentar...</p>
                    ) : (
                      <>
                        {/* List */}
                        <div className="space-y-2">
                          {commentsInfo.list.length === 0 ? (
                            <p className="text-[11px] text-slate-600">Belum ada komentar. Beri semangat pertama!</p>
                          ) : (
                            commentsInfo.list.map((c) => {
                              const canDelete = c.author?.id === user?.id || isAuthor;
                              return (
                                <div
                                  key={c.id}
                                  className="flex items-start justify-between bg-slate-50 p-2.5 rounded-xl text-xs"
                                >
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <Link
                                        to={`/u/${c.author?.username}`}
                                        className="font-bold text-slate-800 hover:text-emerald-700"
                                      >
                                        {c.author?.display_name}
                                      </Link>
                                      <span className="text-[10px] text-slate-600">
                                        {formatRelativeTime(c.created_at)}
                                      </span>
                                    </div>
                                    <p className="text-slate-700 mt-0.5">{c.body}</p>
                                  </div>
                                  {canDelete && (
                                    <button type="button"
                                      onClick={() => handleDeleteComment(post.id, c.id)}
                                      title="Hapus komentar"
                                      aria-label="Hapus komentar"
                                      className="text-slate-600 hover:text-rose-600 p-1"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Add comment input */}
                        <form
                          onSubmit={(e) => handleAddComment(post.id, e)}
                          className="flex items-center space-x-2 pt-1"
                        >
                          <input
                            type="text"
                            maxLength={300}
                            aria-label="Tulis pesan penyemangat"
                            placeholder="Tulis pesan penyemangat..."
                            value={commentsInfo.input || ''}
                            onChange={(e) =>
                              setCommentsState((prev) => ({
                                ...prev,
                                [post.id]: { ...prev[post.id], input: e.target.value },
                              }))
                            }
                            className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <button
                            type="submit"
                            disabled={!commentsInfo.input?.trim()}
                            className="px-3 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 disabled:opacity-50"
                          >
                            Kirim
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-2">
              <button type="button"
                onClick={() => fetchPosts(false, cursor)}
                className="px-5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
              >
                Muat Lebih Banyak
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
