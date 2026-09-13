# Font and CV assets

The site serves local WOFF2 files with Latin, Vietnamese, combining accents,
punctuation and arrow glyphs. Original fonts and OFL licenses are retained in
`apps/web/app/fonts`. The Geist source revision is recorded in `Geist-source.txt`.
Serif web fonts use weight 400 and optical size 24; Geist retains variable weight.

To regenerate assets, install the optional Python tools:

```sh
python -m pip install -r scripts/requirements-assets.txt
python scripts/prepare-web-fonts.py
python scripts/prepare-resume.py
```

The CV script creates one-page Vietnamese and English PDFs in `output/pdf` and
copies them to `apps/web/public/cv`. Names and contacts come from portfolio content;
project copy in the script is intentionally limited to verified responsibilities.
Update both CV languages alongside project descriptions. Inspect rendered pages
and check selectable text before publishing. Employment dates and usage metrics
must come from confirmed information.

`build:static` includes only the two named CV PDFs in its public asset allowlist.
Font source files and intermediate PDF fonts are not copied into the deployment.
