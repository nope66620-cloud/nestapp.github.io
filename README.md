# Nest — prototipe UI/UX

Prototipe fungsional aplikasi keuangan rumah tangga. Satu berkas UI untuk HP, tablet, dan web. Vanilla HTML/CSS/JS. Tanpa build, tanpa dependency, tanpa server.

Nama dan aturan mainnya mengikuti blueprint sesi `session-fbe0a75d` dan [03-roadmap-publish.md](../03-roadmap-publish.md).

## Buka

```
prototype/index.html
```

Klik dua kali. Jalan dari `file://`.

Layar kunci: tekan **4 angka apa saja** (prototipe, tidak ada validasi).

## Satu UI, tiga ukuran

Ukuran tidak ditentukan media query besar-kecil, tapi `clamp()`: padding, jarak, dan huruf naik turun sendiri. Tidak ada lompatan tata letak di antara ambang.

| Lebar | Tata letak |
|---|---|
| < 780px | HP. Bingkai penuh, tab bar bawah, tombol tambah di tengah, form naik dari bawah, satu kolom |
| 780–1080px | Tablet. Bingkai dilepas, isi selebar layar maks 1000px, dua kolom, tab bar masih di bawah |
| > 1080px | Web. Sidebar kiri 252px, isi maks 1180px, dua kolom, tab bar hilang, form jadi dialog tengah |

Verifikasi: [checks/responsive.html](checks/responsive.html) menguji 7 lebar × 5 layar, [checks/geometry.html](checks/geometry.html) mengukur kotak elemen.

Hasil terakhir: 0 overflow horizontal, 0 teks terpotong, 0 dokumen melebar, di 360 / 390 / 430 / 768 / 900 / 1280 / 1440 px.

## Yang bisa dicoba

| Aksi | Hasil |
|---|---|
| Tombol **+** atau "Catat transaksi" di sidebar | Form: jenis, nominal, kategori, rekening, catatan |
| Keypad atau angka di keyboard | Nominal berubah, tombol simpan aktif |
| Keluar / Masuk / Pindah | Kategori ikut berganti; Pindah minta dua rekening |
| **Simpan** | Transaksi masuk, saldo rekening bergerak, dashboard dihitung ulang |
| Segmen **Bulan ini / Siklus gajian** | Periode, angka besar, dan daftar ikut berubah |
| Tab Laporan | Per kategori, per rekening, arus kas, pembanding bulan lalu, tombol Excel/PDF |
| Tab Kekayaan | Net worth, grafik, aset, utang, target, pelacak harga emas |
| Tab Atur → **Coba role** | Ganti ke Istri (admin) atau Anak (lihat saja) |

## Role, sesuai blueprint

| Role | Bisa |
|---|---|
| `owner` (Suami) | Semua: transaksi, laporan, kekayaan, atur, ganti role |
| `admin` (Istri) | Sama, kecuali ganti role |
| `anak` | Hanya Beranda dan Transaksi miliknya sendiri. Tanpa anggaran, tanpa tagihan, tanpa tombol catat |

Coba langsung: [index.html?skip=1&role=anak](index.html?skip=1&role=anak).

## Angka dari blueprint

Gajian tanggal 25 → periode 25 Okt–24 Nov. Rekening: Tunai, Bank Utama, E-Wallet, Tabungan Emas, Dana Darurat. 9 kategori keluar, 3 masuk. Peringatan anggaran 80% (kuning) dan 100% (merah). Pindah dana tidak dihitung pemasukan atau pengeluaran.

## Nama & desain

**Nest** — sarang. Bonus makna: *nest egg* = dana simpanan. Tagline "Sarang keuangan keluarga", sesuai header yang sudah dipasang di aplikasi Apps Script.

Palet kertas + tinta: `#faf6ef` kertas, `#1c1a16` tinta, hijau lumut `#3f6b4c` (sarang), emas tua `#7d5c15` (telur), tanah liat `#a54d34`. Tanpa gradien ungu, tanpa glassmorphism.

Kontras teks (WCAG AA, teks normal butuh 4,5:1):

| Pasangan | Rasio |
|---|---|
| tinta / kertas | 16,1:1 |
| tinta-2 / kertas | 9,4:1 |
| muted / kertas | 5,2:1 |
| hijau / kertas | 5,7:1 |
| tanah liat / kertas | 5,3:1 |
| emas / krem | 5,3:1 |

Ukuran teks terkecil 10px, hanya untuk label pendek seperti nama bulan di kartu tagihan.

## Animasi

Angka besar menghitung naik, bar anggaran mengisi, layar masuk bertahap 42ms per blok, form naik dengan easing `cubic-bezier(.16,1,.3,1)`, segmen punya indikator geser, tombol mengecil saat ditekan. Semua berhenti otomatis kalau `prefers-reduced-motion: reduce`.

## File

```
prototype/
  index.html   bingkai: sidebar, isi, tab bar, tombol tambah, form, toast
  style.css    desain + skala cair + tiga tata letak
  data.js      data dummy (41 transaksi, 5 rekening, 12 kategori)
  app.js       render, hitung periode, hak akses, form, animasi
  checks/      halaman uji tata letak dan interaksi
  screens/     tangkapan layar HP, tablet, web
```

## Catatan teknis

- Semua angka dihitung dari `DATA.transactions`. Tambah lewat form, dashboard ikut berubah.
- Tanggal dibentuk dari komponen lokal, bukan `toISOString()`. Di WIB, `toISOString()` menggeser tanggal lokal 00:00 ke hari sebelumnya.
- Semua teks dari pengguna di-escape sebelum masuk `innerHTML`. Catatan berisi `<` tidak merusak tampilan (blocker #4 blueprint).
- Uang selalu integer rupiah.
- Parameter: `?skip=1` lewati kunci, `?screen=laporan` buka layar, `?sheet=1` buka form, `?role=anak` coba batasan.

## Belum ada

- Backend. Data hilang saat halaman dimuat ulang.
- Edit dan hapus transaksi.
- Grafik garis net worth sungguhan (sekarang batang).
- Mode gelap.
- Rekonsiliasi saldo dan transaksi berulang.

## Status permission Windows

Diagnosa permission dijalankan pada `D:\Project AI\Rumahtangga`: hasil `NOT_THIS_CLASS`. Kedua hak yang dibutuhkan tersedia, tidak ada entri paket asing, 1.458 objek dipindai, 0 perubahan. Laporan: `D:\Project AI\acl-recovery\acl-report-b3bccb71c049488882b75acfda29b1ff.jsonl`.
