# MorphPDF

Aplikasi web **MorphPDF** yang berjalan 100% di sisi klien (client-side) —
tidak ada file yang diunggah ke server mana pun. Semua proses (edit foto, crop,
filter, konversi format gambar, dan olah PDF) dilakukan langsung di browser.

MorphPDF adalah **Progressive Web App (PWA)**: bisa dipasang sebagai aplikasi
di desktop & Android (Chrome/Edge), dan via *Add to Home Screen* di iOS
(Safari). Lihat [docs/PWA.md](docs/PWA.md).

## Brand

Logo MorphPDF adalah simbol **"the morphing document"**: satu lembar dokumen
yang terbelah diagonal — charcoal `#302D28` (file asli) → band krem dengan
panah transformasi → warm apricot `#E9B978` (hasil konversi).

| Aset | File |
|---|---|
| Logo utama (symbol + wordmark) | `assets/brand/logo.svg` |
| Symbol saja (light bg) | `assets/brand/logo-symbol.svg` |
| Symbol saja (dark bg) | `assets/brand/logo-symbol-dark.svg` |
| Favicon | `favicon.svg` + `favicon-32.png` |
| PWA icons | `assets/icons/icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png` |
| Apple touch icon | `apple-touch-icon.png` |

Wordmark memakai **Inter** (fallback Manrope / system sans) — konsisten dengan
tipografi aplikasi. Detail selengkapnya ada di [docs/BRAND.md](docs/BRAND.md).

## Fitur

### Photo Studio
- Upload foto (klik atau drag & drop)
- Crop dengan preset rasio (Free, 1:1, 3:4, 4:3, 16:9)
- Penyesuaian **Kecerahan**, **Kontras**, **Saturasi** (diterapkan nyata pada hasil ekspor)
- Tambah teks ke gambar (dengan pilihan warna)
- Export/download hasil edit ke **JPG / PNG / WEBP**
- Putar foto 90°, orientasi lembar Portrait/Landscape (satu sumber state)
- Tombol Cetak membuka dialog pilihan orientasi A4 sebelum dialog cetak browser
- Margin cetak nyata (default 5 mm), skala Fit/Fill, atau layout pasfoto (3x4, 4x6, 2x3 cm)

### Image Converter
- Konversi banyak gambar sekaligus ke format **PNG / JPG / WEBP** (AVIF jika
  encoder browser mendukung; kalau tidak, muncul pesan jelas)
- Pengaturan kualitas kompresi
- Opsi warna latar belakang saat konversi ke format tanpa transparansi
- Validasi format, file kosong dilewati, file gagal didekode dilaporkan per file

### PDF Tools
- **Image to PDF** – gabungkan beberapa gambar jadi satu PDF (A4/Letter, Portrait/Landscape)
- **PDF to Image** – ekstrak setiap halaman PDF menjadi gambar (PNG/JPG/WEBP, 1x–3x)
- **Merge PDF** – gabungkan beberapa file PDF sesuai urutan daftar
- **Split PDF** – ambil halaman tertentu (format `1-3, 5`), rentang di luar jumlah halaman ditolak dengan pesan
- **Compress PDF** – perkecil ukuran file PDF; jika hasil justru lebih besar
  (PDF teks murni), aplikasi mengatakannya dengan jujur di panel hasil

### Document Tools
- **File to Excel** – CSV / JSON / XLS / XLSX / TXT / PDF → `.xlsx` sah
  (JSON nested di-flatten, PDF teks diekstraksi best-effort, file kosong dan
  format tak didukung ditolak dengan pesan yang jelas)

## Teknologi

Semua library dimuat lewat CDN (tidak perlu instalasi/build tools):

| Library | Kegunaan |
|---|---|
| [Tailwind CSS](https://tailwindcss.com) | Utility-first styling |
| [Font Awesome](https://fontawesome.com) | Ikon |
| [Cropper.js](https://fengyuanchen.github.io/cropperjs/) | Crop gambar |
| [Fabric.js](http://fabricjs.com/) | Canvas editor (teks, filter) |
| [pdf-lib](https://pdf-lib.js.org/) | Manipulasi PDF (merge, split, dsb.) |
| [PDF.js](https://mozilla.github.io/pdf.js/) | Render/ekstrak halaman PDF |
| [JSZip](https://stuk.github.io/jszip/) | Kompres hasil batch jadi ZIP |
| [SheetJS](https://sheetjs.com/) | Pembuatan file Excel (.xlsx) |
| [Inter](https://rsms.me/inter/) | Tipografi |

## PWA

- `manifest.webmanifest` — nama, warna tema, ikon 192/512 + maskable,
  `start_url` & `scope` relatif (`./`) sehingga aman untuk base path
  GitHub Pages `/MorphPDF/`.
- `sw.js` — app shell di-precache, navigasi network-first dengan fallback
  offline, library CDN tepercaya di-cache *stale-while-revalidate*, cache
  versioning + cleanup otomatis, dan tidak pernah menyimpan file/hasil
  pengguna.
- Tombol **Install App** (navbar & menu mobile) hanya muncul saat browser
  benar-benar mendukung instalasi (`beforeinstallprompt`), atau menampilkan
  instruksi manual di iOS Safari.
- Banner offline sederhana muncul saat koneksi hilang; tools yang sudah
  dimuat tetap berjalan karena seluruh proses bersifat lokal.

Dokumentasi lengkap: [docs/PWA.md](docs/PWA.md) · Hasil pengujian:
[docs/TESTING.md](docs/TESTING.md).

## Design System (Second Redesign)

Arah visual: **Warm Liquid Glass + Soft Apricot**, editorial dan tenang.

- **Palet**: background `#F7F4ED`, secondary surface `#F0EBE1`, card `#FFFFFF`,
  peach `#F2E2CC`, apricot accent `#E9B978`, amber `#C98D50`,
  text `#302D28` / `#777168`, border `#E5DED2`.
  Tidak ada merah, biru, ungu, atau hijau.
- **Liquid Glass** dipakai selektif: navbar, dropdown, search bar,
  hero visual chips, dan dialog cetak — selebihnya permukaan solid.
- **Hero dua kolom**: copy + pencarian di kiri, visual workspace
  (dokumen preview, chip konversi JPG→PDF, kartu file) yang dibangun
  murni dengan HTML/CSS di kanan.
- **Direktori tools**: header kategori ber-ikon dengan deskripsi dan jumlah
  tool; kartu tools putih dengan ikon tile peach/apricot per kategori.
- **CTA primer**: solid amber `#C98D50` dengan teks cokelat tua `#2F2213`.
- Palet Tailwind diremap lewat `assets/config.js`, sehingga seluruh markup
  dinamis (daftar file, hasil konversi, toast) mengikuti design system 
