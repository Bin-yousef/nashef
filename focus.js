/* نشّف — interaction layer: focus workout mode with rest timer, swipe gestures. Loaded after app.js.
   Focus mode never stores anything itself: every number typed here is mirrored into the normal training card,
   so saving goes through the same autosave path as the rest of the app. */
"use strict";
(() => {
  const el = document.getElementById("focus"), body = document.getElementById("fc-body"), restEl = document.getElementById("fc-rest");
  let idx = 0, restEnd = 0, restTotal = 0, tick = null, lock = null, returnTo = null;
  const dayEx = () => getPlan().days[curDay()].ex;
  const src = (id, i, f) => document.querySelector(`#tr-body input[data-ex="${id}"][data-i="${i}"][data-f="${f}"]`);
  const valOf = (id, i, f) => { const s = src(id, i, f); return s ? s.value : ""; };
  const filled = (id, i) => parseFloat(norm(valOf(id, i, "r"))) > 0;
  const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  function drawProgress(){
    let done = 0, total = 0;
    dayEx().forEach(([id, , n]) => { for(let i = 0; i < n; i++){ total++; if(filled(id, i)) done++; } });
    document.getElementById("fc-bar").style.width = (total ? done / total * 100 : 0) + "%";
    document.getElementById("fc-count").textContent = `${AR(done)} / ${AR(total)} مجموعة`;
  }
  function draw(){
    const ex = dayEx(); idx = Math.max(0, Math.min(idx, ex.length - 1));
    const [id, name, n, reps, slot] = ex[idx], info = LIB[id], last = S.lifts && S.lifts[id];
    const wPh = info.time ? "—" : info.bw ? "إضافي" : "كجم", rPh = info.time ? "ثانية" : "تكرار";
    const rows = [...Array(n)].map((_, i) => `<div class="fc-set${filled(id, i) ? " ok" : ""}" data-set="${i}"><span>${AR(i + 1)}</span>
      <input aria-label="مجموعة ${i + 1} وزن" data-fx="${id}" data-i="${i}" data-f="w" type="text" autocomplete="off" inputmode="decimal" placeholder="${wPh}" value="${esc(valOf(id, i, "w"))}">
      <input aria-label="مجموعة ${i + 1} ${rPh}" data-fx="${id}" data-i="${i}" data-f="r" type="text" autocomplete="off" inputmode="numeric" placeholder="${rPh}" value="${esc(valOf(id, i, "r"))}">
      <button class="fc-ok" data-fdone="${i}" aria-label="تمت المجموعة ${i + 1}">${CHECK}</button></div>`).join("");
    body.innerHTML = `<div class="caption">تمرين ${AR(idx + 1)} من ${AR(ex.length)}</div>${shot(id, slot)}
      <div class="row between"><h2>${esc(name)}</h2><span class="pill">${AR(n)} × ${AR(reps)}</span></div>
      <p class="muted">${esc(nextHint(last, reps, info))}</p>
      <div class="fc-sets">${rows}</div>
      <ul class="fc-cues">${info.cue.map(c => `<li>${esc(c)}</li>`).join("")}</ul>`;
    document.getElementById("fc-prev").disabled = idx === 0;
    document.getElementById("fc-next").textContent = idx === ex.length - 1 ? "خلصت التمرين" : "التمرين التالي";
    body.scrollTop = 0; drawProgress();
  }
  body.addEventListener("input", e => {
    const inp = e.target.closest("input[data-fx]"); if(!inp) return;
    const s = src(inp.dataset.fx, inp.dataset.i, inp.dataset.f);
    if(s){ s.value = inp.value; queueWO(); }
    inp.closest(".fc-set").classList.toggle("ok", filled(inp.dataset.fx, +inp.dataset.i));
    drawProgress();
  });
  body.addEventListener("click", e => {
    const b = e.target.closest("[data-fdone]"); if(!b) return;
    const ex = dayEx(), [id, , n] = ex[idx], i = +b.dataset.fdone;
    if(!filled(id, i)){ toast("اكتب التكرارات أول"); return; }
    if(document.activeElement && document.activeElement.blur) document.activeElement.blur();
    /* carry the weight to the next set so it is one tap less */
    if(i + 1 < n && !valOf(id, i + 1, "w") && valOf(id, i, "w")){
      const nx = body.querySelector(`input[data-fx="${id}"][data-i="${i + 1}"][data-f="w"]`), s = src(id, i + 1, "w");
      if(nx && s){ nx.value = s.value = valOf(id, i, "w"); queueWO(); }
    }
    const lastOfAll = idx === ex.length - 1 && i === n - 1;
    if(!lastOfAll) startRest(idx < 2 ? 150 : 75);
  });

  /* ---------- rest timer (keeps correct time even if the phone sleeps) ---------- */
  const RC = 2 * Math.PI * 20;
  function beep(){
    try{
      const a = beep.ctx; if(!a) return;
      const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
      o.frequency.value = 880; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.18, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .5);
      o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + .55);
    }catch(e){}
  }
  function primeAudio(){ try{ const C = window.AudioContext || window.webkitAudioContext; if(C && !beep.ctx) beep.ctx = new C(); if(beep.ctx && beep.ctx.state === "suspended") beep.ctx.resume(); }catch(e){} }
  function paintRest(){
    const left = Math.max(0, restEnd - Date.now());
    const s = Math.ceil(left / 1000);
    document.getElementById("fc-time").textContent = AR(Math.floor(s / 60)) + ":" + AR(String(s % 60).padStart(2, "0"));
    document.getElementById("fc-ring").style.strokeDashoffset = RC * (1 - (restTotal ? left / restTotal : 0));
    if(left <= 0) endRest(true);
  }
  function startRest(sec){
    primeAudio(); restTotal = sec * 1000; restEnd = Date.now() + restTotal;
    restEl.hidden = false; clearInterval(tick); tick = setInterval(paintRest, 250); paintRest();
  }
  function endRest(finished){
    clearInterval(tick); tick = null;
    if(restEl.hidden) return;
    restEl.hidden = true;
    if(finished){ beep(); toast("خلصت الراحة. يلا المجموعة الجاية"); }
  }
  document.getElementById("fc-more").addEventListener("click", () => { restEnd += 30000; restTotal += 30000; paintRest(); });
  document.getElementById("fc-skip").addEventListener("click", () => endRest(false));

  /* ---------- open / close ---------- */
  async function wake(){ try{ if("wakeLock" in navigator && !lock) { lock = await navigator.wakeLock.request("screen"); lock.addEventListener("release", () => { lock = null; }); } }catch(e){ lock = null; } }
  function openFocus(){
    if(!S.settings) return;
    if(woDirty) captureWO();
    renderTrain(true);
    const ex = dayEx(); if(!ex.length){ toast("ما فيه تمارين في هذا اليوم"); return; }
    idx = ex.findIndex(([id, , n]) => { for(let i = 0; i < n; i++) if(!filled(id, i)) return true; return false; });
    if(idx < 0) idx = 0;
    returnTo = document.activeElement;
    el.hidden = false; document.body.style.overflow = "hidden"; draw(); wake();
    document.getElementById("fc-close").focus();
  }
  function closeFocus(){
    if(el.hidden) return;
    endRest(false); el.hidden = true; document.body.style.overflow = "";
    try{ if(lock) lock.release(); }catch(e){} lock = null;
    if(woDirty) captureWO(); flushWO(); renderTrain(true);
    if(returnTo && document.contains(returnTo)) returnTo.focus();
  }
  document.getElementById("fc-open").addEventListener("click", openFocus);
  document.getElementById("fc-close").addEventListener("click", closeFocus);
  document.getElementById("fc-prev").addEventListener("click", () => { if(idx > 0){ idx--; draw(); } });
  document.getElementById("fc-next").addEventListener("click", () => {
    if(idx < dayEx().length - 1){ idx++; draw(); return; }
    closeFocus(); document.getElementById("tr-done").click();
  });
  document.addEventListener("keydown", e => { if(e.key === "Escape" && !el.hidden) closeFocus(); });
  document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible" && !el.hidden){ wake(); if(tick) paintRest(); } });

  /* ---------- swipe a food row sideways to delete it (the × button stays for accessibility) ---------- */
  const fl = document.getElementById("f-list"); let sw = null;
  fl.addEventListener("pointerdown", e => {
    const row = e.target.closest("[data-row]"); if(!row || e.target.closest("button")) return;
    sw = { row, x: e.clientX, y: e.clientY, dx: 0, active: false };
  });
  fl.addEventListener("pointermove", e => {
    if(!sw) return;
    const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
    if(!sw.active){
      if(Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5) sw.active = true;
      else if(Math.abs(dy) > 10){ sw = null; return; } else return;
    }
    sw.dx = dx; sw.row.style.transition = "none"; sw.row.style.transform = `translateX(${dx}px)`; sw.row.style.opacity = String(Math.max(.25, 1 - Math.abs(dx) / 220));
  });
  function swipeEnd(){
    if(!sw) return; const s = sw; sw = null;
    s.row.style.transition = "";
    if(s.active && Math.abs(s.dx) > 90){
      s.row.style.transform = `translateX(${s.dx > 0 ? 110 : -110}%)`; s.row.style.opacity = "0";
      setTimeout(() => delFood(+s.row.dataset.row), 160);
    } else { s.row.style.transform = ""; s.row.style.opacity = ""; }
  }
  fl.addEventListener("pointerup", swipeEnd); fl.addEventListener("pointercancel", swipeEnd); fl.addEventListener("pointerleave", swipeEnd);

  /* ---------- drag the alternatives sheet down by its header to close it ---------- */
  const head = document.querySelector("#sheet .sheet-head"), panel = document.querySelector("#sheet .sheet-panel"); let dg = null;
  head.addEventListener("pointerdown", e => { if(e.target.closest("button")) return; dg = { y: e.clientY, dy: 0 }; head.setPointerCapture(e.pointerId); });
  head.addEventListener("pointermove", e => { if(!dg) return; dg.dy = Math.max(0, e.clientY - dg.y); panel.style.transition = "none"; panel.style.transform = `translateY(${dg.dy}px)`; });
  function dragEnd(){
    if(!dg) return; const d = dg; dg = null; panel.style.transition = "";
    if(d.dy > 90){ closeSheet(); panel.style.transform = ""; } else panel.style.transform = "";
  }
  head.addEventListener("pointerup", dragEnd); head.addEventListener("pointercancel", dragEnd);
})();
