"""Render portable SVG lettering with Vietnamese shaping and font-independent paths.

Install the optional tooling in requirements-profile.txt, then run from any folder.
Font licenses are retained under apps/web/app/fonts/ (Source Serif 4: SIL OFL).
"""
from io import BytesIO
from pathlib import Path
import sys
import unicodedata
import xml.etree.ElementTree as ET

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import uharfbuzz as hb

ROOT = Path(__file__).resolve().parents[2]
FONTS = ROOT / "apps/web/app/fonts"
OUTPUT = ROOT / "docs/github-profile/assets/banner.svg"
sys.stdout.reconfigure(encoding="utf-8")


def outlined_font(filename, axes):
    font = TTFont(FONTS / filename)
    if "fvar" in font:
        supported = {axis.axisTag for axis in font["fvar"].axes}
        font = instantiateVariableFont(font, {k: v for k, v in axes.items() if k in supported}, inplace=False)
    font.flavor = None
    stream = BytesIO()
    font.save(stream)
    shaped = hb.Font(hb.Face(stream.getvalue()))
    units = font["head"].unitsPerEm
    shaped.scale = (units, units)
    hb.ot_font_set_funcs(shaped)
    return font, shaped, units


SERIF = outlined_font("SourceSerif4-Regular.ttf", {"wght": 430, "opsz": 48})
SANS = outlined_font("GeistVF.woff", {"wght": 450})


def lettering(text, x, y, size, fill, family, max_width):
    font, shaped, units = family
    text = unicodedata.normalize("NFC", text)
    buffer = hb.Buffer()
    buffer.add_str(text)
    buffer.guess_segment_properties()
    buffer.language = "vi"
    hb.shape(shaped, buffer, {"kern": True, "liga": True})
    scale = size / units
    glyphs = font.getGlyphSet()
    names = font.getGlyphOrder()
    cursor_x = cursor_y = 0
    paths = []
    for info, pos in zip(buffer.glyph_infos, buffer.glyph_positions):
        assert info.codepoint != 0, f"Missing glyph in {text!r}"
        pen = SVGPathPen(glyphs)
        transform = (scale, 0, 0, -scale, x + (cursor_x + pos.x_offset) * scale, y - (cursor_y + pos.y_offset) * scale)
        glyphs[names[info.codepoint]].draw(TransformPen(pen, transform))
        if pen.getCommands():
            paths.append(f'<path d="{pen.getCommands()}"/>')
        cursor_x += pos.x_advance
        cursor_y += pos.y_advance
    width = cursor_x * scale
    assert width <= max_width, f"Text exceeds its layout area: {text!r} ({width:.1f}px)"
    print(f"LETTERING_PASS: {text}; {len(buffer.glyph_infos)} shaped glyphs; width={width:.1f}px")
    return f'<g fill="{fill}">{"".join(paths)}</g>'


name = lettering("Đỗ Hiền Dinh", 62, 168, 86, "#faf5e9", SERIF, 730)
role = lettering("Software Engineer", 66, 66, 21, "#c9d7cb", SANS, 530)
location = lettering("Đà Lạt, Việt Nam · 2 năm kinh nghiệm", 67, 239, 21, "#c0cfc0", SERIF, 670)
book_label = lettering("Portfolio", 924, 191, 27, "#775c40", SERIF, 235)

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="300" viewBox="0 0 1280 300" role="img" aria-labelledby="title desc">
<title id="title">Đỗ Hiền Dinh — Software Engineer</title>
<desc id="desc">Đà Lạt, Việt Nam. Hai năm kinh nghiệm phát triển phần mềm. Vietnamese text uses shaped vector outlines for consistent rendering.</desc>
<rect width="1280" height="300" rx="14" fill="#263f36"/>
<g fill="none" stroke="#a3b7a5" stroke-opacity=".12" stroke-width="1.2">
<path d="M812 0C724 101 946 173 852 300M831 0C743 101 965 173 871 300M850 0C762 101 984 173 890 300"/>
<path d="M1255 0C1140 85 1276 196 1194 300M1236 0C1121 85 1257 196 1175 300M1217 0C1102 85 1238 196 1156 300"/>
</g>
{role}
{name}
<path d="M66 197H725" stroke="#a6bba8" stroke-opacity=".25"/>
{location}
<path d="M887 56Q1018 38 1158 59L1174 232Q1034 212 901 234Z" fill="#152c24" opacity=".65"/>
<path d="M881 49Q1013 31 1153 53L1168 224Q1029 204 895 226Z" fill="#f0eadb"/>
<path d="M1019 43L1033 214" stroke="#c8bca3" stroke-width="3"/>
<path d="M1023 43L1037 214" stroke="#fff9ee" stroke-width="3"/>
<path d="M913 85L985 81M915 99L979 96M918 113L987 109" stroke="#a6ad91" stroke-width="2"/>
<path d="M1082 75C1062 112 1136 134 1100 181" fill="none" stroke="#a55d46" stroke-width="2" stroke-dasharray="4 5"/>
<circle cx="1100" cy="181" r="5" fill="#a55d46" stroke="#fff9ed" stroke-width="3"/>
{book_label}
</svg>'''
ET.fromstring(svg)
assert "<text" not in svg and "font-family" not in svg
OUTPUT.write_text(svg, encoding="utf-8", newline="\n")
print(f"BANNER_PASS: 1280x300; no external fonts; no live SVG text; {OUTPUT.stat().st_size} bytes")

mobile_name = lettering("Đỗ Hiền Dinh", 34, 132, 80, "#faf5e9", SERIF, 570)
mobile_role = lettering("Software Engineer", 38, 51, 24, "#c9d7cb", SANS, 555)
mobile_location = lettering("Đà Lạt, Việt Nam · 2 năm kinh nghiệm", 39, 220, 28, "#c0cfc0", SERIF, 550)
mobile = f'''<svg xmlns="http://www.w3.org/2000/svg" width="640" height="268" viewBox="0 0 640 268" role="img" aria-labelledby="title desc">
<title id="title">Đỗ Hiền Dinh — Software Engineer</title>
<desc id="desc">Đà Lạt, Việt Nam. Hai năm kinh nghiệm phát triển phần mềm.</desc>
<rect width="640" height="268" rx="14" fill="#263f36"/>
<g fill="none" stroke="#a3b7a5" stroke-opacity=".1" stroke-width="1.2">
<path d="M597 0C490 89 689 174 577 268M614 0C507 89 706 174 594 268M631 0C524 89 723 174 611 268"/>
</g>
{mobile_role}
{mobile_name}
<path d="M38 167H552" stroke="#a6bba8" stroke-opacity=".25"/>
{mobile_location}
</svg>'''
ET.fromstring(mobile)
assert "<text" not in mobile and "font-family" not in mobile
OUTPUT.with_name("banner-mobile.svg").write_text(mobile, encoding="utf-8", newline="\n")
print("MOBILE_BANNER_PASS: 640x268; complete Vietnamese glyphs; responsive lettering")
