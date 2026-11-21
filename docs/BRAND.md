# MorphPDF — Brand Guidelines

Identitas visual logo MorphPDF: **"the morphing document"**.

## Konsep

Satu lembar dokumen yang terbelah oleh band diagonal — metafora transformasi
format file:

- **Charcoal `#302D28`** (kiri-atas): dokumen asli, dengan dua garis teks
  samar (konten).
- **Band krem `#F7F4ED`**: zona transformasi, ditembusi **panah charcoal**
  yang menunjuk ke arah hasil.
- **Warm apricot `#E9B978`** (kanan-bawah): file hasil konversi.

Siluet dasar adalah lembar dokumen dengan sudut atas-kanan terpotong miring
(pangkal pen). Simbol dibangun dari geometri terkomputasi (band & panah
sejajar diagonal lembar) sehingga tetap presisi di semua ukuran — hingga 16px
favicon.

## Variasi

| Varian | File | Penggunaan |
|---|---|---|
| Logo utama (symbol + wordmark + tagline) | `assets/brand/logo.svg` | README, dokumentasi, OG image |
| Symbol saja — light background | `assets/brand/logo-symbol.svg` | Navbar, favicon, PWA icon |
| Symbol saja — dark background | `assets/brand/logo-symbol-dark.svg` | Background gelap |
| Favicon | `favicon.svg` (32 `favicon-32.png`) | Browser tab |
| PWA icon (any) | `assets/icons/icon-{192,512}.png` | Install prompt, task switcher |
| PWA icon (maskable) | `assets/icons/icon-maskable-{192,512}.png` | Android adaptive icon |
| Apple touch icon | `apple-touch-icon.png` (180) | iOS home screen |
| Compact (navbar) | Inline SVG di `index.html` | 30px di navbar, 26px di footer |

## Wordmark

- Font: **Inter** (fallback Manrope → system sans). Tidak memakai font dekoratif.
- "Morph" charcoal `#302D28`, "PDF" amber `#C98D50`.
- Tagline (opsional, pada lockup penuh): `IMAGE · PDF · DOCUMENT TOOLS`
  dalam `#777168`, letter-spacing lebar.

## Aturan penggunaan

1. Jangan mengubah warna brand: charcoal `#302D28`, apricot `#E9B978`,
   cream `#F7F4ED`, amber `#C98D50`.
2. Jangan menaruh logo di atas background ber-tekstur sibuk; gunakan varian
   dark pada latar gelap.
3. Jangan menambahkan gradient, glow, atau shadow.
4. Beri ruang kosong minimal sebesar 25% lebar simbol di sekeliling logo.
5. Monochrome: gunakan versi *dark* (semua charcoal) pada latar terang atau
   sebaliknya; band dan panah tetap terbaca.

## Regenerasi aset

Ikon raster diregenerasi dari `logo-symbol.svg` dengan skrip
`scripts/make-icons.py` (repo pengembangan; memakai cairosvg):

```bash
python3 scripts/make-icons.py
```
