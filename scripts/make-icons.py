"""Generate MorphPDF brand SVGs + PWA icon rasters with exact geometry.

Symbol concept: "the morphing document" - one document sheet split by a
diagonal transform band. Charcoal = original file, warm apricot = result,
charcoal arrow on the cream band = the transformation.

Geometry is computed (not hand-tuned) so the band, arrow and regions stay
aligned at any scale.
"""
import math, cairosvg, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHARCOAL = "#302D28"
APRICOT  = "#E9B978"
CREAM    = "#F7F4ED"

# --- sheet geometry (viewBox 0 0 64 64) -------------------------------
SHEET = "M16 4 H40 L56 20 V52 A8 8 0 0 1 48 60 H16 A8 8 0 0 1 8 52 V12 A8 8 0 0 1 16 4 Z"

# diagonal of the sheet: from bottom-left corner (8,60) to the fold point (56,20)
P0 = (8.0, 60.0)
P1 = (56.0, 20.0)
dx, dy = P1[0] - P0[0], P1[1] - P0[1]
L = math.hypot(dx, dy)
u = (dx / L, dy / L)                    # along diagonal (up-right)
n = (-u[1], u[0])                       # perpendicular, pointing down-right

def offset_point(p, d):
    return (p[0] + n[0] * d, p[1] + n[1] * d)

BAND_W = 9.0          # cream band width
HALF = BAND_W / 2

def fmt(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")

def polygon_below_diagonal(offset):
    """Half-plane polygon covering everything below the diagonal (offset
    toward bottom-right by `offset` px); clipped to the sheet later."""
    a = offset_point((P0[0] - 6, P0[1] + 6 * 0.8333), offset)
    b = offset_point((P1[0] + 8, P1[1] - 8 * 0.8333), offset)
    far = 90.0  # reach far beyond the sheet so the whole half is covered
    c = (b[0] + n[0] * far, b[1] + n[1] * far)
    d = (a[0] + n[0] * far, a[1] + n[1] * far)
    pts = [a, b, c, d]
    return "M" + " L".join(f"{fmt(x)} {fmt(y)}" for x, y in pts) + " Z"

def arrow_shaft(t0, t1, inset):
    """Shaft along the diagonal between param t0..t1, inset from center."""
    a = (P0[0] + dx * t0 + n[0] * inset, P0[1] + dy * t0 + n[1] * inset)
    b = (P0[0] + dx * t1 + n[0] * inset, P0[1] + dy * t1 + n[1] * inset)
    return a, b

def arrow_head(tip_t, base_t, half_w, inset):
    tip = (P0[0] + dx * tip_t + n[0] * inset, P0[1] + dy * tip_t + n[1] * inset)
    base = (P0[0] + dx * base_t + n[0] * inset, P0[1] + dy * base_t + n[1] * inset)
    p1 = (base[0] + n[0] * half_w, base[1] + n[1] * half_w)
    p2 = (base[0] - n[0] * half_w, base[1] - n[1] * half_w)
    return "M" + " L".join(f"{fmt(x)} {fmt(y)}" for x, y in [tip, p1, p2]) + " Z"

def symbol_svg(sheet_fill, band_stroke, arrow_fill, band_w=9.0, arrow_scale=1.0):
    band_w_local = band_w
    half = band_w_local / 2
    apricot_poly = polygon_below_diagonal(half)      # apricot starts exactly at band edge
    s0, s1 = arrow_shaft(0.22, 0.50, 0)
    head = arrow_head(0.60, 0.42, 4.0 * arrow_scale, 0)
    shaft = (f"M{fmt(s0[0])} {fmt(s0[1])} L{fmt(s1[0])} {fmt(s1[1])}")
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="MorphPDF">
  <defs>
    <clipPath id="mp-sheet"><path d="{SHEET}"/></clipPath>
  </defs>
  <path d="{SHEET}" fill="{sheet_fill}"/>
  <g clip-path="url(#mp-sheet)">
    <path d="{apricot_poly}" fill="{APRICOT}"/>
    <path d="M{P0[0]} {P0[1]} L{P1[0]} {P1[1]}" stroke="{band_stroke}" stroke-width="{band_w_local}"/>
    <path d="{shaft}" stroke="{arrow_fill}" stroke-width="{fmt(4.0 * arrow_scale)}" stroke-linecap="round" fill="none"/>
    <path d="{head}" fill="{arrow_fill}" stroke="{arrow_fill}" stroke-width="{fmt(1.6 * arrow_scale)}" stroke-linejoin="round"/>
  </g>
  <rect x="14.5" y="13.5" width="19" height="3.8" rx="1.9" fill="{arrow_fill}" opacity="0.5"/>
  <rect x="14.5" y="21.5" width="13" height="3.8" rx="1.9" fill="{arrow_fill}" opacity="0.3"/>
</svg>
'''

# --- brand SVG files ---------------------------------------------------
os.makedirs(f"{BASE}/assets/brand", exist_ok=True)
os.makedirs(f"{BASE}/assets/icons", exist_ok=True)

open(f"{BASE}/assets/brand/logo-symbol.svg", "w").write(
    symbol_svg(CHARCOAL, CREAM, CHARCOAL))          # arrow charcoal on cream band
open(f"{BASE}/assets/brand/logo-symbol-dark.svg", "w").write(
    symbol_svg(CREAM, CHARCOAL, CREAM))             # arrow cream on charcoal band
open(f"{BASE}/favicon.svg", "w").write(
    symbol_svg(CHARCOAL, CREAM, CHARCOAL))

# --- raster icons ------------------------------------------------------
def icon_svg(scale_pct):
    inner = 64 * scale_pct / 100
    pad = (64 - inner) / 2
    sym = symbol_svg(CHARCOAL, CREAM, CHARCOAL)
    # wrap inner content: add transform group right after opening <svg ...>
    sym = sym.replace('>', f'><g transform="translate({pad:.2f} {pad:.2f}) scale({inner/64:.4f})">', 1)
    sym = sym.replace('</svg>\n', '</g></svg>\n', 1)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="{CREAM}"/>{sym}</svg>'

jobs = [
    ("assets/icons/icon-192.png",          192, 74),
    ("assets/icons/icon-512.png",          512, 74),
    ("assets/icons/icon-maskable-192.png", 192, 60),
    ("assets/icons/icon-maskable-512.png", 512, 60),
    ("apple-touch-icon.png",               180, 74),
    ("favicon-32.png",                      32, 74),
]
for out, size, scale in jobs:
    cairosvg.svg2png(bytestring=icon_svg(scale).encode(),
                     write_to=f"{BASE}/{out}", output_width=size, output_height=size)
    print("wrote", out, size)

print("done")
