# resume

Resume and TikTok portfolio site for Pawitta Donklai (ปวิตตา ดอนกลาย · 王丽纯), in Thai, English and Chinese.

A single static page: `index.html` plus images in `img/`. No build step.

## Editing content

All text, clips, jobs and events live in the `DATA` object at the top of the `<script>` in `index.html`. Every text field has `th`, `en` and `zh` values.

- **Add a clip:** put the cover image in `img/` (e.g. `img/clip-34.webp`) and add an entry to `DATA.clips` with its TikTok Studio stats.
- **Play clips on the page:** set the clip's `link` to the full TikTok URL, e.g. `https://www.tiktok.com/@lifp_thailand/video/7xxxxxxxxxxxxxxxxxx`. Short `vt.tiktok.com` links only open TikTok in a new tab. Embedded playback works when the page is opened as its own site (GitHub Pages), not inside another frame.

## Publishing with GitHub Pages

Settings → Pages → Build and deployment → Deploy from a branch → `main` / root. The site will be at `https://dkpawitta.github.io/resume/`.
