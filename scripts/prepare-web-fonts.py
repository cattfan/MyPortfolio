"""Build WOFF2 subsets. Install scripts/requirements-assets.txt to regenerate."""
from pathlib import Path
import unicodedata
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1]
FONTS = ROOT / 'apps/web/app/fonts'
RANGES = [(0x20, 0x250), (0x300, 0x370), (0x1E00, 0x1F00), (0x2000, 0x2070), (0x20A0, 0x20D0), (0x2190, 0x2200)]
UNICODES = {c for start, end in RANGES for c in range(start, end)}
VIETNAMESE = 'Đỗ Hiền Dinh Việt Nam Đà Lạt Công nghệ Kinh nghiệm ứng dụng cơ sở dữ liệu Ăă Ââ Êê Ôô Ơơ Ưư Đđ'
FILES = ['Geist-Regular', 'Newsreader-Regular', 'Newsreader-Italic', 'SourceSerif4-Regular', 'SourceSerif4-Italic']
for name in FILES:
    font = TTFont(FONTS / f'{name}.ttf', recalcTimestamp=False)
    if name != 'Geist-Regular' and 'fvar' in font:
        axes = {axis.axisTag: (400 if axis.axisTag == 'wght' else 24) for axis in font['fvar'].axes}
        font = instantiateVariableFont(font, axes, inplace=True)
    options = subset.Options()
    options.flavor = 'woff2'
    options.layout_features = ['*']
    options.recalc_timestamp = False
    sub = subset.Subsetter(options=options)
    sub.populate(unicodes=UNICODES)
    sub.subset(font)
    font.flavor = 'woff2'
    target = FONTS / f'{name}.woff2'
    font.save(target)
    cmap = TTFont(target).getBestCmap()
    assert all(ord(c) in cmap for c in unicodedata.normalize('NFC', VIETNAMESE))
    print(f'FONT_PASS: {name}; {target.stat().st_size} bytes; Vietnamese glyphs present')
