# Repbook — Gym Tracker

Web gym tracker ringan, responsif, tanpa build dan tanpa database eksternal. Bisa dihosting gratis di GitHub Pages.

## Fitur

- Dashboard volume, durasi, jumlah sesi dan target mingguan.
- Program Push / Pull / Legs dan latihan bebas dengan nama gerakan custom.
- Catat beban (kg), repetisi dan set selesai; timer sesi otomatis.
- Sesi berjalan tetap tersimpan saat halaman ditutup atau dimuat ulang.
- Riwayat dengan pencarian, rincian sesi dan penghapusan dengan konfirmasi.
- Grafik volume 7/30 hari dan personal records per gerakan.
- Ekspor / impor backup `.json`, validasi format dan konfirmasi sebelum mengganti data.
- Tampilan desktop dan mobile, tanpa akun atau API key.

## Menjalankan lokal

Butuh Node.js 22 atau lebih baru. Tidak perlu `npm install`.

```sh
npm start
```

Buka http://127.0.0.1:4173. Gunakan server ini, jangan buka `index.html` lewat `file://` karena aplikasi memakai JavaScript modules.

```sh
npm run check
npm test
```

## Deploy ke GitHub Pages

1. Buat repository GitHub lalu upload isi folder ini, termasuk `.github/workflows/deploy.yml`, ke branch `main`.
2. Buka repository → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Jalankan workflow **Deploy GitHub Pages** di tab Actions (atau push perubahan ke `main`).
4. Setelah workflow berhasil, URL tampil di Settings → Pages dan deployment Actions.

Semua asset memakai relative path sehingga bisa dipakai di project Pages (`username.github.io/nama-repo/`) maupun domain sendiri. Workflow hanya mengunggah file web, tanpa server pengembangan dan file test.

## Penyimpanan JSON

Data diserialisasikan menjadi JSON di `localStorage`, key `repbook.v1`. Tombol **Kelola backup** menyediakan file JSON portabel. Aplikasi **tidak** menulis langsung ke file di repository: GitHub Pages hanya menyajikan file statis. Data terpisah per browser/perangkat/origin dan tidak otomatis tersinkron. Ekspor JSON secara berkala, terutama sebelum membersihkan data browser atau berpindah alamat web. Mode privat bisa menghapus data saat jendela ditutup.

Backup menyimpan semua sesi, sesi aktif, dan target mingguan. Impor mengganti seluruh data setelah konfirmasi; ekspor data lama dulu bila diperlukan. Contoh format kosong:

```json
{
  "version": 1,
  "sessions": [],
  "active": null,
  "weeklyGoal": 4
}
```

Volume = jumlah (beban × repetisi) dari set yang dicentang. Gerakan bodyweight bisa dicatat dengan 0 kg; volume beban tambahan untuk gerakan itu menjadi 0. Sesi dihitung berdasarkan tanggal lokal saat dimulai. Timer menghitung waktu berlalu sejak memulai, termasuk saat tab ditutup. Tidak ada saran medis atau program latihan personal yang dihasilkan aplikasi.

Font Google Fonts bersifat opsional dan punya fallback bawaan. Catatan latihan tidak dikirim ke server mana pun.
