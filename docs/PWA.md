# MorphPDF — PWA Documentation

Dokumen ini menjelaskan implementasi Progressive Web App pada MorphPDF:
arsitektur caching, cara kerja instalasi, dan batasan offline.

## Ringkasan

| Aspek | Implementasi |
|---|---|
| Manifest | `manifest.webmanifest` |
| Service Worker | `sw.js` (versi cache `v1.0.0`) |
| PWA logic | `assets/pwa.js` |
| Install UI | Tombol `Install App` di navbar + menu mobile |
| Offline fallback | `offline.html` + cached app shell |
| Base path | Relatif (`./`) — aman untuk GitHub Pages `/MorphPDF/` |

## Manifest

```json
{
  "name": "MorphPDF",
  "short_name": "MorphPDF",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "any",
  "theme_color": "#F7F4ED",
  "background_color": "#F7F4ED"
}
```

**Semua path sengaja dibuat relatif** (bukan `/MorphPDF/...` absolut). Ini
penting agar manifest, ikon, dan start URL tetap valid:

- di lokal (`http://localhost:8000/`),
- di GitHub Pages project site (`https://azriel-ae.github.io/MorphPDF/`),
- maupun jika repo di-rename.

`start_url: "./"` menunjuk ke root aplikasi (base path GitHub Pages
otomatis menjadi bagian dari URL tersebut), dan `scope: "./"` memastikan
service worker **tidak mengambil alih scope website lain**.

## Ikon

| File | Ukuran | Purpose | Catatan |
|---|---|---|---|
| `assets/icons/icon-192.png` | 192×192 | any | Latar cream, simbol 74% |
| `assets/icons/icon-512.png` | 512×512 | any | Latar cream, simbol 74% |
| `assets/icons/icon-maskable-192.png` | 192×192 | maskable | Simbol 60% (safe zone) |
| `assets/icons/icon-maskable-512.png` | 512×512 | maskable | Simbol 60% (safe zone) |
| `apple-touch-icon.png` | 180×180 | iOS | iOS menambahkan rounding sendiri |
| `favicon.svg` / `favicon-32.png` | any / 32 | favicon | |

Seluruh ikon dihasilkan dari satu sumber: `assets/brand/logo-symbol.svg`
(lihat `scripts/make-icons.py` di repo pengembangan).

## Service Worker (`sw.js`)

### Cache

- **`morphpdf-static-<VERSION>`** — app shell (HTML, CSS, JS sendiri,
  manifest, ikon, brand SVG, `offline.html`). Di-precache saat `install`
  dengan `Promise.allSettled` sehingga satu file gagal tidak menggagalkan
  instalasi.
- **`morphpdf-runtime-<VERSION>`** — library CDN tepercaya yang diisi
  bertahap (*stale-while-revalidate*): `cdn.tailwindcss.com`,
  `cdnjs.cloudflare.com`, `unpkg.com`, `fonts.googleapis.com`,
  `fonts.gstatic.com`.

### Strategi per jenis request

1. **Navigasi (HTML)** — *network-first*. Jika online, respons 200 disimpan
   sebagai `index.html` terbaru. Jika offline: cached `index.html` →
   `offline.html` → respons HTML minimal.
2. **Aset same-origin** — *cache-first* (app shell sudah di-precache),
   miss → network, dan hanya response `ok` (`basic`/`cors`) yang disimpan.
3. **CDN tepercaya** — *stale-while-revalidate*: kunjungan pertama online
   menyimpan salinan; kunjungan berikutnya memakai cache sambil memperbarui
   di latar belakang. Inilah yang membuat PDF.js/Tailwind tetap berfungsi
   saat offline setelah sesi online pertama.
4. **Selain itu** — tidak di-intercept.

### Yang tidak pernah di-cache

- Request non-GET, `blob:`, `data:`, dan skema non-http(s).
- Response error (>=400) atau opaque (`no-cors`) — tidak ada "error yang
  disimpan seolah berhasil".
- **File dan hasil pengguna**: semua pemrosesan berjalan di memori browser
  (`Blob`/`ObjectURL`) dan tidak pernah melewati service worker. SW hanya
  menyimpan aset aplikasi.
- CDN yang tidak ada di whitelist.

### Versioning & update

- Nama cache memuat `VERSION` (`v1.0.0`). Saat `activate`, semua cache
  `morphpdf-*` dengan versi lama dihapus.
- Saat versi baru menunggu (*waiting*), halaman menampilkan toast
  "Versi baru MorphPDF tersedia. Muat ulang halaman untuk memperbarui."
  (`assets/pwa.js` → `reg.addEventListener('updatefound', ...)`).
- Untuk mengganti versi: ubah `VERSION` di `sw.js`, lalu deploy. Kunjungan
  berikutnya akan meng-install SW baru dan membersihkan cache lama.

## Instalasi (Install Experience)

1. **Chromium (desktop & Android)** — `beforeinstallprompt` dicegah dari
   tampil otomatis; tombol **Install App** baru muncul setelah event tersebut
   (artinya browser benar-benar mendukung dan kriteria PWA terpenuhi).
   Klik tombol → `deferredPrompt.prompt()` → hasil `userChoice` ditangani →
   tombol disembunyikan setelah `appinstalled`. **Tidak ada tombol palsu.**
2. **iOS Safari** — `beforeinstallprompt` tidak pernah muncul di Safari;
   tombol akan muncul dalam mode *manual* dan membuka panel instruksi
   *Share → Add to Home Screen*.
3. **Sudah terpasang** (`display-mode: standalone` atau
   `navigator.standalone`) — tombol tetap disembunyikan.

## Pengalaman Offline

- Setelah satu kunjungan online, app shell + library CDN tersimpan.
- Homepage, navigasi, dan seluruh UI dapat dibuka tanpa koneksi.
- Banner **"Anda sedang offline..."** muncul di bawah layar.
- **Bisa berjalan offline penuh**: Photo Editor, Image Converter,
  Image to PDF, PDF to Image, Merge/Split/Compress PDF, File to Excel —
  karena seluruh library-nya (pdf-lib, PDF.js, SheetJS, JSZip, Cropper,
  Fabric) sudah tersimpan di runtime cache setelah dipakai minimal sekali
  online. Font Awesome/Tailwind yang sudah ter-cache ikut tersedia.
- **Batasan**: kunjungan *pertama* harus online (browser butuh mengunduh
  shell & library dulu). Library CDN yang belum pernah ter-cache tidak akan
  bisa dimuat offline; halaman tetap terbuka dan pesan offline ditampilkan.

## Verifikasi (ringkas)

Yang sudah diverifikasi secara manual di Chromium headless:

- Manifest ter-load dan link valid.
- SW ter-registrasi dengan scope `./` (bukan root domain).
- 21 file app shell masuk cache `morphpdf-static-v1.0.0`.
- Offline: reload homepage dari cache + banner offline muncul.
- Offline: konversi gambar dan PDF-to-Image tetap berjalan.
- `beforeinstallprompt` tertangani; tombol install berfungsi tanpa error.
- Tidak ada error terkait PWA di console.

Untuk audit penuh, jalankan **Lighthouse (kategori PWA)** di Chrome DevTools
pada URL produksi: `https://azriel-ae.github.io/MorphPDF/`.
