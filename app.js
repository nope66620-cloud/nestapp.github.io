/* ==========================================================================
   Nest — prototipe UI/UX
   Satu berkas untuk tiga ukuran layar:
     < 720px   HP     : tab bar bawah, sheet bawah, satu kolom
     720–1080  tablet : dua kolom, tab bar masih ada
     > 1080   web     : sidebar kiri, dua kolom, sheet jadi dialog tengah
   Semua angka dihitung dari DATA, bukan ditulis di HTML.
   ========================================================================== */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const nf = new Intl.NumberFormat("id-ID");
const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

/* Teks dari pengguna selalu di-escape: catatan berisi "<" tidak boleh
   merusak markup. Ini blocker #4 di blueprint. */
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const rp = (n) => (n < 0 ? "−Rp" : "Rp") + nf.format(Math.abs(Math.round(n)));

function rpShort(n) {
  const a = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (a >= 1e9) return sign + "Rp" + (a / 1e9).toFixed(1).replace(".", ",") + " M";
  if (a >= 1e6) return sign + "Rp" + (a / 1e6).toFixed(1).replace(".", ",") + " jt";
  if (a >= 1e3) return sign + "Rp" + Math.round(a / 1e3) + " rb";
  return sign + "Rp" + a;
}

const d = (iso) => new Date(iso + "T00:00:00");
/* Jangan pakai toISOString: di WIB (UTC+7) tanggal lokal 00:00 mundur sehari. */
const isoOf = (dt) =>
  `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;

const fmtDay = (iso) => `${d(iso).getDate()} ${BULAN[d(iso).getMonth()]}`;
const fmtDayLong = (iso) => {
  const dt = d(iso);
  return `${HARI[dt.getDay()]}, ${dt.getDate()} ${BULAN[dt.getMonth()]} ${dt.getFullYear()}`;
};

const dayDiff = (iso) => Math.round((d(iso).getTime() - d(DATA.today).getTime()) / 86400000);

/* ------------------------------------------------------------------ role -- */

const PERMS = {
  owner: { lihatSemua: true, tulis: true, kelolaUser: true, laporan: true, kekayaan: true, atur: true },
  admin: { lihatSemua: true, tulis: true, kelolaUser: false, laporan: true, kekayaan: true, atur: true },
  anak: { lihatSemua: false, tulis: false, kelolaUser: false, laporan: false, kekayaan: false, atur: false },
};

const perms = () => PERMS[DATA.role] || PERMS.anak;
const me = () => DATA.members.find((m) => m.role === DATA.role) || DATA.members[0];

const NAV = [
  ["beranda", "Beranda", "home"],
  ["transaksi", "Transaksi", "list"],
  ["laporan", "Laporan", "chart"],
  ["kekayaan", "Kekayaan", "vault"],
  ["atur", "Atur", "user"],
];

function allowedScreens() {
  const p = perms();
  return NAV.filter(([id]) => {
    if (id === "laporan") return p.laporan;
    if (id === "kekayaan") return p.kekayaan;
    if (id === "atur") return p.atur;
    return true;
  }).map(([id]) => id);
}

/* ---------------------------------------------------------------- state -- */

const state = {
  screen: "beranda",
  mode: "kalender",
  filter: "semua",
  q: "",
  sheet: null,
  draft: null,
};

const lastVals = new Map();

/* --------------------------------------------------------------- period -- */

function periodRange(mode) {
  const now = d(DATA.today);
  if (mode === "kalender") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: isoOf(start), end: isoOf(end), label: `Bulan ${BULAN[start.getMonth()]} ${start.getFullYear()}` };
  }
  const payday = DATA.settings.payday;
  let startMonth = now.getMonth();
  if (now.getDate() < payday) startMonth -= 1;
  const dim = new Date(now.getFullYear(), startMonth + 1, 0).getDate();
  const start = new Date(now.getFullYear(), startMonth, Math.min(payday, dim));
  const nextDim = new Date(start.getFullYear(), start.getMonth() + 2, 0).getDate();
  const nextStart = new Date(start.getFullYear(), start.getMonth() + 1, Math.min(payday, nextDim));
  const end = new Date(nextStart.getTime() - 86400000);
  return { start: isoOf(start), end: isoOf(end), label: `Siklus gajian ${BULAN[start.getMonth()]} ${start.getFullYear()}` };
}

/* -------------------------------------------------------------- compute -- */

function compute(mode = state.mode) {
  const range = periodRange(mode);
  let tx = DATA.transactions.filter((t) => t.date >= range.start && t.date <= range.end);

  if (!perms().lihatSemua) tx = tx.filter((t) => t.anggota === me().nama);

  let masuk = 0;
  let keluar = 0;
  const byCat = {};
  const byAkun = {};

  tx.forEach((t) => {
    if (t.jenis === "masuk") masuk += t.nominal;
    if (t.jenis === "keluar") {
      keluar += t.nominal;
      byCat[t.cat] = (byCat[t.cat] || 0) + t.nominal;
      byAkun[t.akun] = (byAkun[t.akun] || 0) - t.nominal;
    }
    /* Pindah dana menggeser saldo dua rekening, bukan pengeluaran. */
    if (t.jenis === "pindah") {
      byAkun[t.akun] = (byAkun[t.akun] || 0) - t.nominal;
      byAkun[t.ke] = (byAkun[t.ke] || 0) + t.nominal;
    }
  });

  const likuid = DATA.accounts.filter((a) => a.likuid).reduce((s, a) => s + a.saldo, 0);
  const komitmen = DATA.bills.reduce((s, b) => s + b.nominal, 0);
  const budgetTotal = DATA.budget.reduce((s, b) => s + b.nominal, 0);
  const budgetSpent = DATA.budget.reduce((s, b) => s + (byCat[b.cat] || 0), 0);

  return {
    range,
    tx,
    masuk,
    keluar,
    byCat,
    byAkun,
    likuid,
    komitmen,
    bebas: likuid - komitmen,
    budgetTotal,
    budgetSpent,
    networth: DATA.aset.reduce((s, a) => s + a.nilai, 0) - DATA.utang.reduce((s, u) => s + u.nilai, 0),
  };
}

const catOf = (id) => DATA.categories.find((c) => c.id === id) || { nama: "Lain-lain", emoji: "•" };
const akunOf = (id) => DATA.accounts.find((a) => a.id === id) || { nama: "Rekening" };

/* ------------------------------------------------------------ animation -- */

function animateNum(node, key, to, prefix = "Rp") {
  const from = lastVals.has(key) ? lastVals.get(key) : 0;
  lastVals.set(key, to);
  const dur = 820;
  const t0 = performance.now();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const paint = (v) => {
    node.textContent = (v < 0 ? "−" : "") + prefix + nf.format(Math.abs(Math.round(v)));
  };
  if (reduce || from === to) {
    paint(to);
    return;
  }
  let done = false;
  function frame(now) {
    if (done) return;
    /* p dikunci 0..1: kalau jam mundur atau frame telat, angka tidak liar. */
    const p = Math.min(1, Math.max(0, (now - t0) / dur));
    const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
    paint(from + (to - from) * e);
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  /* Jaring pengaman: kalau rAF tidak jalan (tab nonaktif), angka tetap final. */
  setTimeout(() => {
    if (done) return;
    done = true;
    paint(to);
  }, dur + 80);
}

function animateBars() {
  requestAnimationFrame(() => {
    $$(".bar i[data-w]").forEach((i) => {
      i.style.width = Math.max(0, Number(i.dataset.w)) + "%";
    });
    $$(".spark > div[data-h]").forEach((b) => {
      b.style.height = b.dataset.h + "%";
    });
  });
}

/* ---------------------------------------------------------------- icons -- */

const ico = {
  home: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5 12 4l8 6.5"/><path d="M6 9.8V19a1 1 0 0 0 1 1h3.5v-5h3V20H17a1 1 0 0 0 1-1V9.8"/></svg>`,
  list: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M8 7h12M8 12h12M8 17h8"/><circle cx="4" cy="7" r="1.1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="4" cy="17" r="1.1" fill="currentColor" stroke="none"/></svg>`,
  chart: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 19V9M10 19V5M16 19v-6M22 19H2"/></svg>`,
  vault: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="12" cy="12" r="3.4"/><path d="M12 6.5v1.6M12 15.9v1.6"/></svg>`,
  user: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="8.5" r="3.6"/><path d="M5 20c0-3.3 3.1-5.6 7-5.6s7 2.3 7 5.6"/></svg>`,
  plus: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5.5v13M5.5 12h13"/></svg>`,
  search: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="6.4"/><path d="m16 16 4 4"/></svg>`,
  close: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
  tick: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4.5 4.5L19 7"/></svg>`,
  up: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>`,
  lock: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="5" y="10.5" width="14" height="9.5" rx="2.4"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>`,
  nest: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="9.6" cy="13.4" rx="3" ry="3.6" fill="currentColor" stroke="none" opacity=".92"/><ellipse cx="14.6" cy="13.9" rx="2.6" ry="3.1" fill="currentColor" stroke="none" opacity=".55"/><path d="M3.5 15.5c3.2 3.4 13.8 3.4 17 0"/><path d="M4.6 12.4c2.6 2.4 12.2 2.4 14.8 0" opacity=".5"/></svg>`,
};

const NAV_ICON = { home: ico.home, list: ico.list, chart: ico.chart, vault: ico.vault, user: ico.user };

/* ----------------------------------------------------------------- shell -- */

function render() {
  if (!allowedScreens().includes(state.screen)) state.screen = "beranda";
  renderSide();
  renderTabs();
  $("#fab").style.display = perms().tulis ? "" : "none";

  const scroller = $("#scroll");
  const views = { beranda: viewBeranda, transaksi: viewTransaksi, laporan: viewLaporan, kekayaan: viewKekayaan, atur: viewAtur };
  scroller.innerHTML = views[state.screen]();
  scroller.scrollTop = 0;
  animateBars();
  bindRoot(scroller);
  /* Sidebar hidup di luar #scroll: tombol "Catat transaksi" di sana butuh
     delegasi sendiri, kalau tidak kliknya tidak melakukan apa pun di web. */
  bindRoot($("#side"));
}

function renderSide() {
  const screens = allowedScreens();
  const navBtn = (id) => {
    const [, label, icon] = NAV.find((n) => n[0] === id);
    return `<button data-screen="${id}" class="${state.screen === id ? "on" : ""}">${NAV_ICON[icon]}<span>${label}</span></button>`;
  };

  $("#side").innerHTML = `
    <div class="side-brand">
      <span class="side-mark">${ico.nest}</span>
      <span class="side-name">
        <b class="display">${esc(DATA.app.name)}</b>
        <em>${esc(DATA.settings.namaKeluarga)}</em>
      </span>
    </div>

    <nav class="side-nav">${screens.map(navBtn).join("")}</nav>

    ${
      perms().tulis
        ? `<button class="side-cta" data-act="catat">${ico.plus}<span>Catat transaksi</span></button>`
        : `<div class="side-note">${ico.lock}<span>Mode lihat saja. Akun anak tidak bisa mencatat.</span></div>`
    }

    <div class="side-me">
      <span class="avatar">${esc(me().initial)}</span>
      <span class="side-name"><b>${esc(me().nama)}</b><em>${esc(DATA.role)}</em></span>
    </div>`;
}

function renderTabs() {
  /* Empat tab + satu slot tengah untuk tombol tambah. */
  const left = ["beranda", "transaksi"].filter((id) => allowedScreens().includes(id));
  const right = ["laporan", "kekayaan"].filter((id) => allowedScreens().includes(id));
  const cell = (id) => {
    const [, label, icon] = NAV.find((n) => n[0] === id);
    return `<button data-screen="${id}" class="${state.screen === id ? "on" : ""}">${NAV_ICON[icon]}<span>${label}</span></button>`;
  };
  $("#tabbar").innerHTML = `${left.map(cell).join("")}<div class="spacer"></div>${right.map(cell).join("")}`;
  $("#tabbar").style.gridTemplateColumns = `repeat(${left.length + right.length + 1}, 1fr)`;
}

/* -------------------------------------------------------------- beranda -- */

function seg(opts, active, name, style = "") {
  const i = Math.max(0, opts.findIndex((o) => o[0] === active));
  return `<div class="seg" data-seg="${name}" style="--n:${opts.length};--i:${i};${style}">
    <div class="thumb"></div>
    ${opts.map(([v, l]) => `<button data-val="${v}" class="${v === active ? "on" : ""}">${l}</button>`).join("")}
  </div>`;
}

function viewBeranda() {
  const c = compute();
  const p = perms();
  const m = me();

  const budgetRows = [...DATA.budget]
    .map((b) => ({ ...b, spent: c.byCat[b.cat] || 0 }))
    .sort((a, b) => b.spent / b.nominal - a.spent / a.nominal);

  const bills = [...DATA.bills].sort((a, b) => dayDiff(a.date) - dayDiff(b.date)).slice(0, 3);
  const recent = [...c.tx].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5);
  const savedPct = c.masuk ? Math.round(((c.masuk - c.keluar) / c.masuk) * 100) : 0;

  return `<div class="view">
    <header class="topbar" style="--i:0">
      <div>
        <div class="hi">${fmtDayLong(DATA.today)}</div>
        <div class="who">Halo, ${esc(m.nama)}</div>
      </div>
      <button class="avatar" data-go="atur" ${p.atur ? "" : "disabled"}>${esc(m.initial)}</button>
    </header>

    <div class="dash-grid">
      <div class="col">
        <div style="--i:1">
          ${seg([["kalender", "Bulan ini"], ["gajian", "Siklus gajian"]], state.mode, "mode")}
          <div class="muted period-note">${fmtDay(c.range.start)} – ${fmtDay(c.range.end)} · ${c.range.label}</div>
        </div>

        <div style="--i:2">
          <section class="hero">
            <div class="eyebrow">${p.lihatSemua ? "Bisa dipakai" : "Sisa kamu"}</div>
            <div class="big display"><span class="cur">Rp</span><span class="num" id="heroBebas">0</span></div>
            <div class="sub">${
              p.lihatSemua
                ? `Saldo ${rpShort(c.likuid)} dikurangi ${rpShort(c.komitmen)} tagihan terdekat`
                : `Masuk ${rpShort(c.masuk)} dikurangi keluar ${rpShort(c.keluar)}`
            }</div>
            <div class="hero-split">
              <div>
                <div class="k pos"><i class="dot"></i>Masuk</div>
                <div class="v num pos">${rpShort(c.masuk)}</div>
              </div>
              <div>
                <div class="k neg"><i class="dot"></i>Keluar</div>
                <div class="v num">${rpShort(c.keluar)}</div>
              </div>
              <div>
                <div class="k"><i class="dot" style="color:var(--gold)"></i>Disimpan</div>
                <div class="v num ${savedPct < 0 ? "neg" : "pos"}">${savedPct}%</div>
              </div>
            </div>
          </section>
        </div>

        <div style="--i:3">
          <div class="quick">
            ${p.tulis ? `<button data-act="catat">${ico.plus}<span>Catat</span></button>` : ""}
            <button data-go="transaksi">${ico.list}<span>Riwayat</span></button>
            ${p.laporan ? `<button data-go="laporan">${ico.chart}<span>Laporan</span></button>` : ""}
            ${p.kekayaan ? `<button data-go="kekayaan">${ico.vault}<span>Kekayaan</span></button>` : ""}
          </div>
        </div>

        ${
          p.lihatSemua
            ? `<div style="--i:4">
                <section class="section">
                  <div class="section-head">
                    <h2>Anggaran</h2>
                    <span class="link">${rpShort(c.budgetSpent)} / ${rpShort(c.budgetTotal)}</span>
                  </div>
                  ${budgetRows.slice(0, 4).map(budgetRow).join("")}
                </section>
              </div>`
            : ""
        }
      </div>

      <div class="col">
        ${
          p.lihatSemua
            ? `<div style="--i:5">
                <section class="section">
                  <div class="section-head">
                    <h2>Tagihan terdekat</h2>
                    <span class="link">${DATA.bills.length} tagihan</span>
                  </div>
                  ${bills.map(billRow).join("")}
                </section>
              </div>`
            : ""
        }

        <div style="--i:6">
          <section class="section">
            <div class="section-head">
              <h2>${p.lihatSemua ? "Terakhir" : "Transaksi kamu"}</h2>
              <button class="link" data-go="transaksi">Lihat semua</button>
            </div>
            ${recent.length ? recent.map(txRow).join("") : `<div class="empty">Belum ada transaksi di periode ini.</div>`}
          </section>
        </div>
      </div>
    </div>
  </div>`;
}

function budgetRow(b) {
  const pct = Math.round((b.spent / b.nominal) * 100);
  const cls = pct >= 100 ? "over" : pct >= 80 ? "warn" : "";
  const cat = catOf(b.cat);
  const right =
    pct >= 100 ? `lewat ${rpShort(b.spent - b.nominal)}` : pct >= 80 ? `<span class="tag warn">hampir habis</span>` : `sisa ${rpShort(b.nominal - b.spent)}`;
  return `<div class="budget-row">
    <div class="top">
      <div class="name"><span>${cat.emoji}</span>${esc(cat.nama)}</div>
      <div class="amt num">${rp(b.spent)}</div>
    </div>
    <div class="bar"><i class="${cls}" data-w="${Math.min(100, pct)}"></i></div>
    <div class="foot">
      <span>${pct}% dari ${rpShort(b.nominal)}</span>
      <span class="${pct >= 100 ? "neg" : ""}">${right}</span>
    </div>
  </div>`;
}

function billRow(b) {
  const diff = dayDiff(b.date);
  return `<div class="bill ${diff <= 7 ? "soon" : ""}">
    <div class="when"><b>${d(b.date).getDate()}</b><span>${BULAN[d(b.date).getMonth()]}</span></div>
    <div class="body">
      <b>${esc(b.nama)}</b>
      <span>${diff === 0 ? "hari ini" : diff + " hari lagi"} · ${esc(akunOf(b.akun).nama)}</span>
    </div>
    <div class="amt">${rpShort(b.nominal)}</div>
  </div>`;
}

function txRow(t) {
  const cat = t.jenis === "pindah" ? { nama: "Pindah dana", emoji: "↔️" } : catOf(t.cat);
  const sign = t.jenis === "masuk" ? "+" : t.jenis === "keluar" ? "−" : "";
  const sub =
    t.jenis === "pindah"
      ? `${esc(akunOf(t.akun).nama)} → ${esc(akunOf(t.ke).nama)}`
      : `${esc(akunOf(t.akun).nama)} · ${esc(t.anggota)}`;
  return `<div class="tx">
    <div class="ico ${t.jenis}">${cat.emoji}</div>
    <div class="body">
      <b>${esc(t.note || cat.nama)}</b>
      <span>${esc(cat.nama)} · ${sub}</span>
    </div>
    <div class="amt ${t.jenis === "masuk" ? "in" : "out"}">${sign}${rp(t.nominal)}</div>
  </div>`;
}

/* ------------------------------------------------------------ transaksi -- */

function viewTransaksi() {
  const c = compute();
  const q = state.q.toLowerCase();
  const p = perms();

  let list = [...c.tx].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  if (state.filter !== "semua") list = list.filter((t) => t.jenis === state.filter);
  if (q) {
    list = list.filter((t) => {
      const hay = `${t.note} ${catOf(t.cat).nama} ${akunOf(t.akun).nama} ${t.anggota}`.toLowerCase();
      return hay.includes(q);
    });
  }

  const groups = {};
  list.forEach((t) => {
    (groups[t.date] = groups[t.date] || []).push(t);
  });

  const totalIn = list.filter((t) => t.jenis === "masuk").reduce((s, t) => s + t.nominal, 0);
  const totalOut = list.filter((t) => t.jenis === "keluar").reduce((s, t) => s + t.nominal, 0);

  return `<div class="view">
    <header class="screen-head" style="--i:0">
      <div>
        <div class="eyebrow">${c.range.label}</div>
        <h1 class="display">Transaksi</h1>
      </div>
      <div class="muted num count-note">${list.length} catatan${p.lihatSemua ? "" : " · milik sendiri"}</div>
    </header>

    <div style="--i:1">
      <div class="summary">
        <div class="cell">
          <div class="k pos"><i class="dot"></i>Masuk</div>
          <div class="v pos">${rpShort(totalIn)}</div>
        </div>
        <div class="cell">
          <div class="k neg"><i class="dot"></i>Keluar</div>
          <div class="v">${rpShort(totalOut)}</div>
        </div>
      </div>
      <div class="search">
        ${ico.search}
        <input id="q" placeholder="Cari catatan, kategori, rekening" value="${esc(state.q)}" />
      </div>
      <div class="chips">
        ${[
          ["semua", "Semua"],
          ["keluar", "Keluar"],
          ["masuk", "Masuk"],
          ["pindah", "Pindah"],
        ]
          .map(([v, l]) => `<button class="chip ${state.filter === v ? "on" : ""}" data-filter="${v}">${l}</button>`)
          .join("")}
      </div>
    </div>

    <div style="--i:2">
      ${
        Object.keys(groups).length
          ? Object.entries(groups)
              .map(
                ([date, items]) => `<div class="tx-day">
            <div class="label"><span>${fmtDayLong(date)}</span><span class="num">${rpShort(
                  items.reduce((s, t) => s + (t.jenis === "masuk" ? t.nominal : t.jenis === "keluar" ? -t.nominal : 0), 0),
                )}</span></div>
            ${items.map(txRow).join("")}
          </div>`,
              )
              .join("")
          : `<div class="empty">Belum ada transaksi yang cocok.</div>`
      }
    </div>
  </div>`;
}

/* -------------------------------------------------------------- laporan -- */

function viewLaporan() {
  const c = compute();
  const rows = DATA.categories
    .filter((cat) => cat.kind === "keluar")
    .map((cat) => ({ cat, spent: c.byCat[cat.id] || 0 }))
    .filter((r) => r.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  const top = rows[0] ? rows[0].spent : 1;
  const prev = DATA.prevPeriod;
  const delta = c.keluar - prev.keluar;
  const pindahTotal = c.tx.filter((t) => t.jenis === "pindah").reduce((s, t) => s + t.nominal, 0);

  return `<div class="view">
    <header class="screen-head" style="--i:0">
      <div>
        <div class="eyebrow">${c.range.label}</div>
        <h1 class="display">Laporan</h1>
      </div>
      <div class="export">
        <button class="chip" data-act="ekspor" data-fmt="Excel">Excel</button>
        <button class="chip" data-act="ekspor" data-fmt="PDF">PDF</button>
      </div>
    </header>

    <div class="dash-grid">
      <div class="col">
        <div style="--i:1">
          <section class="section">
            <div class="section-head"><h2>Per kategori</h2><span class="link">${rpShort(c.keluar)}</span></div>
            ${
              rows.length
                ? rows
                    .map((r) => {
                      const budget = DATA.budget.find((b) => b.cat === r.cat.id);
                      const pctBudget = budget ? Math.round((r.spent / budget.nominal) * 100) : null;
                      return `<div class="budget-row">
                        <div class="top">
                          <div class="name"><span>${r.cat.emoji}</span>${esc(r.cat.nama)}</div>
                          <div class="amt num">${rp(r.spent)}</div>
                        </div>
                        <div class="bar"><i class="${pctBudget >= 100 ? "over" : pctBudget >= 80 ? "warn" : ""}" data-w="${Math.round((r.spent / top) * 100)}"></i></div>
                        <div class="foot">
                          <span>${Math.round((r.spent / c.keluar) * 100)}% dari pengeluaran</span>
                          <span class="muted">${pctBudget === null ? "tanpa anggaran" : pctBudget + "% anggaran"}</span>
                        </div>
                      </div>`;
                    })
                    .join("")
                : `<div class="empty">Belum ada pengeluaran di periode ini.</div>`
            }
          </section>
        </div>

        <div style="--i:2">
          <section class="section">
            <div class="section-head"><h2>Perbandingan</h2><span class="link">${prev.label}</span></div>
            <div class="summary">
              <div class="cell">
                <div class="k">Masuk</div>
                <div class="v pos">${rpShort(c.masuk)}</div>
                <div class="s">${c.masuk >= prev.masuk ? "+" : "−"}${rpShort(Math.abs(c.masuk - prev.masuk))} vs lalu</div>
              </div>
              <div class="cell">
                <div class="k">Keluar</div>
                <div class="v">${rpShort(c.keluar)}</div>
                <div class="s ${delta > 0 ? "neg" : "pos"}">${delta > 0 ? "+" : "−"}${rpShort(Math.abs(delta))} vs lalu</div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div class="col">
        <div style="--i:3">
          <section class="section">
            <div class="section-head"><h2>Per rekening</h2><span class="link">${rpShort(c.likuid)} likuid</span></div>
            <div class="rows">
              ${DATA.accounts
                .map((a) => {
                  const gerak = c.byAkun[a.id] || 0;
                  const emoji = a.tipe === "bank" ? "🏦" : a.tipe === "ewallet" ? "📱" : a.tipe === "cash" ? "👛" : "🐖";
                  return `<div class="r">
                <div class="ico">${emoji}</div>
                <div class="body"><b>${esc(a.nama)}</b><span>${gerak === 0 ? "tidak bergerak" : "gerak " + rpShort(gerak)}</span></div>
                <div class="amt">${rpShort(a.saldo)}</div>
              </div>`;
                })
                .join("")}
            </div>
          </section>
        </div>

        <div style="--i:4">
          <section class="section">
            <div class="section-head"><h2>Arus kas</h2><span class="link">${c.tx.length} transaksi</span></div>
            <div class="rows">
              <div class="r"><div class="body"><b>Uang masuk</b><span>gaji + lain-lain</span></div><div class="amt pos">+${rpShort(c.masuk)}</div></div>
              <div class="r"><div class="body"><b>Uang keluar</b><span>belanja + tagihan</span></div><div class="amt neg">−${rpShort(c.keluar)}</div></div>
              <div class="r"><div class="body"><b>Pindah dana</b><span>bukan pengeluaran</span></div><div class="amt">${rpShort(pindahTotal)}</div></div>
              <div class="r"><div class="body"><b>Arus kas bersih</b><span>masuk − keluar</span></div><div class="amt ${c.masuk - c.keluar < 0 ? "neg" : "pos"}">${rpShort(c.masuk - c.keluar)}</div></div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>`;
}

/* ------------------------------------------------------------- kekayaan -- */

function viewKekayaan() {
  const max = Math.max(...DATA.networthHistory);
  const min = Math.min(...DATA.networthHistory);
  const span = max - min || 1;
  const asetTotal = DATA.aset.reduce((s, a) => s + a.nilai, 0);
  const utangTotal = DATA.utang.reduce((s, u) => s + u.nilai, 0);
  const months = ["Mei", "Jun", "Jul", "Agu", "Sep", "Okt"];

  return `<div class="view">
    <header class="screen-head" style="--i:0">
      <div>
        <div class="eyebrow">Per ${fmtDay(DATA.today)}</div>
        <h1 class="display">Kekayaan</h1>
      </div>
    </header>

    <div class="dash-grid">
      <div class="col">
        <div style="--i:1">
          <section class="networth">
            <div class="eyebrow">Kekayaan bersih</div>
            <div class="big display"><span class="num" id="heroNet" style="font-size:inherit">Rp0</span></div>
            <div class="delta">${ico.up} ${rpShort(3255000)} sejak bulan lalu</div>
            <div class="spark">
              ${DATA.networthHistory.map((v, i) => `<div data-h="${18 + ((v - min) / span) * 78}" class="${i === DATA.networthHistory.length - 1 ? "now" : ""}"></div>`).join("")}
            </div>
            <div class="spark-x">${months.map((m) => `<span>${m}</span>`).join("")}</div>
          </section>
        </div>

        <div style="--i:2">
          <section class="section">
            <div class="section-head"><h2>Aset</h2><span class="link num">${rpShort(asetTotal)}</span></div>
            <div class="rows">
              ${DATA.aset
                .map(
                  (a) => `<div class="r">
                <div class="ico">${a.emoji}</div>
                <div class="body"><b>${esc(a.nama)}</b><span>${Math.round((a.nilai / asetTotal) * 100)}% dari aset</span></div>
                <div class="amt">${rpShort(a.nilai)}</div>
              </div>`,
                )
                .join("")}
            </div>
            <div class="gold-card">
              <div class="ico" style="background:#f0e2bf">🥇</div>
              <div class="body">
                <b>${DATA.gold.gram} gram emas</b>
                <span>Beli ${rp(DATA.gold.beliPerGram)}/g · kini ${rp(DATA.gold.hargaPerGram)}/g</span>
              </div>
              <div class="amt pos" style="font-weight:700">+${Math.round(((DATA.gold.hargaPerGram - DATA.gold.beliPerGram) / DATA.gold.beliPerGram) * 100)}%</div>
            </div>
          </section>
        </div>
      </div>

      <div class="col">
        <div style="--i:3">
          <section class="section">
            <div class="section-head"><h2>Utang</h2><span class="link num">${rpShort(utangTotal)}</span></div>
            <div class="rows">
              ${DATA.utang
                .map(
                  (u) => `<div class="r">
                <div class="ico">${u.emoji}</div>
                <div class="body"><b>${esc(u.nama)}</b><span>${u.cicilan ? "cicilan " + rpShort(u.cicilan) + "/bln" : "tanpa cicilan"}</span></div>
                <div class="amt neg">${rpShort(u.nilai)}</div>
              </div>`,
                )
                .join("")}
            </div>
          </section>
        </div>

        <div style="--i:4">
          <section class="section">
            <div class="section-head"><h2>Target</h2><span class="link">${DATA.goals.length} tujuan</span></div>
            <div class="rows">
              ${DATA.goals
                .map((g) => {
                  const pct = Math.min(100, Math.round((g.now / g.target) * 100));
                  return `<div class="goal">
                  <div class="top"><div>${g.emoji} ${esc(g.nama)}</div><span>${pct}%</span></div>
                  <div class="bar"><i data-w="${pct}"></i></div>
                  <div class="foot"><span>${rpShort(g.now)} dari ${rpShort(g.target)}</span><span>${rpShort(g.perBulan)}/bln</span></div>
                </div>`;
                })
                .join("")}
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>`;
}

/* ----------------------------------------------------------------- atur -- */

function viewAtur() {
  const p = perms();
  return `<div class="view">
    <header class="screen-head" style="--i:0">
      <div>
        <div class="eyebrow">${esc(DATA.settings.namaKeluarga)}</div>
        <h1 class="display">Atur</h1>
      </div>
    </header>

    <div class="dash-grid">
      <div class="col">
        <div style="--i:1">
          <div class="profile">
            <div class="who-card">
              <div class="avatar">${esc(me().initial)}</div>
              <div style="flex:1">
                <b>${esc(me().nama)}</b>
                <span>${esc(DATA.app.name)} · role ${esc(DATA.role)}</span>
              </div>
            </div>
          </div>
        </div>

        <div style="--i:2">
          <section class="section">
            <div class="section-head"><h2>Coba role</h2><span class="link">${p.kelolaUser ? "bisa diganti" : "terkunci"}</span></div>
            <div class="role-switch">
              ${DATA.members
                .map(
                  (m) => `<button class="role-card ${DATA.role === m.role ? "on" : ""}" data-role="${m.role}" ${p.kelolaUser ? "" : "disabled"}>
                  <span class="avatar">${esc(m.initial)}</span>
                  <b>${esc(m.nama)}</b>
                  <em>${esc(m.role)}</em>
                  <small>${esc(m.note)}</small>
                </button>`,
                )
                .join("")}
            </div>
          </section>
        </div>

        <div style="--i:3">
          <section class="section">
            <div class="section-head"><h2>Rekening</h2></div>
            <div class="rows">
              ${DATA.accounts
                .map((a) => {
                  const emoji = a.tipe === "bank" ? "🏦" : a.tipe === "ewallet" ? "📱" : a.tipe === "cash" ? "👛" : "🐖";
                  return `<div class="r">
                <div class="ico">${emoji}</div>
                <div class="body"><b>${esc(a.nama)}</b><span>${a.likuid ? "bisa dipakai" : "terkunci untuk target"}</span></div>
                <div class="amt">${rpShort(a.saldo)}</div>
              </div>`;
                })
                .join("")}
            </div>
          </section>
        </div>
      </div>

      <div class="col">
        <div style="--i:4">
          <section class="section">
            <div class="section-head"><h2>Anggota</h2></div>
            <div class="rows">
              ${DATA.members
                .map(
                  (m) => `<div class="r">
                <div class="avatar" style="width:34px;height:34px;font-size:12px">${esc(m.initial)}</div>
                <div class="body"><b>${esc(m.nama)}</b><span>${esc(m.note)}</span></div>
                <span class="tag">${esc(m.role)}</span>
              </div>`,
                )
                .join("")}
            </div>
          </section>
        </div>

        <div style="--i:5">
          <section class="section">
            <div class="section-head"><h2>Preferensi</h2></div>
            <div class="rows">
              <div class="list-row"><div class="grow">Nama aplikasi</div><div class="val">${esc(DATA.app.name)}</div></div>
              <div class="list-row"><div class="grow">Tanggal gajian</div><div class="val">tiap tanggal ${DATA.settings.payday}</div></div>
              <div class="list-row"><div class="grow">Periode default</div><div class="val">${state.mode === "kalender" ? "Bulan kalender" : "Siklus gajian"}</div></div>
              <div class="list-row"><div class="grow">Zona waktu</div><div class="val">${esc(DATA.settings.timezone)}</div></div>
              <div class="list-row"><div class="grow">Tab bulanan</div><div class="val">${esc(DATA.app.month)}</div></div>
              <div class="list-row"><div class="grow">Ekspor laporan</div><div class="val">Excel · PDF</div></div>
              <div class="list-row"><div class="grow">Cadangkan ke Drive</div><div class="val">mingguan</div></div>
            </div>
          </section>
        </div>

        <div style="--i:6">
          <section class="section">
            <button class="btn-primary ghost-btn" data-act="logout">Keluar</button>
            <p class="muted foot-note">Nest · prototipe UI. Data contoh, bukan data asli.</p>
          </section>
        </div>
      </div>
    </div>
  </div>`;
}

/* ---------------------------------------------------------------- sheet -- */

const KEYPAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "⌫"];

function openCatat() {
  if (!perms().tulis) {
    toast("Role anak hanya bisa melihat");
    return;
  }
  state.draft = { jenis: "keluar", amount: "0", cat: "harian", akun: "ewallet", ke: "emas", note: "" };
  state.sheet = "catat";
  renderSheet();
  $("#sheet").classList.add("on");
  $("#scrim").classList.add("on");
  $("#fab").classList.add("open");
}

function closeSheet() {
  $("#sheet").classList.remove("on");
  $("#scrim").classList.remove("on");
  $("#fab").classList.remove("open");
  state.sheet = null;
}

function renderSheet() {
  const dr = state.draft;
  if (!dr) return;

  const cats = DATA.categories.filter((c) => c.kind === dr.jenis);
  const akuns = DATA.accounts.filter((a) => a.likuid);
  const label = dr.jenis === "keluar" ? "Pengeluaran" : dr.jenis === "masuk" ? "Pemasukan" : "Pindah dana";

  $("#sheet").innerHTML = `
    <div class="sheet-grip"></div>
    <div class="sheet-head">
      <h3>Catat ${label.toLowerCase()}</h3>
      <button class="icon-btn" data-act="close-sheet">${ico.close}</button>
    </div>

    <div class="sheet-body">
      ${seg(
        [
          ["keluar", "Keluar"],
          ["masuk", "Masuk"],
          ["pindah", "Pindah"],
        ],
        dr.jenis,
        "jenis",
      )}

      <div class="amount-box">
        <span class="eyebrow">Nominal</span>
        <div class="val display ${dr.jenis}" id="amtVal">${rp(Number(dr.amount))}</div>
        <div class="hint">${
          dr.jenis === "pindah" ? "Dana berpindah, bukan pengeluaran" : dr.jenis === "masuk" ? "Uang masuk ke rekening" : "Uang keluar ke pihak luar"
        }</div>
      </div>

      ${
        dr.jenis === "pindah"
          ? ""
          : `<div class="field-label"><span>Kategori</span><span>${cats.length}</span></div>
      <div class="cat-grid">
        ${cats
          .map(
            (c) => `<button class="cat ${dr.cat === c.id ? "on" : ""}" data-cat="${c.id}">
          <span class="em">${c.emoji}</span><span>${esc(c.nama)}</span>
        </button>`,
          )
          .join("")}
      </div>`
      }

      <div class="field-label"><span>${dr.jenis === "pindah" ? "Dari rekening" : "Rekening"}</span></div>
      <div class="acct-row">
        ${akuns
          .map(
            (a) => `<button class="acct ${dr.akun === a.id ? "on" : ""}" data-akun="${a.id}">
          <i></i>${esc(a.nama)}
        </button>`,
          )
          .join("")}
      </div>

      ${
        dr.jenis === "pindah"
          ? `<div class="field-label"><span>Ke rekening</span></div>
      <div class="acct-row">
        ${DATA.accounts
          .filter((a) => a.id !== dr.akun)
          .map(
            (a) => `<button class="acct ${dr.ke === a.id ? "on" : ""}" data-ke="${a.id}">
          <i></i>${esc(a.nama)}
        </button>`,
          )
          .join("")}
      </div>`
          : ""
      }

      <div class="field-label"><span>Catatan</span><span>opsional</span></div>
      <input class="note" id="noteInput" placeholder="misal: sayur pasar" value="${esc(dr.note)}" />
      <div style="height:8px"></div>
    </div>

    <div class="keypad">
      ${KEYPAD.map((k) => `<button class="${/[0-9]/.test(k[0]) ? "" : "fn"}" data-key="${k}">${k}</button>`).join("")}
    </div>

    <div class="sheet-foot">
      <button class="btn-primary" data-act="save" ${Number(dr.amount) > 0 ? "" : "disabled"}>
        Simpan · ${rp(Number(dr.amount))}
      </button>
    </div>`;
}

function keyPress(k) {
  const dr = state.draft;
  if (!dr) return;
  let v = dr.amount;
  if (k === "⌫") v = v.length > 1 ? v.slice(0, -1) : "0";
  else if (k === "000") v = v === "0" ? "0" : v + "000";
  else v = v === "0" ? k : v + k;
  if (v.length > 12) v = v.slice(0, 12);
  dr.amount = v;

  const val = $("#amtVal");
  if (val) {
    val.textContent = rp(Number(v));
    val.style.animation = "none";
    void val.offsetWidth;
    val.style.animation = "pop .22s var(--ease)";
  }
  const btn = $('[data-act="save"]');
  if (btn) {
    btn.disabled = Number(v) <= 0;
    btn.textContent = `Simpan · ${rp(Number(v))}`;
  }
}

function saveDraft() {
  const dr = state.draft;
  if (!dr || Number(dr.amount) <= 0) return;

  const nominal = Number(dr.amount);
  DATA.transactions.push({
    id: "t" + Date.now(),
    date: DATA.today,
    jenis: dr.jenis,
    nominal,
    cat: dr.jenis === "pindah" ? null : dr.cat,
    akun: dr.akun,
    ke: dr.jenis === "pindah" ? dr.ke : undefined,
    anggota: me().nama,
    note: dr.note || (dr.jenis === "pindah" ? "Pindah dana" : catOf(dr.cat).nama),
  });

  /* Saldo rekening ikut bergerak, supaya angka "bisa dipakai" benar. */
  const from = DATA.accounts.find((a) => a.id === dr.akun);
  if (from) from.saldo += dr.jenis === "masuk" ? nominal : -nominal;
  if (dr.jenis === "pindah") {
    const to = DATA.accounts.find((a) => a.id === dr.ke);
    if (to) to.saldo += nominal;
  }

  const txt =
    dr.jenis === "pindah" ? `${rp(nominal)} dipindah ke ${akunOf(dr.ke).nama}` : `${rp(nominal)} · ${catOf(dr.cat).nama} tersimpan`;

  closeSheet();
  render();
  toast(txt);
}

/* ---------------------------------------------------------------- toast -- */

let toastTimer;
function toast(text) {
  const el = $("#toast");
  el.innerHTML = `<span class="tick">${ico.tick}</span><span>${esc(text)}</span>`;
  el.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("on"), 2600);
}

/* ---------------------------------------------------------------- events -- */

/* Delegasi dipasang sekali saja; render ulang tidak menumpuk listener. */
function onScreenClick(e) {
  const go = e.target.closest("[data-go]");
  if (go && !go.disabled) {
    state.screen = go.dataset.go;
    render();
    return;
  }

  const act = e.target.closest("[data-act]");
  if (act) {
    const a = act.dataset.act;
    if (a === "catat") openCatat();
    if (a === "tagihan") {
      const next = [...DATA.bills].sort((x, y) => dayDiff(x.date) - dayDiff(y.date))[0];
      toast(`${DATA.bills.length} tagihan · terdekat ${next.nama}, ${fmtDay(next.date)}`);
    }
    if (a === "ekspor") toast(`${act.dataset.fmt} disiapkan · ${periodRange(state.mode).label}`);
    if (a === "logout") toast("Prototipe: sesi tidak benar-benar diakhiri");
    return;
  }

  const chip = e.target.closest("[data-filter]");
  if (chip) {
    state.filter = chip.dataset.filter;
    render();
    return;
  }

  const role = e.target.closest("[data-role]");
  if (role && !role.disabled) {
    DATA.role = role.dataset.role;
    state.screen = "beranda";
    render();
    toast(`Sekarang melihat sebagai ${me().nama} (${DATA.role})`);
  }
}

function bindRoot(root) {
  if (!root) return;
  if (!root._bound) {
    root._bound = true;
    root.addEventListener("click", onScreenClick);
  }
  if (root.id !== "scroll") return;

  const q = $("#q");
  if (q) {
    q.addEventListener("input", (e) => {
      state.q = e.target.value;
      const pos = e.target.selectionStart;
      render();
      const nq = $("#q");
      if (nq) {
        nq.focus();
        nq.setSelectionRange(pos, pos);
      }
    });
  }

  $$("[data-seg='mode'] button", root).forEach((b) => {
    b.addEventListener("click", () => {
      state.mode = b.dataset.val;
      render();
    });
  });

  const bebas = $("#heroBebas");
  if (bebas) animateNum(bebas, "bebas-" + state.mode + "-" + DATA.role, compute().bebas, "");
  const net = $("#heroNet");
  if (net) animateNum(net, "net", compute().networth, "Rp");
}

/* tabbar, sidebar, fab, sheet */
document.addEventListener("click", (e) => {
  const tab = e.target.closest("[data-screen]");
  if (tab) {
    state.screen = tab.dataset.screen;
    render();
    return;
  }

  if (e.target.closest("#fab")) {
    if (state.sheet) closeSheet();
    else openCatat();
    return;
  }

  if (e.target.closest("#scrim")) {
    closeSheet();
    return;
  }

  const sheet = $("#sheet");
  if (!sheet.contains(e.target)) return;

  if (e.target.closest('[data-act="close-sheet"]')) {
    closeSheet();
    return;
  }

  const jenis = e.target.closest("[data-seg='jenis'] button");
  if (jenis) {
    state.draft.jenis = jenis.dataset.val;
    const first = DATA.categories.find((c) => c.kind === state.draft.jenis);
    if (first) state.draft.cat = first.id;
    renderSheet();
    return;
  }

  const cat = e.target.closest("[data-cat]");
  if (cat) {
    state.draft.cat = cat.dataset.cat;
    renderSheet();
    return;
  }

  const akun = e.target.closest("[data-akun]");
  if (akun) {
    state.draft.akun = akun.dataset.akun;
    if (state.draft.ke === state.draft.akun) {
      const other = DATA.accounts.find((a) => a.id !== state.draft.akun);
      state.draft.ke = other.id;
    }
    renderSheet();
    return;
  }

  const ke = e.target.closest("[data-ke]");
  if (ke) {
    state.draft.ke = ke.dataset.ke;
    renderSheet();
    return;
  }

  const key = e.target.closest("[data-key]");
  if (key) {
    keyPress(key.dataset.key);
    return;
  }

  if (e.target.closest('[data-act="save"]')) saveDraft();
});

document.addEventListener("input", (e) => {
  if (e.target.id === "noteInput" && state.draft) state.draft.note = e.target.value;
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeSheet();
  if (state.sheet && /^[0-9]$/.test(e.key) && e.target.tagName !== "INPUT") keyPress(e.key);
  if (state.sheet && e.key === "Backspace" && e.target.tagName !== "INPUT") keyPress("⌫");
});

/* ----------------------------------------------------------------- login -- */

const loginState = { pin: "" };

function renderLogin() {
  $("#login").innerHTML = `
    <div class="brand">
      <div class="mark">${ico.nest}</div>
      <h1 class="display">${esc(DATA.app.name)}</h1>
      <p>${esc(DATA.app.tagline)}</p>
    </div>

    <div class="pin" id="pin">${[0, 1, 2, 3].map(() => "<i></i>").join("")}</div>

    <div class="keypad" id="loginPad">
      ${["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"]
        .map((k) => (k === "" ? `<span></span>` : `<button data-lkey="${k}" class="${/[0-9]/.test(k) ? "" : "fn"}">${k}</button>`))
        .join("")}
    </div>

    <p class="login-note">Prototipe · tekan 4 angka apa saja</p>`;
}

function loginKey(k) {
  const dots = $$("#pin i");
  if (k === "⌫") loginState.pin = loginState.pin.slice(0, -1);
  else if (loginState.pin.length < 4) loginState.pin += k;
  dots.forEach((dot, i) => dot.classList.toggle("on", i < loginState.pin.length));

  if (loginState.pin.length === 4) {
    setTimeout(() => {
      $("#login").classList.add("gone");
      setTimeout(() => {
        $("#login").style.display = "none";
        render();
        toast("Selamat datang, " + me().nama);
      }, 260);
    }, 220);
  }
}

document.addEventListener("click", (e) => {
  const k = e.target.closest("[data-lkey]");
  if (k) loginKey(k.dataset.lkey);
});

/* ------------------------------------------------------------------ init -- */

/* ?skip=1 lewati layar kunci, ?screen=nama buka layar tertentu,
   ?sheet=1 langsung buka form, ?role=anak coba batasan hak akses.        */
const params = new URLSearchParams(location.search);

renderLogin();

if (params.get("role") && PERMS[params.get("role")]) DATA.role = params.get("role");
if (params.get("skip")) {
  $("#login").style.display = "none";
  if (params.get("screen")) state.screen = params.get("screen");
  render();
  if (params.get("sheet")) openCatat();
} else {
  render();
}
