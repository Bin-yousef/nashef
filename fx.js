/* نشّف — feedback layer: hype messages, celebrations, number animation. No data lives here. */
"use strict";
/* shown one at a time after a finished workout; a shuffled "bag" guarantees no repeat until all were used */
const HYPE = [
  "كفو يا وحش! تمرين اليوم في الجيب.",
  "عز الله إنك رجال، ما فوّتها.",
  "يا سلام عليك! كذا الشغل ولا بلاش.",
  "بيّض الله وجهك، خلصتها وأنت واقف على رجولك.",
  "الكرش يودّعك شوي شوي، كمّل.",
  "هذا الالتزام اللي يجيب النتيجة. كفو.",
  "ما شاء الله عليك، اليوم أقوى من أمس.",
  "قدّها وقدود! بكرا نكمّل.",
  "تعبك اليوم هو شكلك بعد شهرين.",
  "عاش يا بطل، الحديد يشهد لك.",
  "والله إنك ذيب، ولا تمرين يفلت منك.",
  "غيرك لسّا يفكر يبدأ، وأنت خلّصت.",
  "صحّ بدنك! اشرب مويه وارتاح، تستاهل.",
  "السبعين جايّة جايّة، وأنت ماشي لها صح.",
  "يا رجّال وش ذا الحماس! استمر.",
  "كل تمرين تخلصه طوبة في جسمك الجديد.",
  "اليوم كسبت نفسك، وهذا أهم فوز.",
  "الله يقويك، جلسة نظيفة من أولها لآخرها.",
  "ما في أعذار اليوم، وهذا اللي يعجبني فيك.",
  "شدّيت حيلك وطلعت قدّها.",
  "أسطورة! سجّلناها لك في التاريخ.",
  "المراية بتشكرك قريب.",
  "ولا غلطة. تمرين مرتّب وأداء يرفع الراس.",
  "هذا اللي نبيه: حضور، شغل، وإنجاز.",
  "كفو والله، عضلك اليوم أخذ حقه.",
  "زوّد العيار! الجاي أثقل وأنت قدّه.",
  "تمرين وراء تمرين، والنتيجة تجي غصب.",
  "يا حيّ هالهمّة! لا توقف.",
  "خلاص، اليوم مقفّل. روّح مرفوع الراس.",
  "جسمك يتغيّر حتى لو ما شفته للحين. اصبر.",
  "اللي يداوم يوصل، وأنت مداوم.",
  "طيّرت التمرين تطيير! عاش.",
  "اليوم ما كان سهل، وعشان كذا له قيمة.",
  "رجّال وكلمتك وحدة: قلت بتمرّن وتمرّنت.",
  "الدهون في ورطة معك.",
  "أداء يشرح الصدر. كمّل على نفس الخط.",
  "حطّيت جهدك في مكانه الصح. تستاهل وجبة بروتين محترمة.",
  "فنّان! شغل متقن من أول عدّة لآخر عدّة.",
  "كل قطرة عرق محسوبة لك.",
  "بطل بمعنى الكلمة. نشوفك في التمرين الجاي.",
  "هذي العزيمة اللي تنزّل الكيلوات.",
  "ما قصّرت، وقّعت حضورك بأقوى شكل.",
  "اليوم أثبتّ إن المسألة قرار، وأنت قرّرت.",
  "يا كبير! جلسة تسوى وزنها ذهب.",
  "خلّك كذا، وبعد أربع أسابيع بتتذكر كلامي.",
  "الحديد ما يكذب: اللي يتعب يلقى.",
  "منوّر النادي اليوم، ومطفّي الدهون.",
  "عدّيتها. الصعب راح، وباقي الاستمرار.",
  "لياقتك تتكلم عنك. شغل نظيف.",
  "فوق فوق! مستواك يطلع كل أسبوع.",
  "هذا تمرين أقرب لهدفك. واحد واحد ونوصل.",
  "تعبت؟ زين. التعب هذا هو الثمن وأنت دفعته.",
  "أنت اليوم نسخة أحسن من نفسك.",
  "لا تستهين باللي سويته، ناس كثير ما قدروا يبدون.",
  "صلابة! حتى آخر مجموعة ما رخّيت.",
  "مبروك عليك الجلسة. نوم زين وأكل زين، والباقي يجي.",
  "شغل رجال. خلّ الأرقام تتكلم.",
  "تمرينك اليوم يرفع الضغط... ضغط الدهون طبعاً.",
  "ولّعتها! الجاي أحلى.",
  "الانضباط يغلب الحماس، وأنت جمعت الاثنين.",
  "عاشت يمينك ويسارك، ما خلّيت شي.",
  "اليوم حطّيت علامة صح كبيرة.",
  "قوّاك الله، كذا تنبني الأجسام.",
  "الطريق طويل بس أنت ماشي، وهذا يكفي.",
  "جبتها صح. ارتاح اليوم وارجع أقوى.",
  "ما في شي اسمه حظ هنا، كله شغلك.",
  "وحش الصالة حضر وخلّص ومشى.",
  "كل ما تعبت أكثر، خفّ الميزان أكثر.",
  "هيبة! أداء يستاهل التصفيق.",
  "سكّرت يومك بإنجاز. نام قرير العين.",
  "تمرينك اليوم هدية لنفسك بعد سنة.",
  "كفو كفو كفو! ولا كلمة زيادة."
];
const HYPE_TITLES = ["كفو!", "عاش!", "يا وحش!", "بطل!", "عز الله!", "يا سلام!"];
const PROTEIN_LINES = [
  "قفّلت البروتين اليوم. عضلك مأمّن.",
  "هدف البروتين تم. كذا تحافظ على عضلك وأنت تنشّف.",
  "البروتين كامل! نص الشغل في المطبخ وأنت سويته.",
  "وصلت هدف البروتين. الدهون تنزل والعضل يبقى.",
  "حلقة البروتين مقفولة. كفو على الالتزام.",
  "بروتين اليوم خالص. باقي عليك النوم الزين."
];
const KILO_LINES = [
  "الميزان بدا يسمع الكلام. كمّل.",
  "هذا مو حظ، هذا شغلك. الكيلو الجاي أقرب.",
  "كيلو ورا كيلو، والسبعين تقرّب.",
  "جسمك يتغيّر قدام عينك. لا توقف.",
  "إنجاز حقيقي. اثبت على نفس الخطة."
];
const pick = a => a[Math.random() * a.length | 0];
function nextHype(){
  const KEY = "nashef-local:hype";
  let bag = null;
  try{ bag = JSON.parse(localStorage.getItem(KEY) || "null"); }catch(e){}
  if(!bag || !Array.isArray(bag.order) || bag.n !== HYPE.length || bag.i >= bag.order.length){
    const order = HYPE.map((_, i) => i);
    for(let i = order.length - 1; i > 0; i--){ const j = Math.random() * (i + 1) | 0; [order[i], order[j]] = [order[j], order[i]]; }
    if(bag && bag.last === order[0] && order.length > 1) [order[0], order[1]] = [order[1], order[0]];   // never the same line twice in a row
    bag = { order, i: 0, n: HYPE.length };
  }
  const idx = bag.order[bag.i]; bag.i++; bag.last = idx;
  try{ localStorage.setItem(KEY, JSON.stringify(bag)); }catch(e){}
  return HYPE[idx];
}
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
function confetti(){
  if(reducedMotion()) return;
  const c = document.createElement("canvas"); c.className = "confetti"; c.setAttribute("aria-hidden", "true");
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight;
  c.width = W * dpr; c.height = H * dpr; document.body.appendChild(c);
  const g = c.getContext("2d"); g.scale(dpr, dpr);
  const cs = getComputedStyle(document.documentElement);
  const cols = ["--accent", "--accent-2", "--warn"].map(v => cs.getPropertyValue(v).trim() || "#0b8a72");
  const P = Array.from({ length: 120 }, () => ({ x: W / 2 + (Math.random() - .5) * 90, y: H * .34, vx: (Math.random() - .5) * 12, vy: -Math.random() * 11 - 4,
    r: Math.random() * 5 + 3, a: Math.random() * 6.28, va: (Math.random() - .5) * .4, c: pick(cols) }));
  const t0 = performance.now(), DUR = 2100;
  (function frame(t){
    const k = (t - t0) / DUR; g.clearRect(0, 0, W, H);
    for(const p of P){
      p.vy += .3; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va;
      g.save(); g.globalAlpha = Math.max(0, 1 - k * k); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c; g.fillRect(-p.r, -p.r * .4, p.r * 2, p.r * .8); g.restore();
    }
    k < 1 ? requestAnimationFrame(frame) : c.remove();
  })(t0);
}
/* a short celebration card at the top of the screen; tap to dismiss */
function celebrate(title, text, opts){
  const el = document.getElementById("cele"); if(!el) return;
  el.querySelector(".cele-t").textContent = title;
  el.querySelector(".cele-x").textContent = text;
  el.hidden = false; void el.offsetWidth; el.classList.add("on");
  clearTimeout(celebrate.t); celebrate.t = setTimeout(hideCelebrate, (opts && opts.ms) || 6500);
  if(!opts || opts.confetti !== false) confetti();
}
function hideCelebrate(){
  const el = document.getElementById("cele"); if(!el || el.hidden) return;
  el.classList.remove("on"); clearTimeout(celebrate.t); setTimeout(() => { if(!el.classList.contains("on")) el.hidden = true; }, 350);
}
document.addEventListener("click", e => { if(e.target.closest("#cele")) hideCelebrate(); });
/* count a number up/down to its new value; the first value appears instantly */
function countTo(el, to, render){
  const from = el._v; el._v = to;
  if(from === undefined || from === to || reducedMotion() || !isFinite(from) || !isFinite(to)){ el.textContent = render(to); return; }
  cancelAnimationFrame(el._raf);
  const t0 = performance.now(), DUR = 550;
  (function step(t){
    const k = Math.min(1, (t - t0) / DUR), e = 1 - Math.pow(1 - k, 3);
    el.textContent = render(from + (to - from) * e);
    if(k < 1) el._raf = requestAnimationFrame(step); else el.textContent = render(to);
  })(t0);
}
/* small UI preferences (not user records): chart range and the like */
const pref = {
  get(k, d){ try{ const v = localStorage.getItem("nashef-local:pref:" + k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem("nashef-local:pref:" + k, JSON.stringify(v)); }catch(e){} }
};
