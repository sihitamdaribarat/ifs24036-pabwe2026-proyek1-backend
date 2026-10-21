# LangkahKecil — Micro-Habit Tracker & Community Accountability

Aplikasi web modern pencatat kebiasaan mikro (*micro-habit*) yang berpijak pada prinsip **Atomic Habits**: perubahan besar lahir dari aksi yang sangat kecil tetapi dilakukan konsisten setiap hari.

Dilengkapi dengan habit tracker harian yang ringan (check-in 1-ketukan < 3 detik), perhitungan streak transparan dengan algoritma *Gaps-and-Islands*, serta feed komunitas yang hangat dan suportif tanpa kompetisi berlebihan.

---

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: SQLite (WAL mode, foreign keys enforced, busy timeout 5000ms)
- **Keamanan**: JWT Access Token (15 menit) + Refresh Token (7 hari, httpOnly cookie), bcryptjs (cost 12), Helmet, CORS, Rate Limiting
- **Frontend**: React 19 + Vite + Tailwind CSS + Lucide Icons + Canvas-Confetti
- **Arsitektur**: Monolitik modular (Backend REST API di `/api/v1` dan Frontend SPA tersaji pada satu port)

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Prasyarat
- Pastikan **Node.js** (v18+ / v20+ / v24+) dan **npm** sudah terinstal.

### 2. Menjalankan Server Utama (Backend + Frontend)
Di folder proyek (`pabwe_revisi`):

```bash
# Masuk ke folder backend
cd backend

# Jalankan server
node src/server.js
```

Buka peramban dan akses:
👉 **[http://localhost:4000](http://localhost:4000)**

### 3. Menjalankan Frontend dalam Mode Pengembangan (Dev Server Vite)
Jika Anda ingin mengembangkan antarmuka dengan hot-module-replacement (HMR):

```bash
# Terminal 1: Jalankan backend
cd backend
npm run dev

# Terminal 2: Jalankan frontend
cd frontend
npm run dev
```
Akses Vite dev server di:
👉 **[http://localhost:5173](http://localhost:5173)** (otomatis mem-proxy panggilan `/api` ke backend di port 4000).

---

## 📋 Fitur yang Tersedia (Sesuai PRD.md)

| ID | Fitur | Status | Keterangan |
|---|---|---|---|
| **F-01** | Autentikasi | ✅ Selesai | Registrasi, Login, Refresh token rotation, Logout, cookie httpOnly, proteksi brute force rate limiter. |
| **F-02** | Manajemen Profil | ✅ Selesai | Ubah display_name, bio (maks. 160 kar), zona waktu IANA (WIB, WITA, WIT, dll). |
| **F-03** | Habit Tracker | ✅ Selesai | CRUD kebiasaan mikro, anchor cue ("Setelah saya..."), emoji picker, color picker, batas 10 kebiasaan aktif, arsip & pulihkan. |
| **F-04** | Check-in Harian & Dashboard Hari Ini | ✅ Selesai | 1-ketukan (area sentuh ≥ 44px), progress bar "X dari Y selesai", pencegahan duplikat check-in per hari, backdate H-1, pembatalan log, perayaan confetti. |
| **F-05** | Streak Counter | ✅ Selesai | Algoritma *Gaps-and-Islands*, `current_streak` dan `longest_streak` dihitung di server berdasarkan zona waktu pengguna. |
| **F-06** | Feed Komunitas | ✅ Selesai | Composer postingan (Daily Win 🎉 / Refleksi 💭), penautan kebiasaan dengan lencana streak snapshot, cursor pagination, filter feed. |
| **F-07** | Komentar & Reaksi (Cheer) | ✅ Selesai | Reaksi 🎉 Cheer, 👏 Clap, 🔥 Fire (maksimal satu reaksi per pengguna, upsert otomatis), komentar kronologis, hak hapus komentar untuk pemilik. |

---

## 🧪 Pengujian Otomatis

Untuk menjalankan suite integration test API:

```bash
cd backend
node tests/api_test.js
```

10 dari 10 skenario pengujian mencakup:
1. Registrasi akun
2. Profil `GET /users/me`
3. Pembuatan kebiasaan `POST /habits`
4. Dashboard hari ini `GET /dashboard/today`
5. Check-in kebiasaan `POST /habits/:id/logs`
6. Penolakan duplikat log (409 Conflict)
7. Pembuatan postingan dengan snapshot streak `POST /posts`
8. Pemberian reaksi `PUT /posts/:id/reaction`
9. Pemberian komentar `POST /posts/:id/comments`
10. Validasi feed dengan cursor pagination `GET /posts`
