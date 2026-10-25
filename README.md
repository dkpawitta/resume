# resume

Resume and TikTok portfolio site for Pawitta Donklai (ปวิตตา ดอนกลาย · 王丽纯), in Thai, English and Chinese.

A static site with no build step and no dependencies.

## Files

| File | What's in it |
| --- | --- |
| `index.html` | Markup only — section shells that the script fills in |
| `style.css` | All styling, including the light/dark theme tokens |
| `data.js` | The `DATA` object: every piece of content, in `th` / `en` / `zh` |
| `app.js` | Rendering, language switch, theme, filters, lightbox, TikTok player |
| `img/`, `video/` | Media |

`data.js` and `app.js` are plain scripts, not ES modules, so `DATA` is a shared
global and the page also opens straight from the filesystem. Keep the inline
theme script in `<head>` — it applies the saved theme before first paint.

## Editing content

Nearly every change is a change to `DATA` in `data.js`. Every text field has `th`, `en` and `zh` values.

- **Add a clip:** put the cover image in `img/` (e.g. `img/clip-34.webp`) and add an entry to `DATA.clips` with its TikTok Studio stats.
- **Play clips on the page:** set the clip's `link` to the full TikTok URL, e.g. `https://www.tiktok.com/@lifp_thailand/video/7xxxxxxxxxxxxxxxxxx`. Short `vt.tiktok.com` links only open TikTok in a new tab. Embedded playback works when the page is opened as its own site (GitHub Pages), not inside another frame.

## Previewing locally

```
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173/`. The TikTok oEmbed lookup for short links is
blocked by CORS on localhost and falls back to a plain link; it works on Pages.

## Publishing with GitHub Pages

Settings → Pages → Build and deployment → Deploy from a branch → `main` / root. The site will be at `https://dkpawitta.github.io/resume/`.
