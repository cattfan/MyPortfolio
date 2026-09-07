"""Build the GitHub preview GIF from profile-preview.mjs captures."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[2]
frames=[Image.open(p).convert("RGB") for p in sorted((root/"output/profile-preview").glob("*.png"))]
assert len(frames)==37
# A shared palette avoids color flicker between frames.
contact=Image.new("RGB",(880,frames[0].height*4))
for i,j in enumerate([0,12,24,36]):contact.paste(frames[j],(0,i*frames[0].height))
palette=contact.quantize(colors=128,method=Image.Quantize.MEDIANCUT)
frames=[frame.quantize(palette=palette,dither=Image.Dither.NONE) for frame in frames]
duration=[120]*len(frames)
for i in [0,12,24,36]:duration[i]=1700
target=root/"docs/github-profile/assets/portfolio.gif"
frames[0].save(target,save_all=True,append_images=frames[1:],duration=duration,loop=0,optimize=True,disposal=1)
with Image.open(target) as gif:
    assert gif.n_frames==37
    print(f"GIF_PASS: {gif.n_frames} frames; {gif.width}x{gif.height}; {target.stat().st_size} bytes")
