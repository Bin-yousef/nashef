/* نشّف — daily challenges + cardio coach. Loaded after app.js (uses its globals: S, D, save, render, Store, …).
   Everything here is stored inside existing records, so backup/restore already covers it:
   - settings.fun  : challenges on/off, start date, reminder time
   - settings.cx   : jogging level and progress
   - wo-<date>.ch  : today's challenge {id, done, swapped}
   - wo-<date>.cx  : today's cardio session {kind, mode, lvl, min, mod, vig, status, rate}
   - wo-<date>.rest: user marked today as a rest day from weights */
"use strict";

/* ======================= helpers ======================= */
function hashStr(s){ let h=2166136261; for(const c of String(s)) h=Math.imul(h ^ c.charCodeAt(0), 16777619); return h>>>0; }
function seeded(seed){ return () => { seed=(seed+0x6D2B79F5)|0; let t=Math.imul(seed^seed>>>15, 1|seed); t=t+Math.imul(t^t>>>7, 61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function shuffled(arr, seed){ const a=arr.slice(), r=seeded(seed); for(let i=a.length-1;i>0;i--){ const j=r()*(i+1)|0; [a[i],a[j]]=[a[j],a[i]]; } return a; }
const daysBetween = (a,b) => Math.round((new Date(b+"T00:00:00") - new Date(a+"T00:00:00"))/864e5);
const mmss = s => AR(Math.floor(s/60)) + ":" + AR(String(Math.floor(s%60)).padStart(2,"0"));
/* change today's workout record without losing numbers being typed */
function editToday(mut){
  if(woDirty) captureWO();
  const wo=structuredClone(S.wo||{}); mut(wo); S.wo=wo; save("wo-"+D, wo);
}
const durText = s => s%60 ? (s<60 ? `${AR(s)} ث` : `${AR(Math.floor(s/60))}:${AR(String(s%60).padStart(2,"0"))} د`) : `${AR(s/60)} د`;

/* ======================= CARDIO ======================= */
/* Jogging ladder = NHS Couch to 5K, weeks 1–9 (run/walk intervals, 3 runs a week).
   Every session starts with a 5-minute brisk walk and ends with a 5-minute easy walk. */
const R=(n,parts)=>Array.from({length:n},()=>parts).flat();
const JOG = [
  {d:"٨ مرات: دقيقة هرولة ثم دقيقة ونص مشي", seg:R(8,[["r",60],["w",90]])},
  {d:"٦ مرات: دقيقة ونص هرولة ثم دقيقتين مشي", seg:R(6,[["r",90],["w",120]])},
  {d:"مرتين: ٩٠ ث هرولة، ٩٠ ث مشي، ٣ د هرولة، ٣ د مشي", seg:R(2,[["r",90],["w",90],["r",180],["w",180]])},
  {d:"٣ د هرولة، ٩٠ ث مشي، ٥ د هرولة، ٢:٣٠ مشي، ٣ د هرولة، ٩٠ ث مشي، ٥ د هرولة", seg:[["r",180],["w",90],["r",300],["w",150],["r",180],["w",90],["r",300]]},
  {d:"٣ مرات ٥ د هرولة، بينها ٣ د مشي", seg:[["r",300],["w",180],["r",300],["w",180],["r",300]]},
  {d:"مرتين ٨ د هرولة، بينها ٥ د مشي", seg:[["r",480],["w",300],["r",480]]},
  {d:"٢٠ دقيقة هرولة متواصلة", seg:[["r",1200]]},
  {d:"٢٥ دقيقة هرولة متواصلة", seg:[["r",1500]]},
  {d:"٢٨ دقيقة هرولة متواصلة", seg:[["r",1680]]},
  {d:"٣٠ دقيقة هرولة متواصلة", seg:[["r",1800]]}
];
const PHASE = {wu:"إحماء: مشي سريع", cd:"تهدئة: مشي هادي", r:"هرولة", w:"مشي", h:"قوي", e:"سهل", z:"شدة متوسطة"};
const MODE = {
  walk:{n:"مشي سريع على سير بميلان", how:"ميلان ٨–١٢٪ وسرعة ٤.٥–٥.٥ كم/س"},
  bike:{n:"دراجة ثابتة", how:"مقاومة متوسطة و٧٠–٩٠ دورة بالدقيقة"},
  ellip:{n:"إليبتكال", how:"مقاومة متوسطة وحركة ثابتة"},
  rowerg:{n:"جهاز تجديف", how:"٢٠–٢٤ سحبة بالدقيقة، والدفع من الرجول"},
  swim:{n:"سباحة", how:"سباحة متواصلة بإيقاع مريح"},
  stairs:{n:"جهاز الدرج", how:"سرعة هادية بدون ما تتسند على اليدين"}
};
const TALK = "الشدة: تقدر تتكلم بجمل قصيرة وأنت تتمرن.";
function sessionEasy(mode, min, why){
  const m=MODE[mode]||MODE.walk;
  return {kind:"easy", mode, title:`${m.n} ${AR(min)} دقيقة`, detail:`${m.how}. ${TALK}`, why, min, mod:min, vig:0, seg:[["z",min*60]]};
}
function sessionJog(lvl, why){
  const L=JOG[lvl-1], seg=[["wu",300], ...L.seg, ["cd",300]];
  const total=seg.reduce((a,s)=>a+s[1],0), run=L.seg.filter(s=>s[0]==="r").reduce((a,s)=>a+s[1],0);
  return {kind:"jog", mode:"run", lvl, title:`هرولة: المستوى ${AR(lvl)} من ${AR(JOG.length)}`, detail:`٥ د مشي سريع، ثم ${L.d}، ثم ٥ د مشي هادي. الهرولة بسرعة تقدر تقول فيها جملة قصيرة، مو سباق.`,
    why, min:Math.round(total/60), vig:Math.round(run/60), mod:Math.round((total-run)/60), seg};
}
function sessionHiit(mode, adv, why){
  const m=MODE[mode]||MODE.bike;
  const main = adv ? R(4,[["h",240],["e",180]]) : R(8,[["h",30],["e",90]]);
  const seg=[["wu",300], ...main, ["cd",300]], total=seg.reduce((a,s)=>a+s[1],0), mainS=main.reduce((a,s)=>a+s[1],0);
  return {kind:"hiit", mode, title:`متقطع على ${m.n}`, detail: adv
      ? "٥ د إحماء، ثم ٤ مرات: ٤ د قوي و٣ د سهل، ثم ٥ د تهدئة. القوي: تقدر تقول كلمتين بس."
      : "٥ د إحماء، ثم ٨ مرات: ٣٠ ث قوي و٩٠ ث سهل، ثم ٥ د تهدئة. القوي: قريب من أقصى جهدك.",
    why, min:Math.round(total/60), vig:Math.round(mainS/60), mod:Math.round((total-mainS)/60), seg};
}
const LOWER_SLOTS = new Set(["squat","rdl","lpress","lcurl","calf","hack","hipt","lunge","lext","slcurl"]);
function dayKind(idx){
  const days=getPlan().days, d=days[((idx%days.length)+days.length)%days.length]; const ex=(d&&d.ex)||[];
  if(!ex.length) return "upper";
  const share=ex.filter(e=>LOWER_SLOTS.has(e[4])).length/ex.length;
  return share>=0.6 ? "lower" : share<=0.2 ? "upper" : "full";
}
/* last 7 days including today; vigorous minutes count double (moderate-equivalent) */
function weekCardio(){
  let jog=0, hiit=0, mod=0, vig=0;
  for(let i=0;i<7;i++){
    const w = i===0 ? S.wo : Store.get("wo-"+addDays(D,-i)); if(!w) continue;
    const c=w.cx;
    if(c && c.status==="done"){ if(c.kind==="jog") jog++; if(c.kind==="hiit") hiit++; mod+=c.mod||0; vig+=c.vig||0; }
    else if(w.cardio) mod+=w.cardio;
  }
  return {jog, hiit, mod, vig, eq:mod+2*vig};
}
/* the coach: ordered list, first = today's recommendation */
function cardioOptions(){
  const prog=S.program, st=S.settings||{}, wo=S.wo||{};
  const kind = wo.rest ? "rest" : dayKind(curDay());
  const y=Store.get("wo-"+addDays(D,-1)) || {};
  const yLower = !!(y.done && !y.rest && y.day!=null && dayKind(y.day)==="lower");
  const yHard  = !!(y.cx && y.cx.status==="done" && (y.cx.kind==="jog" || y.cx.kind==="hiit"));
  const wk=weekCardio(), knee=prog.lim.includes("knee"), lvl=Math.min(JOG.length, Math.max(1,(st.cx&&st.cx.lvl)||1));
  const prefs = prog.cardio.length ? prog.cardio : ["walk"], easyPrefs = prefs.filter(m=>MODE[m]).length ? prefs.filter(m=>MODE[m]) : ["walk"];
  const lowImpact = ["bike","ellip","swim","rowerg"].find(m=>prefs.includes(m)) || (knee ? "bike" : "walk");
  const anyPref = i => easyPrefs[i % easyPrefs.length], runs = prefs.includes("run");
  const out=[];
  const jogOK  = runs && !knee && wk.jog<3 && !yHard && !yLower && kind!=="lower";
  const hiitOK = prog.level!=="beg" && !knee && wk.hiit<1 && !yHard && !yLower && kind==="upper";
  if(kind==="lower") out.push(sessionEasy(lowImpact, 20, "بعد يوم الأرجل خلّه خفيف وبدون صدمات، والدراجة أخف على الرجول من الجري."));
  if(kind==="full")  out.push(sessionEasy(lowImpact, 25, "جلسة جسم كامل اليوم، فالكارديو يكون متوسط وقصير عشان الاستشفاء."));
  if(jogOK) out.push(sessionJog(lvl, kind==="rest" ? "يوم راحة ورجولك مرتاحة، أنسب يوم للهرولة." : "رجولك مرتاحة اليوم، فالهرولة ما تأثر على تمرين الأرجل."));
  if(hiitOK) out.push(sessionHiit(prefs.includes("rowerg")?"rowerg":prefs.includes("ellip")&&!prefs.includes("bike")?"ellip":"bike", prog.level==="adv", "جلسة متقطعة وحدة بالأسبوع تعطي تنويع وتختصر الوقت."));
  const others=easyPrefs.filter(m=>!out.length || m!==out[0].mode), rot=(others.length?others:easyPrefs)[new Date(D).getDate() % (others.length||easyPrefs.length)];
  out.push(sessionEasy(rot, kind==="rest" ? 40 : 30, kind==="rest" ? "يوم راحة: كارديو أطول بشدة متوسطة يرفع حرقك بدون ما يتعب عضلك." : "خيار ثابت ومريح بشدة متوسطة."));
  if(!out.some(o=>o.kind==="easy" && o.mode!==out[0].mode)) out.push(sessionEasy(out[0].mode==="walk" ? lowImpact : "walk", 30, "تنويع بنفس الشدة."));
  if(runs && !jogOK && !knee && kind!=="lower"){
    const why = wk.jog>=3 ? "خلصت ٣ هرولات هالأسبوع، وهذا الحد المناسب." : (yHard||yLower) ? "أمس كان جهد عالي على الرجول، فالأفضل تأجيلها لبكرا." : "";
    if(why) out.push({...sessionJog(lvl, why), blocked:true});
  }
  /* variety: do not open with the same kind as yesterday when there is another choice */
  if(y.cx && y.cx.status==="done" && out.length>1 && out[0].kind===y.cx.kind && out[0].mode===y.cx.mode && !out[1].blocked) [out[0],out[1]]=[out[1],out[0]];
  const seen=new Set(); return out.filter(o=>{ const k=o.kind+o.mode+(o.lvl||"")+o.min; if(seen.has(k)) return false; seen.add(k); return true; }).slice(0,4);
}
const CX_DONE = ["عاش! الكارديو مسجّل.", "كفو، قلبك يشكرك.", "خلصتها، والدهون تحس فيك.", "زين يا بطل، كارديو اليوم مقفّل.", "هذا الشغل. كمّل على نفس الخط."];
let cxAlts=false, cxRate=false;
function renderCardio(){
  const el=document.getElementById("cx-card"); if(!el || !S.settings) return;
  if(el.contains(document.activeElement) && document.activeElement.tagName==="INPUT") return;
  const wo=S.wo||{}, cx=wo.cx, wk=weekCardio(), st=S.settings, lvl=(st.cx&&st.cx.lvl)||1;
  const meter = `<div class="cx-meter"><div class="row between"><span class="caption">كارديو آخر ٧ أيام</span><span class="caption num">${AR(wk.eq)} من ١٥٠–٢٥٠ د</span></div><div class="bar"><i style="width:${Math.min(100,wk.eq/150*100)}%"></i></div><p class="footnote">دقايق الهرولة والمتقطع تنحسب ضعف. الهرولة هالأسبوع: ${AR(wk.jog)} من ٣.</p></div>`;
  const card = (o, tag) => `<div class="cx-s${o.blocked?" off":""}"><div class="row between"><h3>${esc(o.title)}</h3><span class="pill${o.kind==="easy"?" alt":""}">${tag||AR(o.min)+" د"}</span></div>
    <p class="muted">${esc(o.detail)}</p>${o.why?`<p class="footnote">ليش: ${esc(o.why)}</p>`:""}</div>`;
  let h="";
  if(cx && cx.status==="done"){
    h = `<div class="row between"><h2>كارديو اليوم</h2><span class="pill">تم</span></div>${card(cx, AR(cx.min)+" د")}${meter}`;
  } else if(cx && cx.status==="planned"){
    h = `<div class="row between"><h2>كارديو اليوم</h2><span class="pill">متفقين</span></div>${card(cx)}
      ${cxRate ? `<p class="caption">كيف كانت؟</p><div class="cx-rate"><button class="ghost" data-rate="easy">سهلة</button><button class="ghost" data-rate="ok">مناسبة</button><button class="ghost" data-rate="hard">صعبة</button></div>`
               : `<div class="actions"><button id="cx-timer">ابدأ المؤقت</button><button class="ghost" id="cx-finish">خلصتها</button></div><button class="ghost" id="cx-change">غيّرها</button>`}
      ${meter}`;
  } else {
    const opts=cardioOptions(), first=opts[0];
    h = `<div class="row between"><h2>كارديو اليوم</h2><span class="caption">${wo.rest?"يوم راحة":""}</span></div>
      <p class="cx-ask">أقترح اليوم: وش رايك؟</p>${card(first)}
      <div class="actions"><button data-pick="0">تمام، نسويها</button><button class="ghost" id="cx-more" aria-expanded="${cxAlts}">${cxAlts?"خبّ الخيارات":"اقترح غيرها"}</button></div>
      ${cxAlts ? `<div class="cx-alts">${opts.slice(1).map((o,i)=>`${card(o)}${o.blocked?"":`<button class="ghost" data-pick="${i+1}">اختر هذي</button>`}`).join("")}</div>` : ""}
      <button class="tog cx-rest" id="cx-rest" aria-pressed="${!!wo.rest}">اليوم يوم راحة من الحديد</button>
      <p class="footnote">مستواك في الهرولة: ${AR(lvl)} من ${AR(JOG.length)}. ترتفع بعد ٣ جلسات ناجحة، وتنزل لو جلستين ورا بعض كانت صعبة.</p>${meter}`;
  }
  el.innerHTML=h;
}
document.getElementById("cx-card").addEventListener("click", e => {
  const t=e.target;
  if(t.closest("#cx-more")){ cxAlts=!cxAlts; renderCardio(); return; }
  if(t.closest("#cx-rest")){ editToday(w => { w.rest=!w.rest; }); cxAlts=false; return; }
  const p=t.closest("[data-pick]");
  if(p){ const o=cardioOptions()[+p.dataset.pick]; if(!o || o.blocked) return; const {why, blocked, ...keep}=o;
    editToday(w => { w.cx={...keep, status:"planned"}; }); cxAlts=false; toast("تمام، اتفقنا. بالتوفيق"); return; }
  if(t.closest("#cx-change")){ editToday(w => { delete w.cx; }); cxRate=false; return; }
  if(t.closest("#cx-finish")){ cxRate=true; renderCardio(); return; }
  if(t.closest("#cx-timer")){ openTimer(); return; }
  const r=t.closest("[data-rate]"); if(r) finishCardio(r.dataset.rate);
});
function finishCardio(rate){
  const cx=S.wo && S.wo.cx; if(!cx) return; cxRate=false;
  editToday(w => { w.cx={...w.cx, status:"done", rate, at:Date.now()}; w.cardio=Math.max(w.cardio||0, cx.min); });
  let msg=pick(CX_DONE);
  if(cx.kind==="jog"){
    const st=structuredClone(S.settings), c=st.cx||{lvl:1, ok:0, hard:0};
    if(cx.lvl===c.lvl){
      if(rate==="hard"){ c.hard=(c.hard||0)+1; if(c.hard>=2 && c.lvl>1){ c.lvl--; c.ok=0; c.hard=0; msg="نزّلنا مستوى الهرولة درجة. ما فيها عيب، نبني صح ونرجع أقوى."; } else msg="صعبة؟ عادي. نعيد نفس المستوى الجلسة الجاية."; }
      else { c.hard=0; c.ok=(c.ok||0)+(rate==="easy"?1.5:1);
        if(c.ok>=3 && c.lvl<JOG.length){ c.lvl++; c.ok=0; celebrate("ترقيت في الهرولة", `صرت في المستوى ${AR(c.lvl)}. ${JOG[c.lvl-1].d}.`); st.cx=c; save("settings", st); return; } }
      st.cx=c; save("settings", st);
    }
  }
  toast(msg);
}

/* ---------- guided interval timer (keeps time by the clock, so a sleeping phone does not drift it) ---------- */
let tmr=null;
function beepCx(n){
  try{ const C=window.AudioContext||window.webkitAudioContext; if(!C) return; beepCx.c=beepCx.c||new C(); const a=beepCx.c; if(a.state==="suspended") a.resume();
    for(let i=0;i<n;i++){ const o=a.createOscillator(), g=a.createGain(), t=a.currentTime+i*0.22; o.frequency.value=n>1?990:740;
      g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.2,t+.02); g.gain.exponentialRampToValueAtTime(.0001,t+.18); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t+.2); } }catch(e){}
}
function openTimer(){
  const cx=S.wo && S.wo.cx; if(!cx || !cx.seg) return;
  beepCx(0);
  tmr={seg:cx.seg, total:cx.seg.reduce((a,s)=>a+s[1],0), start:Date.now(), paused:0, pausedAt:0, idx:-1, lock:null};
  const el=document.getElementById("cxt"); el.hidden=false; document.body.style.overflow="hidden";
  document.getElementById("cxt-title").textContent=cx.title;
  try{ if("wakeLock" in navigator) navigator.wakeLock.request("screen").then(l=>{ if(tmr) tmr.lock=l; }).catch(()=>{}); }catch(e){}
  tmr.iv=setInterval(tickTimer, 250); tickTimer();
  document.getElementById("cxt-close").focus();
}
function tickTimer(){
  if(!tmr) return;
  const now=tmr.pausedAt||Date.now(), el=Math.min(tmr.total, (now-tmr.start-tmr.paused)/1000);
  let acc=0, i=0; for(;i<tmr.seg.length;i++){ if(el < acc+tmr.seg[i][1]) break; acc+=tmr.seg[i][1]; }
  if(i>=tmr.seg.length){ closeTimer(true); return; }
  const [ph, len]=tmr.seg[i], left=acc+len-el;
  if(i!==tmr.idx){ if(tmr.idx>=0){ beepCx(ph==="r"||ph==="h" ? 2 : 1); } tmr.idx=i;
    const box=document.getElementById("cxt"); box.dataset.ph=ph; document.getElementById("cxt-phase").textContent=PHASE[ph]; }
  document.getElementById("cxt-time").textContent=mmss(Math.ceil(left));
  const nx=tmr.seg[i+1]; document.getElementById("cxt-next").textContent = nx ? `بعدها: ${PHASE[nx[0]]} ${durText(nx[1])}` : "بعدها: خلصت الجلسة";
  document.getElementById("cxt-bar").style.width=(el/tmr.total*100)+"%";
  document.getElementById("cxt-left").textContent=`باقي ${mmss(Math.ceil(tmr.total-el))}`;
}
function closeTimer(finished){
  if(!tmr) return; clearInterval(tmr.iv); try{ if(tmr.lock) tmr.lock.release(); }catch(e){}
  tmr=null; document.getElementById("cxt").hidden=true; document.body.style.overflow="";
  if(finished){ beepCx(3); cxRate=true; renderCardio(); toast("خلصت الجلسة! قيّمها تحت"); document.getElementById("cx-card").scrollIntoView({block:"center"}); }
}
document.getElementById("cxt-close").addEventListener("click", () => closeTimer(false));
document.getElementById("cxt-done").addEventListener("click", () => closeTimer(true));
document.getElementById("cxt-pause").addEventListener("click", e => {
  if(!tmr) return;
  if(tmr.pausedAt){ tmr.paused+=Date.now()-tmr.pausedAt; tmr.pausedAt=0; e.target.textContent="إيقاف مؤقت"; }
  else { tmr.pausedAt=Date.now(); e.target.textContent="كمّل"; }
  tickTimer();
});
document.addEventListener("visibilitychange", () => { if(document.visibilityState==="visible" && tmr) tickTimer(); });

/* ======================= DAILY CHALLENGES ======================= */
/* auto: checked from the app's own records; self: the user taps "سويته" */
const CH = [
  {id:"steps",  t:c=>`امشِ ${AR(c.steps.toLocaleString("en"))} خطوة اليوم، وسجّلها في شاشة التمرين`, auto:c=>({v:(S.wo&&S.wo.steps)||0, of:c.steps, u:"خطوة"})},
  {id:"protein",t:c=>`قفّل البروتين اليوم: ${AR(c.prot)} جم`, auto:c=>({v:Math.round(c.pr), of:c.prot, u:"جم"})},
  {id:"weigh",  t:()=>"سجّل وزنك الصبح قبل الأكل والمويه", auto:()=>({v:S.weights&&S.weights.e&&S.weights.e[D]!=null?1:0, of:1})},
  {id:"workout",t:()=>"خلّص تمرين اليوم كامل، ولا تنقّص مجموعة", auto:()=>({v:S.wo&&S.wo.done?1:0, of:1}), train:true},
  {id:"cardio", t:c=>`${AR(c.cmin)} دقيقة كارديو اليوم`, auto:c=>({v:(S.wo&&S.wo.cardio)||0, of:c.cmin, u:"د"})},
  {id:"log3",   t:()=>"سجّل كل وجباتك اليوم، ٣ على الأقل", auto:()=>({v:((S.food&&S.food.items)||[]).length, of:3})},
  {id:"water",  t:c=>`اشرب ${c.water} لتر مويه اليوم`},
  {id:"nosugar",t:()=>"صفر مشروبات بسكر اليوم: لا عصير ولا غازي ولا قهوة محلّاة"},
  {id:"veg",    t:()=>"خضار أو سلطة مع الغداء والعشاء"},
  {id:"walkmeal",t:()=>"امشِ ١٠ دقايق بعد الغداء"},
  {id:"sleep",  t:()=>"نام قبل الساعة ١٢ الليلة، و٧ ساعات على الأقل"},
  {id:"stairs", t:()=>"الدرج بدل المصعد اليوم في كل مشوار"},
  {id:"kitchen",t:()=>"قفّل المطبخ بعد العشاء: لا أكل بعد الساعة ١٠"},
  {id:"plusrep",t:()=>"زد تكرار واحد على أول تمرين في جلستك", train:true},
  {id:"tempo",  t:()=>"خلّ النزول بالوزن ٣ ثواني في كل مجموعة اليوم", train:true},
  {id:"nofried",t:()=>"لا مقليات اليوم"},
  {id:"rice",   t:()=>"وزّن الرز ني قبل الطبخ: ٧٥ جم للوجبة"},
  {id:"protmeal",t:()=>"بروتين في كل وجبة اليوم، ٣٠ جم على الأقل"},
  {id:"standup",t:()=>"قوم وتحرك ٥ دقايق كل ساعة وأنت على المكتب"},
  {id:"stretch",t:()=>"١٠ دقايق تمدد قبل النوم"},
  {id:"nosnack",t:()=>"لا سناكات بين الوجبات اليوم إلا بروتين أو فاكهة"},
  {id:"phone",  t:()=>"لا جوال وأنت تاكل: كل وجبة بتركيز وعلى مهل"},
  {id:"focusmode",t:()=>"تمرّن اليوم بوضع التركيز والتزم بمؤقت الراحة", train:true},
  {id:"fruit",  t:()=>"لو اشتهيت حلا، خلّه فاكهة بدال الحلويات"}
];
const CH_DONE = ["تحدي اليوم في الجيب. كفو!", "قدّها وقدود، تحدي اليوم انتهى.", "يا سلام عليك! التزمت بكلمتك.", "تم يا بطل. بكرا تحدي جديد.", "عز الله إنك قدّها.", "تحدي ورا تحدي، وجسمك يتغيّر.", "شغل نظيف. سجّلناها لك.", "ولا أحلى! ما خذلت نفسك اليوم."];
function chCtx(date){
  const st=S.settings||{}, fun=st.fun||{}, w=Math.max(0, Math.floor(daysBetween(fun.start||date, date)/7));
  const items=(S.food&&S.food.items)||[];
  return {w, steps:Math.min(13000, (st.steps||8000)+1000*Math.min(w,4)), prot:st.protein||150, cmin:25+5*Math.min(w,3),
    water:w>=1?"٣":"٢.٥", pr:items.reduce((a,x)=>a+(x.p||0),0)};
}
/* deterministic: the same date always gets the same challenge, and the 24 cycle without repeats */
function chOrder(start, cyc){
  const o=shuffled(CH.map(c=>c.id), hashStr(start+"|"+cyc));
  if(cyc>0){ const prev=shuffled(CH.map(c=>c.id), hashStr(start+"|"+(cyc-1))); if(prev[prev.length-1]===o[0]) [o[0],o[1]]=[o[1],o[0]]; }
  return o;
}
function chFor(date, skip){
  const fun=(S.settings&&S.settings.fun)||{}, start=fun.start||date;
  const n=Math.max(0, daysBetween(start, date))+(skip?CH.length*7+3:0), cyc=Math.floor(n/CH.length);
  return CH.find(c=>c.id===chOrder(start, cyc)[n%CH.length]);
}
function chStreak(){
  let n=0; const todayDone=!!(S.wo&&S.wo.ch&&S.wo.ch.done);
  for(let i=todayDone?0:1;i<400;i++){ const w=i===0?S.wo:Store.get("wo-"+addDays(D,-i)); if(w&&w.ch&&w.ch.done) n++; else break; }
  return n;
}
let chCeleFor="";
function chComplete(){
  editToday(w => { w.ch={...(w.ch||{}), done:true, at:Date.now()}; });
  chCeleFor=D; const s=chStreak();
  celebrate(s>1 ? `سلسلة ${AR(s)} أيام!` : "تحدي اليوم تم", pick(CH_DONE));
}
function renderChallenge(){
  const el=document.getElementById("ch-card"); if(!el || !S.settings) return;
  if(el.contains(document.activeElement) && document.activeElement.tagName==="INPUT") return;
  const fun=S.settings.fun;
  if(!fun || !fun.on){
    el.innerHTML=`<div class="row between"><h2>تحديات يومية</h2><span class="pill alt">${fun?"موقفة":"جديد"}</span></div>
      <p class="muted">كل يوم تحدي جديد يحمّسك: خطوات، بروتين، تمرين، عادات. تبدأ متى ما قلت، وتقدر توقفها أي وقت.</p>
      <button id="ch-start">${fun?"رجّع التحديات":"ابدأ التحديات"}</button>`;
    return;
  }
  const wo=S.wo||{}; let ch=wo.ch && CH.find(c=>c.id===wo.ch.id);
  if(!ch){ ch=chFor(D, false); const id=ch.id; setTimeout(() => { if(!(S.wo&&S.wo.ch)) editToday(w => { w.ch={id, done:false}; }); }, 0); wo.ch={id, done:false}; }
  const c=chCtx(D), done=!!wo.ch.done, s=chStreak();
  let prog="";
  if(ch.auto && !done){
    const a=ch.auto(c);
    if(a.v>=a.of && chCeleFor!==D){ chCeleFor=D; setTimeout(chComplete, 0); }
    prog = a.of>1 ? `<div class="bar"><i style="width:${Math.min(100,a.v/a.of*100)}%"></i></div><p class="caption num">${AR(Math.min(a.v,a.of).toLocaleString("en"))} من ${AR(a.of.toLocaleString("en"))} ${a.u||""}</p>` : `<p class="caption">يتسجّل لحاله لما تسويه في التطبيق.</p>`;
  }
  el.innerHTML=`<div class="row between"><span class="caption">${done?"تحدي اليوم":"يلا يا بطل، تحدي اليوم"}</span><span class="pill${s?"":" alt"}">${s?`سلسلة ${AR(s)} ${s>2&&s<11?"أيام":"يوم"}`:"ابدأ سلسلتك"}</span></div>
    <p class="ch-text${done?" done":""}">${esc(ch.t(c))}</p>${done?`<p class="caption ch-ok">تم. بكرا تحدي جديد.</p>`:prog}
    ${done?"":`<div class="actions">${ch.auto?"":`<button id="ch-done">سويته</button>`}${wo.ch.swapped?"":`<button class="ghost" id="ch-swap">تحدي ثاني</button>`}</div>`}
    <details class="ch-more"><summary>التذكير والإعدادات</summary>
      <div class="stack" style="margin-top:10px">
        <p class="footnote">تطبيقات الويب في الآيفون ما تقدر ترسل إشعار مجدول وهي مقفولة بدون سيرفر. البديل: أضيف لك تنبيهات يومية في تطبيق التقويم، فيها نص تحدي كل يوم لمدة ٤ أسابيع.</p>
        <label class="field" for="ch-time"><span>وقت التذكير</span><input id="ch-time" type="time" value="${esc(fun.time||"17:00")}"></label>
        <button class="ghost" id="ch-ics">أضف التذكيرات للتقويم</button>
        <button class="ghost" id="ch-stop">أوقف التحديات</button>
      </div></details>`;
}
document.getElementById("ch-card").addEventListener("click", e => {
  const t=e.target;
  if(t.closest("#ch-start")){ const st=structuredClone(S.settings); st.fun={...(st.fun||{}), on:true, start:(st.fun&&st.fun.start)||D}; save("settings", st); celebrate("يلا يا بطل!", "بدأت التحديات. كل يوم تحدي جديد ينتظرك هنا.", {confetti:false}); return; }
  if(t.closest("#ch-stop")){ const st=structuredClone(S.settings); st.fun={...st.fun, on:false}; save("settings", st); toast("وقفت التحديات. ترجعها متى ما بغيت"); return; }
  if(t.closest("#ch-done")){ chComplete(); return; }
  if(t.closest("#ch-swap")){ const alt=chFor(D, true); const cur=S.wo.ch.id; const nx = alt.id===cur ? CH[(CH.findIndex(c=>c.id===cur)+5)%CH.length] : alt;
    editToday(w => { w.ch={id:nx.id, done:false, swapped:true}; }); toast("تم، هذا تحدي ثاني. التبديل مرة وحدة باليوم"); return; }
  if(t.closest("#ch-ics")) exportReminders();
});
document.getElementById("ch-card").addEventListener("change", e => {
  if(e.target.id!=="ch-time" || !/^\d\d:\d\d$/.test(e.target.value)) return;
  const st=structuredClone(S.settings); st.fun={...st.fun, time:e.target.value}; save("settings", st);
});
/* ---------- calendar reminders (.ics): works offline, no server, no account ---------- */
const REM_TITLES = ["يلا يا بطل! تحدي اليوم ينتظرك", "وينك يا وحش؟ عندك تحدي", "نشّف: تحدي اليوم", "قوم يا بطل، اليوم يومك", "تحدي جديد، وأنت قدّه"];
function icsEsc(s){ return String(s).replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\n/g,"\\n"); }
function icsFold(line){
  const enc=new TextEncoder(); if(enc.encode(line).length<=75) return line;
  const out=[]; let cur="", n=0;
  for(const ch of line){ const b=enc.encode(ch).length; if(n+b>(out.length?74:75)){ out.push(cur); cur=""; n=0; } cur+=ch; n+=b; }
  out.push(cur); return out.join("\r\n ");
}
function buildIcs(){
  const fun=S.settings.fun, [hh,mm]=(fun.time||"17:00").split(":"), stamp=new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d+/,"");
  const L=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//nashef//challenges//AR","CALSCALE:GREGORIAN","METHOD:PUBLISH","X-WR-CALNAME:نشّف"];
  for(let i=0;i<28;i++){
    const d=addDays(D,i), ch=chFor(d,false), c=chCtx(d), ymd=d.replace(/-/g,"");
    L.push("BEGIN:VEVENT", `UID:nashef-${ymd}-${hashStr(fun.start)}@local`, `DTSTAMP:${stamp}`, `DTSTART:${ymd}T${hh}${mm}00`, "DURATION:PT10M",
      `SUMMARY:${icsEsc(REM_TITLES[i%REM_TITLES.length])}`, `DESCRIPTION:${icsEsc("تحدي اليوم: "+ch.t(c)+"\nافتح نشّف وسجّل إنجازك.")}`,
      "BEGIN:VALARM","ACTION:DISPLAY",`DESCRIPTION:${icsEsc(ch.t(c))}`,"TRIGGER:PT0M","END:VALARM","END:VEVENT");
  }
  L.push("END:VCALENDAR");
  return L.map(icsFold).join("\r\n")+"\r\n";
}
async function exportReminders(){
  const file=new File([buildIcs()], "nashef-challenges.ics", {type:"text/calendar"});
  if(navigator.canShare && navigator.canShare({files:[file]})){
    try{ await navigator.share({files:[file], title:"تذكيرات نشّف"}); toast("اختر التقويم من القائمة وأضف المواعيد"); return; }
    catch(e){ if(e && e.name==="AbortError") return; }
  }
  const url=URL.createObjectURL(file), a=document.createElement("a"); a.href=url; a.download=file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),60000);
  toast("نزل ملف التقويم. افتحه وأضف المواعيد");
}

/* ======================= hooks ======================= */
function playMigrate(){
  const st=S.settings; if(!st || st.cxInit) return;
  const prog=structuredClone(S.program);
  if(prog.cardio.length===1 && prog.cardio[0]==="walk"){ prog.cardio=["walk","run","bike"]; S.program=normProg(prog); save("program", S.program); }
  const s2=structuredClone(st); s2.cxInit=1; s2.cx=s2.cx||{lvl:1, ok:0, hard:0}; save("settings", s2);
}
function renderPlay(){
  if(S.settings && !S.settings.cxInit){ setTimeout(playMigrate, 0); }
  renderChallenge();
  const t=document.getElementById("t-cx"); if(!t || !S.settings) return;
  const cx=S.wo && S.wo.cx;
  t.textContent = cx ? `كارديو اليوم: ${cx.title}${cx.status==="done"?" (تم)":""}` : `كارديو اليوم: ${cardioOptions()[0].title}. افتح التمرين وقرّر.`;
}
