const ICONS = {
  sos:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/></svg>',
  flood:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 15c2 0 2-1.5 4.5-1.5S10 15 12 15s2.5-1.5 4.5-1.5S19 15 21 15M3 19c2 0 2-1.5 4.5-1.5S10 19 12 19s2.5-1.5 4.5-1.5S19 19 21 19M12 11V4M9 7l3-3 3 3"/></svg>',
  closed:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="9" width="18" height="6" rx="1"/><path d="M7 9l-2 6M12 9l-2 6M17 9l-2 6M6 15v4M18 15v4"/></svg>',
  util:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M13 3L5 13h6l-1 8 8-10h-6z"/></svg>',
  point:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 11l8-7 8 7v9H4z"/><path d="M12 11v6M9 14h6"/></svg>',
  ppl:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 11a3 3 0 1 0 0-6M21 20c0-2.8-1.8-5-4.3-5.7"/></svg>',
  phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/></svg>',
  chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  menu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>'
};
const TYPES = {
  sos:{label:"ขอความช่วยเหลือ",hint:"ติดอยู่ในห้อง ขาดอาหาร/น้ำ ผู้ป่วย ผู้สูงอายุ",c:"sos"},
  flood:{label:"รายงานน้ำท่วม",hint:"น้ำท่วมชั้นล่าง ลานจอด ทางเดิน",c:"flood"},
  closed:{label:"เส้นทางถูกปิด",hint:"ถนนหรือซอยผ่านไม่ได้",c:"closed"},
  util:{label:"ไฟดับ / น้ำประปา",hint:"ไฟดับ น้ำประปาไม่ไหล ปั๊มน้ำเสีย",c:"util"},
  point:{label:"จุดช่วยเหลือ",hint:"แจกอาหาร น้ำ ยา กระสอบทราย เรือ",c:"point"}
};
const CASE_STATUS = {waiting:"ยังเกิดอยู่",inprogress:"กำลังดำเนินการ",helped:"คลี่คลายแล้ว"};
const SOS_STATUS = {waiting:"รอความช่วยเหลือ",inprogress:"กำลังช่วยเหลือ",helped:"ช่วยเหลือสำเร็จ"};
const POINT_STATUS = {open:"เปิด มีของ",paused:"พักชั่วคราว",out:"ของหมดแล้ว",closed:"ปิดบริการ"};
const SERVICES = {food:"อาหารและน้ำดื่ม",shelter:"ที่พักพิง",medical:"ยา / การแพทย์",sandbag:"กระสอบทราย",boat:"เรือ / รถรับส่ง",other:"อื่น ๆ"};
const DEPTH = [null,["ต่ำกว่า 20 ซม.","รถผ่านได้ ระวัง"],["20–49 ซม.","รถเล็กเสี่ยง"],["50–89 ซม.","รถเล็กผ่านไม่ได้"],["90 ซม. ขึ้นไป","อันตราย เดินลุยไม่ได้"]];
const depthLvl = cm => cm == null ? 0 : cm < 20 ? 1 : cm < 50 ? 2 : cm < 90 ? 3 : 4;
const STALE_MS = 6*3600*1000;
const pad2 = n => String(n).padStart(2,"0");
const toLocalInput = ms => { const d = new Date(ms); return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const tShort = ms => { const d = new Date(ms), n = new Date(); const t = d.toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"}) + " น."; return d.toDateString() === n.toDateString() ? t : d.toLocaleDateString("th-TH",{day:"numeric",month:"short"}) + " " + t; };
const GAUGE = [[10,"ข้อเท้า"],[30,"หน้าแข้ง"],[50,"เข่า"],[90,"เอว"],[120,"อก"],[140,"คอ"],[170,"สูงกว่าคอ"]];
const HOTLINES = [
  ["1784","ปภ. สายด่วนนิรภัย","แจ้งเหตุสาธารณภัย ขอความช่วยเหลือน้ำท่วม"],
  ["1669","เจ็บป่วยฉุกเฉิน","รถพยาบาล สพฉ."],
  ["191","เหตุด่วนเหตุร้าย","ตำรวจ"],
  ["199","ดับเพลิงและกู้ภัย","ไฟไหม้ ไฟฟ้าช็อต ไฟฟ้ารั่วลงน้ำ"],
  ["1555","กรุงเทพมหานคร","น้ำท่วมขัง การระบายน้ำ"],
  ["1615","การเคหะแห่งชาติ","Call Center เจ้าของแฟลต"],
  ["1130","การไฟฟ้านครหลวง","ไฟดับ สายไฟจมน้ำ"],
  ["1125","การประปานครหลวง","น้ำประปาไม่ไหล"]
];
const LINKS = [
  ["https://weather.bangkok.go.th/","เรดาร์ฝน กทม.","สำนักการระบายน้ำ ดูกลุ่มฝนและระดับน้ำในคลองแสนแสบ"],
  ["https://weather.longdo.com/","Longdo Weather","เรดาร์ฝนสดและพยากรณ์ฝนล่วงหน้า"],
  ["https://www.thaiwater.net/","ThaiWater","ระดับน้ำ ปริมาณฝน สถานีวัดน้ำ"],
  ["https://sites.research.google/floods/","Google Flood Hub","คาดการณ์น้ำท่วมล่วงหน้า 7 วัน"],
  ["https://www.traffy.in.th/","Traffy Fondue","แจ้งน้ำท่วมขังถึง กทม. โดยตรง"],
  ["https://www.google.com/maps/search/?api=1&query=%E0%B9%81%E0%B8%9F%E0%B8%A5%E0%B8%95%E0%B8%84%E0%B8%A5%E0%B8%AD%E0%B8%87%E0%B8%88%E0%B8%B1%E0%B9%88%E0%B8%99","แผนที่ Google Maps","ดูภาพถ่ายดาวเทียมและนำทางไปแฟลตคลองจั่น"]
];

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
function h(tag, attrs, ...kids){
  const el = document.createElement(tag);
  if (attrs) for (const k in attrs){
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v; /* constant SVG icons only */
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat(3)){ if (c == null || c === false) continue; el.append(c.nodeType ? c : String(c)); }
  return el;
}
const toNum = v => { const n = parseInt(v,10); return isFinite(n) && n >= 0 ? n : null; };
const clean = (s, n) => String(s || "").trim().slice(0, n || 500);
function autoCode(name){
  const d = (String(name).match(/\d+/)||[])[0];
  let c = d || ("B" + Date.now().toString(36).toUpperCase());
  let i = 2; const base = c;
  while (S.blds.some(b => b.id === c)) c = base + "-" + (i++);
  return c;
}
const thSort = (a,b) => String(a).localeCompare(String(b),"th",{numeric:true});
function when(ms){
  if (!ms) return "";
  const m = Math.round((Date.now() - ms)/60000);
  if (m < 1) return "เมื่อสักครู่";
  if (m < 60) return m + " นาทีที่แล้ว";
  if (m < 1440) return Math.floor(m/60) + " ชม.ที่แล้ว";
  return new Date(ms).toLocaleDateString("th-TH",{day:"numeric",month:"short"}) + " " + new Date(ms).toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"});
}
const full = ms => ms ? new Date(ms).toLocaleString("th-TH",{dateStyle:"medium",timeStyle:"short"}) : "-";
const shortName = n => String(n||"").replace(/^(แฟลตคลองจั่น\s*)?(อาคารที่|อาคาร|ตึก|หลังที่)\s*/,"") || n;
const gmaps = B => (typeof B.lat === "number") ? "https://www.google.com/maps/dir/?api=1&destination=" + B.lat + "," + B.lng : "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("แฟลตคลองจั่น " + B.name + " บางกะปิ");
function statusLabel(r){
  if (r.type === "point") return POINT_STATUS[r.status] || POINT_STATUS.open;
  const st = r.status === "closed" ? "helped" : r.status;
  return (r.type === "sos" ? SOS_STATUS : CASE_STATUS)[st] || (r.type === "sos" ? SOS_STATUS.waiting : CASE_STATUS.waiting);
}
function statusClass(r){
  if (r.type === "point") return r.status === "open" ? "t-point" : r.status === "closed" ? "t-done" : "t-util";
  if (r.status === "inprogress") return "t-util";
  return isActive(r) ? "t-" + (TYPES[r.type]||TYPES.sos).c : "t-point";
}
const isActive = r => r.type === "point" ? r.status !== "closed" : (r.status === "waiting" || r.status === "inprogress");
let toastT;
function toast(msg){ const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(()=>t.hidden = true, 3600); }
function copy(text, okMsg){
  const fallback = () => {
    const ta = h("textarea",{style:"position:fixed;left:-9999px"}); ta.value = text; document.body.append(ta); ta.select();
    try { document.execCommand("copy"); toast(okMsg); } catch(e){ toast("คัดลอกไม่ได้ กดค้างที่ข้อความเพื่อคัดลอกเอง"); }
    ta.remove();
  };
  try { navigator.clipboard.writeText(text).then(()=>toast(okMsg), fallback); } catch(e){ fallback(); }
}

/* ---------- config & data layer ---------- */
const CFG = window.KCF_CONFIG || {};
const SITE = (CFG.SITE_URL || (location.origin + location.pathname)).replace(/\/$/, "");
const configured = CFG.SUPABASE_URL && !/YOUR-/.test(CFG.SUPABASE_URL) && CFG.SUPABASE_ANON_KEY && !/YOUR-/.test(CFG.SUPABASE_ANON_KEY);
let SB = null;

const KEYSTORE = "kcf-keys";
function loadKeys(){ try { return JSON.parse(localStorage.getItem(KEYSTORE) || "{}") || {}; } catch(e){ return {}; } }
function saveKey(id, role, key){ const k = loadKeys(); k[id] = Object.assign(k[id] || {}, {[role]: key}); try { localStorage.setItem(KEYSTORE, JSON.stringify(k)); } catch(e){} }
const keyOf = id => { const k = loadKeys()[id] || {}; return k.owner || k.helper || null; };
const isMine = id => !!(loadKeys()[id] || {}).owner;
const isHelperOf = id => !!(loadKeys()[id] || {}).helper;

const ms = v => v ? Date.parse(v) : null;
function normReport(r){
  return Object.assign({}, r, { bid:r.building_id, createdAt:ms(r.created_at), updatedAt:ms(r.updated_at), observedAt:ms(r.observed_at),
    readings:r.readings||[], helpers:r.helpers||[], updates:r.updates||[], photos:r.photos||[] });
}
const errMsg = e => (e && (e.message || e.error_description)) ? String(e.message || e.error_description).replace(/^.*?:\s*(?=[฀-๿])/,"") : "บันทึกไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วลองใหม่";
async function rpc(name, args){ const { data, error } = await SB.rpc(name, args); if (error) throw error; return data; }

/* photos: shrink on the phone, then upload to Storage */
function loadImg(file){ return new Promise((res, rej) => { const u = URL.createObjectURL(file); const im = new Image(); im.onload = () => { res(im); setTimeout(()=>URL.revokeObjectURL(u), 1000); }; im.onerror = () => rej(new Error("อ่านไฟล์รูปไม่ได้ ลองเลือกรูปอื่น")); im.src = u; }); }
async function shrink(file){
  const im = await loadImg(file);
  const max = 1600, sc = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
  const c = document.createElement("canvas"); c.width = Math.round(im.naturalWidth*sc); c.height = Math.round(im.naturalHeight*sc);
  c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
  return await new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error("ย่อรูปไม่สำเร็จ")), "image/jpeg", 0.8));
}
const rid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
async function uploadPhotos(files, onProgress){
  const urls = [];
  for (let i = 0; i < files.length; i++){
    if (onProgress) onProgress(i+1, files.length);
    let blob;
    try { blob = await shrink(files[i]); }
    catch(e){ if (/^image\/(jpeg|png|webp)$/.test(files[i].type) && files[i].size <= 5*1024*1024) blob = files[i]; else throw new Error("รูปนี้อ่านไม่ได้ (เช่นไฟล์ HEIC) ลองถ่ายใหม่หรือเลือกรูป JPG"); }
    const path = new Date().toISOString().slice(0,10) + "/" + rid() + ".jpg";
    const { error } = await SB.storage.from("photos").upload(path, blob, {contentType:blob.type || "image/jpeg", upsert:false});
    if (error) throw error;
    urls.push(SB.storage.from("photos").getPublicUrl(path).data.publicUrl);
  }
  return urls;
}
function photoPicker(list, onChange, max){
  const wrap = h("div",{style:"display:grid;gap:6px"});
  const input = h("input",{type:"file",accept:"image/*",multiple:true,style:"display:none"});
  const draw = () => {
    wrap.replaceChildren(
      h("div",{class:"thumbs"}, list.map((f,i) => { const u = URL.createObjectURL(f); return h("div",{class:"thumb"}, h("img",{src:u,alt:"รูปที่ "+(i+1)}),
        h("button",{type:"button","aria-label":"นำรูปออก",onclick:()=>{ list.splice(i,1); onChange && onChange(); draw(); }},"×")); }),
        list.length < max ? h("button",{class:"thumb add",type:"button",onclick:()=>input.click()}, "+ เพิ่มรูป") : null),
      h("span",{class:"note"}, "ถ่ายรูปหรือเลือกจากเครื่องได้สูงสุด "+max+" รูป ระบบย่อขนาดให้ก่อนส่ง"), input);
  };
  input.addEventListener("change", () => { [...input.files].filter(f => /^image\//.test(f.type)).slice(0, max - list.length).forEach(f => list.push(f)); input.value = ""; onChange && onChange(); draw(); });
  draw();
  return wrap;
}

async function loadTable(t){
  let q = SB.from(t).select("*");
  if (t === "reports") q = q.order("created_at", {ascending:false}).limit(1000);
  if (t === "news") q = q.order("created_at", {ascending:false}).limit(150);
  const { data, error } = await q;
  if (error) throw error;
  if (t === "reports") S.reports = (data||[]).map(normReport);
  else if (t === "news") S.news = (data||[]).map(n => Object.assign({}, n, {bid:n.building_id, createdAt:ms(n.created_at)}));
  else S.blds = data || [];
}
let reloadT = {};
function reload(t){ clearTimeout(reloadT[t]); reloadT[t] = setTimeout(async () => { try { await loadTable(t); banner(""); renderAll(); } catch(e){ banner("การเชื่อมต่อข้อมูลขาดหาย กำลังลองใหม่…"); } }, 250); }

/* ---------- state ---------- */
const S = { reports:[], news:[], blds:[], staff:false, filter:"active", bldF:null, baseMode:"sat", loaded:false, rd:null, ad:null, placing:null, placingCancel:null, cal:null };
const regByCode = code => S.blds.find(b => b.id === code);
const regByName = name => S.blds.find(b => b.name === name);
const bldOf = r => (r.bid && regByCode(r.bid)) || regByName(r.building) || null;
const sortedBlds = () => S.blds.slice().sort((a,b)=>thSort(shortName(a.name),shortName(b.name)));
const hasLL = o => o && typeof o.lat === "number" && typeof o.lng === "number";
function whereText(r){
  const B = bldOf(r);
  const p = [B ? B.name : (r.building || "นอกอาคาร")];
  if (r.room) p.push("ห้อง " + r.room);
  return p.join(" · ");
}
function bldStats(B){
  const R = S.reports.filter(r => bldOf(r) === B);
  const act = R.filter(isActive);
  const sos = act.filter(r => r.type === "sos").length;
  const other = act.filter(r => r.type !== "sos" && r.type !== "point").length;
  const point = act.filter(r => r.type === "point").length;
  const sev = sos ? 3 : other ? 2 : point ? 1 : 0;
  const water = Math.max(0, ...act.filter(r=>r.type==="flood" && r.water != null).map(r=>r.water));
  const victims = R.filter(r => r.type !== "point");
  const pplWait = victims.filter(isActive).reduce((a,r)=>a+(r.people||0),0);
  const pplDone = victims.filter(r => !isActive(r)).reduce((a,r)=>a+(r.people||0),0);
  return {R, act, sos, other, point, sev, water, pplWait, pplDone, ppl:pplWait+pplDone};
}

/* ---------- clock & view ---------- */
function tick(){ $("#clock").textContent = new Date().toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"}) + " น."; }
tick(); setInterval(tick, 20000);
function setView(v){
  $("#app").dataset.view = v;
  document.querySelectorAll(".seg [data-view]").forEach(b => b.setAttribute("aria-pressed", b.dataset.view === v));
  if (v === "map" && MAP) setTimeout(()=>MAP.invalidateSize(), 30);
}
document.querySelectorAll(".seg [data-view]").forEach(b => b.addEventListener("click", () => setView(b.dataset.view)));
$("#newsBtn").addEventListener("click", openNews);
$("#brand").addEventListener("click", () => { S.bldF = null; renderList(); renderMapMarks(); fitAll(); setView("map"); });

/* ============ MAP ============ */
const DEFAULT_CENTER = [13.7712, 100.6500];
let MAP = null, fLayer = null, bLayer = null, rLayer = null, meLayer = null, SATL = null, STRL = null;
function initMap(){
  if (!window.L){ $("#map").replaceChildren(h("div",{class:"empty",style:"margin:90px 16px"},"โหลดแผนที่ไม่สำเร็จ ลองรีเฟรชหน้า รายการเหตุการณ์ยังใช้งานได้ตามปกติ")); return; }
  MAP = L.map("map", {zoomControl:true, maxZoom:20}).setView(DEFAULT_CENTER, 17);
  SATL = L.layerGroup([
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {maxZoom:20, maxNativeZoom:19, attribution:"ภาพดาวเทียม © Esri, Maxar, Earthstar Geographics"}),
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}", {maxZoom:20, maxNativeZoom:19, opacity:.8}),
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {maxZoom:20, maxNativeZoom:19})
  ]);
  STRL = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom:20, maxNativeZoom:19, attribution:"© ผู้ร่วมพัฒนา OpenStreetMap"});
  setBase(S.baseMode);
  fLayer = L.layerGroup().addTo(MAP);
  bLayer = L.layerGroup().addTo(MAP);
  rLayer = L.layerGroup().addTo(MAP);
  meLayer = L.layerGroup().addTo(MAP);
  MAP.on("zoomend", () => $("#map").classList.toggle("z-lo", MAP.getZoom() < 17));
  MAP.on("click", e => {
    if (!S.placing) return;
    const cb = S.placing; endPlacing(); cb(e.latlng.lat, e.latlng.lng);
  });
}
function setBase(mode){
  S.baseMode = mode;
  if (!MAP) return;
  if (mode === "sat"){ MAP.removeLayer(STRL); SATL.addTo(MAP); } else { MAP.removeLayer(SATL); STRL.addTo(MAP); }
  document.querySelectorAll("#baseSeg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.base === mode));
}
document.querySelectorAll("#baseSeg button").forEach(b => b.addEventListener("click", () => setBase(b.dataset.base)));
function fitAll(){
  if (!MAP) return;
  const pts = S.blds.filter(hasLL).map(b => [b.lat, b.lng]);
  if (pts.length) MAP.fitBounds(L.latLngBounds(pts).pad(0.08), {maxZoom:18});
}
function focusOn(lat, lng, z){ if (MAP && typeof lat === "number"){ setView("map"); MAP.flyTo([lat,lng], z || 18, {duration:.6}); } }
function startPlacing(text, cb, onCancel){
  S.placing = cb; S.placingCancel = onCancel || null;
  $("#placingText").textContent = text; $("#placing").hidden = false; $("#mapbox").classList.add("pick");
  $("#dlg").close(); setView("map");
}
function endPlacing(){ S.placing = null; $("#placing").hidden = true; $("#mapbox").classList.remove("pick"); }
$("#placingCancel").addEventListener("click", () => { const cb = S.placingCancel; endPlacing(); if (cb) cb(); });

function getGPS(){
  return new Promise((res, rej) => {
    if (!navigator.geolocation) return rej(new Error("อุปกรณ์นี้ไม่รองรับ GPS"));
    navigator.geolocation.getCurrentPosition(p => res(p.coords), e => rej(new Error(e.code === 1 ? "ยังไม่ได้อนุญาตให้เว็บใช้ตำแหน่ง เปิดสิทธิ์ตำแหน่งในเบราว์เซอร์แล้วลองใหม่" : "หาตำแหน่งไม่ได้ ลองอีกครั้งหรือปักหมุดเอง")), {enableHighAccuracy:true, timeout:15000, maximumAge:30000});
  });
}
$("#gpsBtn").addEventListener("click", async () => {
  try { const c = await getGPS(); meLayer.clearLayers();
    L.marker([c.latitude, c.longitude], {icon:L.divIcon({className:"", html:h("div",{class:"me-dot"}), iconSize:[16,16], iconAnchor:[8,8]}), interactive:false}).addTo(meLayer);
    focusOn(c.latitude, c.longitude, 18);
  } catch(e){ toast(e.message); }
});

function renderMapMarks(){
  if (!MAP) return;
  bLayer.clearLayers(); rLayer.clearLayers(); fLayer.clearLayers();
  S.reports.filter(r => r.type === "flood" && isActive(r) && r.water != null).forEach(r => {
    const B = bldOf(r);
    const ll = hasLL(r) ? [r.lat, r.lng] : (hasLL(B) ? [B.lat, B.lng] : null);
    if (!ll) return;
    const lvl = depthLvl(r.water), at = r.observedAt || r.createdAt, old = Date.now() - at > STALE_MS;
    const c = L.circle(ll, {radius:28, className:"fz d"+lvl+(old?" old":""), weight:2, fillOpacity:.42, color:"#999", fillColor:"#999"});
    c.on("click", () => { if (!S.placing) openDetail(r.id); });
    c.addTo(fLayer);
    const el = h("span",{class:"fzl d"+lvl+(old?" old":""),title:"ระดับน้ำ "+r.water+" ซม."}, r.water+" ซม. · "+tShort(at));
    const m = L.marker(ll, {icon:L.divIcon({className:"", html:el, iconSize:[0,0], iconAnchor:[0,0]}), zIndexOffset:400, title:"ระดับน้ำ "+r.water+" ซม."});
    m.on("click", () => { if (!S.placing) openDetail(r.id); });
    m.addTo(fLayer);
  });
  S.blds.forEach(B => {
    if (!hasLL(B)) return;
    const st = bldStats(B);
    const cnt = st.act.length;
    const el = h("div",{class:"bpin s"+st.sev+(S.bldF===B.id?" focus":""),title:B.name},
      h("span",{class:"dot"}, shortName(B.name)),
      cnt ? h("span",{class:"cnt"}, cnt) : null,
      h("span",{class:"nm"}, B.name, st.pplWait ? h("em",null," · รอช่วย "+st.pplWait+" คน") : null));
    const m = L.marker([B.lat,B.lng], {icon:L.divIcon({className:"", html:el, iconSize:[40,40], iconAnchor:[20,15]}), title:B.name, zIndexOffset: st.sev*100});
    m.on("click", () => { if (!S.placing) openBuilding(B.id); });
    m.addTo(bLayer);
  });
  S.reports.filter(r => hasLL(r) && isActive(r) && !(r.type === "flood" && r.water != null)).forEach(r => {
    const T = TYPES[r.type] || TYPES.sos;
    const el = h("div",{class:"rpin c-"+(r.status==="inprogress"?"util":T.c),title:T.label,html:ICONS[T.c]});
    const m = L.marker([r.lat,r.lng], {icon:L.divIcon({className:"", html:el, iconSize:[26,26], iconAnchor:[13,13]}), title:T.label, zIndexOffset:500});
    m.on("click", () => { if (!S.placing) openDetail(r.id); });
    m.addTo(rLayer);
  });
}

/* ============ SUMMARY + LIST ============ */
function stats(){
  const R = S.reports;
  const w = t => R.filter(r => r.type === t && isActive(r));
  const vict = R.filter(r => r.type !== "point");
  return { sos:w("sos"), flood:w("flood"), closed:w("closed"), util:w("util"),
    point:R.filter(r => r.type === "point" && r.status === "open"),
    prog:R.filter(r => r.status === "inprogress"),
    done:R.filter(r => r.type !== "point" && !isActive(r)),
    pplWait:vict.filter(isActive).reduce((a,r)=>a+(r.people||0),0),
    ppl:vict.reduce((a,r)=>a+(r.people||0),0) };
}
function renderSummary(){
  const s = stats();
  const pick = f => { S.filter = f; renderList(); setView("list"); };
  $("#sumbar").replaceChildren(
    h("button",{class:"sos",type:"button",onclick:()=>pick("sos")}, h("b",{class:"num"},s.sos.length), h("span",null,"รอความช่วยเหลือ")),
    h("button",{class:"ppl",type:"button",onclick:openCenter}, h("b",{class:"num"},s.ppl), h("span",null,"ผู้ประสบภัย (คน)"+(s.pplWait?` · รอช่วย ${s.pplWait}`:""))),
    h("button",{class:"flood",type:"button",onclick:()=>pick("prog")}, h("b",{class:"num",style:"color:var(--util)"},s.prog.length), h("span",null,"กำลังช่วยเหลือ")),
    h("button",{class:"flood",type:"button",onclick:()=>pick("flood")}, h("b",{class:"num"},s.flood.length), h("span",null,"รายงานน้ำท่วม")),
    h("button",{class:"closed",type:"button",onclick:()=>pick("closed")}, h("b",{class:"num"},s.closed.length), h("span",null,"เส้นทางถูกปิด")),
    h("button",{class:"point",type:"button",onclick:()=>pick("point")}, h("b",{class:"num"},s.point.length), h("span",null,"จุดช่วยเหลือ")),
    h("button",{class:"done",type:"button",onclick:()=>pick("done")}, h("b",{class:"num"},s.done.length), h("span",null,"ช่วยเหลือสำเร็จ")));
}
const FILTERS = [["active","ยังไม่สำเร็จ",r=>isActive(r)],["prog","กำลังช่วยเหลือ",r=>r.status==="inprogress"],["all","ทั้งหมด",()=>true],["sos","ขอความช่วยเหลือ",r=>r.type==="sos"],["flood","น้ำท่วม",r=>r.type==="flood"],
  ["closed","เส้นทางปิด",r=>r.type==="closed"],["util","ไฟดับ/น้ำประปา",r=>r.type==="util"],["point","จุดช่วยเหลือ",r=>r.type==="point"],["done","สำเร็จแล้ว",r=>!isActive(r)]];
function renderList(){
  let base = S.reports;
  const BF = S.bldF && regByCode(S.bldF);
  if (BF) base = base.filter(r => bldOf(r) === BF);
  $("#filters").replaceChildren(...FILTERS.map(([k,l,fn]) => h("button",{class:"chip",type:"button","aria-pressed":S.filter===k,onclick:()=>{S.filter=k;renderList();}}, l+" ", h("span",{class:"num"},base.filter(fn).length))));
  $("#bldFilter").replaceChildren(...(BF ? [h("div",{class:"row"}, h("button",{class:"chip","aria-pressed":"true",type:"button",onclick:()=>{S.bldF=null;renderList();renderMapMarks();}}, BF.name+"  ✕"),
    h("button",{class:"chip",type:"button",onclick:()=>openBuilding(BF.id)},"ข้อมูลอาคาร"))] : []));
  const fn = (FILTERS.find(f=>f[0]===S.filter)||FILTERS[0])[2];
  const rank = r => r.type==="sos" && r.status==="waiting" ? 0 : isActive(r) ? 1 : 2;
  const R = base.filter(fn).sort((a,b)=> rank(a)-rank(b) || (b.createdAt||0)-(a.createdAt||0));
  $("#listCount").textContent = R.length + " รายการ";
  const act = S.reports.filter(isActive).length;
  $("#segCount").textContent = act ? "("+act+")" : "";
  if (!R.length){
    $("#list").replaceChildren(h("div",{class:"empty"}, !S.loaded ? "กำลังโหลดข้อมูล…" : S.reports.length ? "ไม่มีรายการในตัวกรองนี้" : "ยังไม่มีการแจ้งเหตุ ถ้าน้ำเข้าห้อง ไฟดับ หรือต้องการของจำเป็น กดปุ่มด้านล่างเพื่อแจ้งได้เลย",
      S.loaded && !S.reports.length ? h("button",{class:"btn sos",type:"button",onclick:()=>openReport({type:"sos"})},"ขอความช่วยเหลือ") : null));
    return;
  }
  $("#list").replaceChildren(...R.map(itemRow));
}
function itemRow(r){
  const T = TYPES[r.type] || TYPES.sos;
  return h("button",{class:"item",type:"button",onclick:()=>openDetail(r.id)},
    h("span",{class:"ic t-"+T.c,html:ICONS[T.c]}),
    h("span",{style:"min-width:0;display:grid"},
      h("span",{class:"where"}, whereText(r)),
      h("span",{class:"det"}, r.detail),
      h("span",{class:"note num"}, [T.label, r.type==="point" && r.service ? SERVICES[r.service] : null, r.water != null && r.type==="flood" ? "น้ำ "+r.water+" ซม. เมื่อ "+tShort(r.observedAt||r.createdAt) : null, r.people ? r.people+" คน" : null, r.photos && r.photos.length ? "รูป "+r.photos.length : null, r.phone ? "โทร "+r.phone : null].filter(Boolean).join(" · "))),
    h("span",{class:"side2"}, h("span",{class:"pill "+statusClass(r)},statusLabel(r)), h("span",null,when(r.updatedAt||r.createdAt))));
}

/* ============ ACTION BAR ============ */
$("#actions").replaceChildren(
  h("button",{class:"act sos",type:"button",onclick:()=>openReport({type:"sos"})}, h("span",{html:ICONS.sos}), "ขอความช่วยเหลือ"),
  h("button",{class:"act",type:"button",onclick:()=>openReport({type:"flood"})}, h("span",{html:ICONS.flood,style:"color:var(--flood)"}), "รายงานระดับน้ำ"),
  h("button",{class:"act",type:"button",onclick:()=>openReport({type:"closed"})}, h("span",{html:ICONS.closed,style:"color:var(--closed)"}), "เส้นทางถูกปิด"),
  h("button",{class:"act",type:"button",onclick:()=>openReport({type:"point"})}, h("span",{html:ICONS.point,style:"color:var(--point)"}), "จุดช่วยเหลือ"),
  h("button",{class:"act",type:"button",onclick:openCenter}, h("span",{html:ICONS.ppl}), "ผู้ประสบภัยรายอาคาร"),
  h("button",{class:"act",type:"button",onclick:openHotlines}, h("span",{html:ICONS.phone,style:"color:var(--sos)"}), "เบอร์ฉุกเฉิน"),
  h("button",{class:"act",type:"button",onclick:openHub}, h("span",{html:ICONS.menu}), "เมนูเชื่อมโยง"));

/* ============ DIALOG ============ */
function sheet(title, eyebrow, ...content){
  $("#dlgBody").replaceChildren(
    h("div",{class:"dhead"}, h("div",null, eyebrow ? h("div",{class:"eyebrow"},eyebrow) : null, h("h2",null,title)),
      h("button",{class:"x",type:"button","aria-label":"ปิด",onclick:()=>$("#dlg").close()},"×")),
    ...content.flat().filter(Boolean));
  const d = $("#dlg"); if (!d.open) d.showModal(); d.scrollTop = 0;
}

/* ---------- building ---------- */
function openBuilding(id){
  const B = regByCode(id); if (!B) return;
  S.bldF = id; renderList(); renderMapMarks();
  if (hasLL(B)) focusOn(B.lat, B.lng, 18);
  const st = bldStats(B);
  const contacts = (B.contacts||[]).map(line => { const ph = (/[0-9][0-9\- ]{7,}/.exec(line)||[])[0];
    return h("div",{class:"coord"}, h("span",{style:"overflow-wrap:anywhere;flex:1"},line),
      ph ? h("a",{class:"chip",href:"tel:"+ph.replace(/[^0-9]/g,""),style:"text-decoration:none;color:inherit"},"โทร") : null,
      ph ? h("button",{class:"chip",type:"button",onclick:()=>copy(ph.trim(),"คัดลอกเบอร์แล้ว")},"คัดลอก") : null); });
  const acts = st.act.slice().sort((a,b)=>(a.type==="sos"?0:1)-(b.type==="sos"?0:1) || (b.createdAt||0)-(a.createdAt||0));
  const bNews = S.news.filter(n => n.bid === B.id).slice(0,3);
  sheet(B.name, "แฟลตคลองจั่น",
    h("div",{class:"row"},
      h("span",{class:"pill "+(st.sev===3?"t-sos":st.sev===2?"t-flood":st.sev===1?"t-point":"t-done")}, st.sev===3?"มีคนรอความช่วยเหลือ":st.sev===2?"มีเหตุค้าง":st.sev===1?"มีจุดช่วยเหลือ":"ไม่มีเหตุค้าง"),
      st.water ? h("span",{class:"pill t-flood num"},"น้ำสูงสุด ~"+st.water+" ซม.") : null),
    h("div",{class:"row"},
      h("button",{class:"btn sos",type:"button",onclick:()=>openReport({type:"sos",bid:B.id})},"แจ้งเหตุตึกนี้"),
      h("a",{class:"btn ghost",href:gmaps(B),target:"_blank",rel:"noopener"},"นำทาง Google Maps ↗"),
      h("button",{class:"btn ghost",type:"button",onclick:()=>copy(SITE+"/#b-"+B.id,"คัดลอกลิงก์ตึกแล้ว ส่งในกลุ่ม LINE ได้เลย")},"คัดลอกลิงก์ตึก")),
    h("div",{class:"sec"},
      h("div",{class:"row",style:"justify-content:space-between"}, h("h3",null,"เบอร์ติดต่อประจำตึก"),
        S.staff ? h("button",{class:"chip",type:"button",onclick:()=>openAdmin(B.id)},"แก้ไข") : null),
      contacts.length ? h("div",{style:"display:grid;gap:6px"}, contacts) : h("p",{class:"note",style:"margin:0"},"ยังไม่มีเบอร์ติดต่อประจำตึก")),
    h("div",{class:"sec"},
      h("h3",null,"ผู้ประสบภัยในอาคาร (ตามที่แจ้งเข้ามา)"),
      h("div",{class:"vgrid"},
        h("div",{class:"vcell main"}, h("b",{class:"num"},st.pplWait), h("span",null,"รอความช่วยเหลือ (คน)")),
        h("div",{class:"vcell"}, h("b",{class:"num"},st.pplDone), h("span",null,"ช่วยเหลือแล้ว (คน)")),
        h("div",{class:"vcell"}, h("b",{class:"num"},st.ppl), h("span",null,"รวมทั้งหมด (คน)")))),
    h("div",{class:"sec"}, h("h3",null,"เหตุการณ์ที่ยังไม่สำเร็จ ("+acts.length+")"),
      acts.length ? h("div",{style:"display:grid;gap:6px"}, acts.map(itemRow)) : h("p",{class:"note",style:"margin:0"},"ไม่มีเหตุค้างในอาคารนี้")),
    bNews.length ? h("div",{class:"sec"}, h("h3",null,"ประกาศของตึก"), h("div",{class:"news"}, bNews.map(newsItem))) : null);
}

/* ---------- report form ---------- */
function openReport(pre){
  const B0 = pre && pre.bid ? regByCode(pre.bid) : (S.bldF ? regByCode(S.bldF) : null);
  if (!S.rd || (pre && !pre.keep)) S.rd = {type:(pre&&pre.type)||"sos", bid:B0?B0.id:"", other:"", room:"", detail:"", people:"", phone:"", water:"", obs:toLocalInput(Date.now()), service:"food", pstatus:"open", link:"", lat:null, lng:null, files:[]};
  const d = S.rd, isF = d.type === "flood";
  const bind = (el, key) => { el.value = d[key] == null ? "" : d[key]; el.addEventListener("input", () => d[key] = el.value); el.addEventListener("change", () => d[key] = el.value); return el; };
  const typeCards = h("div",{class:"types"}, Object.entries(TYPES).map(([k,T]) => h("label",{class:"type"},
    h("input",{type:"radio",name:"rType",value:k,checked:d.type===k,onchange:()=>{ d.type=k; openReport({keep:true}); }}),
    h("span",{class:"ic t-"+T.c,html:ICONS[T.c]}), h("b",null,T.label))));
  const bsel = bind(h("select",{id:"rBld"}, h("option",{value:""}, isF ? "— ไม่ระบุ —" : "— เลือกอาคาร —"), sortedBlds().map(B => h("option",{value:B.id},B.name)), h("option",{value:"_other"},"อื่น ๆ / นอกอาคาร")),"bid");
  const other = bind(h("input",{type:"text",id:"rOther",placeholder:"เช่น ถนนหน้าตลาดเช้า, ลานจอดรถ"}),"other");
  const otherWrap = h("label",{class:"f",hidden:d.bid!=="_other"},"ระบุตำแหน่ง",other);
  bsel.addEventListener("change", () => { otherWrap.hidden = bsel.value !== "_other"; });
  const room = bind(h("input",{type:"text",id:"rRoom",placeholder:"เช่น 5/305"}),"room");
  const detail = bind(h("textarea",{id:"rDetail",placeholder: d.type==="sos" ? "เช่น ผู้สูงอายุ 2 คน ติดอยู่ในห้อง ต้องการยาความดันและน้ำดื่ม" : isF ? "เช่น น้ำท่วมทั้งซอย ไหลเร็ว" : d.type==="closed" ? "เช่น ซอยเสรีไทย 7 หน้าโรงเรียน น้ำสูง รถเล็กผ่านไม่ได้" : d.type==="point" ? "เช่น แจกข้าวกล่อง 200 ชุด ลานหน้าอาคาร 14 เวลา 11.00 น." : "เช่น ไฟดับทั้งตึกตั้งแต่ 6 โมงเช้า"}),"detail");
  const people = bind(h("input",{type:"number",id:"rPeople",min:0,max:999,inputmode:"numeric",placeholder:"0"}),"people");
  const phone = bind(h("input",{type:"tel",id:"rPhone",inputmode:"tel",placeholder:"08x-xxx-xxxx",autocomplete:"tel"}),"phone");
  const water = bind(h("input",{type:"number",id:"rWater",min:0,max:400,inputmode:"numeric",placeholder:"เช่น 40"}),"water");
  const obs = bind(h("input",{type:"datetime-local",id:"rObs"}),"obs");
  const svc = bind(h("select",{id:"rService"}, Object.entries(SERVICES).map(([k,l]) => h("option",{value:k},l))),"service");
  const pst = bind(h("select",{id:"rPst"}, Object.entries(POINT_STATUS).filter(([k])=>k!=="closed").map(([k,l]) => h("option",{value:k},l))),"pstatus");
  const link = bind(h("input",{type:"url",id:"rLink",placeholder:"https://"}),"link");
  const msg = h("span",{class:"note"});
  const submit = h("button",{class:"btn sos",type:"submit"}, d.type==="sos" ? "ส่งคำขอความช่วยเหลือ" : "ส่งข้อมูลทันที");
  const pinned = d.lat != null;
  const pinBox = h("div",{class:"locbox"},
    pinned ? h("span",null,"ปักหมุดแล้ว") : h("span",{class:isF?"":"note"}, isF ? h("span",null,"ตำแหน่งถนน/จุดที่วัดระดับน้ำ ",h("span",{class:"req"},"*")) : d.type==="closed"||d.type==="point" ? "แนะนำให้ปักหมุดจุดที่เกิดเหตุ" : "ถ้าเหตุไม่ได้อยู่ที่ตัวตึก ปักหมุดเพิ่มได้"),
    h("button",{class:"chip",type:"button",onclick:async e=>{ const b = e.currentTarget; b.textContent = "กำลังหาตำแหน่ง…"; try { const c = await getGPS(); d.lat = c.latitude; d.lng = c.longitude; openReport({keep:true}); } catch(err){ b.textContent = "ใช้ GPS ตำแหน่งนี้"; toast(err.message); } }},"ใช้ GPS ตำแหน่งนี้"),
    h("button",{class:"chip",type:"button",onclick:()=>startPlacing("แตะตำแหน่งที่เกิดเหตุบนแผนที่", (lat,lng)=>{ d.lat=lat; d.lng=lng; openReport({keep:true}); }, () => openReport({keep:true}))}, pinned ? "ย้ายหมุด" : "ปักหมุดบนแผนที่"),
    pinned ? h("button",{class:"chip",type:"button",onclick:()=>{ d.lat=null; d.lng=null; openReport({keep:true}); }},"ลบหมุด") : null);
  const form = h("form",{novalidate:true,onsubmit:e=>{ e.preventDefault(); submitReport(msg, submit); }},
    typeCards,
    isF ? h("div",{style:"display:grid;gap:8px"},
      h("span",{style:"font-weight:600;font-size:14px"},"ระดับน้ำ ",h("span",{class:"req"},"*")),
      h("div",{class:"gauge"}, GAUGE.map(([cm,l]) => h("button",{type:"button",onclick:()=>{water.value=cm; d.water=String(cm);}}, l, h("span",null,"~"+cm+" ซม.")))),
      h("div",{class:"grid2"}, h("label",{class:"f"},"ความสูงน้ำ (ซม.)",water), h("label",{class:"f"}, h("span",null,"เวลาที่พบระดับนี้ ",h("span",{class:"req"},"*")), obs))) : null,
    isF ? pinBox : null,
    h("div",{class:"grid2"}, h("label",{class:"f"}, h("span",null, isF ? "อาคารใกล้เคียง" : "ชื่ออาคาร ", isF ? null : h("span",{class:"req"},"*")), bsel), isF ? null : h("label",{class:"f"},"เลขห้อง",room)),
    otherWrap,
    d.type==="point" ? h("div",{class:"grid2"}, h("label",{class:"f"},"ประเภทบริการ",svc), h("label",{class:"f"},"สถานะ",pst)) : null,
    h("label",{class:"f"}, h("span",null,"รายละเอียด ", isF ? "(ถ้ามี)" : h("span",{class:"req"},"*")), detail),
    h("div",{class:"grid2"}, isF ? null : h("label",{class:"f"},"จำนวนคน",people), h("label",{class:"f"},"เบอร์ติดต่อกลับ (กู้ภัยและทีมช่วยเหลือเห็น)",phone)),
    isF ? null : pinBox,
    h("div",{style:"display:grid;gap:4px"}, h("span",{style:"font-size:13px;color:var(--ink-2);font-weight:500"},"รูปถ่ายเหตุการณ์"), photoPicker(d.files, null, 4)),
    h("label",{class:"f"},"หรือแนบลิงก์วิดีโอ (YouTube, Facebook, Google Drive)",link),
    h("div",{class:"row"}, submit, msg),
    h("p",{class:"note",style:"margin:0"},"ข้อมูลและเบอร์โทรจะแสดงให้ทุกคนเห็น เพื่อให้กู้ภัยติดต่อกลับได้ ถ้าอันตรายถึงชีวิต โทร 1784 หรือ 1669 ทันที"));
  sheet("แจ้งเหตุ / ขอความช่วยเหลือ", "Khlong Chan Emergency Report", form);
}
async function submitReport(msg, btn){
  const d = S.rd, isF = d.type === "flood";
  let obsAt = null;
  if (isF){
    if (toNum(d.water) == null){ msg.textContent = "ใส่ระดับน้ำ (ซม.) หรือกดปุ่มระดับน้ำ"; return; }
    obsAt = new Date(d.obs).getTime();
    if (!isFinite(obsAt)){ msg.textContent = "ใส่เวลาที่พบระดับน้ำ"; return; }
    if (obsAt > Date.now() + 5*60000){ msg.textContent = "เวลาที่พบต้องไม่เกินเวลาปัจจุบัน"; return; }
    if (d.lat == null){ msg.textContent = "ปักหมุดหรือใช้ GPS บอกตำแหน่งที่น้ำท่วม"; return; }
  } else {
    if (!d.bid){ msg.textContent = "เลือกอาคารก่อน"; $("#rBld").focus(); return; }
    if (d.bid === "_other" && !clean(d.other) && d.lat == null){ msg.textContent = "ระบุตำแหน่ง หรือปักหมุดบนแผนที่"; return; }
    if (!clean(d.detail)){ msg.textContent = "เขียนรายละเอียดสั้น ๆ ว่าเกิดอะไรขึ้น"; $("#rDetail").focus(); return; }
  }
  if (!SB){ msg.textContent = "ยังเชื่อมต่อระบบข้อมูลไม่ได้ โทร 1784 หรือ 1669"; return; }
  const B = d.bid && d.bid !== "_other" ? regByCode(d.bid) : null;
  const p = { type:d.type, building_id:B?B.id:null, building:B?B.name:clean(d.other,80)||(isF?"ถนน / พื้นที่ส่วนกลาง":"นอกอาคาร"),
    room:isF?"":clean(d.room,30), detail:clean(d.detail,1500)||(isF?"รายงานระดับน้ำ "+toNum(d.water)+" ซม.":""),
    people:toNum(d.people), phone:clean(d.phone,30), link:clean(d.link,400), lat:d.lat, lng:d.lng };
  if (isF){ p.water = toNum(d.water); p.observed_at = new Date(obsAt).toISOString(); }
  if (d.type === "point"){ p.service = d.service || "other"; p.status = d.pstatus || "open"; }
  btn.disabled = true; msg.textContent = "กำลังส่ง…";
  try {
    if (d.files.length){
      try { p.photos = await uploadPhotos(d.files, (i,n) => msg.textContent = `กำลังอัปโหลดรูป ${i}/${n}…`); }
      catch(e){ btn.disabled = false; msg.textContent = "อัปโหลดรูปไม่สำเร็จ: " + errMsg(e) + " ลองลดจำนวนรูป หรือส่งโดยไม่มีรูปก่อน"; return; }
      msg.textContent = "กำลังส่ง…";
    }
    const res = await rpc("create_report", {p});
    saveKey(res.id, "owner", res.key);
    S.rd = null; $("#dlg").close();
    toast(d.type === "sos" ? "ส่งคำขอแล้ว ทีมช่วยเหลือเห็นทันที" : "ส่งข้อมูลแล้ว");
    await loadTable("reports"); renderAll();
    if (d.lat != null) focusOn(d.lat, d.lng, 18); else if (hasLL(B)) focusOn(B.lat, B.lng, 18);
  } catch(e){ btn.disabled = false; msg.textContent = errMsg(e); }
}

/* ---------- incident detail ---------- */
function openDetail(id){
  const r = S.reports.find(x => x.id === id); if (!r) return;
  const T = TYPES[r.type] || TYPES.sos;
  const B = bldOf(r);
  if (hasLL(r)) focusOn(r.lat, r.lng, 18); else if (hasLL(B)) focusOn(B.lat, B.lng, 18);
  const helpers = r.helpers || [];
  const mine = isMine(r.id), isHelper = isHelperOf(r.id);
  const canFinish = mine || isHelper || S.staff;
  const writable = !!SB;
  const shareText = `[${T.label}] ${whereText(r)}\n${r.detail}` + (r.people ? `\nจำนวน ${r.people} คน` : "") + (r.phone ? `\nโทร ${r.phone}` : "") + `\nสถานะ: ${statusLabel(r)} · ${full(r.createdAt)}` + `\n${SITE}/` + (B ? `#b-${B.id}` : "");
  const act = async (fn, ok) => { try { await fn(); toast(ok); await loadTable("reports"); renderAll(); openDetail(r.id); } catch(e){ toast(errMsg(e)); } };

  const hName = h("input",{type:"text",id:"hName",placeholder:"ชื่อ / ทีม เช่น กู้ภัยบางกะปิ, อาสาตึก 14"});
  const hPhone = h("input",{type:"tel",id:"hPhone",inputmode:"tel",placeholder:"เบอร์ผู้ช่วยเหลือ"});
  const takeBox = writable && isActive(r) && r.type !== "point" && r.type !== "flood" && !isHelper ? h("div",{class:"sec"},
    h("h3",null, helpers.length ? "ร่วมช่วยเหลือเคสนี้" : "รับเรื่อง / ไปช่วยเหลือ"),
    h("div",{class:"grid2"}, h("label",{class:"f"},"ผู้ช่วยเหลือ",hName), h("label",{class:"f"},"เบอร์ติดต่อ",hPhone)),
    h("div",null, h("button",{class:"btn",type:"button",onclick:()=>{
      const nm = clean(hName.value,80); if (!nm){ toast("ใส่ชื่อผู้ช่วยเหลือหรือทีม"); hName.focus(); return; }
      act(async () => { const key = await rpc("take_case", {p_id:r.id, p_name:nm, p_phone:clean(hPhone.value,30)}); saveKey(r.id, "helper", key); }, "รับเรื่องแล้ว");
    }},"รับเรื่อง กำลังไปช่วย"))) : null;

  const doneLabel = r.type === "sos" ? "ช่วยเหลือสำเร็จ" : r.type === "flood" ? "น้ำลดแล้ว" : "คลี่คลายแล้ว";
  const finishBox = writable && isActive(r) && r.type !== "point" ? (canFinish ?
    h("div",{class:"sec"}, h("h3",null,"ปิดเคส"),
      h("p",{class:"note",style:"margin:0"}, "กดเมื่อ"+(r.type==="sos"?"ช่วยเหลือเสร็จจริง":r.type==="flood"?"น้ำลดแล้ว":"เหตุคลี่คลายแล้ว")+" รายการจะหายจากแผนที่และย้ายไปที่ \"สำเร็จแล้ว\""),
      h("div",null, h("button",{class:"btn",type:"button",style:"background:var(--point);color:#fff",onclick:()=>act(() => rpc("finish_case", {p_id:r.id, p_key:keyOf(r.id)}), doneLabel)}, "✓ "+doneLabel))) :
    h("p",{class:"note",style:"margin:0"},"ปุ่ม \""+doneLabel+"\" กดได้เฉพาะผู้แจ้ง หรือผู้ที่กดรับเรื่อง จากมือถือเครื่องที่ใช้แจ้งหรือรับเรื่อง")) : null;

  let pointBox = null;
  if (r.type === "point" && writable && (mine || S.staff)){
    const sel = h("select",{id:"pStatus"}, Object.entries(POINT_STATUS).map(([k,l]) => h("option",{value:k,selected:r.status===k},l)));
    pointBox = h("div",{class:"sec"}, h("h3",null,"สถานะจุดช่วยเหลือ"), h("div",{class:"row"}, sel, h("button",{class:"btn",type:"button",onclick:()=>act(() => rpc("set_point_status", {p_id:r.id, p_key:keyOf(r.id), p_status:sel.value}), "อัปเดตแล้ว")},"บันทึก")));
  }

  let levelBox = null;
  if (r.type === "flood" && writable && isActive(r)){
    const cm = h("input",{type:"number",id:"lvCm",min:0,max:400,inputmode:"numeric",placeholder:"ซม."});
    const at = h("input",{type:"datetime-local",id:"lvAt"}); at.value = toLocalInput(Date.now());
    levelBox = h("div",{class:"sec"}, h("h3",null,"อัปเดตระดับน้ำจุดนี้"),
      h("div",{class:"gauge"}, GAUGE.map(([v,l]) => h("button",{type:"button",onclick:()=>cm.value=v}, l, h("span",null,"~"+v+" ซม.")))),
      h("div",{class:"grid2"}, h("label",{class:"f"},"ความสูงน้ำ (ซม.)",cm), h("label",{class:"f"},"เวลาที่พบ",at)),
      h("div",null, h("button",{class:"btn",type:"button",onclick:()=>{
        const v = toNum(cm.value), t = new Date(at.value).getTime();
        if (v == null){ toast("ใส่ระดับน้ำ"); cm.focus(); return; }
        if (!isFinite(t) || t > Date.now()+5*60000){ toast("ใส่เวลาที่พบให้ถูกต้อง"); return; }
        act(() => rpc("add_reading", {p_id:r.id, p_cm:v, p_at:new Date(t).toISOString()}), "อัปเดตระดับน้ำแล้ว");
      }},"บันทึกระดับน้ำ")));
  }

  let photoBox = null;
  if (writable && isActive(r) && r.photos.length < 12){
    const files = [], pmsg = h("span",{class:"note"});
    const up = h("button",{class:"btn ghost",type:"button",disabled:true,onclick:async ()=>{
      up.disabled = true;
      try { const urls = await uploadPhotos(files, (i,n) => pmsg.textContent = `กำลังอัปโหลด ${i}/${n}…`);
        await rpc("add_photos", {p_id:r.id, p_urls:urls}); toast("เพิ่มรูปแล้ว"); await loadTable("reports"); renderAll(); openDetail(r.id); }
      catch(e){ up.disabled = false; pmsg.textContent = errMsg(e); }
    }},"อัปโหลดรูป");
    photoBox = h("div",{class:"sec"}, h("h3",null,"เพิ่มรูปล่าสุด"), photoPicker(files, () => { up.disabled = !files.length; }, Math.min(4, 12 - r.photos.length)), h("div",{class:"row"}, up, pmsg));
  }
  const note = h("input",{type:"text",id:"dNote",placeholder:"เช่น ยังรออยู่ ต้องการน้ำดื่มเพิ่ม"});
  const noteBox = writable ? h("div",{class:"sec"}, h("h3",null,"เพิ่มข้อความอัปเดต"),
    h("div",{class:"row"}, h("div",{style:"flex:1;min-width:200px"},note), h("button",{class:"btn ghost",type:"button",onclick:()=>{ const t = clean(note.value,300); if (t) act(() => rpc("add_update", {p_id:r.id, p_text:t}), "เพิ่มข้อความแล้ว"); }},"ส่ง"))) : null;

  let armed = false;
  const delBtn = writable && (S.staff || mine) ? h("button",{class:"btn danger",type:"button",onclick:async ()=>{
    if (!armed){ armed = true; delBtn.textContent = "กดอีกครั้งเพื่อยืนยันลบ"; setTimeout(()=>{armed=false;delBtn.textContent=mine?"ลบรายการที่ฉันแจ้ง":"ลบรายการนี้";},4000); return; }
    try { await rpc("delete_report", {p_id:r.id, p_key:keyOf(r.id)}); $("#dlg").close(); toast("ลบแล้ว"); await loadTable("reports"); renderAll(); } catch(e){ toast(errMsg(e)); }
  }}, mine ? "ลบรายการที่ฉันแจ้ง" : "ลบรายการนี้") : null;
  const telDigits = r.phone ? r.phone.replace(/[^0-9]/g,"") : "";

  sheet(whereText(r), T.label,
    h("div",{class:"row"}, h("span",{class:"pill "+statusClass(r)},statusLabel(r)), r.people ? h("span",{class:"pill t-done num"},r.people+" คน") : null, mine ? h("span",{class:"pill t-done"},"คุณเป็นผู้แจ้ง") : null, isHelper ? h("span",{class:"pill t-util"},"คุณรับเรื่องนี้") : null),
    h("p",{style:"margin:0;white-space:pre-wrap;overflow-wrap:anywhere"}, r.detail),
    r.photos.length ? h("div",{class:"thumbs big"}, r.photos.map((u,i) => h("a",{class:"thumb",href:u,target:"_blank",rel:"noopener"}, h("img",{src:u,alt:"รูปเหตุการณ์ "+(i+1),loading:"lazy"})))) : null,
    h("dl",{class:"kv"},
      r.phone ? [h("dt",null,"เบอร์ผู้แจ้ง"),h("dd",null, h("span",{class:"num",style:"font-family:var(--f-mono);font-weight:600;font-size:16px;user-select:all"},r.phone), " ",
        telDigits ? h("a",{class:"chip",href:"tel:"+telDigits,style:"text-decoration:none;color:inherit"},"โทร") : null, " ", h("button",{class:"chip",type:"button",onclick:()=>copy(r.phone,"คัดลอกเบอร์แล้ว")},"คัดลอก"))] : null,
      r.type==="flood" && r.water != null ? [h("dt",null,"ระดับน้ำ"),h("dd",null, h("span",{class:"pill fzl d"+depthLvl(r.water),style:"transform:none;cursor:default"}, r.water+" ซม."), " ", DEPTH[depthLvl(r.water)][1])] : null,
      r.type==="flood" ? [h("dt",null,"เวลาที่พบ"),h("dd",{class:"num",style:"font-weight:600"}, full(r.observedAt||r.createdAt), " (", when(r.observedAt||r.createdAt), ")")] : null,
      r.readings.length > 1 ? [h("dt",null,"ประวัติระดับน้ำ"),h("dd",{class:"num"}, r.readings.slice().reverse().slice(0,8).map(x => h("div",null, tShort(x.at)+" — "+x.cm+" ซม.")))] : null,
      r.type==="point" && r.service ? [h("dt",null,"บริการ"),h("dd",null,SERVICES[r.service]||r.service)] : null,
      helpers.length ? [h("dt",null,"ผู้ช่วยเหลือ"),h("dd",null, helpers.map(x => h("div",null, x.name, x.phone ? " · " : null, x.phone ? h("span",{class:"num",style:"user-select:all"},x.phone) : null)))] : null,
      r.link && /^https?:\/\//.test(r.link) ? [h("dt",null,"รูป/วิดีโอ"),h("dd",null,h("a",{href:r.link,target:"_blank",rel:"noopener"},"เปิดลิงก์ ↗"))] : null,
      h("dt",null,"แจ้งเมื่อ"), h("dd",{class:"num"},full(r.createdAt)),
      r.updatedAt && r.updatedAt !== r.createdAt ? [h("dt",null,"อัปเดต"),h("dd",{class:"num"},full(r.updatedAt))] : null),
    h("div",{class:"row"},
      B ? h("button",{class:"btn ghost",type:"button",onclick:()=>openBuilding(B.id)},"ดูทั้งตึก") : null,
      (hasLL(r) || hasLL(B)) ? h("a",{class:"btn ghost",href:gmaps(hasLL(r) ? r : B),target:"_blank",rel:"noopener"},"นำทาง ↗") : null,
      h("button",{class:"btn ghost",type:"button",onclick:()=>copy(shareText,"คัดลอกไปวางใน LINE ได้เลย")},"คัดลอกไปแชร์")),
    r.updates.length ? h("div",{class:"sec"}, h("h3",null,"บันทึกการช่วยเหลือ"),
      r.updates.slice().reverse().map(u => h("div",{class:"note"}, h("b",{class:"num"},when(u.t)+" · "), u.text))) : null,
    levelBox, takeBox, finishBox, pointBox, photoBox, noteBox,
    delBtn ? h("div",{class:"row"}, delBtn) : null);
}

/* ---------- center: victims per building ---------- */
function openCenter(){
  const s = stats();
  const rows = sortedBlds().map(B => ({B, st:bldStats(B)}));
  const outside = S.reports.filter(r => r.type !== "point" && !bldOf(r));
  const oWait = outside.filter(isActive).reduce((a,r)=>a+(r.people||0),0), oDone = outside.filter(r=>!isActive(r)).reduce((a,r)=>a+(r.people||0),0);
  const sum = k => rows.reduce((a,x)=>a+x.st[k],0);
  sheet("ผู้ประสบภัยรายอาคาร", "สรุปจากจำนวนคนที่ระบุในการแจ้งเหตุ",
    h("div",{class:"vgrid"},
      h("div",{class:"vcell main"}, h("b",{class:"num"},s.pplWait), h("span",null,"รอความช่วยเหลือ (คน)")),
      h("div",{class:"vcell"}, h("b",{class:"num"},s.ppl - s.pplWait), h("span",null,"ช่วยเหลือแล้ว (คน)")),
      h("div",{class:"vcell"}, h("b",{class:"num"},s.ppl), h("span",null,"ผู้ประสบภัยรวม (คน)")),
      h("div",{class:"vcell"}, h("b",{class:"num",style:"color:var(--sos)"},s.sos.length), h("span",null,"คำขอที่ยังไม่สำเร็จ")),
      h("div",{class:"vcell"}, h("b",{class:"num",style:"color:var(--util)"},s.prog.length), h("span",null,"กำลังช่วยเหลือ"))),
    rows.length ? h("div",{class:"tablewrap"}, h("table",null,
      h("thead",null,h("tr",null, h("th",null,"อาคาร"), h("th",{class:"n"},"รอช่วย (คน)"), h("th",{class:"n"},"ช่วยแล้ว (คน)"), h("th",{class:"n"},"รวม (คน)"), h("th",{class:"n"},"คำขอค้าง"), h("th",{class:"n"},"เหตุอื่นค้าง"), h("th",null,"ติดต่อตึก"))),
      h("tbody",null, rows.map(({B,st}) => h("tr",{class:"click",onclick:()=>openBuilding(B.id)},
        h("td",null,B.name), h("td",{class:"n",style:st.pplWait?"color:var(--sos);font-weight:700":null},st.pplWait), h("td",{class:"n"},st.pplDone), h("td",{class:"n"},st.ppl),
        h("td",{class:"n"},st.sos), h("td",{class:"n"},st.other), h("td",{class:"muted"}, (B.contacts||[])[0] || "–"))),
        outside.length ? h("tr",null, h("td",null,"นอกอาคาร"), h("td",{class:"n"},oWait), h("td",{class:"n"},oDone), h("td",{class:"n"},oWait+oDone), h("td",{class:"n"},"–"), h("td",{class:"n"},"–"), h("td",null,"")) : null,
        h("tr",{class:"tot"}, h("td",null,"รวม"), h("td",{class:"n"},s.pplWait), h("td",{class:"n"},s.ppl-s.pplWait), h("td",{class:"n"},s.ppl), h("td",{class:"n"},sum("sos")), h("td",{class:"n"},sum("other")), h("td",null,""))))) :
      h("div",{class:"empty"},"ยังไม่มีอาคารในระบบ"),
    h("div",{class:"row"}, h("button",{class:"btn ghost",type:"button",onclick:exportCSV},"ส่งออก CSV"), h("span",{class:"note"},"ตัวเลขมาจากช่อง \"จำนวนคน\" ที่ผู้แจ้งกรอก")));
}
function exportCSV(){
  const esc = v => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s; };
  const a = [["อาคาร","รอช่วย (คน)","ช่วยแล้ว (คน)","รวม (คน)","คำขอค้าง","เหตุอื่นค้าง","ติดต่อตึก"].join(",")];
  sortedBlds().forEach(B => { const st = bldStats(B); a.push([B.name,st.pplWait,st.pplDone,st.ppl,st.sos,st.other,(B.contacts||[]).join(" / ")].map(esc).join(",")); });
  a.push("", ["แจ้งเมื่อ","ประเภท","อาคาร","ห้อง","รายละเอียด","จำนวนคน","เบอร์ผู้แจ้ง","ระดับน้ำ(ซม.)","เวลาที่พบ","สถานะ","ผู้ช่วยเหลือ","ละติจูด","ลองจิจูด","อัปเดตล่าสุด"].join(","));
  S.reports.forEach(r => a.push([full(r.createdAt),(TYPES[r.type]||{}).label,(bldOf(r)||{}).name||r.building,r.room,r.detail,r.people,r.phone,r.water,r.observedAt?full(r.observedAt):"",statusLabel(r),(r.helpers||[]).map(x=>x.name).join(" / "),r.lat,r.lng,full(r.updatedAt)].map(esc).join(",")));
  const blob = new Blob(["﻿"+a.join("\n")], {type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const link = h("a",{href:url,download:"khlongchan-flood-"+new Date().toISOString().slice(0,10)+".csv"});
  document.body.append(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url), 5000);
}

/* ---------- hotlines, hub, news ---------- */
function openHotlines(){
  const withC = sortedBlds().filter(B => (B.contacts||[]).length);
  sheet("เบอร์โทรฉุกเฉิน 24 ชม.", "Emergency Hotlines",
    h("div",{class:"hot"}, HOTLINES.map(([n,t,d]) => h("div",{class:"hotc"},
      h("div",{class:"row",style:"justify-content:space-between"}, h("a",{class:"n",href:"tel:"+n,style:"text-decoration:none"},n), h("a",{class:"chip",href:"tel:"+n,style:"text-decoration:none;color:inherit"},"โทร")),
      h("b",null,t), h("span",{class:"note"},d)))),
    withC.length ? h("div",{class:"sec"}, h("h3",null,"เบอร์ติดต่อประจำตึก"),
      h("div",{class:"tablewrap"}, h("table",null, h("tbody",null, withC.map(B => h("tr",{class:"click",onclick:()=>openBuilding(B.id)}, h("td",null,B.name), h("td",{style:"white-space:normal"},(B.contacts||[]).join(" / "))))))) ) : null);
}
function openHub(){
  const go = fn => h("button",{class:"hubc",type:"button",onclick:fn});
  const items = [
    [go(()=>openReport({type:"sos"})), "ขอความช่วยเหลือฉุกเฉิน", "ติดน้ำ อาหาร/น้ำ ยา คนป่วย"],
    [go(()=>openReport({type:"flood"})), "รายงานระดับน้ำ", "ระดับน้ำบนถนนพร้อมเวลา"],
    [go(()=>openReport({type:"point"})), "จุดช่วยเหลือ / แจกของ", "แจกอาหาร กระสอบทราย เรือรับส่ง"],
    [go(openCenter), "ผู้ประสบภัยรายอาคาร", "ยอดรอช่วยเหลือและช่วยแล้ว"],
    [go(openNews), "ข่าวสารและประกาศ", "ประกาศทั้งแฟลตและรายตึก"],
    [go(()=>{ S.filter="done"; renderList(); setView("list"); $("#dlg").close(); }), "เคสที่สำเร็จแล้ว", "รายการที่คลี่คลายแล้ว"],
    S.staff ? [go(()=>openAdmin()), "จัดการอาคาร", "เพิ่มตึก ปักตำแหน่ง ใส่เบอร์ติดต่อ"] : [go(openLogin), "เข้าสู่ระบบเจ้าหน้าที่", "สำหรับผู้ดูแลระบบ"]
  ];
  sheet("ศูนย์รวมเมนูและจุดเชื่อมโยง", "Quick Navigation",
    h("div",{class:"sec",style:"border:0;padding:0"}, h("h3",null,"บริการในหน้านี้"),
      h("div",{class:"hub"}, items.map(([b,t,d]) => { b.append(h("b",null,t), h("span",null,d)); return b; }))),
    h("div",{class:"sec"}, h("h3",null,"ติดตามฝนและระดับน้ำ"),
      h("div",{class:"hub"}, LINKS.map(([u,t,d]) => h("a",{class:"hubc",href:u,target:"_blank",rel:"noopener"}, h("b",null,t+" ↗"), h("span",null,d))))));
}
function newsItem(n){
  const ok = n.url && /^https?:\/\//.test(n.url);
  const B = n.bid ? regByCode(n.bid) : null;
  let armed = false;
  const del = S.staff ? h("button",{class:"chip",type:"button",onclick:async e=>{ const b=e.currentTarget; if(!armed){armed=true;b.textContent="ยืนยันลบ";return;}
    const { error } = await SB.from("news").delete().eq("id", n.id); if (error) toast(errMsg(error)); else { await loadTable("news"); b.closest(".nws").remove(); } }},"ลบ") : null;
  return h("div",{class:"nws"}, ok ? h("a",{href:n.url,target:"_blank",rel:"noopener"},n.title+" ↗") : h("b",{style:"overflow-wrap:anywhere;white-space:pre-wrap"},n.title),
    h("div",{class:"row note"}, h("span",{class:"mini "+(B?"t-flood":"t-done")}, B ? B.name : "ทั้งแฟลต"), h("span",null,[n.source, when(n.createdAt)].filter(Boolean).join(" · ")), del));
}
function openNews(){
  const title = h("textarea",{id:"nTitle",style:"min-height:60px",placeholder:"เช่น การเคหะฯ แจกถุงยังชีพ ลานหน้าอาคาร 14 เวลา 14.00 น."});
  const url = h("input",{type:"url",id:"nUrl",placeholder:"https://"});
  const src = h("input",{type:"text",id:"nSrc",placeholder:"เช่น นิติบุคคล, สำนักงานเขตบางกะปิ"});
  const to = h("select",{id:"nBld"}, h("option",{value:""},"ทั้งแฟลต"), sortedBlds().map(B => h("option",{value:B.id,selected:S.bldF===B.id},B.name)));
  const msg = h("span",{class:"note"});
  const btn = h("button",{class:"btn",type:"submit"},"บันทึกและโพสต์");
  const form = h("form",{novalidate:true,onsubmit:async e=>{
    e.preventDefault();
    const t = clean(title.value,600); if (!t){ msg.textContent = "กรอกข้อความประกาศ"; return; }
    if (!SB){ msg.textContent = "ยังเชื่อมต่อระบบข้อมูลไม่ได้"; return; }
    btn.disabled = true;
    const { error } = await SB.from("news").insert({title:t, url:clean(url.value,400)||null, source:clean(src.value,80)||null, building_id:to.value||null});
    if (error){ btn.disabled = false; msg.textContent = errMsg(error); return; }
    toast("โพสต์แล้ว"); await loadTable("news"); openNews();
  }}, h("label",{class:"f"}, h("span",null,"หัวข้อ / ข้อความประกาศ ",h("span",{class:"req"},"*")), title),
    h("div",{class:"grid2"}, h("label",{class:"f"},"ลิงก์ Facebook หรือเว็บข่าว",url), h("label",{class:"f"},"แหล่งที่มา",src), h("label",{class:"f"},"ประกาศถึง",to)),
    h("div",{class:"row"}, btn, msg));
  sheet("ข่าวสารและประกาศเตือนภัย", "News & Updates",
    S.news.length ? h("div",{class:"news"}, S.news.map(newsItem)) : h("div",{class:"empty"},"ยังไม่มีประกาศ ใครได้ข่าวจากนิติบุคคล เขต หรือการเคหะฯ โพสต์ไว้ที่นี่ได้"),
    h("div",{class:"sec"}, h("h3",null,"โพสต์ข่าวใหม่"), form));
}

/* ---------- staff login ---------- */
function openLogin(){
  if (!SB){ toast("ยังไม่ได้ตั้งค่าฐานข้อมูล"); return; }
  const email = h("input",{type:"text",id:"lgEmail",inputmode:"email",autocomplete:"username",placeholder:"อีเมลเจ้าหน้าที่"});
  const pass = h("input",{type:"password",id:"lgPass",autocomplete:"current-password",placeholder:"รหัสผ่าน",style:"width:100%;border:1px solid var(--line);background:var(--surface-2);border-radius:8px;padding:9px 11px;font-size:15px;color:var(--ink)"});
  const msg = h("span",{class:"note"});
  const btn = h("button",{class:"btn",type:"submit"},"เข้าสู่ระบบ");
  sheet("เข้าสู่ระบบเจ้าหน้าที่", "Staff",
    h("form",{class:"login",novalidate:true,onsubmit:async e=>{
      e.preventDefault(); btn.disabled = true; msg.textContent = "กำลังตรวจสอบ…";
      const { error } = await SB.auth.signInWithPassword({email:email.value.trim(), password:pass.value});
      if (error){ btn.disabled = false; msg.textContent = "อีเมลหรือรหัสผ่านไม่ถูกต้อง"; return; }
      await checkStaff();
      if (!S.staff){ msg.textContent = "บัญชีนี้ยังไม่ได้รับสิทธิ์ผู้ดูแลระบบ"; btn.disabled = false; return; }
      toast("เข้าสู่ระบบแล้ว"); openAdmin();
    }}, h("label",{class:"f"},"อีเมล",email), h("label",{class:"f"},"รหัสผ่าน",pass), h("div",{class:"row"}, btn, msg)),
    h("p",{class:"note",style:"margin:0"},"สำหรับผู้ดูแลระบบเท่านั้น ผู้พักอาศัยและทีมช่วยเหลือแจ้งเหตุได้โดยไม่ต้องเข้าสู่ระบบ"));
}
async function checkStaff(){
  if (!SB) return;
  try { const { data } = await SB.auth.getSession(); S.staff = data && data.session ? !!(await rpc("is_admin", {})) : false; } catch(e){ S.staff = false; }
  renderRole(); renderAll();
}
function renderRole(){
  const chip = $("#roleChip");
  chip.textContent = S.staff ? "ผู้ดูแลระบบ" : "เจ้าหน้าที่";
  chip.onclick = () => S.staff ? openAdmin() : openLogin();
}

/* ---------- admin: buildings ---------- */
async function saveBuilding(row){ const { error } = await SB.from("buildings").upsert(Object.assign({updated_at:new Date().toISOString()}, row)); if (error) throw error; }
function openAdmin(editId){
  if (!S.staff){ openLogin(); return; }
  const E = editId && editId !== "_new" ? regByCode(editId) : null;
  if (editId && (!S.ad || S.ad.src !== editId)) S.ad = E ? {src:editId, name:E.name, contacts:(E.contacts||[]).join("\n"), lat:E.lat, lng:E.lng} : {src:"_new", name:"", contacts:"", lat:null, lng:null};
  const list = h("div",{style:"display:grid;gap:6px"}, S.blds.length ? sortedBlds().map(B => h("div",{class:"blr"},
    h("div",{style:"min-width:0"}, h("b",null,B.name),
      h("div",{class:"note"}, [hasLL(B) ? "ปักตำแหน่งแล้ว" : "ยังไม่ปักตำแหน่ง", (B.contacts||[]).length ? "เบอร์ติดต่อ "+B.contacts.length+" รายการ" : "ยังไม่มีเบอร์ติดต่อ"].join(" · "))),
    h("div",{class:"row"}, h("button",{class:"chip",type:"button",onclick:()=>copy(SITE+"/#b-"+B.id,"คัดลอกลิงก์ "+B.name+" แล้ว")},"ลิงก์"), h("button",{class:"chip",type:"button",onclick:()=>openAdmin(B.id)},"แก้ไข")))) :
    h("div",{class:"empty"},"ยังไม่มีอาคาร"));
  const content = [
    h("div",{class:"row"}, h("button",{class:"btn",type:"button",onclick:()=>openAdmin("_new")},"+ เพิ่มอาคาร"), h("button",{class:"btn ghost",type:"button",onclick:()=>openCalib()},"ปรับตำแหน่งทุกตึก (2 จุด)"),
      h("button",{class:"btn ghost",type:"button",onclick:async ()=>{ await SB.auth.signOut(); S.staff = false; renderRole(); renderAll(); $("#dlg").close(); toast("ออกจากระบบแล้ว"); }},"ออกจากระบบ")),
    h("span",{class:"note"},S.blds.length+" อาคาร"), list];
  if (editId){
    const a = S.ad;
    const name = h("input",{type:"text",id:"aName",placeholder:"เช่น อาคาร 6"}); name.value = a.name; name.oninput = () => a.name = name.value;
    const contacts = h("textarea",{id:"aContacts",style:"min-height:80px",placeholder:"ลุงสมชาย (ผู้ดูแลตึก) 081-234-5678\nป้าศรี ห้อง 6/101 089-765-4321"}); contacts.value = a.contacts; contacts.oninput = () => a.contacts = contacts.value;
    const msg = h("span",{class:"note"});
    const save = h("button",{class:"btn",type:"submit"},"บันทึกอาคาร");
    let armed = false;
    const del = a.src !== "_new" ? h("button",{class:"btn danger",type:"button",onclick:async ()=>{
      if (!armed){ armed = true; del.textContent = "กดอีกครั้งเพื่อลบอาคาร"; return; }
      const { error } = await SB.from("buildings").delete().eq("id", a.src);
      if (error){ msg.textContent = errMsg(error); return; }
      S.ad = null; toast("ลบอาคารแล้ว"); await loadTable("buildings"); renderAll(); openAdmin();
    }},"ลบอาคาร") : null;
    const form = h("form",{novalidate:true,onsubmit:async e=>{
      e.preventDefault();
      const nm = clean(a.name,60).replace(/\s+/g," ");
      if (!nm){ msg.textContent = "กรอกชื่ออาคาร"; return; }
      const dup = regByName(nm); if (dup && dup.id !== a.src){ msg.textContent = "มีอาคารชื่อนี้แล้ว"; return; }
      const cd = a.src !== "_new" ? a.src : autoCode(nm);
      save.disabled = true;
      try { await saveBuilding({id:cd, name:nm, lat:a.lat, lng:a.lng, contacts:a.contacts.split("\n").map(x=>clean(x,120)).filter(Boolean).slice(0,10)});
        toast("บันทึก "+nm+" แล้ว"); S.ad = null; await loadTable("buildings"); renderAll(); openAdmin(); }
      catch(err){ save.disabled = false; msg.textContent = errMsg(err); }
    }},
      h("label",{class:"f"},"ชื่ออาคาร",name),
      h("div",{class:"locbox"}, h("span",null, a.lat != null ? "ปักตำแหน่งแล้ว" : "ยังไม่ปักตำแหน่ง"),
        h("button",{class:"chip",type:"button",onclick:()=>startPlacing("แตะตำแหน่งกลางตึกบนแผนที่", (lat,lng)=>{ a.lat=lat; a.lng=lng; openAdmin(a.src); }, () => openAdmin(a.src))}, a.lat != null ? "ย้ายตำแหน่ง" : "ปักบนแผนที่")),
      h("label",{class:"f"},"เบอร์ติดต่อประจำตึก (ชื่อ และเบอร์ บรรทัดละคน)",contacts),
      h("div",{class:"row"}, save, h("button",{class:"btn ghost",type:"button",onclick:()=>{ S.ad=null; openAdmin(); }},"ยกเลิก"), del, msg));
    content.unshift(h("div",{class:"sec",style:"border:0;padding:0"}, h("h3",null, a.src==="_new" ? "เพิ่มอาคาร" : "แก้ไข "+a.name), form));
  }
  sheet("จัดการอาคาร", "ผู้ดูแลระบบ", ...content);
}

/* ---------- admin: 2-point calibration ---------- */
function similarity(pA, gA, pB, gB){
  // pixel (x, y-down) -> local metres (east, north) around gA, as complex z = a*w + b
  const kx = 111320*Math.cos(gA.lat*Math.PI/180), ky = 110574;
  const toZ = g => [(g.lng-gA.lng)*kx, (g.lat-gA.lat)*ky];
  const w1 = [pA.x, -pA.y], w2 = [pB.x, -pB.y], z1 = toZ(gA), z2 = toZ(gB);
  const dw = [w2[0]-w1[0], w2[1]-w1[1]], dz = [z2[0]-z1[0], z2[1]-z1[1]];
  const den = dw[0]*dw[0] + dw[1]*dw[1];
  if (!den) return null;
  const a = [(dz[0]*dw[0] + dz[1]*dw[1])/den, (dz[1]*dw[0] - dz[0]*dw[1])/den];
  const b = [z1[0] - (a[0]*w1[0] - a[1]*w1[1]), z1[1] - (a[0]*w1[1] + a[1]*w1[0])];
  return p => { const w = [p.x, -p.y]; const e = a[0]*w[0] - a[1]*w[1] + b[0], n = a[0]*w[1] + a[1]*w[0] + b[1];
    return {lat: gA.lat + n/ky, lng: gA.lng + e/kx}; };
}
function openCalib(){
  const cand = sortedBlds().filter(B => typeof B.px === "number");
  if (cand.length < 2){ toast("ต้องมีอาคารจากชุดเริ่มต้นอย่างน้อย 2 ตึก"); return; }
  if (!S.cal) S.cal = {a:cand[0].id, b:cand[cand.length-1].id, ga:null, gb:null};
  const c = S.cal;
  const pick = key => h("select",{id:"cal"+key}, cand.map(B => h("option",{value:B.id,selected:c[key]===B.id},B.name)));
  const sa = pick("a"), sb = pick("b");
  sa.onchange = () => { c.a = sa.value; c.ga = null; openCalib(); };
  sb.onchange = () => { c.b = sb.value; c.gb = null; openCalib(); };
  const place = key => h("button",{class:"chip",type:"button",onclick:()=>startPlacing("แตะกลางหลังคา "+regByCode(c[key]).name+" บนภาพดาวเทียม", (lat,lng)=>{ c["g"+key] = {lat,lng}; openCalib(); }, openCalib)}, c["g"+key] ? "แตะใหม่" : "แตะตำแหน่งจริงบนแผนที่");
  const msg = h("span",{class:"note"});
  const apply = h("button",{class:"btn",type:"button",disabled:!(c.ga && c.gb) || c.a === c.b,onclick:async ()=>{
    const A = regByCode(c.a), B = regByCode(c.b);
    const f = similarity({x:A.px,y:A.py}, c.ga, {x:B.px,y:B.py}, c.gb);
    if (!f){ msg.textContent = "เลือก 2 ตึกที่ต่างกัน"; return; }
    apply.disabled = true; msg.textContent = "กำลังบันทึก…";
    try {
      const rows = S.blds.filter(x => typeof x.px === "number").map(x => Object.assign({id:x.id, name:x.name, contacts:x.contacts||[], px:x.px, py:x.py}, f({x:x.px, y:x.py})));
      const { error } = await SB.from("buildings").upsert(rows.map(r => Object.assign({updated_at:new Date().toISOString()}, r)));
      if (error) throw error;
      S.cal = null; toast("ปรับตำแหน่ง "+rows.length+" ตึกแล้ว"); await loadTable("buildings"); renderAll(); fitAll(); $("#dlg").close();
    } catch(e){ apply.disabled = false; msg.textContent = errMsg(e); }
  }},"คำนวณและบันทึกตำแหน่งทุกตึก");
  sheet("ปรับตำแหน่งทุกตึกด้วย 2 จุด", "ผู้ดูแลระบบ",
    h("p",{class:"note",style:"margin:0"},"เลือก 2 ตึกที่อยู่ห่างกันมาก ๆ (เช่น ตึกมุมบนขวา กับตึกมุมล่างซ้าย) แล้วแตะกลางหลังคาของตึกนั้นบนภาพดาวเทียม ระบบจะคำนวณตำแหน่งตึกที่เหลือทั้งหมดให้เอง ตึกไหนยังคลาดเล็กน้อย แก้ทีละตึกได้ที่ \"แก้ไข > ย้ายตำแหน่ง\""),
    h("div",{class:"calib"}, h("label",{class:"f"},"จุดที่ 1",sa), h("div",{class:"row"}, place("a"), c.ga ? h("span",{class:"pill t-point"},"✓ ปักแล้ว") : null)),
    h("div",{class:"calib"}, h("label",{class:"f"},"จุดที่ 2",sb), h("div",{class:"row"}, place("b"), c.gb ? h("span",{class:"pill t-point"},"✓ ปักแล้ว") : null)),
    h("div",{class:"row"}, apply, h("button",{class:"btn ghost",type:"button",onclick:()=>{ S.cal=null; openAdmin(); }},"ยกเลิก"), msg));
}

/* ---------- boot ---------- */
function banner(t){ const b = $("#banner"); b.hidden = !t; b.textContent = t || ""; }
function renderAll(){ renderRole(); renderSummary(); renderList(); renderMapMarks(); }
$("#flegend").replaceChildren(h("b",null,"ระดับน้ำบนถนน"), ...DEPTH.slice(1).map((d,i) => h("span",null, h("i",{style:`background:var(--d${i+1})`}), d[0], h("em",{class:"dsc note",style:"font-style:normal"}," "+d[1]))), h("span",{class:"note"},"เส้นประ = ข้อมูลเก่ากว่า 6 ชม."));
initMap();
renderAll();
setInterval(renderList, 60000);

(async function init(){
  if (!configured){
    document.body.append(h("div",{class:"setup"}, h("div",null, h("h2",null,"ยังไม่ได้เชื่อมฐานข้อมูล"),
      h("p",{style:"margin:0"},"เปิดไฟล์ config.js แล้วใส่ SUPABASE_URL และ SUPABASE_ANON_KEY ของโปรเจกต์ Supabase ตามคู่มือขั้นตอนที่ 3"),
      h("p",{class:"note",style:"margin:0"},"ระหว่างนี้โทรแจ้งเหตุได้ที่ 1784 หรือ 1669"))));
    S.loaded = true; renderAll(); return;
  }
  if (!window.supabase || !window.supabase.createClient){ banner("โหลดระบบข้อมูลไม่สำเร็จ ลองรีเฟรชหน้า"); S.loaded = true; renderAll(); return; }
  SB = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
  try { await Promise.all([loadTable("buildings"), loadTable("reports"), loadTable("news")]); }
  catch(e){ banner("โหลดข้อมูลไม่สำเร็จ ตรวจอินเทอร์เน็ต หรือแจ้งผู้ดูแลตรวจการตั้งค่า"); }
  S.loaded = true; renderAll(); fitAll();
  await checkStaff();
  const want = (location.hash||"").slice(1);
  if (want.startsWith("b-") && regByCode(want.slice(2))) openBuilding(want.slice(2));
  try {
    SB.channel("kcf-live")
      .on("postgres_changes", {event:"*", schema:"public", table:"reports"}, () => reload("reports"))
      .on("postgres_changes", {event:"*", schema:"public", table:"buildings"}, () => reload("buildings"))
      .on("postgres_changes", {event:"*", schema:"public", table:"news"}, () => reload("news"))
      .subscribe();
  } catch(e){}
  setInterval(() => { reload("reports"); reload("news"); }, 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden){ reload("reports"); reload("buildings"); reload("news"); } });
})();
