/* نشّف — local storage layer (no network, no accounts).
   - IndexedDB database "nashef" holds every record. The app reads from an in-memory copy loaded at start.
   - Every change is first written synchronously to a small localStorage journal, then to IndexedDB.
     If the app is closed before IndexedDB finishes, the journal is replayed on the next launch.
     If IndexedDB fails, the change stays in the journal and the user is warned; nothing is dropped silently.
   - Before a restore replaces the data, the current data is kept as a snapshot that can be brought back. */
"use strict";
const Store = (() => {
  const DB_NAME = "nashef", DB_VERSION = 1, J = "nashef-local:j:";
  const DOC_RE = /^(settings|program|weights|measures|lifts|(food|wo)-\d{4}-\d{2}-\d{2})$/;
  const isObj = o => o !== null && typeof o === "object" && !Array.isArray(o);
  const clone = v => v == null ? null : JSON.parse(JSON.stringify(v));
  let db = null, mem = {}, meta = {}, mode = "loading", lastError = "", queue = new Map(), writing = false;
  let statusCb = () => {};
  const status = () => ({ mode, pending: queue.size + journalKeys().length, error: lastError, meta: { ...meta } });
  const emit = () => statusCb(status());

  /* ---------- IndexedDB helpers ---------- */
  const req2p = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const txDone = t => new Promise((res, rej) => { t.oncomplete = () => res(); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error || new Error("abort")); });
  function openDB(){
    return new Promise((res, rej) => {
      if(!self.indexedDB) return rej(new Error("المتصفح ما يوفّر IndexedDB"));
      let r; try{ r = indexedDB.open(DB_NAME, DB_VERSION); }catch(e){ return rej(e); }
      const t = setTimeout(() => rej(new Error("IndexedDB ما استجاب")), 8000);
      r.onupgradeneeded = () => {
        const d = r.result;
        if(!d.objectStoreNames.contains("docs")) d.createObjectStore("docs");
        if(!d.objectStoreNames.contains("meta")) d.createObjectStore("meta");
        if(!d.objectStoreNames.contains("snapshots")) d.createObjectStore("snapshots");
      };
      r.onsuccess = () => { clearTimeout(t); const d = r.result; d.onversionchange = () => d.close(); res(d); };
      r.onerror = () => { clearTimeout(t); rej(r.error); };
      r.onblocked = () => { clearTimeout(t); rej(new Error("قاعدة البيانات مقفلة من نافذة ثانية")); };
    });
  }
  async function readAll(storeName){
    const t = db.transaction(storeName, "readonly"), s = t.objectStore(storeName);
    const [keys, vals] = await Promise.all([req2p(s.getAllKeys()), req2p(s.getAll())]);
    const out = {}; keys.forEach((k, i) => out[k] = vals[i]); return out;
  }
  async function putMeta(k, v){ meta[k] = v; if(db){ const t = db.transaction("meta", "readwrite"); t.objectStore("meta").put(v, k); await txDone(t); } else lsSet("nashef-local:meta", meta); emit(); }

  /* ---------- journal (synchronous, survives a sudden close) ---------- */
  function lsSet(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } }
  function journalKeys(){ const out = []; try{ for(let i=0;i<localStorage.length;i++){ const k = localStorage.key(i); if(k && k.startsWith(J)) out.push(k); } }catch(e){} return out; }
  const journalWrite = (k, v) => lsSet(J + k, { v, t: Date.now() });
  const journalDrop = k => { try{ localStorage.removeItem(J + k); }catch(e){} };

  /* ---------- write queue: one IndexedDB transaction per batch, retried with backoff ---------- */
  let backoff = 0;
  async function drain(){
    if(writing || !db) return;
    writing = true;
    try{
      while(queue.size){
        const batch = new Map(queue); queue.clear();
        try{
          const t = db.transaction("docs", "readwrite"), s = t.objectStore("docs");
          for(const [k, v] of batch) v === null ? s.delete(k) : s.put(v, k);
          await txDone(t);
          for(const [k, v] of batch) if(!queue.has(k)) journalDrop(k);
          lastError = ""; backoff = 0;
        }catch(e){
          for(const [k, v] of batch) if(!queue.has(k)) queue.set(k, v);
          lastError = (e && e.name === "QuotaExceededError") ? "مساحة التخزين ممتلئة" : "تعذّر الحفظ في قاعدة البيانات (" + ((e && (e.name || e.message)) || "خطأ") + ")";
          emit();
          backoff = Math.min(backoff ? backoff * 2 : 1000, 30000);
          setTimeout(drain, backoff);
          return;
        }
      }
    } finally { writing = false; emit(); }
  }

  /* ---------- migration from older versions on this same site ---------- */
  function legacyDocs(){
    const found = {}; let source = "";
    try{
      for(let i=0;i<localStorage.length;i++){
        const k = localStorage.key(i); if(!k) continue;
        let m;
        if(k.startsWith("cut_") && DOC_RE.test(k.slice(4))){ const v = JSON.parse(localStorage.getItem(k)); if(isObj(v)){ found[k.slice(4)] = v; source = "localStorage"; } }
        else if((m = /^nashef:[0-9a-f-]{36}:d:(.+)$/.exec(k)) && DOC_RE.test(m[1])){ const v = JSON.parse(localStorage.getItem(k)); if(v && isObj(v.data)){ found[m[1]] = v.data; source = source || "نسخة المزامنة"; } }
      }
    }catch(e){}
    return { docs: found, source };
  }

  async function open(){
    try{
      db = await openDB();
      mem = await readAll("docs"); meta = await readAll("meta"); mode = "idb";
    }catch(e){
      /* IndexedDB unavailable (private mode, very old iOS, storage blocked): keep working from localStorage and say so */
      db = null; mode = "fallback"; lastError = "قاعدة البيانات غير متاحة: " + (e && e.message || e) + ". البيانات تنحفظ مؤقتاً بطريقة أضعف، خذ نسخة احتياطية.";
      try{ meta = JSON.parse(localStorage.getItem("nashef-local:meta") || "{}") || {}; }catch(x){ meta = {}; }
      try{ mem = JSON.parse(localStorage.getItem("nashef-local:fallback") || "{}") || {}; }catch(x){ mem = {}; }
    }
    /* 1) replay the journal: changes made just before the app was closed */
    for(const jk of journalKeys()){
      try{ const k = jk.slice(J.length), e = JSON.parse(localStorage.getItem(jk)); if(DOC_RE.test(k)){ mem[k] = e.v; queue.set(k, e.v); } }catch(x){}
    }
    /* 2) first launch of this version: bring over data saved by the previous versions on this site */
    if(!meta.migrated){
      const { docs, source } = legacyDocs(), n = Object.keys(docs).length;
      if(n && !Object.keys(mem).length){ for(const [k, v] of Object.entries(docs)){ mem[k] = v; queue.set(k, v); journalWrite(k, v); } }
      await putMeta("migrated", { at: Date.now(), n: Object.keys(mem).length ? n : 0, source }).catch(() => {});
      meta.migratedNow = n && source ? n : 0;
    }
    if(mode === "fallback") persistFallback(); else drain();
    emit();
    return status();
  }
  function persistFallback(){ if(!lsSet("nashef-local:fallback", mem)) lastError = "مساحة التخزين ممتلئة. خذ نسخة احتياطية الحين."; else journalKeys().forEach(k => { try{ localStorage.removeItem(k); }catch(e){} }); queue.clear(); emit(); }

  function put(k, v){
    if(!DOC_RE.test(k) || !isObj(v)) return false;
    const c = clone(v); mem[k] = c;
    const journaled = journalWrite(k, c);
    if(mode === "fallback"){ persistFallback(); return !lastError; }
    queue.set(k, c); drain();
    return journaled || !!db;
  }
  const get = k => mem[k] != null ? clone(mem[k]) : null;
  const all = () => clone(mem) || {};
  async function flush(){
    for(let i=0;i<50 && (queue.size || writing);i++) await new Promise(r => setTimeout(r, 60));
    return queue.size === 0;
  }

  /* replace everything (restore). Keeps the previous data as a snapshot first. */
  async function replaceAll(docs){
    await flush();
    const before = all();
    if(mode === "fallback"){ lsSet("nashef-local:snapshot", { at: Date.now(), docs: before }); mem = clone(docs); persistFallback(); await putMeta("snapshotAt", Date.now()); return; }
    const t = db.transaction(["docs", "snapshots"], "readwrite");
    t.objectStore("snapshots").put({ at: Date.now(), docs: before }, "before-restore");
    const s = t.objectStore("docs"); s.clear();
    for(const [k, v] of Object.entries(docs)) s.put(v, k);
    await txDone(t);   // all or nothing: on failure the old data stays as it was
    mem = clone(docs); journalKeys().forEach(k => { try{ localStorage.removeItem(k); }catch(e){} });
    await putMeta("snapshotAt", Date.now());
  }
  async function snapshot(){
    if(mode === "fallback"){ try{ return JSON.parse(localStorage.getItem("nashef-local:snapshot") || "null"); }catch(e){ return null; } }
    const t = db.transaction("snapshots", "readonly"); return await req2p(t.objectStore("snapshots").get("before-restore")) || null;
  }
  async function undoRestore(){
    const s = await snapshot(); if(!s) return false;
    await replaceAll(s.docs); return true;
  }
  return { open, get, all, put, flush, replaceAll, snapshot, undoRestore, setMeta: putMeta, status,
    onStatus: cb => { statusCb = cb; }, DOC_RE };
})();
