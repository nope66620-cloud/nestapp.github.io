/* ==========================================================================
   Nest — data dummy
   Mengikuti blueprint: gajian tanggal 25, 3 role (owner/admin/anak),
   rekening Tunai / Bank Utama / E-Wallet, 9 kategori keluar, 3 masuk.
   Semua angka dashboard dihitung dari daftar transaksi di bawah.
   ========================================================================== */

const DATA = {
  app: {
    name: "Nest",
    tagline: "Sarang keuangan keluarga",
    month: "Okt 2026",
  },

  /* role aktif bisa diganti di layar Atur, untuk mencoba batasan hak akses */
  role: "owner",

  today: "2026-10-28",

  settings: {
    payday: 25,
    currency: "IDR",
    timezone: "Asia/Jakarta",
    namaKeluarga: "Keluarga Putra",
  },

  members: [
    { id: "m1", nama: "Suami", initial: "S", role: "owner", note: "Lihat semua, kelola semua" },
    { id: "m2", nama: "Istri", initial: "I", role: "admin", note: "Lihat semua, kelola transaksi" },
    { id: "m3", nama: "Anak", initial: "A", role: "anak", note: "Dashboard + transaksi sendiri" },
  ],

  /* ------------------------------------------------------------ accounts -- */
  accounts: [
    { id: "bank", nama: "Bank Utama", tipe: "bank", saldo: 17845000, likuid: true },
    { id: "ewallet", nama: "E-Wallet", tipe: "ewallet", saldo: 1245000, likuid: true },
    { id: "tunai", nama: "Tunai", tipe: "cash", saldo: 620000, likuid: true },
    { id: "emas", nama: "Tabungan Emas", tipe: "simpanan", saldo: 24600000, likuid: false },
    { id: "darurat", nama: "Dana Darurat", tipe: "simpanan", saldo: 9500000, likuid: false },
  ],

  /* ---------------------------------------------------------- categories -- */
  categories: [
    { id: "kebutuhan", nama: "Kebutuhan Rumah", emoji: "🏠", kind: "keluar" },
    { id: "harian", nama: "Belanja Harian", emoji: "🧺", kind: "keluar" },
    { id: "transport", nama: "Transport", emoji: "🛵", kind: "keluar" },
    { id: "utilitas", nama: "Listrik & Air", emoji: "💡", kind: "keluar" },
    { id: "pendidikan", nama: "Pendidikan", emoji: "🎒", kind: "keluar" },
    { id: "kesehatan", nama: "Kesehatan", emoji: "🩺", kind: "keluar" },
    { id: "cicilan", nama: "Cicilan & Utang", emoji: "🏦", kind: "keluar" },
    { id: "jajan", nama: "Jajan & Hiburan", emoji: "☕", kind: "keluar" },
    { id: "lain", nama: "Lain-lain", emoji: "•", kind: "keluar" },
    { id: "gaji", nama: "Gaji", emoji: "💰", kind: "masuk" },
    { id: "bonus", nama: "Bonus & THR", emoji: "🎁", kind: "masuk" },
    { id: "lainmasuk", nama: "Pemasukan Lain", emoji: "🧾", kind: "masuk" },
  ],

  /* -------------------------------------------------------------- budget -- */
  budget: [
    { cat: "kebutuhan", nominal: 1500000 },
    { cat: "harian", nominal: 1500000 },
    { cat: "transport", nominal: 900000 },
    { cat: "utilitas", nominal: 700000 },
    { cat: "pendidikan", nominal: 1200000 },
    { cat: "kesehatan", nominal: 300000 },
    { cat: "cicilan", nominal: 500000 },
    { cat: "jajan", nominal: 400000 },
  ],

  /* -------------------------------------------------------- transactions -- */
  /* jenis: masuk | keluar | pindah. akun: id rekening. ke: rekening tujuan. */
  transactions: [
    { id: "t01", date: "2026-10-01", jenis: "keluar", nominal: 120000, cat: "transport", akun: "tunai", anggota: "Suami", note: "Bensin motor" },
    { id: "t02", date: "2026-10-01", jenis: "masuk", nominal: 1750000, cat: "lainmasuk", akun: "bank", anggota: "Suami", note: "Desain logo UMKM" },
    { id: "t03", date: "2026-10-02", jenis: "keluar", nominal: 285000, cat: "harian", akun: "bank", anggota: "Istri", note: "Belanja bulanan pasar" },
    { id: "t04", date: "2026-10-03", jenis: "keluar", nominal: 212000, cat: "kebutuhan", akun: "bank", anggota: "Istri", note: "Indomaret" },
    { id: "t05", date: "2026-10-04", jenis: "keluar", nominal: 28000, cat: "jajan", akun: "ewallet", anggota: "Suami", note: "Kopi pagi" },
    { id: "t06", date: "2026-10-05", jenis: "keluar", nominal: 42000, cat: "harian", akun: "tunai", anggota: "Istri", note: "Sayur & lauk" },
    { id: "t07", date: "2026-10-05", jenis: "keluar", nominal: 1150000, cat: "pendidikan", akun: "bank", anggota: "Istri", note: "SPP Oktober" },
    { id: "t08", date: "2026-10-06", jenis: "keluar", nominal: 65000, cat: "transport", akun: "ewallet", anggota: "Suami", note: "Parkir & tol" },
    { id: "t09", date: "2026-10-07", jenis: "keluar", nominal: 89000, cat: "harian", akun: "ewallet", anggota: "Istri", note: "Alfamart" },
    { id: "t10", date: "2026-10-07", jenis: "keluar", nominal: 275000, cat: "kebutuhan", akun: "tunai", anggota: "Suami", note: "Perbaikan kran dapur" },
    { id: "t11", date: "2026-10-08", jenis: "keluar", nominal: 156000, cat: "harian", akun: "bank", anggota: "Istri", note: "Beras 10 kg" },
    { id: "t12", date: "2026-10-08", jenis: "keluar", nominal: 45000, cat: "jajan", akun: "ewallet", anggota: "Suami", note: "Kopi & roti" },
    { id: "t13", date: "2026-10-09", jenis: "keluar", nominal: 250000, cat: "transport", akun: "bank", anggota: "Suami", note: "Servis motor" },
    { id: "t14", date: "2026-10-10", jenis: "keluar", nominal: 349000, cat: "utilitas", akun: "bank", anggota: "Istri", note: "IndiHome" },
    { id: "t15", date: "2026-10-11", jenis: "keluar", nominal: 38000, cat: "harian", akun: "tunai", anggota: "Istri", note: "Tempe, tahu, telur" },
    { id: "t16", date: "2026-10-12", jenis: "keluar", nominal: 145000, cat: "kebutuhan", akun: "bank", anggota: "Istri", note: "Sabun & deterjen" },
    { id: "t17", date: "2026-10-12", jenis: "keluar", nominal: 149000, cat: "jajan", akun: "bank", anggota: "Suami", note: "Langganan streaming" },
    { id: "t18", date: "2026-10-13", jenis: "keluar", nominal: 110000, cat: "transport", akun: "tunai", anggota: "Suami", note: "Bensin" },
    { id: "t19", date: "2026-10-14", jenis: "keluar", nominal: 320000, cat: "harian", akun: "bank", anggota: "Istri", note: "Belanja mingguan" },
    { id: "t20", date: "2026-10-15", jenis: "keluar", nominal: 486000, cat: "utilitas", akun: "bank", anggota: "Istri", note: "Token listrik" },
    { id: "t21", date: "2026-10-15", jenis: "keluar", nominal: 32000, cat: "jajan", akun: "tunai", anggota: "Anak", note: "Jajan sekolah" },
    { id: "t22", date: "2026-10-16", jenis: "keluar", nominal: 78000, cat: "lain", akun: "ewallet", anggota: "Suami", note: "Pulsa" },
    { id: "t23", date: "2026-10-17", jenis: "keluar", nominal: 45000, cat: "harian", akun: "ewallet", anggota: "Istri", note: "Ayam & bumbu" },
    { id: "t24", date: "2026-10-18", jenis: "keluar", nominal: 95000, cat: "transport", akun: "ewallet", anggota: "Suami", note: "Ojek online" },
    { id: "t25", date: "2026-10-19", jenis: "keluar", nominal: 178000, cat: "kebutuhan", akun: "bank", anggota: "Istri", note: "Perlengkapan mandi" },
    { id: "t26", date: "2026-10-20", jenis: "keluar", nominal: 298000, cat: "harian", akun: "bank", anggota: "Istri", note: "Belanja mingguan" },
    { id: "t27", date: "2026-10-21", jenis: "keluar", nominal: 132000, cat: "utilitas", akun: "bank", anggota: "Istri", note: "PDAM" },
    { id: "t28", date: "2026-10-22", jenis: "keluar", nominal: 130000, cat: "transport", akun: "tunai", anggota: "Suami", note: "Bensin" },
    { id: "t29", date: "2026-10-23", jenis: "keluar", nominal: 28000, cat: "jajan", akun: "ewallet", anggota: "Suami", note: "Kopi" },
    { id: "t30", date: "2026-10-23", jenis: "keluar", nominal: 62000, cat: "harian", akun: "ewallet", anggota: "Istri", note: "Buah & susu" },
    { id: "t31", date: "2026-10-24", jenis: "keluar", nominal: 96000, cat: "kebutuhan", akun: "ewallet", anggota: "Istri", note: "Snack & minuman" },
    { id: "t32", date: "2026-10-25", jenis: "masuk", nominal: 12500000, cat: "gaji", akun: "bank", anggota: "Suami", note: "Gaji Oktober" },
    { id: "t33", date: "2026-10-25", jenis: "masuk", nominal: 6800000, cat: "gaji", akun: "bank", anggota: "Istri", note: "Gaji Oktober" },
    { id: "t34", date: "2026-10-26", jenis: "keluar", nominal: 210000, cat: "harian", akun: "bank", anggota: "Istri", note: "Belanja mingguan" },
    { id: "t35", date: "2026-10-26", jenis: "keluar", nominal: 185000, cat: "kesehatan", akun: "bank", anggota: "Istri", note: "Vitamin & obat" },
    { id: "t36", date: "2026-10-26", jenis: "pindah", nominal: 2000000, cat: null, akun: "bank", ke: "emas", anggota: "Suami", note: "Setor tabungan emas" },
    { id: "t37", date: "2026-10-27", jenis: "keluar", nominal: 75000, cat: "transport", akun: "ewallet", anggota: "Suami", note: "Tol & parkir" },
    { id: "t38", date: "2026-10-27", jenis: "pindah", nominal: 1000000, cat: null, akun: "bank", ke: "darurat", anggota: "Suami", note: "Setor dana darurat" },
    { id: "t39", date: "2026-10-28", jenis: "keluar", nominal: 55000, cat: "jajan", akun: "ewallet", anggota: "Suami", note: "Makan siang" },
    { id: "t40", date: "2026-10-28", jenis: "keluar", nominal: 84000, cat: "harian", akun: "tunai", anggota: "Istri", note: "Ikan & sayur" },
    { id: "t41", date: "2026-10-28", jenis: "pindah", nominal: 300000, cat: null, akun: "bank", ke: "ewallet", anggota: "Suami", note: "Isi saldo E-Wallet" },
  ],

  /* --------------------------------------------------------------- bills -- */
  bills: [
    { nama: "Cicilan rumah", nominal: 4250000, date: "2026-11-05", akun: "bank", emoji: "🏠" },
    { nama: "Kartu kredit", nominal: 1850000, date: "2026-11-12", akun: "bank", emoji: "💳" },
    { nama: "Token listrik", nominal: 640000, date: "2026-11-20", akun: "bank", emoji: "💡" },
    { nama: "IndiHome", nominal: 349000, date: "2026-11-22", akun: "bank", emoji: "📶" },
    { nama: "SPP sekolah", nominal: 1200000, date: "2026-11-25", akun: "bank", emoji: "🎒" },
  ],

  /* --------------------------------------------------------------- goals -- */
  goals: [
    { nama: "Dana darurat", emoji: "🛟", now: 9500000, target: 30000000, perBulan: 1000000 },
    { nama: "Pendidikan anak", emoji: "🎓", now: 12400000, target: 50000000, perBulan: 1500000 },
    { nama: "Liburan keluarga", emoji: "🏝️", now: 4200000, target: 15000000, perBulan: 750000 },
  ],

  /* -------------------------------------------------------------- wealth -- */
  aset: [
    { nama: "Tanah di Bogor", nilai: 250000000, emoji: "🌱" },
    { nama: "Emas 12,4 gram", nilai: 24600000, emoji: "🥇" },
    { nama: "Tabungan & dana darurat", nilai: 9500000, emoji: "🛟" },
    { nama: "Saldo rekening", nilai: 19710000, emoji: "🏦" },
  ],

  utang: [
    { nama: "KPR rumah", nilai: 185000000, cicilan: 4250000, emoji: "🏠" },
    { nama: "Kartu kredit", nilai: 1850000, cicilan: 1850000, emoji: "💳" },
    { nama: "Pinjaman keluarga", nilai: 5000000, cicilan: 0, emoji: "🤝" },
  ],

  networthHistory: [98000000, 101200000, 104500000, 106900000, 109100000, 112355000],

  gold: { gram: 12.4, hargaPerGram: 1985000, beliPerGram: 1640000 },

  /* ------------------------------------------------------ periode & tren -- */
  prevPeriod: { label: "September 2026", masuk: 19400000, keluar: 7980000 },
};
