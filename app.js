/* ============================================================
   RENDER
   ============================================================ */
let lang = "th";
let filter = "all";
let sortKey = "views";
const openGalleries = new Set();
const $ = (s) => document.querySelector(s);
const t = (o) => (o && typeof o === "object" && !Array.isArray(o)) ? (o[lang] ?? o.th) : o;
const ui = (k) => t(DATA.ui[k]);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const img = (name) => `img/${name}.webp`;
const fmt = (n) => n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace(/\.0$/, "") + "K" : String(n);
const locale = () => ({ th: "th-TH", en: "en-GB", zh: "zh-CN" }[lang]);
/* Embedded players only work when the page is the top-level site (GitHub Pages etc.), not inside a sandboxed frame */
const CAN_EMBED = (() => { try { return window.self === window.top; } catch (e) { return false; } })();
const resolvedIds = {};
const videoId = (url) => ((url || "").match(/\/(?:video|photo)\/(\d+)/) || [])[1] || resolvedIds[url] || null;

/* Short links (vt.tiktok.com) carry no video ID: ask TikTok's oEmbed endpoint for it, remember the answer, and fall back to the plain link if it fails */
async function resolveShortLinks() {
  if (!CAN_EMBED) return;
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem("pd-tk-ids") || "{}"); } catch (e) {}
  const pending = DATA.clips.map((c) => c.link).filter((l) => l && !/\/(video|photo)\/\d+/.test(l));
  pending.forEach((l) => { if (/^\d+$/.test(cache[l] || "")) resolvedIds[l] = cache[l]; });
  const todo = pending.filter((l) => !resolvedIds[l]);
  if (todo.length) {
    await Promise.allSettled(todo.map(async (l) => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      try {
        const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(l)}`, { signal: ctrl.signal });
        if (!res.ok) return;
        const j = await res.json();
        const id = String(j.embed_product_id || (String(j.html || "").match(/data-video-id="(\d+)"/) || [])[1] || "");
        if (/^\d+$/.test(id)) resolvedIds[l] = id;
      } finally { clearTimeout(timer); }
    }));
    try { localStorage.setItem("pd-tk-ids", JSON.stringify(resolvedIds)); } catch (e) {}
  }
  if (Object.keys(resolvedIds).length) renderClips();
}
const fmtDate = (d) => new Intl.DateTimeFormat(locale(), { month: "short", year: "numeric" }).format(new Date(d + "T00:00:00"));

function copyBtn(value) {
  return `<button type="button" class="copy" data-copy="${esc(value)}">${esc(ui("copy"))}</button>`;
}
function contactRows() {
  const c = DATA.contact;
  return `
    <div class="contact-row"><span class="k">${esc(ui("kPhone"))}</span><span class="v">${esc(c.phone)}</span>${copyBtn(c.phone)}</div>
    <div class="contact-row"><span class="k">${esc(ui("kEmail"))}</span><span class="v">${esc(c.email)}</span>${copyBtn(c.email)}</div>
    <div class="contact-row"><span class="k">${esc(ui("kLinked"))}</span><a class="v" href="${esc(c.linkedin)}" target="_blank" rel="noopener">ปวิตตา ดอนกลาย ↗</a></div>`;
}

function renderStatic() {
  document.querySelectorAll("[data-t]").forEach((el) => { el.textContent = ui(el.dataset.t); });
  const ids = ["tiktok", "experience", "events", "skills", "contact"];
  $("#nav").innerHTML = ui("nav").map((label, i) => `<a href="#${ids[i]}">${esc(label)}</a>`).join("");
  $("#creds").innerHTML = DATA.creds.map((c) => `<span class="chip">${esc(t(c))}</span>`).join("");
  $("#contact-hero").innerHTML = contactRows();
  $("#contact-foot").innerHTML = contactRows();
  $("#theme").setAttribute("aria-label", ui("themeGroup"));
  document.querySelectorAll("#theme button").forEach((b) => {
    const label = ui({ light: "themeLight", dark: "themeDark", auto: "themeAuto" }[b.dataset.themeSet]);
    b.setAttribute("aria-label", label); b.title = label;
  });
  $("#figs").innerHTML = DATA.figures.map((f) =>
    `<div class="fig"><div class="n">${esc(f.n)}<small>${esc(t(f.u))}</small></div><div class="l">${esc(t(f.l))}</div></div>`).join("");

  const a = DATA.account;
  $("#acct").innerHTML = `
    <div class="acct-top"><a href="${esc(DATA.contact.tiktok)}" target="_blank" rel="noopener">${esc(a.handle)} ↗</a>
      <span>Likes ${esc(a.likesAll)} · Followers ${esc(a.followers)}</span><span>${esc(ui("acct365"))}</span></div>
    <div class="acct-m">
      <div><b>${esc(a.views365)}</b><span>${esc(ui("mViews"))}</span></div>
      <div><b>${esc(a.likes365)}</b><span>${esc(ui("mLikes"))}</span></div>
      <div><b>${esc(a.shares365)}</b><span>${esc(ui("mShares"))}</span></div>
      <div><b>${esc(a.followers)}</b><span>${esc(ui("mFollowers"))}</span></div>
    </div>`;

  const fkeys = ["all", ...Object.keys(DATA.types)];
  $("#filters").innerHTML = fkeys.map((k) =>
    `<button type="button" data-f="${k}" aria-pressed="${k === filter}">${esc(k === "all" ? ui("fAll") : t(DATA.types[k]))}</button>`).join("");
  $("#sort").innerHTML = [["views", "sViews"], ["new", "sNew"], ["full", "sFull"]].map(([v, k]) =>
    `<option value="${v}"${v === sortKey ? " selected" : ""}>${esc(ui(k))}</option>`).join("");

  $("#reels").innerHTML = DATA.reels.map((r, i) => r.video
    ? `<button type="button" data-video="${esc(r.video)}" data-poster="${img(r.img)}" aria-label="${esc(ui("play"))}: ${esc(ui("hReels"))} ${i + 1}"><img src="${img(r.img)}" alt="" loading="lazy" width="400" height="711"><span class="play" aria-hidden="true">▶</span></button>`
    : `<button type="button" data-lb="reels" data-i="${i}" aria-label="${esc(ui("hReels"))} ${i + 1}"><img src="${img(r.img)}" alt="" loading="lazy" width="400" height="711"></button>`).join("");

  $("#jobs").innerHTML = DATA.jobs.map((j) => `
    <article class="job">
      <div class="job-when">${esc(t(j.when))}</div>
      <div class="job-body">
        <div class="job-co">${esc(t(j.co))}</div>
        <div class="job-role">${esc(t(j.role))}</div>
        <ul>${t(j.points).map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
      </div>
    </article>`).join("");

  renderEvents();

  const s = DATA.skills;
  $("#panel").innerHTML = `
    <div><h3>${esc(ui("hEdu"))}</h3><div class="edu">${DATA.education.map((e) =>
      `<div><span class="y">${esc(e.y)}</span><b>${esc(t(e.school))}</b><span>${esc(t(e.detail))}</span></div>`).join("")}</div></div>
    <div><h3>${esc(ui("hSkill"))}</h3>
      ${[s.special, s.general].map((g) => `<div class="skill-g"><h4>${esc(t(g.h))}</h4><ul>${t(g.list).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}
      <div class="tool-chips">${s.tools.map((x) => `<span class="chip">${esc(x)}</span>`).join("")}</div>
    </div>
    <div><h3>${esc(ui("hLang"))}</h3><div class="langs">${DATA.languages.map((l) =>
      `<div><b>${esc(t(l.l))}</b><span>${esc(t(l.v))}</span></div>`).join("")}</div></div>`;
}

function galleryHTML(key, photos, limit) {
  const open = openGalleries.has(key);
  const shown = open || photos.length <= limit ? photos : photos.slice(0, limit);
  let html = `<div class="gallery">${shown.map((p, i) =>
    `<button type="button" data-lb="${key}" data-i="${i}" aria-label="${i + 1} / ${photos.length}"><img src="${img(p)}" alt="" loading="lazy"></button>`).join("")}</div>`;
  if (photos.length > limit) {
    html += `<button type="button" class="more" data-more="${key}">${esc(open ? ui("showLess") : ui("showAll").replace("{n}", photos.length))}</button>`;
  }
  return html;
}

function renderEvents() {
  $("#event-list").innerHTML = DATA.events.map((e, ei) => `
    <article class="event">
      <div class="event-head">
        <h3>${esc(t(e.title))}</h3>
        <div class="org">${esc(t(e.org))}</div>
        <p>${esc(t(e.desc))}</p>
      </div>
      ${e.subs ? `<div class="clients">${e.subs.map((s) => `
        <div class="client"><h4>${esc(t(s.title))}</h4>
          <div class="boxes">
            <div class="box"><span class="tag">${esc(ui("goal"))}</span><p>${esc(t(s.goal))}</p></div>
            <div class="box"><span class="tag">${esc(ui("process"))}</span><ul>${t(s.process).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
          </div>
        </div>`).join("")}</div>` : `
      <div class="boxes">
        <div class="box"><span class="tag">${esc(ui("goal"))}</span><p>${esc(t(e.goal))}</p></div>
        <div class="box"><span class="tag">${esc(ui("process"))}</span><ul>${t(e.process).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
      </div>`}
      ${galleryHTML(`e${ei}`, e.photos, 6)}
      ${e.clients ? `<div class="clients">${e.clients.map((c, ci) => `
        <div class="client"><h4>${esc(t(c.name))}</h4>${galleryHTML(`e${ei}c${ci}`, c.photos, 6)}</div>`).join("")}</div>` : ""}
    </article>`).join("");
}

function renderClips() {
  let list = DATA.clips.filter((c) => filter === "all" || c.types.includes(filter));
  const by = { views: (a, b) => b.views - a.views, new: (a, b) => b.date.localeCompare(a.date), full: (a, b) => b.full - a.full };
  list = [...list].sort(by[sortKey]);
  const ranked = [...DATA.clips].sort(by.views).slice(0, 3).map((c) => c.img);
  const total = list.reduce((s, c) => s + c.views, 0);
  $("#count").textContent = ui("count").replace("{n}", list.length).replace("{v}", fmt(total));
  $("#clips").innerHTML = list.map((c) => {
    const href = c.link || DATA.contact.tiktok;
    const rank = ranked.indexOf(c.img);
    const vid = CAN_EMBED ? videoId(c.link) : null;
    const coverInner = `
        <img src="${img(c.img)}" alt="" loading="lazy" width="400" height="530">
        <span class="views">▶ ${fmt(c.views)}</span>
        ${rank >= 0 ? `<span class="rank">TOP ${rank + 1}</span>` : ""}
        ${vid ? `<span class="play" aria-hidden="true">▶</span>` : ""}`;
    const actions = vid
      ? `<button type="button" class="clip-link" data-play="${vid}">${esc(ui(c.link.includes("/photo/") ? "playSlides" : "play"))}</button><a class="clip-ext" href="${esc(href)}" target="_blank" rel="noopener">${esc(ui("ext"))}</a>`
      : `<a class="clip-link" href="${esc(href)}" target="_blank" rel="noopener">${esc(!c.link ? ui("openCh") : c.link.includes("/photo/") ? ui("slides") : ui("watch"))}</a>`;
    return `
    <article class="clip">
      ${vid
        ? `<button type="button" class="clip-cover" data-play="${vid}" aria-label="${esc(ui("play"))}: ${esc(t(c.title))}">${coverInner}</button>`
        : `<a class="clip-cover" href="${esc(href)}" target="_blank" rel="noopener" aria-label="${esc(t(c.title))}">${coverInner}</a>`}
      <div class="clip-body">
        <div class="clip-types">${c.types.map((k) => `<span>${esc(t(DATA.types[k]))}</span>`).join("")}</div>
        <h3>${esc(t(c.title))}</h3>
        <div class="clip-date">${esc(fmtDate(c.date))}</div>
        <div class="clip-m">
          <div><b>${c.full}%</b><span>${esc(ui("full"))}</span></div>
          <div><b>${c.avg}s</b><span>${esc(ui("avg"))}</span></div>
          <div><b>+${fmt(c.fol)}</b><span>${esc(ui("newFol"))}</span></div>
        </div>
        <details><summary>${esc(ui("detail"))}</summary>
          <p><b>${esc(ui("topic"))}:</b> ${esc(t(c.topic))}</p>
          <p><b>${esc(ui("target"))}:</b> ${esc(t(c.target))}</p>
        </details>
        <div class="clip-actions">${actions}</div>
      </div>
    </article>`;
  }).join("");
}

function setLang(l) {
  lang = l;
  document.documentElement.lang = { th: "th", en: "en", zh: "zh-CN" }[l];
  document.querySelectorAll("#lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.l === l)));
  try { localStorage.setItem("pd-lang", l); } catch (e) {}
  renderStatic();
  renderClips();
}

/* Lightbox */
let lbList = [], lbIdx = 0;
function photoList(key) {
  if (key === "reels") return DATA.reels.map((r) => r.img);
  const m = key.match(/^e(\d+)(?:c(\d+))?$/);
  const ev = DATA.events[+m[1]];
  return m[2] !== undefined ? ev.clients[+m[2]].photos : ev.photos;
}
function showLb() { $("#lb-img").src = img(lbList[lbIdx]); $("#lb-n").textContent = `${lbIdx + 1} / ${lbList.length}`; }
function openLb(key, i) { lbList = photoList(key); lbIdx = i; showLb(); $("#lb").showModal(); }
$("#lb-prev").addEventListener("click", () => { lbIdx = (lbIdx - 1 + lbList.length) % lbList.length; showLb(); });
$("#lb-next").addEventListener("click", () => { lbIdx = (lbIdx + 1) % lbList.length; showLb(); });
$("#lb-x").addEventListener("click", () => $("#lb").close());
$("#player-x").addEventListener("click", () => $("#player").close());
$("#player").addEventListener("click", (e) => { if (e.target.id === "player") $("#player").close(); });
$("#player").addEventListener("close", () => {
  $("#player-frame").removeAttribute("src");
  const v = $("#player-video"); v.pause(); v.removeAttribute("src"); v.load();
});
function openPlayer(kind, src, poster) {
  const frame = $("#player-frame"), v = $("#player-video");
  frame.hidden = kind !== "tiktok"; v.hidden = kind !== "video";
  if (kind === "tiktok") frame.src = src;
  else { v.poster = poster || ""; v.src = src; }
  $("#player").showModal();
  if (kind === "video") v.play().catch(() => {});
}
$("#lb").addEventListener("click", (e) => { if (e.target.id === "lb") $("#lb").close(); });
$("#lb").addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") $("#lb-next").click();
  if (e.key === "ArrowLeft") $("#lb-prev").click();
});

document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.l) setLang(b.dataset.l);
  else if (b.dataset.themeSet) setTheme(b.dataset.themeSet);
  else if (b.dataset.f) { filter = b.dataset.f; document.querySelectorAll("#filters button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); renderClips(); }
  else if (b.dataset.play) openPlayer("tiktok", `https://www.tiktok.com/player/v1/${b.dataset.play}?autoplay=1&rel=0`);
  else if (b.dataset.video) openPlayer("video", b.dataset.video, b.dataset.poster);
  else if (b.dataset.lb) openLb(b.dataset.lb, +b.dataset.i);
  else if (b.dataset.more) { const k = b.dataset.more; openGalleries.has(k) ? openGalleries.delete(k) : openGalleries.add(k); renderEvents(); }
  else if (b.dataset.copy !== undefined) {
    const done = () => { b.textContent = ui("copied"); setTimeout(() => { b.textContent = ui("copy"); }, 1500); };
    const fallback = () => { const r = document.createRange(); r.selectNodeContents(b.previousElementSibling); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    try { navigator.clipboard.writeText(b.dataset.copy).then(done, fallback); } catch (err) { fallback(); }
  }
});
$("#sort").addEventListener("change", (e) => { sortKey = e.target.value; renderClips(); });

function setDrawer(open) {
  $("#drawer").classList.toggle("open", open);
  $("#drawer-overlay").classList.toggle("open", open);
  $("#drawer-overlay").hidden = !open;
  $("#hamburger").setAttribute("aria-expanded", String(open));
}
$("#hamburger").addEventListener("click", () => setDrawer(!$("#drawer").classList.contains("open")));
$("#drawer-overlay").addEventListener("click", () => setDrawer(false));
$("#drawer").addEventListener("click", (e) => { if (e.target.closest("#nav a")) setDrawer(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setDrawer(false); });
window.addEventListener("resize", () => { if (window.innerWidth > 760) setDrawer(false); });

function setTheme(mode) {
  if (mode === "light" || mode === "dark") document.documentElement.dataset.theme = mode;
  else delete document.documentElement.dataset.theme;
  document.querySelectorAll("#theme button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.themeSet === mode)));
  try { mode === "auto" ? localStorage.removeItem("pd-theme") : localStorage.setItem("pd-theme", mode); } catch (e) {}
}
setTheme(document.documentElement.dataset.theme || "auto");

let saved = null;
try { saved = localStorage.getItem("pd-lang"); } catch (e) {}
setLang(["th", "en", "zh"].includes(saved) ? saved : "th");
resolveShortLinks();
