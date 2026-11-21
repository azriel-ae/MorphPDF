# MorphPDF — Testing Report

Hasil audit fungsional menyeluruh (Chromium headless, CLI `agent-browser`,
file uji dibuat terprogram). Lingkungan uji: `python3 -m http.server` +
Chromium headless; hasil unduhan diverifikasi dengan meng-hook
`downloadBlob` dan mem-parse blob output (mis. openpyxl untuk .xlsx).

Status: **Passed** / **Failed** / **Not tested** / **Known limitation**.

---

## 1. Image Tools

### Photo Editor

| Uji | Status | Catatan |
|---|---|---|
| Upload via file input | Passed | Toast sukses, cropper muncul, badge dimensi benar |
| Crop rasio 1:1 → Terapkan | Passed | 400×300 → 270×270, auto pindah ke Lembar Cetak |
| Rotate 90° | Passed | 400×300 → 300×400 (swap dimensi benar) |
| Filter (brightness/contrast/saturate) | Passed | Slider direset setelah "Simpan Efek"; piksel hasil `renderEditedCanvas()` benar-benar berubah (diverifikasi via `getImageData`) |
| Tambah teks (Fabric) → Terapkan | Passed | 1 object di canvas; commit menyatu ke foto dasar |
| Export JPG/PNG/WEBP | Passed | Toast unduhan; format ekspor sesuai pilihan |
| Reset ke Asli | Passed | Kembali 400×300, filter hilang |
| Ganti foto / clean state | Passed | Badge 0 × 0, dropzone kembali |
| Resize (ubah dimensi bebas) | Known limitation | Kontrol resize tidak ada di aplikasi; crop+filter+teks tersedia |

### Image Converter

| Uji | Status | Catatan |
|---|---|---|
| Konversi PNG → WEBP | Passed | Blob `image/webp` diunduh |
| Konversi batch → JPG | Passed | 2 file sukses; latar putih diterapkan |
| Nama file spasi & karakter khusus (`foto besar (final)!.png`) | Passed | Nama output identik, diunduh benar |
| Nama file sangat panjang (180 karakter) | Passed | Diupload & dikonversi tanpa masalah |
| Format tidak didukung (.txt) | Passed | Toast "file dilewati (bukan gambar)", tidak masuk daftar |
| File kosong (0 byte) | Passed | Toast dilewati, tidak masuk daftar |
| File rusak (teks dinamai .png) | Passed | Lolos validasi ekstensi, gagal di decode; toast jujur: "2 gambar dikonversi, 1 gagal: corrupt.png" |
| AVIF (encoder tak tersedia) | Passed | Toast informatif "Format AVIF tidak didukung encoder browser ini — coba WEBP"; tidak menghasilkan file palsu |
| Gambar besar 3000×4000 | Passed | Konversi sukses tanpa freeze (konversi berurutan) |
| Double-click tombol convert | Passed | Guard `dataset.busy`; tombol dinonaktifkan saat proses |

---

## 2. PDF Tools

### Image to PDF

| Uji | Status | Catatan |
|---|---|---|
| 2 gambar → 1 PDF | Passed | Panel: 2 halaman, 0 dilewati, 14.4 KB, `application/pdf` |
| Ukuran halaman Letter + Landscape | Passed | `getPdfPageDimensions()` membaca kedua select |
| Urutan halaman = urutan file | Passed | Hint UI + proses berurutan |

### PDF to Image

| Uji | Status | Catatan |
|---|---|---|
| PDF 3 halaman → 3 gambar | Passed | Render 2x = 1191×1684 px, JPG valid (`data:image/jpeg`) |
| Thumbnail hasil render | Passed | Konten halaman terlihat di pratinjau |
| Download per halaman + ZIP | Passed | Nama file `..._page01.jpg` dst. |

### Merge PDF

| Uji | Status | Catatan |
|---|---|---|
| 2 PDF (3+3 halaman) → 1 PDF | Passed | Panel: 6 total halaman, urutan ditampilkan, PDF diunduh |
| Kurang dari 2 file | Passed | Toast "minimal 2 file PDF" |

### Split PDF

| Uji | Status | Catatan |
|---|---|---|
| Rentang valid `1-2` | Passed | 2 halaman diambil, PDF diunduh |
| Halaman di luar jangkauan `5` / `2, 5-9` | Passed | Error: "Halaman 5-9 di luar jangkauan (PDF hanya punya 3 halaman)" |
| Format tidak valid `abc`, `1-` | Passed | Error: "Format ... tidak dikenali" |
| PDF rusak | Passed | Error: "File PDF rusak, kosong, atau dilindungi kata sandi"; tidak ada unduhan |
| PDF terproteksi kata sandi | Passed | Error yang sama, tidak crash |

### Compress PDF

| Uji | Status | Catatan |
|---|---|---|
| PDF gambar (1.14 MB) | Passed | → 575.9 KB (−50%), toast sukses + panel statistik |
| PDF teks murni (2.9 KB) | Passed | **Jujur**: panel "Kompresi Tidak Efektif — hasil lebih besar dari asli" + saran pakai file asli (dulu salah tampil "Kompresi Selesai"; sudah diperbaiki) |
| PDF rusak | Passed | Ditolak dengan pesan |

---

## 3. Document Tools (File to Excel)

| Uji | Status | Catatan |
|---|---|---|
| CSV kutipan + koma dalam kutipan + unicode (Ç) + simbol `<>` | Passed | Isi .xlsx diverifikasi dengan openpyxl: kolom tidak tertukar, `"Andi, Jr."` satu sel, karakter utuh |
| JSON nested + flatten | Passed | 9 kolom flatten (`items.0.detail.stok`, dst.) |
| JSON invalid | Passed | Panel "Konversi Gagal" |
| TXT tabel (delimiter tab) | Passed | 2 baris × 3 kolom |
| TXT teks bebas (bukan tabel) | Known limitation | Ditolak dengan pesan yang jelas (by design) |
| XLSX multi-sheet | Passed | 2 sheet dinormalisasi, header dipertahankan |
| PDF teks (3 halaman) | Passed | Ekstraksi heuristik 30 baris; peringatan "best-effort" ditampilkan |
| PDF tanpa lapisan teks (scan) | Known limitation | Ditolak dengan pesan "OCR belum tersedia" (by design, tidak membuat data palsu) |
| PDF rusak | Passed | Panel gagal, tidak crash |
| CSV kosong | Passed | "File kosong, tidak ada data untuk dikonversi" |
| Ekstensi tidak didukung (.docx) | Passed | Toast jelas; workspace tidak dibuka |
| Nama file berisi tag HTML (`<img src=x onerror=alert(1)>.csv`) | Passed | Dirender sebagai teks (escapeHtml); tidak ada injeksi/alert |

---

## 4. Processing & Download

| Uji | Status | Catatan |
|---|---|---|
| State Idle → Processing → Success/Error | Passed | Panel status proses + panel hasil + toast di semua tools |
| Guard double-click (Convert All, Proses PDF, Konversi Excel) | Passed | `dataset.busy` + `disabled` selama proses |
| Nama file output | Passed | Nama output & prefix diterapkan; `sanitizeFilenameBase` membersihkan karakter ilegal |
| Pembersihan Object URL | Passed | `downloadBlob` revoke setelah 4 detik; preview PDF di-revoke saat re-render/ganti tool; photo editor `flushTrash` |
| Pembatalan proses | Known limitation | Pemrosesan synchronous di main thread; tidak ada tombol cancel (file besar tetap terlindungi guard double-click) |

---

## 5. Performance & Stability

| Uji | Status | Catatan |
|---|---|---|
| Memory: konversi berurutan (bukan paralel) | Passed | `convertAllImages` kini `await` per file |
| Memory: object URL leak | Passed | Leak lama di preview PDF & download dibersihkan |
| JavaScript errors di console | Passed | Nol error setelah seluruh rangkaian uji (hanya warning Tailwind CDN dev) |
| Missing assets / 404 | Passed | Tidak ada |
| Library gagal dimuat (offline) | Passed | Fallback offline page + banner; tool berjalan dari cache |
| Browser freeze pada file besar | Passed | Gambar 3000×4000 & PDF 1.14 MB diproses tanpa hang |

---

## 6. PWA

| Uji | Status | Catatan |
|---|---|---|
| Manifest ter-load | Passed | `link[rel=manifest]` valid |
| Service worker ter-registrasi | Passed | Scope `./`, controller aktif |
| App shell ter-cache | Passed | 21 file di `morphpdf-static-v1.0.0` |
| Offline reload homepage | Passed | UI penuh dari cache + banner offline |
| Offline konversi gambar | Passed | Upload → WEBP → unduh, tanpa jaringan |
| Offline PDF to Image (CDN pdf.js) | Passed | 3 halaman dari runtime cache |
| Install button (Chromium) | Passed | Muncul via `beforeinstallprompt`, prompt() dipanggil tanpa error |
| Maskable icons | Passed | 192 & 512, safe zone 60% |
| Lighthouse audit | Not tested | Butuh Chrome beraksibilitas penuh; lihat docs/PWA.md §Verifikasi |
| Install di iOS/Safari nyata | Not tested | Perangkat fisik tidak tersedia di lingkungan uji |

---

## 7. Visual & Responsif

| Uji | Status | Catatan |
|---|---|---|
| Desktop 1440 / laptop 1280 / tablet 768 / mobile 390 | Passed | Screenshot direview per breakpoint |
| Horizontal overflow | Passed | `scrollWidth == innerWidth` di semua breakpoint |
| Navbar responsif | Passed | Logo + Install button tidak mengganggu layout |
| Logo baru tajam (navbar, footer, favicon, ikon) | Passed | SVG di semua ukuran |

## Ringkasan

- **Passed**: 45 pengujian.
- **Failed**: 0 (2 temuan diperbaiki saat audit: header kompresi tidak jujur saat hasil membesar; toast rentan HTML injection dari nama file).
- **Not tested**: Lighthouse penuh, instalasi nyata di iOS.
- **Known limitation**: resize bebas di Photo Editor, TXT teks bebas & PDF scan di File to Excel (ditolak dengan pesan, bukan output palsu), tidak ada tombol cancel proses.
