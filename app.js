"use strict";
/* ---------- constants ---------- */
const PRESETS = [
  {n:"٤ بيضات مسلوقة", k:290, p:25},
  {n:"قهوة بحليب A2 (٢٠٠ مل)", k:135, p:7},
  {n:"حصة كبسة دجاج", k:575, p:52},
  {n:"حصة رز ولحم مفروم", k:660, p:53},
  {n:"حصة مندي أفخاذ", k:640, p:54},
  {n:"زبادي يوناني عالي البروتين ١٧٠ جم", k:110, p:17},
  {n:"سكوب واي بروتين ٣٠ جم", k:120, p:24},
  {n:"موزة", k:105, p:1},
  {n:"٣ تمرات صغيرة", k:70, p:1},
  {n:"١٠٠ جم رز مطبوخ إضافي", k:130, p:3},
  {n:"سلطة بدون صوص دسم", k:40, p:2},
  {n:"ملعقة كبيرة زيت", k:120, p:0},
  {n:"صدر دجاج مشوي ١٥٠ جم", k:250, p:46},
  {n:"علبة تونة بالماء ٩٥ جم", k:100, p:22},
  {n:"تفاحة", k:95, p:0}
];
/* a full day built from the presets above: [label, preset indexes] */
const SAMPLE = [["الفطور",[0,1]],["الغداء",[2]],["سناك",[5,7]],["العشاء",[2]],["بعد التمرين",[6]]];
const MEALPREP = [
  {id:"kabsa", t:"كبسة دجاج", k:575, p:52, preset:2,
   ing:["١.٢ كجم صدور دجاج نيّة","٤٥٠ جم رز بسمتي ني","٢ ملعقة كبيرة زيت زيتون (٣٠ مل)","بصلة كبيرة + ٢ طماطم + ملعقة معجون طماطم","٢ جزر مبشور + بهارات كبسة + ملح + لومي"],
   steps:["حمّر البصل بالزيت، أضف الدجاج مقطع وقلّبه ٥ دقايق.","أضف الطماطم والمعجون والبهارات والجزر، ثم ماء يغطي ٢ سم فوق الدجاج.","طلّع الدجاج إذا استوى، حط الرز المغسول بالمرق (المرق = ضعف الرز تقريباً) وغطه على نار هادية ٢٥ دقيقة.","قسّم الرز بالتساوي على ٦ علب وفوقه الدجاج."]},
  {id:"mince", t:"رز ولحم مفروم وخضار", k:660, p:53, preset:3,
   ing:["١.٢ كجم لحم مفروم ٥٪ دهون (وزن ني)","٤٥٠ جم رز بسمتي ني","٩٠٠ جم خضار مشكلة مجمدة (بوزنها مجمدة)","١ ملعقة كبيرة زيت","بصل + ثوم + كمون + كزبرة ناشفة + فلفل أسود"],
   steps:["اطبخ الرز لحاله بالماء والملح.","حمّر البصل والثوم بالزيت، أضف اللحم وفتته لين يتحمر.","أضف الخضار والبهارات وخلها ١٠ دقايق.","قسّم: رز بالتساوي على ٦ علب + اللحم والخضار فوقه."]},
  {id:"mandi", t:"مندي أفخاذ بالفرن", k:640, p:54, preset:4,
   ing:["١.٢ كجم أفخاذ دجاج نيّة بدون جلد ومنزوعة العظم، شيل الدهن الظاهر","٤٥٠ جم رز بسمتي ني","٢ ملعقة كبيرة زيت","بهارات مندي + هيل + ورق غار","٦٠٠ جم زبادي يوناني قليل الدسم + خيار + نعناع (صوص)"],
   steps:["تبّل الدجاج بالبهارات وملعقة زيت، واشوه بالفرن ٢٠٠° لمدة ٣٥ دقيقة.","اطبخ الرز بالهيل وورق الغار والملعقة الثانية من الزيت.","اخلط الزبادي مع الخيار والنعناع.","قسّم على ٦ علب، والصوص في علب صغيرة لحاله."]}
];
/* ---------- exercise library ----------
   Every exercise has its own id, photo (img/<id>.jpg: the two end positions) and its own records.
   need = equipment tags joined by "+" (bb, db, cable, machine, smith, pull, acc; empty = bodyweight)
   st   = areas the move loads heavily (shoulder, back, knee, elbow): skipped when the user marks that area as painful
   skill= technically demanding (beginners get an easier option when one exists)
   big  = heavy lower-body lift (progress in 5 kg steps); bw = bodyweight (weight field = added load); time = seconds, not reps */
const LIB = {
  bench:{n:"بنش بريس بار", eq:"بار + بنش مستوي", need:"bb", st:"shoulder", cue:["اسحب لوحي الكتف للخلف وثبّت قدميك على الأرض.","نزّل البار لمنتصف الصدر بتحكم، وادفع بدون ما ترفع الورك."]},
  db_bench:{n:"بنش دمبل مستوي", eq:"دمبل + بنش مستوي", need:"db", cue:["نزّل الدمبل لجانب الصدر والكوع مايل ٤٥ درجة.","ادفع للأعلى بدون ما تضرب الدمبلين ببعض."], when:"إذا البار مشغول، أو تبي حركة أريح للكتف ومدى أوسع."},
  m_bench:{n:"جهاز ضغط الصدر جالس", eq:"جهاز ضغط الصدر", need:"machine", cue:["اضبط الكرسي عشان المقابض بمستوى منتصف الصدر.","ادفع بتحكم ورجّع ببطء."], when:"إذا تتمرن لحالك بدون مساعد، أو تبي ثبات أكثر."},
  pushup:{n:"ضغط (بوش أب)", eq:"وزن الجسم", need:"", bw:1, cue:["جسمك خط واحد، واليدين أعرض من الكتف شوي.","انزل لين يقرب صدرك من الأرض."], when:"إذا ما فيه بنش أو جهاز فاضي. زد وزن على ظهرك إذا صار سهل."},
  row:{n:"تجديف بار", eq:"بار", need:"bb", st:"back", skill:1, cue:["اثنِ الورك والظهر مستقيم، والصدر مايل ٤٥ درجة تقريباً.","اسحب البار لأسفل البطن بدون ما تنتر بجسمك."]},
  tbar:{n:"تجديف تي بار", eq:"جهاز تي بار أو بار بزاوية", need:"bb", st:"back", cue:["الظهر مستقيم والركبة مثنية شوي.","اسحب المقبض لبطنك واعصر لوحي الكتف."], when:"إذا متوفر جهاز تي بار وتبي حمل أثقل بثبات أكثر."},
  db_row:{n:"تجديف دمبل بيد وحدة", eq:"دمبل + بنش", need:"db", cue:["اسند يدك وركبتك على البنش والظهر مستوي.","اسحب الدمبل لجنب خصرك والكوع قريب من جسمك."], when:"إذا أسفل ظهرك يتعب من التجديف بالبار، أو البار مشغول."},
  iso_row:{n:"جهاز تجديف بسند صدر", eq:"جهاز تجديف", need:"machine", cue:["صدرك لاصق بالمسند طول الحركة.","اسحب المقابض واعصر لوحي الكتف ثانية."], when:"إذا تبي تشيل الحمل عن أسفل الظهر تماماً."},
  crow:{n:"تجديف كيبل جالس", eq:"جهاز تجديف كيبل", need:"cable", cue:["صدرك مرفوع وظهرك مستقيم.","اسحب المقبض لبطنك بدون ما تميل للخلف."]},
  ohp:{n:"ضغط أكتاف بار واقف", eq:"بار", need:"bb", st:"shoulder back", skill:1, cue:["شد البطن والمقعدة عشان ما يتقوس ظهرك.","ادفع البار فوق راسك بخط مستقيم."]},
  db_ohp:{n:"ضغط أكتاف دمبل جالس", eq:"دمبل + بنش بمسند", need:"db", st:"shoulder", cue:["ظهرك على المسند والدمبل بمستوى الأذن.","ادفع للأعلى بدون ما تقفل الكوع بقوة."], when:"إذا تبي سند للظهر، أو البار مشغول."},
  m_ohp:{n:"جهاز ضغط الأكتاف", eq:"جهاز ضغط الأكتاف", need:"machine", st:"shoulder", cue:["اضبط الكرسي عشان المقابض بمستوى الكتف.","ادفع للأعلى بتحكم ورجّع ببطء."], when:"إذا تبي مسار ثابت وأسهل تحكم."},
  latpd:{n:"سحب أمامي واسع", eq:"جهاز السحب العالي", need:"cable", cue:["اسحب البار لأعلى الصدر والكوع نازل لتحت.","لا تميل للخلف كثير، ورجّع الوزن بتحكم."]},
  cg_pd:{n:"سحب أمامي بقبضة ضيقة", eq:"جهاز السحب العالي + مقبض ضيق", need:"cable", cue:["اسحب المقبض لأعلى الصدر والكوع قريب من جسمك.","مد ذراعك كاملة في الأعلى."], when:"إذا البار العريض مشغول، أو القبضة الواسعة تضايق كتفك."},
  pullup:{n:"عقلة", eq:"بار عقلة", need:"pull", bw:1, skill:1, cue:["ابدأ من تعليق كامل واسحب صدرك للبار.","انزل بتحكم. إذا ما تكمل ٦، استخدم مساعدة."]},
  band_pullup:{n:"عقلة بمساعدة مطاط", eq:"بار عقلة + مطاط مقاومة", need:"pull+acc", bw:1, cue:["حط ركبتك أو قدمك في المطاط.","نفس حركة العقلة، والمطاط يساعدك في الأسفل."], when:"إذا ما تقدر تكمل ٦ عقلات كاملة."},
  chinup:{n:"عقلة بقبضة معكوسة", eq:"بار عقلة", need:"pull", bw:1, st:"elbow", cue:["الكفين باتجاهك وبعرض الكتف.","اسحب لين يتعدى ذقنك البار."], when:"إذا تبي تشرك البايسبس أكثر."},
  curl_i:{n:"بايسبس دمبل مائل", eq:"دمبل + بنش مائل", need:"db", cue:["خلّ العضد ثابت ومتدلي ورا جسمك.","نزّل الدمبل ببطء لين تمد ذراعك كاملة."]},
  db_curl:{n:"بايسبس دمبل واقف", eq:"دمبل", need:"db", cue:["الكوع ثابت جنب جسمك.","ارفع بدون مرجحة ونزّل ببطء."], when:"إذا ما فيه بنش مائل، أو البار مشغول."},
  cable_curl:{n:"بايسبس كيبل", eq:"كيبل سفلي + بار", need:"cable", cue:["الكوع ثابت وجسمك مستقيم.","اسحب للأعلى واعصر ثانية."], when:"إذا تبي شد مستمر طول الحركة."},
  pushd:{n:"ترايسبس كيبل بالحبل", eq:"كيبل علوي + حبل", need:"cable", cue:["ثبّت الكوع جنب جسمك.","مد ذراعك كاملة وافتح الحبل في الأسفل."]},
  pushd_bar:{n:"ترايسبس كيبل بالبار", eq:"كيبل علوي + بار", need:"cable", st:"elbow", cue:["الكوع ثابت جنب جسمك.","ادفع البار لتحت لين تمد ذراعك."], when:"إذا الحبل مشغول، أو تبي وزن أثقل شوي."},
  dips:{n:"متوازي (ديبس)", eq:"جهاز المتوازي", need:"pull", bw:1, st:"shoulder elbow", cue:["الجسم مستقيم والكوع قريب.","انزل لين زاوية ٩٠ درجة في الكوع وادفع."], when:"إذا الكيبل مشغول وكتفك سليم."},
  cg_bench:{n:"بنش بقبضة ضيقة", eq:"بار + بنش", need:"bb", st:"elbow", cue:["القبضة بعرض الكتف، مو أضيق.","الكوع قريب من جسمك في النزول."], when:"إذا تبي حمل ثقيل للترايسبس."},
  squat:{n:"سكوات بار", eq:"بار + رف سكوات", need:"bb", st:"back knee", skill:1, big:1, cue:["شد بطنك قبل النزول، والركبة باتجاه أصابع القدم.","انزل لين يوازي فخذك الأرض، والكعب ثابت."]},
  sm_squat:{n:"سكوات سميث", eq:"جهاز سميث", need:"smith", st:"knee", big:1, cue:["قدّم قدميك شوي عن البار.","انزل بتحكم والظهر مستقيم."], when:"إذا الرف مشغول، أو تبي مسار ثابت."},
  goblet:{n:"قوبلت سكوات", eq:"دمبل أو كيتل بيل", need:"db", cue:["امسك الدمبل عند صدرك والكوع لتحت.","انزل بين ركبتيك والصدر مرفوع."], when:"إذا تبي وزن أخف وتقنية أسهل، أو ما فيه أجهزة."},
  lpress:{n:"ليق برس", eq:"جهاز ليق برس", need:"machine", big:1, cue:["أسفل ظهرك لاصق بالمسند طول الحركة.","انزل لين ٩٠ درجة تقريباً، ولا تقفل الركبة في الأعلى."]},
  hack:{n:"هاك سكوات", eq:"جهاز هاك سكوات", need:"machine", st:"knee", big:1, cue:["ظهرك لاصق بالمسند والقدم بعرض الكتف.","انزل بتحكم لأعمق نقطة تقدرها والكعب ثابت."]},
  rdl:{n:"رومانيان ديدلفت", eq:"بار", need:"bb", st:"back", skill:1, big:1, cue:["ادفع الورك للخلف والركبة مثنية شوي، والظهر مستقيم.","البار قريب من رجلك، وانزل لين تحس بشد في الخلفية."]},
  db_rdl:{n:"رومانيان ديدلفت دمبل", eq:"دمبل", need:"db", st:"back", cue:["نفس حركة البار: الورك للخلف والظهر مستقيم.","الدمبل ينزل قدام الفخذ والساق."], when:"إذا البار مشغول، أو تبي وزن أخف تتعلم فيه الحركة."},
  hyper:{n:"هايبر اكستنشن", eq:"كرسي الهايبر ٤٥ درجة", need:"machine", bw:1, cue:["الوسادة تحت عظم الورك.","انزل والظهر مستقيم، واطلع لين يصير جسمك خط واحد."], when:"إذا تبي نفس حركة الورك بحمل أخف."},
  lcurl:{n:"ليق كيرل نايم", eq:"جهاز ليق كيرل", need:"machine", cue:["الورك لاصق بالجهاز ولا ترفعه.","اسحب بتحكم ورجّع ببطء."]},
  slcurl:{n:"ليق كيرل جالس", eq:"جهاز ليق كيرل جالس", need:"machine", cue:["ثبّت الوسادة فوق الركبة.","اسحب لآخر مدى ورجّع ببطء."]},
  ball_curl:{n:"ليق كيرل بالكورة", eq:"كورة سويسرية", need:"acc", bw:1, cue:["ارفع الورك وكعبك على الكورة.","اسحب الكورة باتجاهك والورك مرفوع."], when:"إذا أجهزة الليق كيرل مشغولة أو غير متوفرة."},
  calf:{n:"سمانة واقف", eq:"جهاز سمانة أو عتبة", need:"machine", cue:["انزل بالكعب لآخر مدى ووقف ثانية.","اطلع على رؤوس أصابعك لأعلى نقطة."]},
  calf_press:{n:"سمانة على الليق برس", eq:"جهاز ليق برس", need:"machine", cue:["مقدمة القدم على حافة المنصة.","ادفع بأصابعك والركبة شبه مفرودة."], when:"إذا ما فيه جهاز سمانة."},
  calf_seated:{n:"سمانة جالس", eq:"جهاز سمانة جالس", need:"machine", cue:["الوسادة فوق الركبة.","انزل بالكعب كامل واطلع لأعلى نقطة."], when:"إذا تبي تغيير، وهو يركز على الجزء العميق من السمانة."},
  plank:{n:"بلانك", eq:"فرشة أرضية", need:"", bw:1, time:1, cue:["جسمك خط واحد من الراس للكعب.","شد البطن والمقعدة، ولا تخلي الورك ينزل."]},
  abroller:{n:"عجلة البطن", eq:"عجلة بطن", need:"acc", bw:1, st:"back", cue:["ابدأ على الركب والظهر مستوي.","امتد قدام قد ما تتحكم، وارجع بشد البطن."], when:"إذا البلانك ٦٠ ثانية صار سهل."},
  deadbug:{n:"ديد بق", eq:"فرشة أرضية", need:"", bw:1, cue:["أسفل ظهرك لاصق بالأرض.","مد يد ورجل متعاكسة ببطء وبدّل."], when:"إذا تبي تمرين بطن ألطف على أسفل الظهر."},
  incdb:{n:"بنش مائل دمبل", eq:"دمبل + بنش مائل ٣٠ درجة", need:"db", cue:["زاوية البنش ٣٠ درجة تقريباً، مو أعلى.","نزّل الدمبل لجانب الصدر والكوع مايل ٤٥ درجة."]},
  inc_bb:{n:"بنش مائل بار", eq:"بار + بنش مائل", need:"bb", st:"shoulder", cue:["نزّل البار لأعلى الصدر.","الكوع تحت البار طول الحركة."], when:"إذا تبي حمل أثقل من الدمبل."},
  inc_sm:{n:"بنش مائل سميث", eq:"سميث + بنش مائل", need:"smith", st:"shoulder", cue:["اضبط البنش عشان البار ينزل على أعلى الصدر.","ادفع بتحكم."], when:"إذا تتمرن لحالك وتبي أمان أكثر."},
  inc_m:{n:"جهاز صدر مائل", eq:"جهاز ضغط صدر مائل", need:"machine", cue:["المقابض بمستوى أعلى الصدر.","ادفع ورجّع ببطء."], when:"إذا تبي ثبات كامل وتركيز على العضلة."},
  chestm:{n:"جهاز ضغط الصدر", eq:"جهاز ضغط الصدر", need:"machine", cue:["اضبط الكرسي عشان المقابض بمستوى منتصف الصدر.","ادفع بدون ما تقفل الكوع بقوة، ورجّع ببطء."]},
  lat:{n:"رفرفة جانبي دمبل", eq:"دمبل خفيف", need:"db", cue:["ارفع لمستوى الكتف بس، والكوع مثني شوي.","وزن خفيف وبدون مرجحة، والنزول أبطأ من الطلوع."]},
  lat_cable:{n:"رفرفة جانبي كيبل", eq:"كيبل سفلي", need:"cable", cue:["الكيبل من ورا جسمك أو قدامه.","ارفع لمستوى الكتف بتحكم."], when:"إذا تبي شد مستمر من أول الحركة."},
  lat_seated:{n:"رفرفة جانبي جالس", eq:"دمبل + بنش", need:"db", cue:["اجلس وظهرك مستقيم.","ارفع بدون ما تستعين بجسمك."], when:"إذا تلاحظ نفسك تتمرجح وأنت واقف."},
  fly:{n:"فلاي كيبل", eq:"كيبل كروس أوفر", need:"cable", st:"shoulder", cue:["الكوع مثني شوي وثابت طول الحركة.","ضم يدينك قدام صدرك ووقف ثانية."]},
  pecdeck:{n:"جهاز الفراشة", eq:"جهاز الفراشة (بيك ديك)", need:"machine", cue:["الكوع بمستوى الكتف أو أقل شوي.","ضم واعصر الصدر ثانية."], when:"إذا الكيبل مشغول، أو تبي مسار ثابت."},
  db_fly:{n:"فلاي دمبل", eq:"دمبل + بنش مستوي", need:"db", st:"shoulder", cue:["الكوع مثني شوي.","انزل لين تحس بشد خفيف في الصدر، لا تنزل أكثر."], when:"إذا ما فيه كيبل ولا جهاز فراشة."},
  ohtri:{n:"ترايسبس كيبل فوق الراس", eq:"كيبل + حبل", need:"cable", cue:["الكوع قريب من راسك ومتجه للأمام.","مد ذراعك كاملة وارجع لآخر مدى ورا راسك."]},
  db_ohtri:{n:"ترايسبس دمبل فوق الراس جالس", eq:"دمبل + بنش بمسند", need:"db", cue:["امسك الدمبل بيدين ورا راسك.","مد ذراعك للأعلى والكوع ثابت."], when:"إذا الكيبل مشغول."},
  skull:{n:"سكل كرشر", eq:"بار إي زد + بنش", need:"bb", st:"elbow", cue:["العضد ثابت ومايل شوي للخلف.","نزّل البار لجبهتك أو وراها بتحكم."], when:"إذا كوعك سليم وتبي حمل أثقل."},
  face:{n:"فيس بول", eq:"كيبل بحبل على مستوى الوجه", need:"cable", cue:["اسحب الحبل باتجاه وجهك والكوع مرتفع.","افتح يدينك في النهاية ووقف ثانية."]},
  cable_rdelt:{n:"رفرفة خلفي كيبل", eq:"كيبل كروس أوفر", need:"cable", cue:["امسك الكيبلين متقاطعين.","افتح ذراعيك للخلف بقيادة الكوع."], when:"إذا تبي شد مستمر للكتف الخلفي."},
  band_apart:{n:"سحب المطاط للجانبين", eq:"مطاط مقاومة", need:"acc", cue:["امسك المطاط قدام صدرك بذراعين ممدودة.","افتح للجانبين واعصر لوحي الكتف."], when:"إذا الكيبل مشغول، أو تتمرن بدون أجهزة."},
  rdelt:{n:"رفرفة خلفي دمبل جالس", eq:"دمبل خفيف + بنش", need:"db", cue:["اجلس ومِل بصدرك على فخذك والظهر مستقيم.","ارفع للجانبين بقيادة الكوع وبدون مرجحة."]},
  rev_fly:{n:"رفرفة خلفي على بنش مائل", eq:"دمبل + بنش مائل", need:"db", cue:["صدرك على البنش المائل.","ارفع الدمبل للجانبين واعصر ثانية."], when:"إذا تبي تمنع المرجحة تماماً."},
  bbcurl:{n:"بايسبس بار", eq:"بار مستقيم", need:"bb", st:"elbow", cue:["الكوع ثابت جنب جسمك.","بدون مرجحة بالظهر، ونزّل ببطء."]},
  ez_curl:{n:"بايسبس بار إي زد", eq:"بار إي زد", need:"bb", cue:["امسك البار من الانحناءة الداخلية.","الكوع ثابت وارفع بتحكم."], when:"إذا البار المستقيم يضايق رسغك."},
  hammer:{n:"هامر كيرل", eq:"دمبل", need:"db", cue:["القبضة محايدة والإبهام لفوق.","الكوع ثابت، وارفع لمستوى الكتف."]},
  rope_hammer:{n:"هامر كيبل بالحبل", eq:"كيبل سفلي + حبل", need:"cable", cue:["امسك الحبل والإبهام لفوق.","الكوع ثابت جنب جسمك."], when:"إذا تبي شد مستمر، أو الدمبل مشغول."},
  rev_curl:{n:"بايسبس بقبضة معكوسة", eq:"بار", need:"bb", st:"elbow", cue:["الكفين لتحت وبعرض الكتف.","ارفع بتحكم والرسغ مستقيم."], when:"إذا تبي تركيز أكثر على الساعد."},
  hipt:{n:"هيب ثرست بار", eq:"بار + بنش + وسادة", need:"bb", big:1, cue:["أعلى ظهرك على حافة البنش والذقن للصدر.","ادفع الورك لين يصير جسمك خط مستقيم واعصر ثانية."]},
  glute_bridge:{n:"قلوت بريدج بار", eq:"بار + وسادة", need:"bb", big:1, cue:["ظهرك على الأرض والبار على الورك.","ادفع الورك للأعلى واعصر المقعدة."], when:"إذا ما فيه بنش فاضي."},
  sl_bridge:{n:"قلوت بريدج برجل وحدة", eq:"فرشة أرضية", need:"", bw:1, cue:["رجل على الأرض والثانية مرفوعة.","ادفع الورك للأعلى ووقف ثانية."], when:"إذا ما فيه بار، أو تبي تمرين بدون معدات."},
  lunge:{n:"طعنات دمبل (لكل رجل)", eq:"دمبل", need:"db", st:"knee", cue:["خطوة طويلة والجسم مستقيم.","الركبة الخلفية تقرب من الأرض، وادفع بكعب الرجل الأمامية."]},
  split:{n:"سبلت سكوات دمبل (لكل رجل)", eq:"دمبل", need:"db", st:"knee", cue:["رجل قدام ورجل ورا وثابتة.","انزل عمودي والجسم مستقيم."], when:"إذا ما فيه مساحة مشي."},
  rear_lunge:{n:"طعنات للخلف دمبل (لكل رجل)", eq:"دمبل", need:"db", cue:["ارجع برجل وحدة للخلف.","الثقل على كعب الرجل الأمامية."], when:"إذا الطعنات الأمامية تضايق ركبتك."},
  stepup:{n:"صعود على بنش بدمبل (لكل رجل)", eq:"دمبل + بنش أو صندوق", need:"db", st:"knee", cue:["قدمك كاملة على البنش.","اطلع بقوة الرجل اللي فوق، وانزل بتحكم."], when:"إذا تبي حركة أبسط من الطعنات."},
  lext:{n:"ليق اكستنشن", eq:"جهاز ليق اكستنشن", need:"machine", st:"knee", cue:["مد رجلك كاملة ووقف ثانية.","انزل ببطء وبدون ما ترمي الوزن."]},
  sissy:{n:"سيسي سكوات بمساعدة", eq:"عمود تمسكه + وزن اختياري", need:"", bw:1, st:"knee", cue:["امسك عمود للتوازن.","مِل بجسمك للخلف والركبة تتقدم، بمدى تتحكم فيه."], when:"إذا جهاز الاكستنشن مشغول وركبتك سليمة."},
  knee:{n:"رفع أرجل معلق", eq:"بار عقلة", need:"pull", bw:1, cue:["تعلّق بالبار وجسمك ثابت.","ارفع ركبك لمستوى الورك أو أعلى بدون مرجحة."]},
  captain:{n:"رفع ركب على كرسي الكابتن", eq:"كرسي الكابتن (متوازي بمسند)", need:"pull", bw:1, cue:["ظهرك على المسند والساعد على الوسادة.","ارفع ركبك لصدرك وانزل ببطء."], when:"إذا قبضتك تتعب قبل بطنك في التعليق."},
  leg_raise:{n:"رفع أرجل على البنش", eq:"بنش مستوي", need:"", bw:1, cue:["امسك البنش ورا راسك.","ارفع رجليك لين تصير عمودية وانزل ببطء."], when:"إذا ما فيه بار عقلة فاضي."},
  cable_crunch:{n:"كرنش كيبل", eq:"كيبل علوي + حبل", need:"cable", cue:["اجلس على ركبك والحبل جنب راسك.","اطوِ بطنك لتحت، والورك ثابت."], when:"إذا تبي تمرين بطن تزيد وزنه تدريجياً."}
};
/* each slot of the programme: muscles + ordered options (first = primary) */
const SLOTS = {
  bench:{m:"الصدر · الكتف الأمامي · الترايسبس", o:["bench","db_bench","m_bench","pushup"]},
  row:{m:"الظهر الأوسط · اللاتس · البايسبس", o:["row","tbar","db_row","iso_row"]},
  ohp:{m:"الأكتاف · الترايسبس", o:["ohp","db_ohp","m_ohp"]},
  latpd:{m:"اللاتس · البايسبس", o:["latpd","cg_pd","pullup","band_pullup"]},
  curl_i:{m:"البايسبس", o:["curl_i","db_curl","cable_curl"]},
  pushd:{m:"الترايسبس", o:["pushd","pushd_bar","dips","cg_bench"]},
  squat:{m:"الفخذ الأمامي · المقعدة", o:["squat","sm_squat","lpress","goblet"]},
  rdl:{m:"الفخذ الخلفي · المقعدة · أسفل الظهر", o:["rdl","db_rdl","hyper"]},
  lpress:{m:"الفخذ الأمامي · المقعدة", o:["lpress","hack","goblet"]},
  lcurl:{m:"الفخذ الخلفي", o:["lcurl","slcurl","ball_curl"]},
  calf:{m:"السمانة", o:["calf","calf_press","calf_seated"]},
  plank:{m:"البطن والجذع", o:["plank","abroller","deadbug"]},
  incdb:{m:"أعلى الصدر · الكتف الأمامي", o:["incdb","inc_bb","inc_sm","inc_m"]},
  chestm:{m:"الصدر · الترايسبس", o:["chestm","db_bench","pushup"]},
  lat:{m:"الكتف الجانبي", o:["lat","lat_cable","lat_seated"]},
  fly:{m:"الصدر", o:["fly","pecdeck","db_fly"]},
  ohtri:{m:"الترايسبس (الراس الطويل)", o:["ohtri","db_ohtri","skull"]},
  pullup:{m:"اللاتس · البايسبس", o:["pullup","band_pullup","latpd","chinup"]},
  crow:{m:"الظهر الأوسط · اللاتس", o:["crow","iso_row","db_row"]},
  face:{m:"الكتف الخلفي · أعلى الظهر", o:["face","cable_rdelt","band_apart"]},
  rdelt:{m:"الكتف الخلفي", o:["rdelt","rev_fly","cable_rdelt"]},
  bbcurl:{m:"البايسبس", o:["bbcurl","ez_curl","db_curl","cable_curl"]},
  hammer:{m:"البايسبس · الساعد", o:["hammer","rope_hammer","rev_curl"]},
  hack:{m:"الفخذ الأمامي · المقعدة", o:["hack","lpress","sm_squat","goblet"]},
  hipt:{m:"المقعدة · الفخذ الخلفي", o:["hipt","glute_bridge","sl_bridge"]},
  lunge:{m:"الفخذ الأمامي · المقعدة", o:["lunge","split","rear_lunge","stepup"]},
  lext:{m:"الفخذ الأمامي", o:["lext","sissy","goblet"]},
  slcurl:{m:"الفخذ الخلفي", o:["slcurl","lcurl","ball_curl"]},
  knee:{m:"أسفل البطن · عضلات الورك", o:["knee","captain","leg_raise","cable_crunch"]}
};
/* line-diagram used when a photo cannot load */
const ICON_OF = {bench:"bench",row:"row",ohp:"ohp",latpd:"pulldown",curl_i:"curl",pushd:"pushdown",squat:"squat",rdl:"hinge",lpress:"legpress",lcurl:"legmachine",calf:"calf",plank:"plank",incdb:"incline",chestm:"bench",lat:"lateral",fly:"fly",ohtri:"ohtri",pullup:"pullup",crow:"seatedrow",face:"facepull",rdelt:"lateral",bbcurl:"curl",hammer:"curl",hack:"squat",hipt:"hipthrust",lunge:"lunge",lext:"legmachine",slcurl:"legmachine",knee:"kneeraise"};
/* weekly templates: [slot, sets, reps] */
const DAY_UPPER=[["bench",4,"5–6"],["row",4,"6–8"],["ohp",3,"6–8"],["latpd",3,"8–10"],["curl_i",2,"10–12"],["pushd",2,"10–12"]],
      DAY_LOWER=[["squat",4,"5–6"],["rdl",3,"6–8"],["lpress",3,"10–12"],["lcurl",3,"10–12"],["calf",3,"12–15"],["plank",3,"45–60"]],
      DAY_LEGS =[["hack",3,"8–10"],["hipt",3,"8–10"],["lunge",3,"10–12"],["lext",3,"12–15"],["slcurl",3,"12–15"],["knee",3,"10–12"]];
const TEMPLATES = {
  5:[{t:"علوي قوة",s:DAY_UPPER},{t:"سفلي قوة",s:DAY_LOWER},
     {t:"دفع",s:[["incdb",3,"8–10"],["chestm",3,"10–12"],["lat",4,"12–15"],["fly",3,"12–15"],["ohtri",3,"10–12"]]},
     {t:"سحب",s:[["pullup",3,"6–10"],["crow",3,"10–12"],["face",3,"12–15"],["rdelt",3,"12–15"],["bbcurl",3,"8–10"],["hammer",2,"10–12"]]},
     {t:"أرجل",s:DAY_LEGS}],
  4:[{t:"علوي ١",s:DAY_UPPER},{t:"سفلي ١",s:DAY_LOWER},
     {t:"علوي ٢",s:[["incdb",3,"8–10"],["pullup",3,"6–10"],["lat",3,"12–15"],["crow",3,"10–12"],["ohtri",3,"10–12"],["bbcurl",3,"8–10"],["face",2,"12–15"]]},
     {t:"سفلي ٢",s:DAY_LEGS}],
  3:[{t:"جسم كامل ١",s:[["squat",3,"6–8"],["bench",3,"6–8"],["row",3,"8–10"],["lat",3,"12–15"],["lcurl",3,"10–12"],["plank",3,"45–60"]]},
     {t:"جسم كامل ٢",s:[["rdl",3,"6–8"],["incdb",3,"8–10"],["latpd",3,"8–10"],["lunge",3,"10–12"],["pushd",3,"10–12"],["bbcurl",3,"10–12"]]},
     {t:"جسم كامل ٣",s:[["hack",3,"8–10"],["ohp",3,"8–10"],["crow",3,"10–12"],["hipt",3,"8–10"],["face",3,"12–15"],["knee",3,"10–12"]]}]
};
const WEEK = {5:"تمرين، تمرين، راحة، تمرين، تمرين، تمرين، راحة", 4:"تمرين، تمرين، راحة، تمرين، تمرين، راحة، راحة", 3:"تمرين، راحة، تمرين، راحة، تمرين، راحة، راحة"};
const EQ_OPTS  = [["bb","بار ورف"],["db","دمبل"],["cable","كيبل"],["machine","أجهزة"],["smith","سميث"],["pull","عقلة ومتوازي"],["acc","مطاط وكورة وعجلة"]];
const LIM_OPTS = [["shoulder","الكتف"],["back","أسفل الظهر"],["knee","الركبة"],["elbow","الكوع أو الرسغ"]];
const CARDIO_OPTS = [["walk","مشي أو سير بميلان"],["run","هرولة"],["bike","دراجة"],["ellip","إليبتكال"],["rowerg","جهاز تجديف"],["swim","سباحة"],["stairs","جهاز درج"]];
const LEVELS = [["beg","مبتدئ"],["mid","متوسط"],["adv","متقدم"]];
const PACES  = [["easy","هادئ"],["mid","معتدل"],["fast","أسرع"]];
const DEFAULT_PROG = {days:5, level:"mid", pace:"mid", eq:EQ_OPTS.map(x=>x[0]), lim:[], cardio:["walk","run","bike"], swaps:{}};
/* whatever is stored, hand back a complete, valid programme */
function normProg(p){
  p = (p && typeof p==="object") ? p : {};
  const pickArr=(a,opts,def)=>Array.isArray(a) ? a.filter(x=>opts.some(o=>o[0]===x)) : def.slice();
  const sw={}; if(p.swaps && typeof p.swaps==="object") for(const [k,v] of Object.entries(p.swaps)) if(SLOTS[k] && SLOTS[k].o.includes(v) && v!==SLOTS[k].o[0]) sw[k]=v;
  return {days:[3,4,5].includes(p.days)?p.days:5, level:LEVELS.some(l=>l[0]===p.level)?p.level:"mid", pace:PACES.some(l=>l[0]===p.pace)?p.pace:"mid",
    eq:pickArr(p.eq,EQ_OPTS,DEFAULT_PROG.eq), lim:pickArr(p.lim,LIM_OPTS,[]), cardio:pickArr(p.cardio,CARDIO_OPTS,DEFAULT_PROG.cardio), swaps:sw};
}
const hasGear = (id,prog) => { const n=LIB[id].need; return !n || n.split("+").every(t=>prog.eq.includes(t)); };
const hurts   = (id,prog) => (LIB[id].st||"").split(" ").filter(t=>t && prog.lim.includes(t));
/* choose the exercise for one slot: the user's own pick first, then the first option that fits gear, pain areas and level */
function pickOption(slot, prog, used){
  const opts=SLOTS[slot].o, sw=prog.swaps[slot];
  if(sw && !used.has(sw)) return {id:sw};
  const avail=opts.filter(id=>hasGear(id,prog) && !used.has(id));
  if(!avail.length) return {id:null, why:"eq"};
  let ok=avail.filter(id=>!hurts(id,prog).length);
  if(!ok.length) return {id:null, why:"lim"};
  if(prog.level==="beg"){ const easy=ok.filter(id=>!LIB[id].skill); if(easy.length) ok=easy; }
  return {id:ok[0]};
}
/* the week as the screens use it: [{t, ex:[[id,name,sets,reps,slot]]}] plus notes about anything left out */
function buildPlan(prog){
  const notes=[];
  const days=TEMPLATES[prog.days].map(day=>{
    const used=new Set(), ex=[];
    day.s.forEach(([slot,n,reps],i)=>{
      const pk=pickOption(slot,prog,used), main=LIB[SLOTS[slot].o[0]];
      if(!pk.id){ notes.push(pk.why==="lim" ? `حذفت «${main.n}» من ${day.t} لأن كل خياراته تحمّل منطقة قلت إنها تألمك.` : `حذفت «${main.n}» من ${day.t} لأن معداته غير متوفرة عندك.`); return; }
      used.add(pk.id);
      const info=LIB[pk.id]; let sets=n, r=reps;
      if(prog.level==="beg"){ sets=Math.max(2,n-1); if(!info.time && parseInt(reps.split("–").pop(),10)<=8) r="8–10"; }
      if(prog.level==="adv" && i<2) sets=n+1;
      ex.push([pk.id, info.n, sets, r, slot]);
    });
    return {t:day.t, ex};
  });
  return {days, notes};
}
let planCache={key:"", plan:null};
function getPlan(){
  const prog=S.program, key=JSON.stringify(prog);
  if(planCache.key!==key) planCache={key, plan:buildPlan(prog)};
  return planCache.plan;
}
const CARDIO_NAMES = Object.fromEntries(CARDIO_OPTS);
function cardioText(prog){
  const acts=(prog.cardio.length?prog.cardio:["walk"]).map(c=>CARDIO_NAMES[c]).join(" أو ");
  const dose={5:"٣٠–٤٠ دقيقة بعد كل تمرين حديد", 4:"٣٠–٤٠ دقيقة بعد كل تمرين حديد، وجلسة ٣٠–٤٥ دقيقة في يوم راحة", 3:"٣٠ دقيقة بعد كل تمرين حديد، وجلستين ٣٠–٤٥ دقيقة في أيام الراحة"}[prog.days];
  let t=`${dose}: ${acts}. الشدة المناسبة إنك تقدر تتكلم بجمل قصيرة. المجموع المستهدف ١٥٠–٢٥٠ دقيقة بالأسبوع.`;
  if(prog.level==="beg") t+=" ابدأ بـ٢٠ دقيقة وزد ٥ دقايق كل أسبوع.";
  if(prog.lim.includes("knee") && prog.cardio.some(c=>c==="stairs"||c==="walk")) t+=" مع ألم الركبة، الدراجة أو السباحة أو الإليبتكال أخف من الميلان والدرج.";
  return t;
}
const LEVEL_TEXT = {beg:"وقّف كل مجموعة وباقي لك ٢–٣ تكرارات. أول ٤ أسابيع ركّز على الأداء الصحيح قبل الوزن.", mid:"وقّف كل مجموعة وباقي لك تكرار أو اثنين.", adv:"وقّف أغلب المجموعات وباقي لك تكرار واحد. آخر مجموعة في التمارين المعزولة ممكن توصلها للنهاية."};

/* movement diagrams, 64x64: body = default stroke, .g gear, .e load (accent), .a movement arrow */
const ICONS = (() => {
  const h=(x,y)=>`<circle cx="${x}" cy="${y}" r="4.5"/>`, b=d=>`<path d="${d}"/>`, g=d=>`<path class="g" d="${d}"/>`,
        e=d=>`<path class="e" d="${d}"/>`, w=(x,y,r=4)=>`<circle class="e f" cx="${x}" cy="${y}" r="${r}"/>`,
        a=d=>`<path class="a" d="${d}"/>`, a2=d=>`<path class="a a2" d="${d}"/>`;
  return {
    bench: g("M10 46H52M16 46v9M46 46v9")+h(17,39)+b("M22 42H40L49 47V56M28 42V28")+w(28,23,4.5)+a2("M40 34V16"),
    incline: g("M12 52L34 26M10 52H24")+h(35,21)+b("M30 31L19 45H33V56M29 32L40 22")+w(43,19,3.5)+a2("M50 32L56 20"),
    ohp: h(32,26)+b("M32 31V46M32 46L27 60M32 46L37 60M32 33L23 30L22 16M32 33L41 30L42 16")+e("M12 15H52M12 10v10M52 10v10")+a2("M58 34V22"),
    row: h(17,24)+b("M40 34L22 27M40 34L37 46L40 58M25 29L28 38")+w(29,43)+a2("M14 50V36"),
    seatedrow: g("M10 42V58")+h(38,21)+b("M40 46L38 27M40 46H24L12 50M38 30H24")+e("M24 30H6")+a("M12 21H30"),
    pulldown: h(32,27)+b("M32 32V50H44V60M32 34L24 24L21 13M32 34L40 24L43 13")+e("M13 12H51M32 12V3")+a("M57 14V30"),
    pullup: g("M10 8H54")+h(32,19)+b("M32 24V42M32 42L28 57M32 42L36 57M32 26L23 9M32 26L41 9")+a("M54 36V18"),
    squat: h(27,14)+b("M40 38L30 21M40 38L26 44L30 58H23")+w(36,22)+a2("M53 26V46"),
    hinge: h(18,25)+b("M42 33L23 28M42 33L40 46V58M26 30V43")+w(26,48)+a2("M12 54V38"),
    legpress: g("M8 54H26")+h(11,30)+b("M22 50L13 36M22 50L32 38L45 31")+e("M43 21L51 39")+a2("M38 54L50 46"),
    legmachine: g("M18 44V20M18 44H38M26 44V58")+h(25,17)+b("M25 22V41H41V55")+w(44,56,3)+a("M49 53Q58 46 56 34"),
    hipthrust: g("M6 34H18V50H6Z")+h(12,29)+b("M18 37H48V56")+w(34,32)+a2("M34 58V46"),
    lunge: h(30,11)+b("M30 16V34M30 34L43 42V57M30 34L22 47L11 53M30 19L34 33")+w(34,37,3)+a2("M54 20V36"),
    calf: g("M26 59H46")+h(32,11)+b("M32 16V36M32 36V51L39 57")+a("M48 46V30"),
    curl: h(30,11)+b("M30 16V38M30 38L27 57M30 38L33 57M30 21V31L40 25")+w(43,23,3.5)+a("M48 38Q54 30 49 21"),
    pushdown: g("M20 6H32")+h(36,13)+b("M36 18V40M36 40L33 58M36 40L39 58M36 22V32L28 37")+e("M27 37V6")+a("M17 22V40"),
    ohtri: h(27,20)+b("M28 25V43M28 43L25 59M28 43L31 59M29 27L38 12L46 16")+w(49,17,3)+a("M52 11Q47 3 40 5"),
    lateral: h(32,13)+b("M32 18V40M32 40L28 58M32 40L36 58M32 22L16 27M32 22L48 27")+w(13,28,3)+w(51,28,3)+a("M9 47V37")+a("M55 47V37"),
    fly: h(32,15)+b("M32 20V42M32 42L28 59M32 42L36 59M32 24L17 22M32 24L47 22")+e("M17 22L6 9M47 22L58 9")+a("M13 31Q19 39 27 36")+a("M51 31Q45 39 37 36"),
    facepull: h(42,13)+b("M42 18V40M42 40L39 58M42 40L45 58M42 23L31 19")+e("M31 19H6")+a("M10 10H28"),
    plank: g("M6 54H58")+h(51,33)+b("M47 37L13 47V52M45 39V51H52")+`<circle class="e" cx="27" cy="20" r="7"/>`+e("M27 16V20H30"),
    kneeraise: g("M12 6H52")+h(32,15)+b("M32 20V38M32 22L25 7M32 22L39 7M32 38L44 36V49")+a("M52 52Q57 43 52 34")
  };
})();
const icon = k => `<svg class="exsvg" viewBox="0 0 64 64" aria-hidden="true">${ICONS[k]||""}</svg>`;
/* double progression: reach the top of the rep range, then add load */
function nextHint(last, reps, info){
  if(!last) return info.time ? "أول مرة: اثبت قد ما تقدر بوضعية صحيحة وسجّل الثواني." : "أول مرة: اختر وزن تكمل فيه كل المجموعات ويبقى لك تكرار أو اثنين.";
  const top=parseInt(String(reps).split("–").pop(),10), unit=info.time?"ثانية":"تكرار";
  const was=`آخر مرة: ${last.w?AR(last.w)+" كجم × ":""}${AR(last.r)}${info.time?" ثانية":""}. `;
  if(last.r>=top) return was + (info.time ? "زد ١٠ ثواني أو صعّب الوضعية." : info.bw && !last.w ? "وصلت أعلى التكرارات: أضف وزن خفيف." : `وصلت أعلى التكرارات: جرّب ${AR(last.w+(info.big?5:2.5))} كجم.`);
  return was + `اليوم: نفس الوزن و${unit} زيادة.`;
}
const AR = n => String(n).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
const fmt = (n, d=1) => (n==null||isNaN(n)) ? "—" : AR(Number(n).toFixed(d));

/* ---------- dates ---------- */
function ymd(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function shortDay(s){const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d).toLocaleDateString("ar-SA-u-ca-gregory-nu-arab",{day:"numeric",month:"short"});}
function today(){return ymd(new Date());}
function addDays(s,n){const [y,m,d]=s.split("-").map(Number);const x=new Date(y,m-1,d);x.setDate(x.getDate()+n);return ymd(x);}
function dayLabel(s){const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d).toLocaleDateString("ar-SA-u-ca-gregory-nu-arab",{weekday:"short",day:"numeric",month:"short"});}

/* ---------- calculations ---------- */
function navyBF(waist, neck, h){
  if(!(waist>neck) || !h) return null;
  return 495/(1.0324 - 0.19077*Math.log10(waist-neck) + 0.15456*Math.log10(h)) - 450;
}
/* least-squares slope of daily weights over the last `days` days, in kg/week; needs 8+ points over 10+ days */
function trendPerWeek(entries, end, days){
  const pts=[]; for(let i=0;i<days;i++){ const k=addDays(end,-i); if(entries[k]!=null) pts.push([-i, entries[k]]); }
  if(pts.length<8 || pts[0][0]-pts[pts.length-1][0]<10) return null;
  const n=pts.length, mx=pts.reduce((a,p)=>a+p[0],0)/n, my=pts.reduce((a,p)=>a+p[1],0)/n;
  let sxy=0, sxx=0; pts.forEach(([x,y])=>{ sxy+=(x-mx)*(y-my); sxx+=(x-mx)**2; });
  return sxy/sxx*7;
}
function avgWindow(entries, end, days){
  const v=[]; for(let i=0;i<days;i++){const k=addDays(end,-i); if(entries[k]!=null) v.push(entries[k]);}
  return v.length ? {avg:v.reduce((a,b)=>a+b,0)/v.length, n:v.length} : null;
}

/* ---------- storage: everything lives on this device (store.js: IndexedDB + journal) ---------- */
let mode="loading";
const S = {settings:null, program:normProg(null), weights:{e:{}}, measures:{e:{}}, lifts:{}, food:{items:[]}, wo:{sets:{}}};
let D = today();
const localWatch = {};
function watch(k, cb){ localWatch[k]=cb; cb(Store.get(k)); }
/* keep the in-memory copy in step with every write, so a second action never builds on stale data */
function applyLocal(k, obj){
  const c=structuredClone(obj);
  if(k==="settings") S.settings=c; else if(k==="program") S.program=normProg(c); else if(k==="weights") S.weights=c; else if(k==="measures") S.measures=c; else if(k==="lifts") S.lifts=c;
  else if(k==="food-"+D) S.food=c; else if(k==="wo-"+D) S.wo=c; else return false;
  return true;
}
function save(k, obj){
  applyLocal(k, obj);
  if(!Store.put(k, obj)) toast("تعذّر الحفظ على الجهاز. صدّر نسخة احتياطية من شاشة الخطة الحين");
  if(localWatch[k]) localWatch[k](structuredClone(obj));
  if(k.startsWith("food-") && k!=="food-"+D) delete weekFood[k.slice(5)];
  return Promise.resolve();
}
function setSync(t, warn){const el=document.getElementById("sync"); el.textContent=t; el.className="pill"+(warn?" warn":"");}
const DAY_MS=864e5;
const fmtDate = t => new Date(t).toLocaleDateString("ar-SA-u-ca-gregory-nu-arab",{day:"numeric",month:"long",year:"numeric"});
const daysSince = t => Math.floor((Date.now()-t)/DAY_MS);
/* header pill + storage card reflect the real state of local saving */
function renderStore(st){
  if(st.mode==="fallback") setSync("حفظ مؤقت", true);
  else if(st.error) setSync("خطأ في الحفظ", true);
  else setSync(st.pending ? "يحفظ…" : "محفوظ على الجهاز", false);
  renderStorageCard();
}
function subscribeAll(){
  watch("settings", v => { S.settings=v; route(); render(); });
  watch("weights", v => {S.weights=v||{e:{}}; render();});
  watch("measures", v => {S.measures=v||{e:{}}; render();});
  watch("lifts", v => {S.lifts=v||{}; render();});
  watch("program", v => {S.program=normProg(v); render();});
  watchDay();
}
function watchDay(){
  watch("food-"+D, v => {S.food=v||{items:[]}; render();});
  watch("wo-"+D, v => { if(woDirty) return; S.wo=v||{}; render(); });
}
/* past midnight: save what is open under the old date, then move every screen to the new day */
function rollDay(){
  if(today()===D || mode==="loading") return;
  flushWO(); D=today(); woDirty=false; trSel=null; renderedDay=null; watchDay(); loadWeek(); render();
}
document.addEventListener("visibilitychange", () => {
  if(document.visibilityState==="hidden"){ flushWO(); return; }
  rollDay();
});
setInterval(rollDay, 60000);
/* totals of the previous 6 days of food (today is left out: an unfinished day would drag the average down) */
const weekFood = {};
async function loadWeek(){
  for(let i=1;i<=6;i++){
    const d=addDays(D,-i); if(weekFood[d]!==undefined) continue;
    let doc=null;
    doc=Store.get("food-"+d);
    const it=(doc&&doc.items)||[];
    weekFood[d] = it.length ? {k:it.reduce((a,x)=>a+(x.k||0),0), p:it.reduce((a,x)=>a+(x.p||0),0)} : null;
  }
  render();
}
function weekStats(){
  const rows=[]; for(let i=1;i<=6;i++){ const r=weekFood[addDays(D,-i)]; if(r) rows.push(r); }
  return rows.length ? {n:rows.length, k:rows.reduce((a,r)=>a+r.k,0)/rows.length, p:rows.reduce((a,r)=>a+r.p,0)/rows.length} : null;
}
window.addEventListener("pagehide", () => flushWO());


/* ---------- navigation ---------- */
let current="today";
const TITLES={setup:"أهلاً", today:"اليوم", weight:"الوزن", food:"الأكل", train:"التمرين", plan:"الخطة"};
function show(v){
  current=v;
  document.getElementById("pageTitle").textContent=TITLES[v]||"نشّف";
  document.getElementById("compactTitle").textContent=TITLES[v]||"نشّف";
  document.querySelectorAll(".view[id^=v-]").forEach(s=>s.classList.toggle("on", s.id==="v-"+v));
  document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("on", b.dataset.go===v));
  document.getElementById("nav").style.display = (v==="setup" || !S.settings) ? "none" : "flex";
  document.body.classList.toggle("restore", v==="plan" && !S.settings);
  window.scrollTo(0,0);
}
function route(){
  if(mode!=="ready") return;
  if(!S.settings){ if(current!=="plan") show("setup"); }
  else if(current==="setup" || document.body.classList.contains("restore")) show("today");
  else if(!document.querySelector(".view[id^=v-].on")) show(current);   /* reopening with saved data: show the current screen */
  else document.getElementById("nav").style.display="flex";
}
document.getElementById("s-restore").addEventListener("click", () => show("plan"));
document.getElementById("p-back").addEventListener("click", () => show("setup"));
document.addEventListener("click", e => {
  const b=e.target.closest("[data-go]"); if(b){ show(b.dataset.go); render(); }
});
function toast(t, act){
  const el=document.getElementById("toast"); el.textContent=t; el.classList.toggle("act", !!act);
  if(act){ const b=document.createElement("button"); b.textContent=act.label; b.addEventListener("click", () => { el.classList.remove("on"); act.fn(); }); el.appendChild(b); }
  el.classList.add("on"); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove("on"), act?5500:2200);
}
/* accept Arabic-Indic and Persian digits and the Arabic decimal mark, whatever keyboard is active */
const norm = t => String(t).replace(/[٠-٩]/g, d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[۰-۹]/g, d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٫,،]/g,".").replace(/[^\d.\-]/g,"");
const num = id => { const v=parseFloat(norm(document.getElementById(id).value)); return isNaN(v)?null:v; };
const esc = s => String(s).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
/* number in range, or NaN after telling the user what is wrong */
function val(id, lo, hi, label, required=true){
  const v=num(id);
  if(v==null){ if(required){ toast("اكتب "+label); document.getElementById(id).focus(); return NaN; } return null; }
  if(v<lo || v>hi){ toast(`${label} لازم يكون بين ${AR(lo)} و${AR(hi)}`); document.getElementById(id).focus(); return NaN; }
  return v;
}
const bad = (...xs) => xs.some(x => Number.isNaN(x));
/* Mifflin-St Jeor (male) x 1.5: desk job + 5 long gym sessions a week; 600 kcal deficit ~ 0.6 kg/week */
/* ---------- recommendation constants (all in one place) ---------- */
const ACTIVITY   = {3:1.4, 4:1.45, 5:1.5};        // desk job + that many gym sessions a week
const PACE       = {easy:0.15, mid:0.20, fast:0.25}; // deficit as a share of maintenance; default is the middle one
const KCAL_FLOOR = 1600;   // never suggest going below this
const KCAL_STEP  = 150;    // size of one weekly adjustment
const RATE_LOW   = 0.004;  // slower than 0.4% of body weight a week = too slow
const RATE_HIGH  = 0.010;  // faster than 1% a week = too fast
const WATER_DAYS = 21;     // early fast loss is mostly water: no change before this
const PROT_PER_LBM = 2.5, PROT_PER_KG = 1.9; // g protein per kg lean mass / per kg body weight
function calcKcal(w,h,a){
  const bmr=10*w+6.25*h-5*a+5, tdee=bmr*ACTIVITY[S.program.days], def=tdee*PACE[S.program.pace];
  return {bmr, tdee, def, target:Math.max(KCAL_FLOOR, Math.round((tdee-def)/50)*50)};
}
function calcProtein(w, lbm){ const g = lbm ? PROT_PER_LBM*lbm : PROT_PER_KG*w; return Math.min(200, Math.max(110, Math.round(g/5)*5)); }
function calcText(c, w){ return `الحرق الأساسي ≈ ${AR(Math.round(c.bmr))} سعرة. مع شغل مكتبي و${AR(S.program.days)} تمارين بالأسبوع، احتياجك التقديري ≈ ${AR(Math.round(c.tdee/10)*10)}. ناقص ${AR(Math.round(PACE[S.program.pace]*100))}٪ = ${AR(c.target)} سعرة، وتنزل فيها تقريباً ${fmt(c.def*7/7700,1)} كجم بالأسبوع (${fmt(c.def*7/7700/w*100,1)}٪ من وزنك). هذا تقدير، وبعد أسبوعين يصححه وزنك الفعلي.`; }
/* targets the app would set today from current weight, measurements and programme */
function suggestTargets(){
  const st=S.settings; if(!st) return null;
  const we=(S.weights&&S.weights.e)||{}, k=Object.keys(we).sort().pop(), a7=k?avgWindow(we,k,7):null, cur=a7?a7.avg:st.startWeight;
  const me=(S.measures&&S.measures.e)||{}, mk=Object.keys(me).sort().pop();
  let bf=mk?navyBF(me[mk].waist,me[mk].neck,st.height):null; if(bf!=null && (bf<3||bf>60)) bf=null;
  const c=calcKcal(cur, st.height, st.age||35);
  return {c, kcal:c.target, protein:calcProtein(cur, bf!=null?cur*(1-bf/100):null)};
}
/* one rule per line: what the weekly trend means and the single change to make */
function weeklyAdvice(a){ // {rate kg/wk (negative = losing), cur, days, kcal, waistDrop cm, week {n,k}, weeksIn}
  if(a.rate==null || a.days<13) return {t:`سجّل وزنك كل صبح. بعد أسبوعين من البيانات أقول لك إذا السعرات (${AR(a.kcal)}) مناسبة أو تحتاج تعديل.`};
  const loss=-a.rate, lo=a.cur*RATE_LOW, hi=a.cur*RATE_HIGH, range=`${fmt(lo,1)}–${fmt(hi,1)} كجم`;
  if(loss>hi){
    if(a.days<WATER_DAYS) return {t:`نزولك سريع (${fmt(loss,2)} كجم/أسبوع)، وهذا طبيعي أول ٣ أسابيع لأن جزء منه ماء. لا تغيّر شي الحين.`};
    return {warn:true, t:`تنزل أسرع من المطلوب (${fmt(loss,2)} كجم/أسبوع، والمطلوب ${range}). ارفع السعرات إلى ${AR(a.kcal+KCAL_STEP)} عشان تحافظ على العضل وقوتك في التمرين.`};
  }
  if(loss<lo){
    if(a.week && a.week.n>=4 && a.week.k>a.kcal+100) return {warn:true, t:`النزول بطيء، ومتوسط أكلك المسجل ${AR(Math.round(a.week.k))} سعرة، يعني فوق هدفك (${AR(a.kcal)}). لا تنزّل الهدف. ارجع له أول وشوف الأسبوع الجاي.`};
    if(a.waistDrop>=1) return {t:`الميزان شبه واقف، لكن خصرك نزل ${fmt(a.waistDrop,1)} سم، وهذا نزول دهون. كمّل بدون تغيير.`};
    if(a.kcal-KCAL_STEP<KCAL_FLOOR) return {warn:true, t:`النزول بطيء وسعراتك قريبة من الحد الأدنى (${AR(KCAL_FLOOR)}). لا تنزل أكثر. زد ٢٠٠٠ خطوة يومياً، أو خذ أسبوع على سعرات الصيانة ثم ارجع.`};
    return {warn:true, t:`النزول بطيء (${fmt(Math.max(0,loss),2)} كجم/أسبوع، والمطلوب ${range}). تأكد أول إنك توزن الرز والزيت وتسجل كل شي. إذا تسجيلك دقيق، نزّل السعرات إلى ${AR(a.kcal-KCAL_STEP)} أو زد ٢٠٠٠ خطوة يومياً. غيّر شي واحد بس.`};
  }
  let t=`ممتاز. تنزل ${fmt(loss,2)} كجم بالأسبوع، ضمن المطلوب (${range}). كمّل على ${AR(a.kcal)} سعرة.`;
  if(a.weeksIn>=10) t+=` صار لك ${AR(a.weeksIn)} أسبوع بعجز. لو حسيت بتعب أو جوع متواصل، أسبوع على سعرات الصيانة خيار معقول ثم ترجع.`;
  return {t};
}

/* ---------- setup ---------- */
let kcalTouched=false, protTouched=false;
document.getElementById("s-k").addEventListener("input", () => kcalTouched=true);
document.getElementById("s-p").addEventListener("input", () => protTouched=true);
function setupCalc(){
  const w=num("s-w"), h=num("s-h"), a=num("s-a");
  if(!(w>=40&&w<=250&&h>=140&&h<=220&&a>=18&&a<=80)) return;
  const c=calcKcal(w,h,a); if(!kcalTouched) document.getElementById("s-k").value=c.target;
  const bf=navyBF(num("s-waist"), num("s-neck"), h), lbm=(bf!=null && bf>3 && bf<60) ? w*(1-bf/100) : null, pr=calcProtein(w,lbm);
  if(!protTouched) document.getElementById("s-p").value=pr;
  document.getElementById("s-calc").textContent=calcText(c,w)+` البروتين المقترح ${AR(pr)} جم يومياً لحماية العضل.`;
}
["s-w","s-h","s-a","s-waist","s-neck"].forEach(id=>document.getElementById(id).addEventListener("input", setupCalc));
setupCalc();
document.getElementById("s-go").addEventListener("click", async () => {
  const height=val("s-h",140,220,"الطول"), age=val("s-a",18,80,"العمر"), sw=val("s-w",40,250,"الوزن الحالي");
  if(bad(height,age,sw)) return;
  const goal=val("s-g",45,sw-1,"الوزن الهدف"); if(bad(goal)) return;
  const waist=val("s-waist",50,200,"الخصر",false), neck=val("s-neck",25,70,"الرقبة",false); if(bad(waist,neck)) return;
  if(waist!=null && neck!=null && waist<=neck){ toast("الخصر لازم يكون أكبر من الرقبة"); return; }
  const kcal=val("s-k",1500,4000,"السعرات"), protein=val("s-p",60,300,"البروتين"); if(bad(kcal,protein)) return;
  const st = {height, age, startWeight:sw, goalWeight:goal, kcal, protein, steps:8000, startDate:D, nextDay:0, cxInit:1, cx:{lvl:1, ok:0, hard:0}};
  const w = structuredClone(S.weights); w.e = w.e||{}; w.e[D]=st.startWeight;
  const m = structuredClone(S.measures); m.e = m.e||{};
  if(waist!=null && neck!=null) m.e[D]={waist, neck};
  await save("weights", w); await save("measures", m); await save("settings", st);
  show("today"); render();
});

/* ---------- weight ---------- */
let wArm={v:null,t:0};
document.getElementById("w-save").addEventListener("click", () => {
  rollDay();
  const v=val("w-in",40,250,"الوزن"); if(bad(v)) return;
  const w=structuredClone(S.weights); w.e=w.e||{};
  const prevK=Object.keys(w.e).filter(k=>k<D).sort().pop(), now=Date.now();
  if(prevK && Math.abs(v-w.e[prevK])>3 && !(wArm.v===v && now-wArm.t<6000)){ wArm={v,t:now}; toast(`فرق كبير عن آخر وزن (${fmt(w.e[prevK])}). اضغط حفظ مرة ثانية للتأكيد`); return; }
  wArm={v:null,t:0};
  w.e[D]=v; save("weights", w); toast("انحفظ الوزن"); checkKilo(w.e);
});
/* celebrate each full kilo lost (by the 7-day average, so one light morning does not trigger it) */
function checkKilo(e){
  const st=S.settings, a=avgWindow(e, D, 7); if(!st || !a) return;
  const lost=Math.floor(st.startWeight-a.avg+1e-9), prev=pref.get("kg",0);
  if(lost>=1 && lost>prev){ pref.set("kg",lost); celebrate(`نزلت ${AR(lost)} كيلو`, pick(KILO_LINES)); }
}
document.getElementById("m-save").addEventListener("click", () => {
  rollDay();
  const wa=val("m-waist",50,200,"الخصر"), ne=val("m-neck",25,70,"الرقبة"); if(bad(wa,ne)) return;
  if(wa<=ne){ toast("الخصر لازم يكون أكبر من الرقبة"); return; }
  const m=structuredClone(S.measures); m.e=m.e||{}; m.e[D]={waist:wa, neck:ne}; save("measures", m); toast("انحفظت القياسات"); ["m-waist","m-neck"].forEach(id=>document.getElementById(id).value="");
});
document.getElementById("w-list").addEventListener("click", e => {
  const b=e.target.closest("[data-delw]"); if(!b) return;
  const w=structuredClone(S.weights); delete w.e[b.dataset.delw]; save("weights", w);
});
document.getElementById("m-list").addEventListener("click", e => {
  const b=e.target.closest("[data-delm]"); if(!b) return;
  const m=structuredClone(S.measures); delete m.e[b.dataset.delm]; save("measures", m);
});

/* ---------- food ---------- */
function addFood(n,k,p){
  rollDay();
  const f=structuredClone(S.food||{}); f.items=f.items||[];
  if(f.items.length>=60){ toast("وصلت الحد الأعلى لعناصر اليوم"); return; }
  f.items.forEach(x => { if(!x.id) x.id=newId(); }); f.items.push({id:newId(), n, k:Math.round(k), p:Math.round(p*10)/10});
  const before=f.items.slice(0,-1).reduce((a,x)=>a+(x.p||0),0), target=(S.settings&&S.settings.protein)||0;
  S.food=f; save("food-"+D, f);
  if(target && before<target && before+p>=target && pref.get("prot","")!==D){ pref.set("prot",D); celebrate("هدف البروتين تم", pick(PROTEIN_LINES)); }
  else toast("أُضيف: "+n);
}
function delFood(i){
  const f=structuredClone(S.food||{}); f.items=f.items||[]; const [it]=f.items.splice(i,1); if(!it) return;
  f.items.forEach(x => { if(!x.id) x.id=newId(); }); S.food=f; save("food-"+D, f);
  const day=D;
  toast("انحذف: "+it.n, {label:"تراجع", fn:() => {
    if(day!==D) return;
    const g=structuredClone(S.food||{}); g.items=g.items||[]; g.items.splice(Math.min(i,g.items.length),0,it); S.food=g; save("food-"+D, g);
  }});
}
/* sample day */
(() => {
  let tk=0, tp=0;
  document.getElementById("f-sample").innerHTML = SAMPLE.map(([label,ids],i)=>{
    const k=ids.reduce((a,j)=>a+PRESETS[j].k,0), p=ids.reduce((a,j)=>a+PRESETS[j].p,0); tk+=k; tp+=p;
    return `<div><div class="s-t"><b>${esc(label)}</b><span>${ids.map(j=>esc(PRESETS[j].n)).join(" + ")} · ${AR(k)} سعرة · ${AR(p)} جم</span></div><button class="ghost" data-sample="${i}" aria-label="أضف ${esc(label)}">أضف</button></div>`;
  }).join("");
  document.getElementById("f-sample-note").textContent = `المجموع ${AR(tk)} سعرة و${AR(tp)} جم بروتين. الباقي من سعراتك خلّه لخضار أو فاكهة. بدّل الكبسة بأي طبخة من تحت.`;
})();
document.getElementById("f-sample").addEventListener("click", e => {
  const b=e.target.closest("[data-sample]"); if(!b) return;
  SAMPLE[+b.dataset.sample][1].forEach(j => addFood(PRESETS[j].n, PRESETS[j].k, PRESETS[j].p));
});
document.getElementById("f-presets").innerHTML = PRESETS.map((x,i)=>`<button class="chip" data-pre="${i}">${esc(x.n)}<small>${AR(x.k)} سعرة · ${AR(x.p)} جم بروتين</small></button>`).join("");
document.getElementById("f-presets").addEventListener("click", e => {
  const b=e.target.closest("[data-pre]"); if(!b) return; const x=PRESETS[+b.dataset.pre]; addFood(x.n,x.k,x.p);
});
document.getElementById("c-add").addEventListener("click", () => {
  const n=document.getElementById("c-n").value.trim().slice(0,60)||"أكل";
  const k=val("c-k",0,3000,"السعرات"), p=val("c-p",0,250,"البروتين",false); if(bad(k,p)) return;
  if((p||0)*4 > k+10){ toast("البروتين أكثر من السعرات نفسها، راجع الأرقام"); return; }
  addFood(n,k,p||0); ["c-n","c-k","c-p"].forEach(id=>document.getElementById(id).value="");
});
document.getElementById("f-list").addEventListener("click", e => {
  const b=e.target.closest("[data-delf]"); if(!b) return;
  delFood(+b.dataset.delf);
});
let mpSel=0;
function renderMP(){
  document.getElementById("mp-tabs").innerHTML = MEALPREP.map((m,i)=>`<button class="${i===mpSel?"on":""}" data-mp="${i}">${esc(m.t)}</button>`).join("");
  const m=MEALPREP[mpSel];
  document.getElementById("mp-body").innerHTML = `
    <div class="row between"><span class="pill">الحصة: ${AR(m.k)} سعرة · ${AR(m.p)} جم بروتين</span>
    <button class="ghost" data-mpadd="${m.preset}">أضف حصة لليوم</button></div>
    <h3>المقادير (٦ حصص)</h3><ul>${m.ing.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
    <h3>الطريقة</h3><ol style="margin:0;padding-inline-start:20px">${m.steps.map(x=>`<li>${esc(x)}</li>`).join("")}</ol>
    <div class="muted">تحفظ بالثلاجة ٣ أيام. سخّن الحصة لين تكون حارة كلها.</div>
    <div class="footnote">كل الأوزان للمكونات نيّة قبل الطبخ، والرز والدجاج يتغير وزنهم بعده. الأرقام محسوبة من جداول التركيب الغذائي القياسية، وتقريبية بحدود ±١٠٪ حسب المنتج وكمية الزيت.</div>`;
}
document.getElementById("mp-tabs").addEventListener("click", e => {const b=e.target.closest("[data-mp]"); if(b){mpSel=+b.dataset.mp; renderMP();}});
document.getElementById("mp-body").addEventListener("click", e => {const b=e.target.closest("[data-mpadd]"); if(b){const x=PRESETS[+b.dataset.mpadd]; addFood(x.n,x.k,x.p);}});
renderMP();

/* ---------- training ---------- */
/* each day's sets live under wo.byDay[day]; the DOM is copied into S.wo on every keystroke,
   and the save to storage is debounced, so a re-render can never wipe unsaved numbers */
let trSel=null, woTimer=null, woDirty=false, renderedDay=null;
function curDay(){
  const n=getPlan().days.length, d = trSel!=null ? trSel : (S.wo && S.wo.day!=null) ? S.wo.day : ((S.settings && S.settings.nextDay)||0);
  return ((d%n)+n)%n;
}
function daySets(d){ const w=S.wo||{}; if(w.byDay && w.byDay[d]) return w.byDay[d]; if(w.day===d && w.sets) return w.sets; return {}; }
function inRange(id,lo,hi){ const v=num(id); return (v==null||v<lo||v>hi)?null:v; }
function captureWO(){
  if(renderedDay==null) return S.wo;
  const sets={}, shown=new Set();
  document.querySelectorAll("#tr-body input[data-ex]").forEach(inp=>{ shown.add(inp.dataset.ex); });
  document.querySelectorAll("#tr-body input[data-ex]").forEach(inp=>{
    const ex=inp.dataset.ex, i=+inp.dataset.i, f=inp.dataset.f; let v=parseFloat(norm(inp.value));
    if(isNaN(v) || v<0 || v>(f==="w"?500:600)) v=null;
    sets[ex]=sets[ex]||[]; sets[ex][i]=sets[ex][i]||{w:null,r:null}; sets[ex][i][f]=v;
  });
  const wo=structuredClone(S.wo||{}); wo.byDay=wo.byDay||{};
  if(wo.sets && wo.day!=null && !wo.byDay[wo.day]) wo.byDay[wo.day]=wo.sets;
  delete wo.sets;
  // merge by exercise id: an exercise swapped out a moment ago keeps the sets already typed for it
  /* only exercises with at least one number are stored: an untouched card must not overwrite sets typed on another device */
  const day={...(wo.byDay[renderedDay]||{})};
  shown.forEach(id => { const a=sets[id]; if(a && a.some(x=>x && (x.w!=null || x.r!=null))) day[id]=a; else delete day[id]; });
  wo.byDay[renderedDay]=day; wo.day=renderedDay;
  wo.cardio=inRange("tr-cardio",0,300); wo.steps=inRange("tr-steps",0,100000); wo.done=!!wo.done;
  S.wo=wo; return wo;
}
function flushWO(){
  clearTimeout(woTimer);
  if(!woDirty || !S.settings) return Promise.resolve();
  woDirty=false; return save("wo-"+D, structuredClone(S.wo));
}
function queueWO(){ captureWO(); woDirty=true; clearTimeout(woTimer); woTimer=setTimeout(flushWO, 600); }
document.getElementById("tr-tabs").addEventListener("click", e => {
  const b=e.target.closest("[data-day]"); if(!b) return;
  if(woDirty) captureWO(); flushWO(); trSel=+b.dataset.day; renderTrain(true);
});
document.getElementById("tr-body").addEventListener("input", queueWO);
document.getElementById("tr-cardio").addEventListener("input", queueWO);
document.getElementById("tr-steps").addEventListener("input", queueWO);
const openEx = new Set();
document.getElementById("tr-body").addEventListener("click", e => {
  const how=e.target.closest("[data-how]");
  if(how){ const id=how.dataset.how, box=how.closest(".ex").querySelector(".how"), open=box.hidden;
    box.hidden=!open; how.setAttribute("aria-expanded", String(open)); open ? openEx.add(id) : openEx.delete(id); return; }
  const alts=e.target.closest("[data-alts]"); if(alts) openSheet(alts.dataset.alts);
});
document.getElementById("tr-done").addEventListener("click", async () => {
  const chk=captureWO();
  const anySet=Object.values((chk.byDay||{})[chk.day]||{}).some(a=>(a||[]).some(x=>x && x.r));
  if(!anySet && !chk.cardio){ toast("سجّل مجموعة وحدة على الأقل أو دقائق الكارديو"); return; }
  const wasDone=!!chk.done, prs=[];
  const wo=chk; wo.done=true; woDirty=false; clearTimeout(woTimer); S.wo=wo;
  const lifts=structuredClone(S.lifts||{});
  for(const [ex,sets] of Object.entries(wo.byDay[wo.day]||{})){
    let best=null; (sets||[]).forEach(s=>{ if(s && s.r){ if(!best || (s.w||0)>(best.w||0) || ((s.w||0)===(best.w||0) && s.r>best.r)) best={w:s.w||0,r:s.r}; } });
    const old=lifts[ex];
    if(best && old && old.date!==D && (best.w>old.w || (best.w===old.w && best.r>old.r)) && LIB[ex]) prs.push(LIB[ex].n);
    if(best) lifts[ex]={...best, date:D};
  }
  await save("wo-"+D, structuredClone(wo)); await save("lifts", lifts);
  const st=structuredClone(S.settings); st.nextDay=(wo.day+1)%getPlan().days.length; await save("settings", st);
  trSel=null;
  const prTxt = prs.length ? ` رقم قياسي جديد: ${prs.slice(0,3).join("، ")}.` : "";
  if(wasDone && !prs.length) toast("تحدّث تمرين اليوم");
  else celebrate(pick(HYPE_TITLES), (wasDone ? "تحدّث تمرين اليوم." : nextHype()) + prTxt);
});
/* photos: img/<id>.jpg shows the two end positions side by side; if it cannot load, fall back to the line diagram */
const thumb = (id,slot) => `<img class="th" src="img/${id}.jpg" alt="" loading="lazy" decoding="async" data-fb="${ICON_OF[slot]||""}">`;
const shot  = (id,slot) => `<figure class="shot"><img src="img/${id}.jpg" alt="${esc(LIB[id].n)}: وضعية البداية ووضعية النهاية" loading="lazy" decoding="async" data-fb="${ICON_OF[slot]||""}" data-cap="1"><figcaption>وضعيتا الحركة: البداية والنهاية</figcaption></figure>`;
document.addEventListener("error", e => {
  const t=e.target; if(!t || t.tagName!=="IMG" || t.dataset.fb==null) return;
  const d=document.createElement("div"); d.className="imgfb";
  d.innerHTML=icon(t.dataset.fb)+(t.dataset.cap?"<span>الصورة ما تحمّلت. هذا رسم مبسّط للحركة.</span>":"");
  const fig=t.closest("figure"); (fig||t).replaceWith(d);
}, true);
function renderTrain(force){
  const prog=S.program, pl=getPlan(), d=curDay(), p=pl.days[d];
  document.getElementById("tr-tabs").innerHTML = pl.days.map((x,i)=>`<button class="${i===d?"on":""}" data-day="${i}">${AR(i+1)}. ${esc(x.t)}</button>`).join("");
  document.getElementById("tr-sub").textContent = `أسبوعك: ${WEEK[prog.days]}. راحة ٢–٣ دقايق بين مجموعات أول تمرينين و٦٠–٩٠ ثانية للباقي. ${LEVEL_TEXT[prog.level]} أي حركة تألمك وقّفها واختر بديل.`;
  document.getElementById("tr-cardio-note").textContent = cardioText(prog)+" في يوم الراحة سجّل خطواتك هنا بدون تمرين.";
  const done = S.wo && S.wo.done;
  const st=document.getElementById("tr-state"); st.textContent = done ? "تم اليوم" : "لم يكتمل"; st.className="pill"+(done?"":" warn");
  const saved = daySets(d);
  const active = document.activeElement && document.activeElement.closest && document.activeElement.closest("#tr-body");
  const sig = d+"|"+p.ex.map(x=>x[0]+x[2]+x[3]).join(",");
  if(force || !active || renderedDay!==d || renderTrain.sig!==sig){
    renderedDay=d; renderTrain.sig=sig;
    document.getElementById("tr-body").innerHTML = p.ex.length ? p.ex.map(([id,name,n,reps,slot])=>{
      const info=LIB[id], last=S.lifts && S.lifts[id], mainId=SLOTS[slot].o[0], open=openEx.has(id);
      const wPh=info.time?"—":info.bw?"إضافي":"كجم", rPh=info.time?"ثانية":"تكرار";
      const rows=[...Array(n)].map((_,i)=>{const s=(saved[id]||[])[i]||{};
        return `<span>${AR(i+1)}</span><input aria-label="${esc(name)} مجموعة ${i+1} وزن" data-ex="${id}" data-i="${i}" data-f="w" type="text" autocomplete="off" inputmode="decimal" placeholder="${wPh}" value="${s.w??""}"><input aria-label="${esc(name)} مجموعة ${i+1} ${rPh}" data-ex="${id}" data-i="${i}" data-f="r" type="text" autocomplete="off" inputmode="numeric" placeholder="${rPh}" value="${s.r??""}">`;}).join("");
      return `<div class="ex">
        <div class="ex-head"><div class="exicon">${thumb(id,slot)}</div>
          <div class="ex-title"><h3>${esc(name)}</h3><div class="footnote">${esc(SLOTS[slot].m)}</div>${id!==mainId?`<div class="footnote swap">بديل عن: ${esc(LIB[mainId].n)}</div>`:""}</div>
          <span class="pill">${AR(n)} × ${AR(reps)}</span></div>
        <div class="muted">${esc(nextHint(last, reps, info))}</div>
        <div class="sets">${rows}</div>
        <div class="actions"><button class="ghost" data-how="${id}" aria-expanded="${open}">الشرح والصورة</button><button class="ghost" data-alts="${slot}">البدائل</button></div>
        <div class="how"${open?"":" hidden"}>${shot(id,slot)}
          <div class="kv"><span>المعدات</span><div>${esc(info.eq)}</div></div>
          <div class="kv"><span>العضلات الأساسية</span><div>${esc(SLOTS[slot].m)}</div></div>
          <div class="kv"><span>الأداء</span><ul>${info.cue.map(c=>`<li>${esc(c)}</li>`).join("")}</ul></div>
        </div></div>`;
    }).join("") : `<div class="card"><p class="muted">ما بقي تمارين في هذا اليوم حسب اختياراتك. راجع المعدات والمناطق المؤلمة في شاشة الخطة.</p></div>`;
  }
  const ca=document.getElementById("tr-cardio"), stp=document.getElementById("tr-steps");
  if(document.activeElement!==ca) ca.value = (S.wo && S.wo.cardio) ?? "";
  if(document.activeElement!==stp) stp.value = (S.wo && S.wo.steps) ?? "";
  if(typeof renderCardio==="function") renderCardio();
}

/* ---------- alternatives sheet ---------- */
let sheetSlot=null, sheetReturn=null;
const sheetEl=document.getElementById("sheet");
function openSheet(slot){
  if(woDirty) captureWO(); flushWO();
  sheetSlot=slot; sheetReturn=document.activeElement; renderSheet();
  sheetEl.hidden=false; document.body.style.overflow="hidden"; document.getElementById("sheet-close").focus();
}
function closeSheet(){
  if(sheetEl.hidden) return;
  sheetEl.hidden=true; document.body.style.overflow=""; sheetSlot=null;
  if(sheetReturn && document.contains(sheetReturn)) sheetReturn.focus();
}
function renderSheet(){
  const slot=sheetSlot, prog=S.program, opts=SLOTS[slot].o;
  const entry=getPlan().days[curDay()].ex.find(x=>x[4]===slot), cur=entry?entry[0]:null;
  const limName=Object.fromEntries(LIM_OPTS);
  document.getElementById("sheet-title").textContent="بدائل "+LIB[opts[0]].n;
  document.getElementById("sheet-body").innerHTML =
    `<p class="footnote">كل تمرين له سجل أوزان وتكرارات مستقل. اختيارك يبقى للمرات الجاية لين تغيّره.</p>`+
    opts.map((id,i)=>{ const x=LIB[id], last=S.lifts && S.lifts[id], h=hurts(id,prog);
      return `<div class="opt${id===cur?" sel":""}">${shot(id,slot)}
        <div class="row between"><h3>${esc(x.n)}</h3><span class="pill${i?" alt":""}">${i?"بديل":"الأساسي"}</span></div>
        <div class="kv"><span>المعدات</span><div>${esc(x.eq)}</div></div>
        <div class="kv"><span>العضلات الأساسية</span><div>${esc(SLOTS[slot].m)}</div></div>
        <div class="kv"><span>متى تختاره</span><div>${esc(i ? (x.when || "نفس نمط الحركة، ويناسب إذا التمرين الأساسي مشغول أو غير متوفر.") : "الخيار الأساسي في برنامجك.")}</div></div>
        ${hasGear(id,prog)?"":`<div class="note warn">معداته مو ضمن اللي حددتها في برنامجك.</div>`}
        ${h.length?`<div class="note warn">يحمّل ${esc(h.map(t=>limName[t]).join(" و"))}. إذا حسيت بألم وقّف واختر غيره.</div>`:""}
        <p class="footnote">${last ? `آخر أداء مسجل: ${last.w?AR(last.w)+" كجم × ":""}${AR(last.r)}` : "ما له سجل سابق."}</p>
        <button data-pick="${id}"${id===cur?" disabled":""}>${id===cur?"المختار حالياً":"اختر هذا التمرين"}</button></div>`; }).join("");
}
document.getElementById("sheet-body").addEventListener("click", e => {
  const b=e.target.closest("[data-pick]"); if(!b || !sheetSlot) return;
  const prog=structuredClone(S.program); prog.swaps[sheetSlot]=b.dataset.pick;
  S.program=normProg(prog); save("program", S.program);
  const name=LIB[b.dataset.pick].n; closeSheet(); renderTrain(true); render(); toast("تم اختيار: "+name);
});
document.getElementById("sheet-close").addEventListener("click", closeSheet);
sheetEl.addEventListener("click", e => { if(e.target===sheetEl) closeSheet(); });
document.addEventListener("keydown", e => { if(e.key==="Escape") closeSheet(); });

/* ---------- programme settings ---------- */
function renderProg(){
  const prog=S.program;
  const seg=(key,opts)=>opts.map(([v,l])=>`<button class="${String(prog[key])===String(v)?"on":""}" data-pv="${v}" aria-pressed="${String(prog[key])===String(v)}">${esc(l)}</button>`).join("");
  const tog=(key,opts)=>opts.map(([v,l])=>`<button class="tog" data-pv="${v}" aria-pressed="${prog[key].includes(v)}">${esc(l)}</button>`).join("");
  const set=(sel,html)=>{ const el=document.querySelector(`#prog [data-prog="${sel}"]`); if(el.innerHTML!==html) el.innerHTML=html; };
  set("days",seg("days",[[3,"٣ أيام"],[4,"٤ أيام"],[5,"٥ أيام"]])); set("level",seg("level",LEVELS)); set("pace",seg("pace",PACES));
  set("eq",tog("eq",EQ_OPTS)); set("lim",tog("lim",LIM_OPTS)); set("cardio",tog("cardio",CARDIO_OPTS));
  const pl=getPlan(), paceTxt={easy:"عجز ١٥٪: أبطأ وأسهل التزام وأفضل لحفظ العضل.", mid:"عجز ٢٠٪: توازن بين السرعة وحفظ العضل. هذا الافتراضي.", fast:"عجز ٢٥٪: أسرع، لكن الجوع أكثر وخطر خسارة العضل أعلى. لا تطوّل عليه."}[prog.pace];
  document.getElementById("prog-note").innerHTML =
    `<b>أسبوعك:</b> ${esc(WEEK[prog.days])}.<br><b>الأيام:</b> ${pl.days.map(x=>esc(x.t)).join("، ")}.<br><b>الكارديو:</b> ${esc(cardioText(prog))}<br><b>سرعة النزول:</b> ${esc(paceTxt)}`+
    (pl.notes.length?`<br><b>تنبيه:</b> ${pl.notes.map(esc).join(" ")}`:"")+
    (prog.lim.length?`<br>اخترت لك الخيارات الأخف على المناطق اللي حددتها. هذا تعديل تمرين، مو علاج. الألم المستمر يحتاج طبيب أو أخصائي علاج طبيعي.`:"");
}
document.getElementById("prog").addEventListener("click", e => {
  const b=e.target.closest("[data-pv]"); if(!b) return;
  const key=b.closest("[data-prog]").dataset.prog, v=b.dataset.pv, prog=structuredClone(S.program);
  if(key==="days") prog.days=+v;
  else if(key==="level" || key==="pace") prog[key]=v;
  else { const a=prog[key], i=a.indexOf(v); i<0 ? a.push(v) : a.splice(i,1);
    if(key==="eq" && !a.length){ toast("لازم نوع واحد من المعدات على الأقل"); return; } }
  if(woDirty) captureWO(); flushWO(); trSel=null;
  S.program=normProg(prog); save("program", S.program); render();
});
document.getElementById("p-apply").addEventListener("click", () => {
  const st=structuredClone(S.settings), sug=suggestTargets(); if(!sug) return;
  st.kcal=sug.kcal; st.protein=sug.protein; save("settings", st); toast(`صار هدفك ${AR(sug.kcal)} سعرة و${AR(sug.protein)} جم بروتين`);
});

/* ---------- plan ---------- */
document.getElementById("p-save").addEventListener("click", () => {
  const kcal=val("p-k",1500,4000,"السعرات"), protein=val("p-p",60,300,"البروتين"),
        goal=val("p-g",45,200,"الوزن الهدف"), steps=val("p-st",0,40000,"هدف الخطوات");
  if(bad(kcal,protein,goal,steps)) return;
  const st=structuredClone(S.settings); Object.assign(st,{kcal,protein,goalWeight:goal,steps});
  save("settings", st); toast("انحفظت الأهداف");
});
const DOC_RE=/^(settings|program|weights|measures|lifts|(food|wo)-\d{4}-\d{2}-\d{2})$/;
const isObj = o => o && typeof o==="object" && !Array.isArray(o);
async function allDocs(){
  const docs={};
  for(const [k,v] of Object.entries(Store.all())) if(DOC_RE.test(k) && isObj(v)) docs[k]=v;
  return docs;
}
/* ---------- backup & restore ---------- */
const MAX_BACKUP = 25*1024*1024;
function backupJSON(docs){
  return JSON.stringify({app:"nashef", v:3, exported:new Date().toISOString(), count:Object.keys(docs).length, docs});
}
/* check a backup before touching anything; returns {docs, report} or throws an Arabic message */
function validateBackup(obj){
  if(!isObj(obj)) throw new Error("الملف مو نسخة احتياطية من نشّف.");
  if(obj.app && obj.app!=="nashef") throw new Error("الملف نسخة من تطبيق ثاني.");
  if(obj.v && obj.v>3) throw new Error("النسخة من إصدار أحدث من التطبيق. حدّث التطبيق أول.");
  const src = isObj(obj.docs) ? obj.docs : obj;          // v2/v3 = {docs}, v1 = keys at the top
  const docs={}; let skipped=0;
  for(const [k,v] of Object.entries(src)){
    if(["app","v","exported","count"].includes(k)) continue;
    if(DOC_RE.test(k) && isObj(v)) docs[k]=v; else skipped++;
  }
  const n=Object.keys(docs).length;
  if(!n) throw new Error("ما لقيت أي بيانات صالحة في الملف.");
  const s=docs.settings;
  if(s && !(s.kcal>0 && s.goalWeight>0 && s.height>0)) throw new Error("إعدادات النسخة ناقصة أو تالفة، فما راح أسترجعها.");
  if(docs.weights && !isObj(docs.weights.e)) throw new Error("سجل الوزن في النسخة تالف.");
  if(docs.weights) for(const [d,w] of Object.entries(docs.weights.e)) if(!/^\d{4}-\d{2}-\d{2}$/.test(d) || typeof w!=="number" || w<20 || w>400) throw new Error("فيه وزن غير منطقي في النسخة ("+d+").");
  for(const [k,v] of Object.entries(docs)) if(k.startsWith("food-") && v.items!=null && !Array.isArray(v.items)) throw new Error("سجل أكل تالف في النسخة ("+k.slice(5)+").");
  const wk=docs.weights ? Object.keys(docs.weights.e).sort() : [];
  return {docs, report:{n, skipped, food:Object.keys(docs).filter(k=>k.startsWith("food-")).length, wo:Object.keys(docs).filter(k=>k.startsWith("wo-")).length,
    weights:wk.length, lastWeight:wk.length?wk[wk.length-1]:null, exported:obj.exported||null, hasSettings:!!s}};
}
function parseBackupText(txt){
  if(txt.length>MAX_BACKUP) throw new Error("الملف كبير بشكل غير طبيعي، فما فتحته.");
  let obj; try{ obj=JSON.parse(txt.replace(/^﻿/,"")); }catch(e){ throw new Error("الملف تالف أو مو بصيغة JSON."); }
  return validateBackup(obj);
}
async function exportBackup(){
  await flushWO(); await Store.flush();
  const docs=await allDocs(), n=Object.keys(docs).length;
  if(!n){ toast("ما فيه بيانات تتصدّر للحين"); return; }
  const json=backupJSON(docs), name=`nashef-backup-${D}.json`;
  const file=new File([json], name, {type:"application/json"});
  let how="download";
  if(navigator.canShare && navigator.canShare({files:[file]})){
    try{ await navigator.share({files:[file], title:"نسخة نشّف الاحتياطية"}); how="share"; }
    catch(e){ if(e && e.name==="AbortError"){ toast("ألغيت الحفظ. النسخة ما انحفظت"); return; } how="download"; }
  }
  if(how==="download"){
    const url=URL.createObjectURL(file), a=document.createElement("a");
    a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url), 60000);
  }
  await Store.setMeta("lastBackup", {at:Date.now(), n, bytes:json.length, how});
  document.getElementById("p-data").value=json;
  toast(how==="share" ? "تم تسليم الملف لـ iOS. تأكد إنه انحفظ في الملفات" : "نزل الملف. تأكد إنه انحفظ في الملفات");
  render();
}
let pendingRestore=null;
function showRestorePreview(res, origin){
  pendingRestore=res;
  const r=res.report, cur=Object.keys(Store.all()).length;
  document.getElementById("rs-box").hidden=false;
  document.getElementById("rs-info").innerHTML =
    `<b>${esc(origin)}</b><br>`+
    (r.exported?`تاريخ النسخة: ${esc(fmtDate(r.exported))}<br>`:"")+
    `السجلات: ${AR(r.n)} (أوزان ${AR(r.weights)}${r.lastWeight?`، آخرها ${esc(shortDay(r.lastWeight))}`:""}، أيام أكل ${AR(r.food)}، أيام تمرين ${AR(r.wo)})`+
    (r.hasSettings?"":"<br>ما فيها إعدادات، فتبقى إعداداتك الحالية لو اخترت الدمج.")+
    (r.skipped?`<br>تجاهلت ${AR(r.skipped)} عنصر مو معروف.`:"");
  document.getElementById("rs-warn").textContent = cur
    ? `انتبه: عندك الحين ${AR(cur)} سجل على هذا الجهاز. «استبدال» يحذفها ويحط النسخة مكانها. «دمج» يكتب النسخة فوق نفس الأيام ويخلي الباقي. في الحالتين أحفظ نسخة من وضعك الحالي تقدر ترجع لها.`
    : "ما فيه بيانات حالية على الجهاز، فما راح ينحذف شي.";
  document.getElementById("rs-box").scrollIntoView({block:"center", behavior:"smooth"});
}
async function applyRestore(mode){
  if(!pendingRestore) return;
  const docs = mode==="replace" ? pendingRestore.docs : {...Store.all(), ...pendingRestore.docs};
  const btns=document.querySelectorAll("#rs-box button"); btns.forEach(b=>b.disabled=true);
  try{
    await flushWO(); woDirty=false;
    await Store.replaceAll(docs);
    try{ sessionStorage.setItem("nashef-toast", `تم الاسترجاع: ${AR(Object.keys(docs).length)} سجل`); }catch(e){}
    location.reload();
  }catch(e){
    btns.forEach(b=>b.disabled=false);
    toast("فشل الاسترجاع وما تغيّر شي في بياناتك: "+(e && (e.name||e.message)));
  }
}
document.getElementById("p-export").addEventListener("click", () => exportBackup().catch(e => toast("تعذّر تصدير النسخة: "+(e && e.message))));
document.getElementById("p-file").addEventListener("change", async e => {
  const f=e.target.files && e.target.files[0]; e.target.value="";
  if(!f) return;
  if(f.size>MAX_BACKUP){ toast("الملف كبير بشكل غير طبيعي، فما فتحته."); return; }
  try{ showRestorePreview(parseBackupText(await f.text()), "الملف: "+f.name); }
  catch(ex){ pendingRestore=null; document.getElementById("rs-box").hidden=true; toast(ex.message); }
});
document.getElementById("p-copy").addEventListener("click", async () => {
  const ta=document.getElementById("p-data");
  if(!ta.value){ await flushWO(); await Store.flush(); ta.value=backupJSON(await allDocs()); }
  try{ await navigator.clipboard.writeText(ta.value); toast("انسخ النص. الصقه في الملاحظات كاحتياط إضافي"); }
  catch(e){ ta.focus(); ta.select(); toast("النسخ التلقائي ما اشتغل. النص محدد، انسخه يدوي"); }
});
document.getElementById("p-import").addEventListener("click", () => {
  const raw=document.getElementById("p-data").value.trim();
  if(!raw){ toast("الصق نص النسخة في المربع"); return; }
  try{ showRestorePreview(parseBackupText(raw), "نص ملصوق"); }catch(ex){ toast(ex.message); }
});
document.getElementById("rs-replace").addEventListener("click", () => applyRestore("replace"));
document.getElementById("rs-merge").addEventListener("click", () => applyRestore("merge"));
document.getElementById("rs-cancel").addEventListener("click", () => { pendingRestore=null; document.getElementById("rs-box").hidden=true; });
let undoArm=0;
document.getElementById("p-undo").addEventListener("click", async () => {
  const btn=document.getElementById("p-undo");
  if(Date.now()-undoArm>6000){ undoArm=Date.now(); btn.textContent="بيرجع بياناتك لوضعها قبل آخر استرجاع. اضغط مرة ثانية للتأكيد"; setTimeout(()=>{ if(Date.now()-undoArm>=6000) btn.textContent="رجّع بياناتي لقبل آخر استرجاع"; },6100); return; }
  try{ await flushWO(); if(await Store.undoRestore()){ try{ sessionStorage.setItem("nashef-toast","رجعت بياناتك لقبل آخر استرجاع"); }catch(e){} location.reload(); } }
  catch(e){ toast("تعذّر التراجع: "+(e && (e.name||e.message))); }
});

/* ---------- storage status ---------- */
let storeInfo={persisted:null, usage:null, imgs:null};
async function refreshStorageInfo(){
  try{ if(navigator.storage && navigator.storage.persisted) storeInfo.persisted=await navigator.storage.persisted(); }catch(e){}
  try{ if(navigator.storage && navigator.storage.estimate){ const e=await navigator.storage.estimate(); storeInfo.usage=e.usage; } }catch(e){}
  try{
    if("caches" in window){ let n=0; for(const k of await caches.keys()) if(k.startsWith("nashef-local-")) for(const r of await (await caches.open(k)).keys()) if(r.url.includes("/img/")) n++; storeInfo.imgs=n; }
  }catch(e){}
  renderStorageCard();
}
function renderStorageCard(){
  const el=document.getElementById("st-list"); if(!el) return;
  const st=Store.status(), lb=st.meta.lastBackup, standalone=matchMedia("(display-mode: standalone)").matches || navigator.standalone===true;
  const rows=[
    ["مكان الحفظ", st.mode==="idb" ? "على هذا الجهاز فقط (قاعدة بيانات المتصفح)" : st.mode==="fallback" ? "حفظ مؤقت أضعف (قاعدة البيانات غير متاحة)" : "—"],
    ["عدد السجلات", AR(Object.keys(Store.all()).length)],
    ["مثبّت على الشاشة الرئيسية", standalone ? "نعم" : "لا، افتحه من الأيقونة بعد التثبيت"],
    ["طلب الحفظ الدائم", storeInfo.persisted===true ? "مقبول" : storeInfo.persisted===false ? "ما انقبل (عادي في iOS)" : "غير مدعوم"],
    ["جاهز بدون إنترنت", storeInfo.imgs==null ? "—" : `${AR(storeInfo.imgs)} من ${AR(78)} صورة محفوظة`],
    ["المساحة المستخدمة", storeInfo.usage==null ? "—" : `${fmt(storeInfo.usage/1048576,1)} ميجا`],
    ["آخر نسخة احتياطية", lb ? `${fmtDate(lb.at)} (${AR(lb.n)} سجل)` : "ما صدّرت أي نسخة للحين"]
  ];
  el.innerHTML=rows.map(([k,v])=>`<div><span>${esc(k)}</span><span class="muted">${esc(v)}</span></div>`).join("");
  const err=document.getElementById("st-err"); err.textContent=st.error||""; 
  document.getElementById("p-last").textContent = lb ? `آخر نسخة صدّرتها: ${fmtDate(lb.at)} (${AR(lb.n)} سجل). التطبيق ما يقدر يتأكد إنها انحفظت في الملفات، فتأكد بنفسك.` : "ما صدّرت أي نسخة للحين.";
  Store.snapshot().then(s => { const b=document.getElementById("p-undo"); b.hidden=!s; if(s) b.dataset.at=s.at; }).catch(()=>{});
}
/* reminder on Today: never backed up (after a few records) or more than 7 days ago */
function renderBackupReminder(){
  const el=document.getElementById("t-backup"); if(!el) return;
  const lb=Store.status().meta.lastBackup, n=Object.keys(Store.all()).length;
  let t="";
  if(!lb && n>=4) t="ما عندك نسخة احتياطية. بياناتك موجودة على هذا الجهاز بس، ولو انحذف التطبيق تروح. صدّر نسخة واحفظها في الملفات أو iCloud Drive.";
  else if(lb && daysSince(lb.at)>=7) t=`آخر نسخة احتياطية قبل ${AR(daysSince(lb.at))} يوم. صدّر نسخة جديدة واحفظها في الملفات.`;
  el.hidden=!t; document.getElementById("t-backup-txt").textContent=t;
}

/* ---------- chart ---------- */
let chartRange = pref.get("range", 90), chartGeo = null;
function chart(entries, goal){
  let keys=Object.keys(entries).sort(); chartGeo=null;
  if(keys.length<1) return `<div class="muted">سجّل وزنك يومياً ويطلع المنحنى هنا.</div>`;
  if(chartRange){ const from=addDays(D,-chartRange), f=keys.filter(k=>k>=from); keys = f.length ? f : keys.slice(-1); }
  const start=keys[0], end=keys[keys.length-1];
  const span=Math.max(1, Math.round((new Date(end)-new Date(start))/864e5));
  const avgs=keys.map(k=>avgWindow(entries,k,7).avg);
  const vals=keys.map(k=>entries[k]); const lo=Math.floor(Math.min(...vals, ...avgs, goal)-1), hi=Math.ceil(Math.max(...vals, ...avgs)+1);
  const W=340,H=190,L=34,R=8,T=10,B=24;
  const x=k=>L+(W-L-R)*(Math.round((new Date(k)-new Date(start))/864e5)/span), y=v=>T+(H-T-B)*(1-(v-lo)/(hi-lo));
  const pts=keys.map((k,i)=>({k, w:entries[k], avg:avgs[i], x:x(k), y:y(entries[k]), ya:y(avgs[i])}));
  chartGeo={pts, W};
  let grid=""; const step=Math.max(1,Math.ceil((hi-lo)/5));
  for(let v=lo; v<=hi; v+=step) grid+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--sep)"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end">${AR(v)}</text>`;
  const dots=pts.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="2.4" fill="var(--ink-3)"/>`).join("");
  const avg=pts.map(p=>`${p.x},${p.ya}`).join(" "), lastP=pts[pts.length-1];
  const area=`${x(start)},${H-B} ${avg} ${x(end)},${H-B}`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="منحنى الوزن. اسحب عليه لقراءة كل يوم">${grid}
    <line x1="${L}" x2="${W-R}" y1="${y(goal)}" y2="${y(goal)}" stroke="var(--ink-3)" stroke-dasharray="4 4"/>
    <polygon points="${area}" fill="var(--accent)" opacity=".08"/>
    ${dots}<polyline points="${avg}" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${lastP.x}" cy="${lastP.ya}" r="6" fill="var(--surface)" stroke="var(--accent)" stroke-width="3"/>
    <g id="w-cur" visibility="hidden"><line y1="${T}" y2="${H-B}" stroke="var(--ink-2)" stroke-width="1"/><circle class="cd" r="4.5" fill="var(--ink)"/><circle class="ca" r="5.5" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/></g>
    <text x="${L}" y="${H-6}" text-anchor="start">${shortDay(start)}</text><text x="${W-R}" y="${H-6}" text-anchor="end">${shortDay(end)}</text></svg>`;
}
/* readout above the chart: the latest day by default, the touched day while scrubbing */
function chartReadout(p){
  const el=document.getElementById("w-read");
  if(!chartGeo){ el.textContent=""; return; }
  const q=p||chartGeo.pts[chartGeo.pts.length-1];
  el.innerHTML=`<b class="num">${fmt(q.w)} <small>كجم</small></b><span>${esc(dayLabel(q.k))} · متوسط ٧ أيام ${fmt(q.avg)}</span>`;
}
(() => {
  const box=document.getElementById("w-chart"); let on=false, t=null;
  function scrub(e){
    const svg=box.querySelector("svg"); if(!chartGeo || !svg) return;
    const r=svg.getBoundingClientRect(), vx=(e.clientX-r.left)/r.width*chartGeo.W;
    let best=chartGeo.pts[0]; for(const p of chartGeo.pts) if(Math.abs(p.x-vx)<Math.abs(best.x-vx)) best=p;
    const g=svg.querySelector("#w-cur"), ln=g.querySelector("line");
    ln.setAttribute("x1",best.x); ln.setAttribute("x2",best.x);
    g.querySelector(".cd").setAttribute("cx",best.x); g.querySelector(".cd").setAttribute("cy",best.y);
    g.querySelector(".ca").setAttribute("cx",best.x); g.querySelector(".ca").setAttribute("cy",best.ya);
    g.setAttribute("visibility","visible"); chartReadout(best);
  }
  function release(){ on=false; clearTimeout(t); t=setTimeout(() => { const g=box.querySelector("#w-cur"); if(g) g.setAttribute("visibility","hidden"); chartReadout(); }, 1400); }
  box.addEventListener("pointerdown", e => { on=true; clearTimeout(t); scrub(e); });
  box.addEventListener("pointermove", e => { if(on || e.pointerType==="mouse"){ clearTimeout(t); scrub(e); } });
  box.addEventListener("pointerup", release); box.addEventListener("pointercancel", release); box.addEventListener("pointerleave", release);
  document.getElementById("w-range").addEventListener("click", e => {
    const b=e.target.closest("[data-r]"); if(!b) return;
    chartRange=+b.dataset.r; pref.set("range",chartRange); render();
  });
})();

/* ---------- render ---------- */
const RING_C = 2*Math.PI*42;
function ring(id, frac, over){ const el=document.getElementById(id); el.classList.toggle("over",!!over);
  el.style.strokeDashoffset = RING_C*(1-Math.max(0,Math.min(1,frac||0))); }
function setBar(id, pct, warn){const el=document.getElementById(id); el.classList.toggle("warn",!!warn); el.firstElementChild.style.width=Math.min(100,Math.max(0,pct))+"%";}
function render(){
  document.getElementById("dateLbl").textContent = new Date().toLocaleDateString("ar-SA-u-ca-gregory-nu-arab",{weekday:"long",day:"numeric",month:"long"});
  const st=S.settings; if(!st) return;
  const we=(S.weights&&S.weights.e)||{}, me=(S.measures&&S.measures.e)||{};
  const keys=Object.keys(we).sort(); const lastKey=keys[keys.length-1];
  const a7=lastKey?avgWindow(we,lastKey,7):null, prev=lastKey?avgWindow(we,addDays(lastKey,-7),7):null;
  const cur = a7 ? a7.avg : st.startWeight;
  // weight card
  countTo(document.getElementById("t-avg"), Math.round(cur*10)/10, v=>fmt(v));
  document.getElementById("t-left").textContent = fmt(Math.max(0,cur-st.goalWeight))+" كجم";
  const prog = (st.startWeight-cur)/(st.startWeight-st.goalWeight)*100;
  document.getElementById("t-prog").style.width = Math.max(0,Math.min(100,prog))+"%";
  const remain=Math.max(0,cur-st.goalWeight), tr=lastKey?trendPerWeek(we,lastKey,21):null;
  let ptxt=`نزلت ${fmt(st.startWeight-cur)} كجم من ${fmt(st.startWeight)}. `;
  if(remain<=0) ptxt+="وصلت هدفك.";
  else if(tr!=null && tr<-0.1) ptxt+=`بمعدلك الفعلي آخر ٣ أسابيع (${fmt(-tr,2)} كجم/أسبوع) توصل بعد قرابة ${AR(Math.ceil(remain/-tr))} أسبوع. النزول عادة يبطأ كل ما قرّبت، فاعتبره تقدير مو موعد.`;
  else ptxt+=`لو نزلت ٠.٥–٠.٧٥ كجم بالأسبوع توصل بعد ${AR(Math.ceil(remain/0.75))}–${AR(Math.ceil(remain/0.5))} أسبوع. بعد ٣ أسابيع تسجيل أحسبها من معدلك الفعلي.`;
  document.getElementById("t-progtxt").textContent = ptxt;
  const rateEl=document.getElementById("t-rate");
  let rate=null; if(a7 && prev && a7.n>=3 && prev.n>=3) rate=a7.avg-prev.avg;
  rateEl.textContent = rate==null ? "يحتاج أسبوعين بيانات" : (rate<=0?"−":"+")+fmt(Math.abs(rate),2)+" كجم/أسبوع";
  rateEl.className="pill"+(rate!=null && (-rate<cur*RATE_LOW || -rate>cur*RATE_HIGH)?" warn":"");
  // advice
  const days = keys.length ? Math.round((new Date(lastKey)-new Date(keys[0]))/864e5) : 0;
  const mkeys=Object.keys(me).sort(), mLast=mkeys[mkeys.length-1], mOld=mLast ? mkeys.filter(k=>k<=addDays(mLast,-10)).pop() : null;
  const waistDrop = mOld ? me[mOld].waist-me[mLast].waist : 0;
  const week = weekStats();
  const weeksIn = st.startDate ? Math.floor((new Date(D)-new Date(st.startDate))/6048e5) : 0;
  const adv = weeklyAdvice({rate, cur, days, kcal:st.kcal, waistDrop, week, weeksIn});
  const advEl=document.getElementById("t-advice"); advEl.textContent=adv.t; advEl.className="note"+(adv.warn?" warn":"");
  // body fat
  const mk=Object.keys(me).sort(); const lm=mk.length?me[mk[mk.length-1]]:null;
  let bf = lm ? navyBF(lm.waist, lm.neck, st.height) : null; if(bf!=null && (bf<3||bf>60)) bf=null;
  document.getElementById("t-bf").textContent = bf!=null ? fmt(bf)+"٪" : "—";
  if(bf!=null){ const lbm=cur*(1-bf/100);
    document.getElementById("t-lbm").textContent=fmt(lbm)+" كجم";
    document.getElementById("t-w15").textContent=fmt(lbm/0.85)+" كجم";
    document.getElementById("t-w12").textContent=fmt(lbm/0.88)+" كجم"; }
  // food
  const items=(S.food&&S.food.items)||[]; const kc=items.reduce((a,b)=>a+(b.k||0),0), pr=items.reduce((a,b)=>a+(b.p||0),0);
  document.getElementById("t-kcal").textContent = `${AR(kc)} / ${AR(st.kcal)}`;
  document.getElementById("t-prot").textContent = `${fmt(pr,0)} / ${AR(st.protein)} جم`;
  ring("t-kring", kc/st.kcal, kc>st.kcal); ring("t-pring", pr/st.protein, false);
  countTo(document.getElementById("t-kleft"), Math.abs(st.kcal-kc), v=>AR(Math.round(v)));
  document.getElementById("t-kleft").nextElementSibling.textContent = kc>st.kcal ? "سعرة زيادة" : "سعرة باقية";
  countTo(document.getElementById("t-pleft"), Math.round(Math.max(0,st.protein-pr)), v=>fmt(v,0));
  document.getElementById("f-kcal").textContent = `${AR(kc)} / ${AR(st.kcal)}`;
  document.getElementById("f-prot").textContent = `${fmt(pr,0)} / ${AR(st.protein)} جم`;
  setBar("f-kbar", kc/st.kcal*100, kc>st.kcal); setBar("f-pbar", pr/st.protein*100);
  const left=st.kcal-kc, pleft=st.protein-pr;
  document.getElementById("f-left").textContent = left>=0 ? `باقي ${AR(left)} سعرة و${fmt(Math.max(0,pleft),0)} جم بروتين` : `زدت ${AR(-left)} سعرة`;
  document.getElementById("f-list").innerHTML = items.length ? items.map((x,i)=>`<div data-row="${i}"><span>${esc(x.n)}</span><span class="row" style="gap:4px;flex-wrap:nowrap"><span class="num muted">${AR(x.k)} سعرة · ${fmt(x.p,0)} جم</span><button class="x" aria-label="حذف" data-delf="${i}">×</button></span></div>`).join("") : `<div class="muted">ما سجلت شي اليوم.</div>`;
  document.getElementById("f-week").textContent = week ? `متوسط آخر ${AR(week.n)} ${week.n>2&&week.n<11?"أيام مسجلة":"يوم مسجل"} قبل اليوم: ${AR(Math.round(week.k))} سعرة و${AR(Math.round(week.p))} جم بروتين.` : "";
  // this week
  let woDone=0; for(let i=0;i<7;i++){ const w = i===0 ? S.wo : Store.get("wo-"+addDays(D,-i)); if(w && w.done) woDone++; }
  const mks=Object.keys(me).sort(), wDiff = mks.length>1 ? me[mks[mks.length-1]].waist-me[mks[mks.length-2]].waist : null;
  document.getElementById("t-week").innerHTML = [
    ["التمارين", `${AR(woDone)} من ${AR(S.program.days)}`],
    ["تغيّر الوزن", rate==null ? "—" : `${rate>0?"+":"−"}${fmt(Math.abs(rate),1)} كجم`],
    ["متوسط السعرات", week ? AR(Math.round(week.k)) : "—"],
    ["متوسط البروتين", week ? `${AR(Math.round(week.p))} جم` : "—"]
  ].map(([k,v])=>`<div class="stat"><span class="caption">${esc(k)}</span><span class="mid">${esc(v)}</span></div>`).join("");
  document.getElementById("t-week-note").textContent = "آخر ٧ أيام." + (wDiff!=null ? ` الخصر ${wDiff>0?"زاد":wDiff<0?"نزل":"ثابت"}${wDiff? " "+fmt(Math.abs(wDiff),1)+" سم":""} عن القياس اللي قبله.` : "");
  const stp=S.wo && S.wo.steps;
  document.getElementById("t-steps").textContent = stp ? `${AR(stp)} / ${AR(st.steps||8000)}` : `الهدف ${AR(st.steps||8000)}`;
  renderBackupReminder();
  if(typeof renderPlay==="function") renderPlay();
  // today workout summary
  const d = (S.wo && S.wo.day!=null) ? S.wo.day : (st.nextDay||0);
  const pdays=getPlan().days, p=pdays[((d%pdays.length)+pdays.length)%pdays.length];
  document.getElementById("t-wo").innerHTML = `<span class="wo-badge">${AR(pdays.indexOf(p)+1)}</span><div class="wo-text"><div class="t">${esc(p.t)}</div><div class="muted">${p.ex.map(e=>esc(e[1])).join("، ")} + كارديو</div></div>`;
  const wd=document.getElementById("t-wodone"); const done=S.wo&&S.wo.done; wd.textContent=done?"تم":"لم يكتمل"; wd.className="pill"+(done?"":" warn");
  // weight tab
  const wi=document.getElementById("w-in"); if(document.activeElement!==wi) wi.value = we[D] ?? (lastKey? we[lastKey] : "");
  document.getElementById("w-chart").innerHTML = chart(we, st.goalWeight); chartReadout();
  document.querySelectorAll("#w-range [data-r]").forEach(b => { const on=+b.dataset.r===chartRange; b.classList.toggle("on",on); b.setAttribute("aria-pressed",String(on)); });
  document.getElementById("w-list").innerHTML = keys.length ? keys.slice(-21).reverse().map(k=>`<div><span>${dayLabel(k)}</span><span class="row" style="gap:4px;flex-wrap:nowrap"><span class="num">${fmt(we[k])} كجم</span><button class="x" aria-label="حذف" data-delw="${k}">×</button></span></div>`).join("") : `<div class="muted">لا يوجد</div>`;
  document.getElementById("m-list").innerHTML = mk.slice(-8).reverse().map(k=>{const b=navyBF(me[k].waist,me[k].neck,st.height);
    return `<div><span>${dayLabel(k)}</span><span class="row" style="gap:4px;flex-wrap:nowrap"><span class="num muted">خصر ${AR(me[k].waist)} · رقبة ${AR(me[k].neck)} · ${b!=null?fmt(b)+"٪":"—"}</span><button class="x" aria-label="حذف" data-delm="${k}">×</button></span></div>`;}).join("");
  // plan tab
  const lbmNow = bf!=null ? cur*(1-bf/100) : null;
  const sug=suggestTargets();
  let calcT = calcText(sug.c, cur) + ` البروتين المقترح ${AR(sug.protein)} جم. أهدافك الحالية: ${AR(st.kcal)} سعرة و${AR(st.protein)} جم.`;
  if(week && week.n>=5 && rate!=null && days>=14) calcT += ` من بياناتك: أكلك المسجل ونزولك الفعلي يعطون صيانة تقريبية ${AR(Math.round((week.k + (-rate)*7700/7)/50)*50)} سعرة. هذا الرقم يعتمد على دقة تسجيلك، وهو أصدق من المعادلة كل ما زادت بياناتك.`;
  document.getElementById("p-calc").textContent = calcT;
  renderProg();
  const li = a => a.map(x=>`<li>${esc(x)}</li>`).join("");
  document.getElementById("p-rules-food").innerHTML = li([
    `سرعة النزول المطلوبة ٠.٥–١٪ من وزنك بالأسبوع، يعني الحين ${fmt(cur*0.005,1)}–${fmt(cur*0.01,1)} كجم. الأسرع من كذا يزيد خسارة العضل.`,
    `البروتين ${AR(st.protein)} جم كل يوم، مقسّم على ٣–٤ وجبات (٣٠–٥٠ جم بالوجبة).`,
    "الرز مسموح: ٧٥ جم ني بالوجبة الرئيسية (كوب مطبوخ تقريباً). وزّنه ني قبل الطبخ.",
    "خضار أو سلطة مع الغداء والعشاء. تشبّع بسعرات قليلة وتسهّل الالتزام.",
    "الزيت يُوزن بالملعقة، لا تصب من القارورة. الملعقة الكبيرة ١٢٠ سعرة.",
    "اشرب ماء وقهوة وشاي بدون سكر. العصير والغازيات بسكر تنحسب من سعراتك.",
    "أكلت برا البيت؟ سجّلها بتقدير أعلى شوي وكمّل يومك عادي. وجبة وحدة ما تخرب أسبوع.",
    `لا تعدّل السعرات قبل أسبوعين من البيانات، وكل تعديل ${AR(KCAL_STEP)} سعرة بس. لا تنزل تحت ${AR(KCAL_FLOOR)}.`
  ]);
  document.getElementById("p-rules-train").innerHTML = li([
    "هدف الحديد وأنت تنشّف إنك تحافظ على قوتك. نفس الأوزان أو أعلى يعني عضلك محفوظ.",
    "التدرج: إذا وصلت أعلى رقم في التكرارات بكل المجموعات، زد الوزن ٢.٥ كجم (٥ كجم لتمارين الأرجل الثقيلة).",
    cardioText(S.program)+" الكارديو يكمّل العجز، وما يعوّض أكل زايد.",
    "أي حركة تألمك وقّفها واختر بديل من زر البدائل. لا تتمرن فوق الألم.",
    `${AR(st.steps||8000)} خطوة يومياً، وأيام الراحة بالذات.`,
    `${({5:"يومين",4:"٣ أيام",3:"٤ أيام"})[S.program.days]} راحة بالأسبوع. النوم ٧–٩ ساعات، لأن قلة النوم تزيد الجوع وتضعف الاستشفاء.`,
    "إذا نزل أداؤك في نفس التمرين جلستين ورا بعض، خفف أسبوع: نفس الأوزان بنص المجموعات، ثم ارجع."
  ]);
  [["p-k","kcal"],["p-p","protein"],["p-g","goalWeight"],["p-st","steps"]].forEach(([id,f])=>{const el=document.getElementById(id); if(document.activeElement!==el) el.value=st[f]??"";});
  renderTrain();
}

/* compact nav bar appears once the large title scrolls away, as on iOS */
if("IntersectionObserver" in window){
  new IntersectionObserver(([e]) => document.getElementById("topbar").classList.toggle("on", !e.isIntersecting), {rootMargin:"-44px 0px 0px 0px"})
    .observe(document.getElementById("pageTitle"));
}
/* ---------- start ---------- */
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+Math.random().toString(36).slice(2));

/* ---------- app updates: a new version waits until the user taps "حدّث", data is saved first ---------- */
let swReg=null;
function offerUpdate(){ document.getElementById("upd").hidden=false; }
document.getElementById("upd-go").addEventListener("click", async () => {
  await flushWO(); await Store.flush();
  if(swReg && swReg.waiting) swReg.waiting.postMessage("activate"); else location.reload();
});
if("serviceWorker" in navigator && location.protocol==="https:" || location.hostname==="localhost"){
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("sw.js").then(reg => {
      swReg=reg;
      if(reg.waiting && navigator.serviceWorker.controller) offerUpdate();
      reg.addEventListener("updatefound", () => { const w=reg.installing; if(w) w.addEventListener("statechange", () => { if(w.state==="installed" && navigator.serviceWorker.controller) offerUpdate(); if(w.state==="activated") refreshStorageInfo(); }); });
      navigator.serviceWorker.ready.then(() => setTimeout(refreshStorageInfo, 1500));
    }).catch(()=>{});
    let reloading=false;
    navigator.serviceWorker.addEventListener("controllerchange", () => { if(reloading || !swReg || !swReg.active) return; if(document.getElementById("upd").hidden) return; reloading=true; location.reload(); });
  }
}
(async () => {
  Store.onStatus(renderStore);
  await Store.open();
  /* the database can open before the later script files (play.js, focus.js) finish loading: wait for all of them */
  if(document.readyState==="loading") await new Promise(r => document.addEventListener("DOMContentLoaded", r, {once:true}));
  mode="ready";
  subscribeAll(); loadWeek(); route(); renderStore(Store.status());
  try{ if(navigator.storage && navigator.storage.persist && !(await navigator.storage.persisted())) await navigator.storage.persist(); }catch(e){}
  refreshStorageInfo();
  const st=Store.status();
  if(st.meta.migratedNow) toast(`نقلت ${AR(st.meta.migratedNow)} سجل من النسخة السابقة على هذا الجهاز`);
  try{ const t=sessionStorage.getItem("nashef-toast"); if(t){ sessionStorage.removeItem("nashef-toast"); toast(t); } }catch(e){}
})();
