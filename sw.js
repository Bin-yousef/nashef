/* نشّف — service worker (local-only).
   - Install downloads EVERY app file (pages, scripts, fonts, icons, all 78 photos) into one versioned cache.
     If any file fails, the install fails and the version already on the phone keeps working unchanged.
   - The app is always served from the cache, so it opens with no internet and never mixes old and new files.
   - A new version waits until the user taps "حدّث الحين" in the app (after the app has saved its data).
   - It never touches IndexedDB: your records are not part of any cache and survive every update. */
const VERSION = "nashef-local-4b3c5c2f0c";
const FILES = ["./", "app.js", "focus.js", "fx.js", "index.html", "manifest.webmanifest", "store.js", "fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2", "fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2", "fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2", "fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2", "fonts/ibm-plex-sans-arabic-latin-400-normal.woff2", "fonts/ibm-plex-sans-arabic-latin-500-normal.woff2", "fonts/ibm-plex-sans-arabic-latin-600-normal.woff2", "fonts/ibm-plex-sans-arabic-latin-700-normal.woff2", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "img/abroller.jpg", "img/ball_curl.jpg", "img/band_apart.jpg", "img/band_pullup.jpg", "img/bbcurl.jpg", "img/bench.jpg", "img/cable_crunch.jpg", "img/cable_curl.jpg", "img/cable_rdelt.jpg", "img/calf.jpg", "img/calf_press.jpg", "img/calf_seated.jpg", "img/captain.jpg", "img/cg_bench.jpg", "img/cg_pd.jpg", "img/chestm.jpg", "img/chinup.jpg", "img/crow.jpg", "img/curl_i.jpg", "img/db_bench.jpg", "img/db_curl.jpg", "img/db_fly.jpg", "img/db_ohp.jpg", "img/db_ohtri.jpg", "img/db_rdl.jpg", "img/db_row.jpg", "img/deadbug.jpg", "img/dips.jpg", "img/ez_curl.jpg", "img/face.jpg", "img/fly.jpg", "img/glute_bridge.jpg", "img/goblet.jpg", "img/hack.jpg", "img/hammer.jpg", "img/hipt.jpg", "img/hyper.jpg", "img/inc_bb.jpg", "img/inc_m.jpg", "img/inc_sm.jpg", "img/incdb.jpg", "img/iso_row.jpg", "img/knee.jpg", "img/lat.jpg", "img/lat_cable.jpg", "img/lat_seated.jpg", "img/latpd.jpg", "img/lcurl.jpg", "img/leg_raise.jpg", "img/lext.jpg", "img/lpress.jpg", "img/lunge.jpg", "img/m_bench.jpg", "img/m_ohp.jpg", "img/ohp.jpg", "img/ohtri.jpg", "img/pecdeck.jpg", "img/plank.jpg", "img/pullup.jpg", "img/pushd.jpg", "img/pushd_bar.jpg", "img/pushup.jpg", "img/rdelt.jpg", "img/rdl.jpg", "img/rear_lunge.jpg", "img/rev_curl.jpg", "img/rev_fly.jpg", "img/rope_hammer.jpg", "img/row.jpg", "img/sissy.jpg", "img/skull.jpg", "img/sl_bridge.jpg", "img/slcurl.jpg", "img/sm_squat.jpg", "img/split.jpg", "img/squat.jpg", "img/stepup.jpg", "img/tbar.jpg", "splash/375x812@3-dark.png", "splash/375x812@3-light.png", "splash/390x844@3-dark.png", "splash/390x844@3-light.png", "splash/393x852@3-dark.png", "splash/393x852@3-light.png", "splash/402x874@3-dark.png", "splash/402x874@3-light.png", "splash/414x896@2-dark.png", "splash/414x896@2-light.png", "splash/414x896@3-dark.png", "splash/414x896@3-light.png", "splash/428x926@3-dark.png", "splash/428x926@3-light.png", "splash/430x932@3-dark.png", "splash/430x932@3-light.png", "splash/440x956@3-dark.png", "splash/440x956@3-light.png"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(FILES.map(f => new Request(f, { cache: "reload" })))));
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("nashef-local-") && k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("message", event => { if (event.data === "activate") self.skipWaiting(); });

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;          // the app makes no outside requests
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req, { ignoreSearch: true }) || (req.mode === "navigate" ? await cache.match("./index.html") || await cache.match("./") : null);
    if (hit) return hit;
    try { return await fetch(req); }
    catch (e) { return new Response("غير متوفر بدون إنترنت", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }); }
  })());
});
