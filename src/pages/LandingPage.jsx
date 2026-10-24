import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Flame,
  CheckCircle2,
  Users,
  ArrowRight,
  Heart,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-white to-slate-50 text-slate-800 flex flex-col">
      {/* Top Navbar */}
      <header className="max-w-6xl w-full mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-emerald-100" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900">
            LangkahKecil
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {user ? (
            <Link
              to="/today"
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
            >
              <span>Buka Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
              >
                <span>Mulai Gratis</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 max-w-4xl mx-auto px-4 pt-12 pb-20 text-center flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-semibold mb-6 border border-emerald-200/60 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Berpijak pada Prinsip Atomic Habits</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-3xl mb-6">
          Perubahan besar lahir dari{' '}
          <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            aksi yang sangat kecil.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Jangan mulai dengan target yang membebani. Cukup baca 1 halaman, push-up 3 kali, atau minum 1 gelas air.
          Lacak setiap hari dalam 3 detik, rayakan kemajuan kecil, dan dapatkan dukungan hangat tanpa kompetisi berlebih.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto mb-16">
          <button
            onClick={() => navigate(user ? '/today' : '/register')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base shadow-xl shadow-emerald-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>{user ? 'Lanjutkan Hari Ini' : 'Mulai Langkah Pertama'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="#prinsip"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-base border border-slate-200 shadow-xs transition-colors"
          >
            Pelajari Filosofinya
          </a>
        </div>

        {/* Interactive Mockup Preview Card */}
        <div className="w-full max-w-lg bg-white rounded-3xl p-5 shadow-2xl border border-slate-200/80 text-left">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <p className="text-xs text-slate-600 font-medium">Hari Ini</p>
              <h2 className="text-base font-bold text-slate-800">Fokus Langkah Mikro</h2>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>3 dari 3 Selesai</span>
            </div>
          </div>

          <div className="space-y-3 py-4">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <div className="flex items-center space-x-3">
                <span className="text-xl">📖</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Baca 1 Halaman Buku</p>
                  <p className="text-[11px] text-slate-600">Setelah menyikat gigi malam</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-amber-700 flex items-center gap-0.5">
                  🔥 14 hari
                </span>
                <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs">
                  ✓
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center space-x-3">
                <span className="text-xl">💪</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Push-up 3 Kali</p>
                  <p className="text-[11px] text-slate-600">Setelah bangun tidur</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-amber-700 flex items-center gap-0.5">
                  🔥 7 hari
                </span>
                <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs">
                  ✓
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>18 orang baru saja memberi Cheer</span>
            </span>
            <span className="font-semibold text-slate-600">100% Bebas Iklan</span>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="prinsip" className="bg-white py-16 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
              Mengapa LangkahKecil Berhasil?
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Kebanyakan habit tracker terasa seperti pekerjaan rumah yang melelahkan. Kami merancang pengalaman yang sangat ringan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-800">Mikro by Design</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Panduan anchor cue "Setelah saya ... , saya akan ..." dan fokus pada batas maksimal 10 kebiasaan aktif agar tidak kewalahan.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-800">Streak yang Jujur & Ramah</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Streak dihitung transparan dari log harian dan tidak langsung hangus jika Anda belum sempat check-in di siang hari.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-800">Komunitas yang Suportif</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bukan kompetisi atau jumlah pengikut. Berbagi kemenangan kecil dengan Cheer 🎉, Clap 👏, dan Fire 🔥 untuk saling menjaga semangat.
              </p>
            </div>
          </div>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 text-center text-xs text-slate-600">
        <p>© 2026 LangkahKecil — Micro-Habit Tracker & Community Accountability</p>
      </footer>
    </div>
  );
}
