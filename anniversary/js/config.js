/* ===================== KONFIGURASI — EDIT BAGIAN INI ===================== */
const CONFIG = {
  PHOTO_DIR: "photos/",   // foto per tahun: photos/tahun1/, photos/tahun2/, photos/tahun3/
  VIDEO_DIR: "videos/",   // video pendek untuk Memory Gacha
  START: new Date(2024, 8, 9, 0, 0, 0),     // 9 September 2024 (bulan 0-11, jadi 8 = September)
  PIN_LENGTH: 6,
  TITLE: "3 Tahun Bersamamu",
  BADGE: "✦ Anniversary ke-3 ✦",
  PIN_SALT: "anv3:",
  PIN_HASH: "7a8b9acab20119df42e3ec652ef9a34c408e7ea34a6a4938c7bdb5a96a9c9317", // hash dari "anv3:" + PIN
  // Mode Supabase (aman sungguhan). Kosongkan untuk mode demo lokal.
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
  COUPLE_EMAIL: "kita@example.com",         // akun Supabase Auth bersama
  LETTER: "Sayang,\n\nTiga tahun lalu aku tidak tahu bahwa hari biasa bisa berubah jadi hari paling kusyukuri.\nTerima kasih sudah sabar, tertawa, dan tetap tinggal.\n\nGanti teks ini dengan suratmu sendiri.\n\nSelamanya milikmu 💙"
};
// Data demo. Di mode Supabase, data dibaca dari tabel `memories` + bucket privat.
const MEMORIES = [
  // img = nama file saja → dicari di photos/tahun{y}/ ; vid = nama file di videos/
  {y:1,t:"Kencan pertama",c:"Kita salah tempat, tapi malah jadi cerita terbaik.",img:"kencan-pertama.jpg",vid:""},
  {y:1,t:"Liburan pertama",c:"Ketawa sampai ketinggalan kereta.",img:"liburan.jpg",vid:""},
  {y:2,t:"Masak bareng",c:"Dapur berantakan, hati penuh.",img:"masak.jpg",vid:""},
  {y:2,t:"Ulang tahunmu",c:"Kue miring tapi senyummu lurus.",img:"ultah.jpg",vid:""},
  {y:3,t:"Petualangan baru",c:"Makin yakin, makin sayang.",img:"petualangan.jpg",vid:""},
  {y:3,t:"Hari ini",c:"Tiga tahun, dan aku masih memilihmu.",img:"hari-ini.jpg",vid:""}
];
const PLAYLIST = [ // taruh file mp3 di folder /music
  {t:"Lagu Kita #1", src:"music/lagu1.mp3"},
  {t:"Lagu Kita #2", src:"music/lagu2.mp3"}
];
/* ========================================================================= */
