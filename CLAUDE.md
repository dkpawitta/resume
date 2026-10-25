# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A trilingual (Thai / English / Chinese) resume and TikTok portfolio site for
Pawitta Donklai. Static, no build step, no dependencies, no test suite —
deployed to GitHub Pages from `main` / root (`.nojekyll` is present).

## Commands

There is nothing to build, lint, or test. To preview:

```bash
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173/`. Serving over HTTP matters: opening
`file://` works for the page itself, but the TikTok oEmbed lookup and the
embedded player behave differently off-origin.

To re-encode a source video into a web-sized MP4 for `video/`:

```bash
./tools/convert-video.sh clip.mov
```

Writes `clip-web.mp4` next to the input; `CRF=30` for a smaller file. Needs ffmpeg.

## Architecture

Four files, loaded in this order:

- `index.html` — markup only. Sections are empty shells (`<div id="clips">`,
  `<div id="jobs">`, …) that the script fills in.
- `style.css` — all styling and the theme tokens.
- `data.js` — the `DATA` object: all content.
- `app.js` — all behavior.

`data.js` and `app.js` are **classic scripts, not ES modules**. Top-level
`const DATA` in a classic script lands in the shared global lexical scope, so
`app.js` reads it directly with no import. Keep it that way unless there's a
reason to add a build step — switching to modules would also break `file://`.

The small inline `<script>` in `<head>` applies the saved theme before first
paint. It must stay inline or the page flashes the wrong theme on load.

### Content lives in `DATA`

Nearly every content change is an edit to `DATA` in `data.js`. Top-level keys:
`contact`, `ui`, `creds`, `figures`, `account`, `types`, `clips`, `reels`,
`jobs`, `events`, `education`, `skills`, `languages`.

### Translation convention

Any translatable value is an object `{ th, en, zh }`. `t(v)` unwraps it for the
current `lang` (falling back to `th`); `ui(key)` is `t(DATA.ui[key])`.

`t()` returns arrays **unchanged** — so a translated list must be
`{ th: [...], en: [...], zh: [...] }`, one object wrapping three arrays, never
an array of per-item objects. `t(job.points)` relies on this.

Fixed labels in `index.html` carry `data-t="uiKey"` and are filled by
`renderStatic()`. Adding a label means adding a `DATA.ui` key plus the
attribute — not hardcoded text in the markup.

### Rendering

Rendering is full-replacement `innerHTML`, not incremental DOM:

- `renderStatic()` — nav, hero, figures, account strip, filters, sort, reels,
  jobs, skills panel, contact rows; also calls `renderEvents()`.
- `renderClips()` — the clip grid, re-run on filter and sort changes.
- `renderEvents()` — re-run when a gallery is expanded or collapsed.

`setLang()` re-runs `renderStatic()` + `renderClips()` wholesale.

Because everything is built as HTML strings, **any interpolated text must go
through `esc()`**. `img(name)` expands a bare name to `img/<name>.webp`, so
`DATA` references images by name only — no directory, no extension.

### Interaction

One delegated `click` listener on `document` dispatches on `data-*`
attributes: `data-l` (language), `data-theme-set`, `data-f` (filter),
`data-play` (TikTok embed), `data-video` (local MP4), `data-lb` (lightbox),
`data-more` (expand gallery), `data-copy`. New interactions should add a data
attribute and a branch there rather than a new listener.

Lightbox gallery keys are **positional**: `e<eventIndex>` and
`e<eventIndex>c<clientIndex>`, parsed back into `DATA.events` by
`photoList()`. Reordering `DATA.events` silently repoints every key, including
the `openGalleries` expand state.

### TikTok playback

`CAN_EMBED` is false inside a frame, which disables in-page playback and falls
back to plain links. Full `/video/` and `/photo/` URLs yield an ID by regex;
short `vt.tiktok.com` links have none, so `resolveShortLinks()` asks TikTok's
oEmbed endpoint, caches results in `localStorage`, and re-renders. That fetch
is CORS-blocked on localhost — the link fallback on a local preview is
expected, not a bug.

### Theme

Three-way light / dark / auto. "Auto" means *removing* `data-theme` from
`<html>` and letting `prefers-color-scheme` decide. The palette is therefore
declared in three places in `style.css`: bare `:root`, the
`prefers-color-scheme: dark` block guarded by `:root:not([data-theme="light"])`,
and `:root[data-theme="dark"]`. Changing a color means changing all three.

`localStorage` keys in use: `pd-theme`, `pd-lang`, `pd-tk-ids`.
