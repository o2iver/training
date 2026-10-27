/*! O.G. Trainings-App · Grundgerüst · Version a16a01f497
 * Abgeleitet aus dem claude.ai-Artefakt „Training Olli“ (Stand 27.10.2026, siehe quelle/).
 * Kennung und Schlüssel des persönlichen Plans stehen im Link hinter „#“ – dieser Teil geht
 * nie an einen Server. Der Plan liegt verschlüsselt unter plan-<kennung>.json und wird erst hier
 * auf dem Gerät entschlüsselt. Quelle dieser Datei: app/app_template.js (build.py setzt die Version). */
(function(){'use strict';

// ===================== Laden: persönlichen Plan öffnen =====================
var MERK = 'ogt:plan';                                  // zuletzt geöffneter Plan auf diesem Gerät
var LINK_RE = /([a-z0-9]{12})\.([A-Za-z0-9_-]{43})/;   // Kennung.Schlüssel

function b64uBytes(s){
  s = String(s).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  var b = atob(s), u = new Uint8Array(b.length);
  for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  return u;
}
function planAus(text){ var m = LINK_RE.exec(String(text || '')); return m ? { id: m[1], key: m[2] } : null; }
function merken(p){ try { localStorage.setItem(MERK, p.id + '.' + p.key); } catch (e) {} }
function gemerkt(){ try { return planAus(localStorage.getItem(MERK)); } catch (e) { return null; } }
function vergessen(){ try { localStorage.removeItem(MERK); } catch (e) {} }
function escL(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function fehler(art){ var e = new Error(art); e.art = art; return e; }

// Einfache Karte für Hinweise, wahlweise mit Feld zum Einfügen des Links
function karte(titel, text, mitFeld){
  var r = document.getElementById('fk-root'); if (!r) return;
  r.innerHTML = '<div class="ogt-karte"><h1>' + escL(titel) + '</h1><p>' + escL(text) + '</p>'
    + (mitFeld ? '<form id="ogt-form" novalidate><label for="ogt-link">Link aus deiner Nachricht</label>'
      + '<input id="ogt-link" type="url" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Link hier einfügen">'
      + '<button type="submit">Plan öffnen</button><p id="ogt-fehler" role="alert"></p></form>' : '')
    + '</div>';
  var f = document.getElementById('ogt-form');
  if (f) f.addEventListener('submit', function(ev){
    ev.preventDefault();
    var p = planAus(document.getElementById('ogt-link').value);
    if (!p){ document.getElementById('ogt-fehler').textContent = 'Das ist kein vollständiger Plan-Link. Bitte den ganzen Link aus der Nachricht einfügen.'; return; }
    merken(p);
    location.hash = p.id + '.' + p.key;
    location.reload();
  });
}

function laden(p){
  if (!window.crypto || !window.crypto.subtle || !window.fetch || !window.TextDecoder) return Promise.reject(fehler('alt'));
  return fetch('plan-' + p.id + '.json', { cache: 'no-cache' })
    .then(function(r){
      if (r.status === 404) throw fehler('fehlt');
      if (!r.ok) throw fehler('netz');
      return r.json();
    }, function(){ throw fehler('netz'); })
    .then(function(d){
      return crypto.subtle.importKey('raw', b64uBytes(p.key), { name: 'AES-GCM' }, false, ['decrypt'])
        .then(function(k){ return crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64uBytes(d.iv) }, k, b64uBytes(d.ct)); })
        .catch(function(){ throw fehler('schluessel'); });
    })
    .then(function(buf){ return JSON.parse(new TextDecoder().decode(buf)); });
}

var MELDUNG = {
  alt: ['Browser zu alt', 'Dieser Browser kann den Plan nicht öffnen. Bitte in Safari (iPhone) oder Chrome (Android) öffnen.'],
  fehlt: ['Plan nicht gefunden', 'Diesen Plan gibt es nicht mehr. Bitte frag nach einem neuen Link.'],
  netz: ['Keine Verbindung', 'Der Plan konnte nicht geladen werden. Bitte einmal mit Internet öffnen – danach geht es auch ohne.'],
  schluessel: ['Link passt nicht', 'Der Link passt nicht zu diesem Plan. Bitte den Link aus der Nachricht vollständig öffnen.']
};

function starten(){
  var ausLink = planAus(location.hash), p = ausLink || gemerkt();
  if (!p){ karte('Dein Trainingsplan', 'Öffne den Link aus deiner Nachricht – oder füge ihn hier ein.', true); return; }
  laden(p).then(function(C){
    if (!C || C.format !== 'ogt-plan' || !C.inhalt) throw fehler('schluessel');
    merken(p);
    document.title = (C.inhalt.TITLE || 'Training') + ' · O.G. Physiotherapie';
    run(C);
  }).catch(function(e){
    var art = (e && e.art) || 'netz', m = MELDUNG[art] || MELDUNG.netz;
    if (art === 'fehlt' || art === 'schluessel') vergessen();
    karte(m[0], m[1], art === 'fehlt' || art === 'schluessel');
  });
}

// Neuer Plan-Link in der Adresszeile: neu laden. Andere Sprungmarken lässt das Gerüst unberührt.
window.addEventListener('hashchange', function(){ if (planAus(location.hash)) location.reload(); });
if ('serviceWorker' in navigator && window.isSecureContext && location.protocol !== 'file:'){
  // bei jedem Öffnen nach einer neuen App-Fassung schauen; sie gilt dann ab dem nächsten Öffnen
  navigator.serviceWorker.register('sw.js').then(function(reg){ return reg.update(); }).catch(function(){});
}

// ===================== Grundgerüst (unverändert aus dem Artefakt) =====================
function run(C){
var I = C.inhalt || {};
// ===================== Inhalte (aus dem entschlüsselten Plan) =====================
var TITLE = I.TITLE;
var APP_ID = I.APP_ID;
var FONT_HREF = I.FONT_HREF;
var SHELL = I.SHELL;
var DEF = I.DEF;
var CODE_TAG = I.CODE_TAG;
var POSITION = I.POSITION;
var GOAL_SHORT = I.GOAL_SHORT;
var TEST_SESS = I.TEST_SESS;
var PAIN_LBL = I.PAIN_LBL;
var ARM_LBL = I.ARM_LBL;
var MAIN_LIFT = I.MAIN_LIFT;
var R = I.R;
var SELF = I.SELF;
var VIEW_LBL = I.VIEW_LBL;
var LOG_FROM = I.LOG_FROM;
var PH_WORD = I.PH_WORD;
var OFF = I.OFF;
var ICON = I.ICON;
var GAMES = I.GAMES;
var PEAK = I.PEAK;
var GUIDE_URL = I.GUIDE_URL;
var REFS = I.REFS;
var OPT = I.OPT;
var EX = I.EX;
var BLK = I.BLK;
var QUICK_BLK = I.QUICK_BLK;
var BLK_INFO = I.BLK_INFO;
var ORDER_NOTE = I.ORDER_NOTE;
var SESS = I.SESS;
var DELOAD_PRO = I.DELOAD_PRO;
var PHASES = I.PHASES;
var WEEKS = I.WEEKS;
var LAST_WEEK = I.LAST_WEEK;
var MAIN_WEEKS = I.MAIN_WEEKS;
var PLAN = I.PLAN;
var LIFTS = I.LIFTS;
var TESTS = I.TESTS;
var RMT = I.RMT;
var RM_WEEK = I.RM_WEEK;
var TDEF = I.TDEF;
var SQ_REF = I.SQ_REF;
var AMPEL = I.AMPEL;
var FRESH = I.FRESH;
var FRESH_NOTE = I.FRESH_NOTE;
var RULE24 = I.RULE24;
var FIX_TIPS = I.FIX_TIPS;
var AMP_HEAD = I.AMP_HEAD;
var AMP_PRO = I.AMP_PRO;
var PROG = I.PROG;
var FAQ = I.FAQ;
var POS_EYEBROW = I.POS_EYEBROW;
var POS_HEAD = I.POS_HEAD;
var POS = I.POS;
var POS_REFS = I.POS_REFS;
var POS_LIST = I.POS_LIST;
var POS_PRO = I.POS_PRO;
var CHOICE_EYEBROW = I.CHOICE_EYEBROW;
var CHOICE_HEAD = I.CHOICE_HEAD;
var CHOICES = I.CHOICES;
var STAIR_GOAL = I.STAIR_GOAL;
var STAIR_TEXT = I.STAIR_TEXT;
var STAIR_PRO = I.STAIR_PRO;
var PERIO = I.PERIO;
var RM_TEXT = I.RM_TEXT;
var RM_PRO = I.RM_PRO;
var RMSTEP_PAIN = I.RMSTEP_PAIN;
var JUMP_HEAD = I.JUMP_HEAD;
var JUMP_INTRO = I.JUMP_INTRO;
var PRE_TECH = I.PRE_TECH;
var MORNING_Q = I.MORNING_Q;
var FIN_K_LBL = I.FIN_K_LBL;
var FIN_SH_LBL = I.FIN_SH_LBL;
var FIN_NOTE_PH = I.FIN_NOTE_PH;
var FIN_K_REQ = I.FIN_K_REQ;
var PAIN_HEAD = I.PAIN_HEAD;
var PAIN_SERIES = I.PAIN_SERIES;
var PAIN_EMPTY = I.PAIN_EMPTY;
var INFO_NOTE = I.INFO_NOTE;
var FOOT_TEXT = I.FOOT_TEXT;
var OVER_TEXT = I.OVER_TEXT;
var WEL_TRAIN = I.WEL_TRAIN;
var WEL_PAIN = I.WEL_PAIN;
var DEMO_BASE = I.DEMO_BASE;
var DEMO_BIG = I.DEMO_BIG;
var LOAD_TEXT = I.LOAD_TEXT;
// ===================== Logik =====================
var SRC = (function(){
  var st = document.getElementById('fk-style'), ap = document.getElementById('fk-app');
  return { style: st ? st.textContent : '', app: ap ? ap.textContent : '' };
})();
var FALLBACK_RESET = ':root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}';
var ORIG_TEXT = JSON.stringify(C.stand || {});   // Stand kommt aus dem entschlüsselten Plan

// ---------- kleine Helfer ----------
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function rid(){ return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5); }
function pad(n){ return String(n).padStart(2, '0'); }
function todayISO(){ var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function parseISO(s){ if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return null; var a = s.split('-').map(Number); return Date.UTC(a[0], a[1] - 1, a[2]); }
function daysBetween(a, b){ var A = parseISO(a), B = parseISO(b); if (A == null || B == null) return null; return Math.round((B - A) / 864e5); }
function addDays(iso, n){ var t = parseISO(iso); if (t == null) return ''; var d = new Date(t + n * 864e5); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }
function wdOf(iso){ var t = parseISO(iso); return t == null ? null : new Date(t).getUTCDay(); }
var WD = ['So','Mo','Di','Mi','Do','Fr','Sa'];
function fmtDate(iso){ var t = parseISO(iso); if (t == null) return '–'; var d = new Date(t); return pad(d.getUTCDate()) + '.' + pad(d.getUTCMonth() + 1) + '.' + d.getUTCFullYear(); }
function fmtShort(iso){ var t = parseISO(iso); if (t == null) return '–'; var d = new Date(t); return pad(d.getUTCDate()) + '.' + pad(d.getUTCMonth() + 1) + '.'; }
function fmtWd(iso){ var t = parseISO(iso); if (t == null) return '–'; return WD[new Date(t).getUTCDay()] + ' ' + fmtShort(iso); }
function fmtNum(n){ return n == null || n === '' || isNaN(n) ? '–' : String(Math.round(n * 100) / 100).replace('.', ','); }
function fmtInt(n){ return n == null || isNaN(n) ? '–' : String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function num(v){ if (v == null) return null; v = String(v).trim().replace(',', '.'); if (v === '') return null; var n = parseFloat(v); return isNaN(n) ? null : n; }
function clampN(v, lo, hi){ var n = (typeof v === 'number') ? v : num(v); if (n == null || isNaN(n)) return null; return Math.max(lo, Math.min(hi, n)); }
function str(v){ return typeof v === 'string' ? v.slice(0, 400) : ''; }
function isoOr(v, d){ return parseISO(v) != null ? v : d; }
function pickOpt(v, list, d){ for (var i = 0; i < list.length; i++){ if (list[i][0] === v) return v; } return d; }
function optLabel(list, v){ for (var i = 0; i < list.length; i++){ if (list[i][0] === v) return list[i][1]; } return ''; }
function debounce(fn, ms){ var t; return function(){ clearTimeout(t); t = setTimeout(fn, ms); }; }
function parseJSON(t){ try { return JSON.parse(t); } catch (e) { return null; } }
function lsGet(k, d){ try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
function lsSet(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
function ssGet(k, d){ try { var v = sessionStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
function ssSet(k, v){ try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function ssDel(k){ try { sessionStorage.removeItem(k); } catch (e) {} }
function u8b64(u8){ var s = ''; for (var i = 0; i < u8.length; i += 0x8000){ s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); } return btoa(s); }
function b64u8(b){ var s = atob(b), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
function b64e(s){ return u8b64(new TextEncoder().encode(s)); }
function b64d(s){ return new TextDecoder().decode(b64u8(s)); }
function canZip(){ return typeof CompressionStream === 'function' && typeof DecompressionStream === 'function' && typeof Response === 'function'; }
function zipB64(text){
  var cs = new CompressionStream('deflate'), w = cs.writable.getWriter();
  w.write(new TextEncoder().encode(text)); w.close();
  return new Response(cs.readable).arrayBuffer().then(function(b){ return u8b64(new Uint8Array(b)); });
}
function unzipB64(b){
  var ds = new DecompressionStream('deflate'), w = ds.writable.getWriter();
  w.write(b64u8(b)); w.close();
  return new Response(ds.readable).text();
}
function slug(s){ return (String(s || 'Athletin').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'Athletin').slice(0, 40); }
function roundTo(v, st){ st = st || 2.5; return Math.round(v / st) * st; }
function fmtStamp(s){ if (!s) return ''; var d = new Date(s); if (isNaN(d)) return ''; var iso = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); return fmtWd(iso) + ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' Uhr'; }

// ---------- Plan-Helfer ----------
function parseDose(s){
  if (!s) return null;
  var raw = String(s).replace(/\s+/g, ''), kg = null, ci = raw.indexOf(':');
  if (ci >= 0){ kg = num(raw.slice(ci + 1)); raw = raw.slice(0, ci); }
  var m = /^(\d+)x(\d+)?(?:-(\d+))?(s|m|min)?(\/S)?(?:@(\d)(?:-(\d))?)?$/.exec(raw);
  if (!m) return { sets: 1, txt: s, kg: kg };
  var lo = m[2] != null ? +m[2] : null;
  return { sets: +m[1], lo: lo, hi: m[3] != null ? +m[3] : lo, unit: m[4] || '', side: !!m[5], rlo: m[6] != null ? +m[6] : null, rhi: m[7] != null ? +m[7] : (m[6] != null ? +m[6] : null), kg: kg };
}
// Gewicht als Text – bei Zusatzgewicht (Klimmzug, Dips) „+10 kg“ bzw. „ohne Zusatz“
function kgText(kg, ex, short){
  if (kg == null) return '';
  if (ex && ex.add) return kg > 0 ? '+' + fmtNum(kg) + (short ? '' : ' kg') : (short ? 'KG' : 'ohne Zusatz');
  return fmtNum(kg) + (short ? '' : ' kg');
}
function rng(a, b){ return a == null ? '' : (b != null && b !== a ? a + '–' + b : String(a)); }
function doseText(p, ex){
  if (!p) return '';
  if (p.txt) return p.txt;
  var side = p.side ? ' je Seite' : '', r = p.rlo != null ? ' · Reserve ' + rng(p.rlo, p.rhi) : '';
  if (p.unit === 'min') return (p.sets > 1 ? p.sets + ' × ' : '') + rng(p.lo, p.hi) + ' min';
  if (p.unit === 's') return p.sets + ' × ' + rng(p.lo, p.hi) + ' s' + side;
  if (p.unit === 'm') return p.sets + ' × ' + rng(p.lo, p.hi) + ' m' + side;
  if (p.lo == null){
    if (ex && ex.n === EX.tests.n) return 'nach Anleitung';
    return p.sets + (p.sets === 1 ? ' Durchgang' : ' Durchgänge') + side;
  }
  return p.sets + ' × ' + rng(p.lo, p.hi) + side + (p.kg != null ? ' · ' + kgText(p.kg, ex) : '') + r;
}
var PH_BY_WEEK = (function(){ var o = {}; PHASES.forEach(function(ph){ ph.weeks.forEach(function(w){ o[w] = ph; }); }); return o; })();
function phaseOfWeek(w){ return PH_BY_WEEK[w] || null; }
function phaseById(id){ for (var i = 0; i < PHASES.length; i++){ if (PHASES[i].id === id) return PHASES[i]; } return null; }
function sidOf(w, s){ return 'w' + w + '-' + s; }
function parseSid(id){ var m = /^w(\d+)-(\w+)$/.exec(id || ''); return m ? { w: +m[1], s: m[2] } : null; }
var SIDS = (function(){ var o = {}; PHASES.forEach(function(ph){ ph.weeks.forEach(function(w){ ph.sess.forEach(function(s){ o[sidOf(w, s)] = 1; }); }); }); return o; })();
function itemsOf(w, s){
  var ph = phaseOfWeek(w); if (!ph) return [];
  var idx = ph.weeks.indexOf(w), list = (PLAN[ph.id] || {})[s] || [];
  return list.map(function(it){
    var arr = it[2], dose = arr[Math.min(idx, arr.length - 1)];
    if (!dose) return null;
    return { b: it[0], x: it[1], dose: dose, p: parseDose(dose), n: it[3] || '', ex: EX[it[1]], opt: !!it[4] };
  }).filter(Boolean);
}
function doseFor(sid, x){ var ps = parseSid(sid); if (!ps) return null; var it = itemsOf(ps.w, ps.s).filter(function(i){ return i.x === x; })[0]; return it ? it.p : null; }
function startISO(){ return S.profile.start || DEF.start; }
function weekOf(iso){ var d = daysBetween(startISO(), iso); if (d == null) return null; return Math.floor(d / 7) + 1; }
function curWeek(){ return weekOf(todayISO()); }
function weekStart(w){ return addDays(startISO(), (w - 1) * 7); }
function weekEnd(w){ return addDays(weekStart(w), 6); }
function weekRange(w){ return fmtShort(weekStart(w)) + '–' + fmtShort(weekEnd(w)); }
function planDate(w, s){
  var ws = weekStart(w), want = SESS[s] ? SESS[s].day : 1;
  for (var i = 0; i < 7; i++){ var d = addDays(ws, i); if (wdOf(d) === want) return d; }
  return ws;
}
function phaseRange(ph){ return fmtShort(weekStart(ph.weeks[0])) + '–' + fmtShort(weekEnd(ph.weeks[ph.weeks.length - 1])); }
// ---------- Spielplan ----------
var GAME_BY_DATE = (function(){ var o = {}; GAMES.forEach(function(g){ o[g.d] = g; }); return o; })();
function gameOn(iso){ return GAME_BY_DATE[iso] || null; }
function gamesInWeek(w){ var a = []; for (var i = 0; i < 7; i++){ var d = addDays(weekStart(w), i); if (GAME_BY_DATE[d]) a.push({ d: d, t: GAME_BY_DATE[d].t }); } return a; }
function nextGameFrom(iso, max){ for (var i = 0; i <= max; i++){ var d = addDays(iso, i); if (GAME_BY_DATE[d]) return { d: d, t: GAME_BY_DATE[d].t, inDays: i }; } return null; }
function gameText(g){ return fmtWd(g.d) + ' · ' + g.t; }
function sessOff(w, s){ return !!(OFF[w] && OFF[w][s]) || !!gameOn(planDate(w, s)); }
function weekSess(w){ var ph = phaseOfWeek(w); if (!ph) return []; return ph.sess.filter(function(s){ return !sessOff(w, s); }); }
function plannedSoFar(){
  var w = curWeek(), n = 0; if (w == null || w < 1) return 0;
  for (var k = Math.max(1, weekOf(LOG_FROM) || 1); k <= Math.min(w, LAST_WEEK); k++){
    var ph = phaseOfWeek(k); if (!ph) continue;
    weekSess(k).forEach(function(s){ if (k < w || planDate(k, s) <= todayISO()) n++; });
  }
  return n;
}

// ---------- Zustand ----------
function normSets(t, arr){
  if (!Array.isArray(arr)) return null;
  var nv = t === 'kg' ? 2 : (t === 'tick' ? 0 : 1), out = [];
  arr.slice(0, 12).forEach(function(s){
    if (!Array.isArray(s)) s = [];
    var row = [];
    for (var i = 0; i < nv; i++){ var v = s[i]; v = (v == null || v === '') ? null : clampN(v, 0, i === 0 && (t === 'kg' || t === 'kg1') ? 500 : 600); row.push(v); }
    row.push(s[nv] ? 1 : 0);
    out.push(row);
  });
  while (out.length && out[out.length - 1].every(function(v, i, a){ return i === a.length - 1 ? !v : v == null; })) out.pop();
  return out.length ? out : null;
}
function normEntry(e){
  if (!e || typeof e !== 'object') return null;
  var sid = str(e.s); if (!SIDS[sid]) return null;
  var o = { s: sid, d: isoOr(e.d, ''), x: {}, r: {}, e: clampN(e.e, 0, 10), m: clampN(e.m, 0, 600), fr: clampN(e.fr, 0, 10), k: clampN(e.k, 0, 10), ks: pickOpt(e.ks, OPT.ks, ''), o: clampN(e.o, 0, 10), sh: clampN(e.sh, 0, 10), n: str(e.n), f: e.f ? 1 : 0, t: +e.t || 0 };
  if (o.e != null) o.e = Math.round(o.e); if (o.fr != null) o.fr = Math.round(o.fr); if (o.k != null) o.k = Math.round(o.k); if (o.o != null) o.o = Math.round(o.o); if (o.sh != null) o.sh = Math.round(o.sh);
  var xs = (e.x && typeof e.x === 'object') ? e.x : {};
  Object.keys(xs).forEach(function(id){ var ex = EX[id]; if (!ex) return; var v = normSets(ex.t, xs[id]); if (v) o.x[id] = v; });
  var rs = (e.r && typeof e.r === 'object') ? e.r : {};
  Object.keys(rs).forEach(function(id){ if (!EX[id]) return; var n = clampN(rs[id], 0, 4); if (n != null) o.r[id] = Math.round(n); });
  var zz = zNorm(e.z); if (zz.length) o.z = zz;
  return o;
}
function normTest(t){
  if (!t || parseISO(t.d) == null) return null;
  var def = testDef(t.k); if (!def) return null;
  var o = { id: str(t.id) || rid(), k: t.k, d: t.d, t: +t.t || 0 };
  if (def.kind === 'lr'){ o.l = clampN(t.l, 0, 9999); o.r = clampN(t.r, 0, 9999); if (o.l == null && o.r == null) return null; }
  else if (def.kind === 'rm'){ o.v = clampN(t.v, 0, 500); o.n = clampN(t.n, 1, 30); o.q = clampN(t.q, 0, 4); if (!(o.v > 0) || o.n == null) return null; o.n = Math.round(o.n); o.q = o.q == null ? 1 : Math.round(o.q); }
  else { o.v = clampN(t.v, 0, 9999); if (o.v == null) return null; }
  return o;
}
function normProfile(p){
  p = (p && typeof p === 'object') ? p : {};
  var bw = clampN(p.bw, 30, 150);
  return { name: str(p.name).slice(0, 60), bw: bw == null ? DEF.bw : Math.round(bw * 10) / 10, start: isoOr(p.start, DEF.start), ther: p.ther == null ? DEF.ther : str(p.ther).slice(0, 80), phone: p.phone == null ? DEF.phone : str(p.phone).slice(0, 40), msg: str(p.msg).slice(0, 300), hb: pickOpt(p.hb, OPT.hb, '0'), side: pickOpt(p.side, OPT.side, '') };
}
function normalize(s){
  s = (s && typeof s === 'object') ? s : {};
  var log = {};
  if (s.log && typeof s.log === 'object'){ Object.keys(s.log).forEach(function(k){ var e = normEntry(s.log[k]); if (e) log[e.s] = e; }); }
  return { v: 1, id: str(s.id) || rid(), rev: +s.rev || 0, saveId: str(s.saveId), updated: str(s.updated), imported: str(s.imported), profile: normProfile(s.profile), log: log, tests: Array.isArray(s.tests) ? s.tests.map(normTest).filter(Boolean) : [] };
}

var S = normalize(parseJSON(ORIG_TEXT));
var UI = { tab: 'start', view: null, sess: null, backSess: null, rmEdit: null, rmDraft: {}, rmErr: null, week: null, lift: LIFTS[0][0], extra: {}, fin: {}, tErr: null, tdraft: {}, editProfile: false, confirm: null, sendText: '', importData: null, refsOpen: false, demo: false, stale: false, finErr: '' };
var MODE = 'boot';          // boot | writer | reader
var WHY = '';               // '' | standalone | nowriter | nouser
var NS = { artifact: null, user: null, downloads: null };
var SAVE = { state: 'idle', timer: null, busy: false, again: false, err: '', retried: false, urgent: false, inflight: '' };
var SAVE_DELAY = 2500, IDLE_MIN = 1500, FORM_IDLE = 45000;
var ACT = { last: 0, down: false, downAt: 0 };
var CONFLICT = null;
var TOAST = { msg: '', t: null, at: 0 };
var CACHE = null;

function LK(x){ return 'fk:' + S.id + ':' + x; }
function isPro(){ return UI.view === 'pro'; }
function who(){ return S.profile.name || 'deine Athletin'; }
function athName(){ return S.profile.name || 'Athletin'; }
function therShort(){ return String(S.profile.ther || '').split(/\s[·|–-]\s|[·|(,]/)[0].trim(); }
function therNom(){ return therShort() || 'dein Trainer'; }
function therAcc(){ return therShort() || 'deinen Trainer'; }
function therDat(){ return therShort() || 'deinem Trainer'; }
function invalidate(){ CACHE = null; }

// ---------- Protokoll: Plan-Stand (von Olli übernommen) + eigene Einträge auf dem Gerät ----------
function localLog(){
  var o = lsGet(LK('log'), {}), out = {};
  if (o && typeof o === 'object'){ Object.keys(o).forEach(function(k){ var e = normEntry(o[k]); if (e) out[e.s] = e; }); }
  return out;
}
function saveLocalLog(map){ var ok = lsSet(LK('log'), map); invalidate(); return ok; }
function localTests(){ var a = lsGet(LK('tests'), []); return (Array.isArray(a) ? a : []).map(normTest).filter(Boolean); }
function L(){
  if (CACHE && CACHE.log) return CACHE.log;
  var out = {};
  Object.keys(S.log).forEach(function(k){ out[k] = S.log[k]; });
  if (MODE !== 'writer' || SELF){
    var loc = localLog();
    Object.keys(loc).forEach(function(k){ var a = loc[k], b = out[k]; if (!b || a.t > b.t){ a.local = true; out[k] = a; } });
  }
  CACHE = CACHE || {}; CACHE.log = out;
  return out;
}
function allTests(){
  var a = S.tests.slice();
  if (MODE !== 'writer' || SELF){
    var ids = {}; a.forEach(function(t, i){ ids[t.id] = i; });
    localTests().forEach(function(t){ var i = ids[t.id]; if (i == null){ t.local = true; a.push(t); } else if (t.t > a[i].t){ t.local = true; a[i] = t; } });
  }
  return a;
}
// Was der Plan schon genauso (oder neuer) hat, wird vom Gerät entfernt – danach gilt der Plan.
function applyLocal(){
  if (MODE !== 'reader') return;
  var base = normalize(parseJSON(ORIG_TEXT));
  var loc = localLog(), ch = false;
  Object.keys(loc).forEach(function(k){ var b = base.log[k]; if (b && b.t >= loc[k].t){ delete loc[k]; ch = true; } });
  if (ch) lsSet(LK('log'), loc);
  var bt = {}; base.tests.forEach(function(t){ bt[t.id] = t; });
  var lt = localTests(), lt2 = lt.filter(function(t){ return !(bt[t.id] && bt[t.id].t >= t.t); });
  if (lt2.length !== lt.length) lsSet(LK('tests'), lt2);
  invalidate();
}
function pending(){
  var loc = localLog(), l = [];
  Object.keys(loc).forEach(function(k){ var b = S.log[k]; if (!b || loc[k].t > b.t) l.push(loc[k]); });
  var bt = {}; S.tests.forEach(function(t){ bt[t.id] = t; });
  var t = localTests().filter(function(x){ return !bt[x.id] || x.t > bt[x.id].t; });
  l.sort(function(a, b){ return (a.d || '') < (b.d || '') ? -1 : 1; });
  return { l: l, t: t };
}
function entriesSorted(log){
  log = log || L();
  return Object.keys(log).map(function(k){ return log[k]; }).sort(function(a, b){
    var da = a.d || planDate(parseSid(a.s).w, parseSid(a.s).s), db = b.d || planDate(parseSid(b.s).w, parseSid(b.s).s);
    return da < db ? -1 : (da > db ? 1 : a.t - b.t);
  });
}
function entryDate(e){ if (e.d) return e.d; var p = parseSid(e.s); return planDate(p.w, p.s); }
function doneSets(e, x){ var a = e && e.x[x]; if (!a) return []; return a.filter(function(s){ return s[s.length - 1]; }); }
function entryProgress(e, w, s){
  var items = itemsOf(w, s), tot = 0, got = 0;
  items.forEach(function(it){ if (it.opt) return; tot += it.p.sets; got += Math.min(it.p.sets, doneSets(e, it.x).length); });
  return { tot: tot, got: got };
}
function sessStatus(w, s, log){
  log = log || L(); var e = log[sidOf(w, s)];
  if (!e) return sessOff(w, s) ? 'off' : 'open';
  if (e.f) return 'done';
  return entryProgress(e, w, s).got > 0 ? 'part' : 'open';
}
function nextSession(){
  var w = curWeek(); if (w == null) return null;
  if (w < 1) return { pre: true, w: 1, s: (weekSess(1)[0] || 'A'), days: -daysBetween(startISO(), todayISO()) };
  if (w > LAST_WEEK) return { over: true };
  var ws = weekSess(w), log = L();
  for (var i = 0; i < ws.length; i++){ if (sessStatus(w, ws[i], log) !== 'done') return { w: w, s: ws[i] }; }
  return { weekDone: true, w: w };
}
function weekCount(w){ var ws = weekSess(w); if (!ws.length) return { done: 0, tot: 0 }; var log = L(), d = 0; ws.forEach(function(s){ if (sessStatus(w, s, log) === 'done') d++; }); return { done: d, tot: ws.length }; }

// ---------- Kraft-Schätzung & Vorschlag ----------
function e1rm(kg, reps, rir){ if (!(kg > 0) || !(reps > 0)) return null; var r = reps + (rir == null ? 2 : rir); if (r > 16) r = 16; return kg * (1 + r / 30); }
function bestOf(e, x){
  var sets = doneSets(e, x).filter(function(s){ return s[0] > 0 && s[1] > 0; }); if (!sets.length) return null;
  var p = doseFor(e.s, x), rir = e.r[x] != null ? e.r[x] : (p && p.rlo != null ? p.rlo : 2);
  var best = null;
  sets.forEach(function(s, i){ var est = e1rm(s[0], s[1], i === sets.length - 1 ? rir : rir + 1); if (est != null && (!best || est > best.est)) best = { est: est, kg: s[0], reps: s[1], rir: i === sets.length - 1 ? rir : null }; });
  return best;
}
function lastPerf(x, w){
  var log = L(), best = null;
  Object.keys(log).forEach(function(k){
    var ps = parseSid(k); if (!ps || ps.w >= w) return;
    var e = log[k], sets = doneSets(e, x).filter(function(s){ return s[0] > 0 && s[1] > 0; }); if (!sets.length) return;
    var key = pad(ps.w) + '|' + entryDate(e) + '|' + e.t;
    if (!best || key > best.key) best = { key: key, e: e, sets: sets, sid: k };
  });
  return best;
}
// ---------- Kraft-Tests ----------
var RM_BY_X = (function(){ var o = {}; RMT.forEach(function(r){ o[r.x] = r; }); return o; })();
function rmE1(t){ return t ? e1rm(t.v, t.n, t.q) : null; }
function rmTestFor(k, w){ var a = testsOf(k).filter(function(t){ var tw = weekOf(t.d); return w === 1 ? (tw != null && tw <= 1) : tw === w; }); return a.length ? a[a.length - 1] : null; }
function rmLatest(k, w){ var a = testsOf(k).filter(function(t){ var tw = weekOf(t.d); return tw != null && tw <= w; }); return a.length ? a[a.length - 1] : null; }
function relTxt(est){ var bw = S.profile.bw; return bw ? fmtNum(Math.round(est / bw * 100) / 100) + ' × Körpergewicht' : ''; }
function strengthSrc(x, w){
  var src = null, lp = lastPerf(x, w);
  if (lp){
    var e = lp.e, pp = doseFor(lp.sid, x), last = lp.sets[lp.sets.length - 1];
    var rir = e.r[x] != null ? e.r[x] : (pp && pp.rlo != null ? pp.rlo : 2), est = e1rm(last[0], last[1], rir);
    if (est != null) src = { kind: 'log', est: est, d: entryDate(e), lp: lp, pp: pp, lastKg: Math.max.apply(null, lp.sets.map(function(s){ return s[0]; })) };
  }
  var r = RM_BY_X[x];
  // Test und Sätze vom selben Tag: der vorsichtigere Schätzwert zählt – außer der Test wurde danach noch einmal geändert (z. B. wiederholt)
  if (r){ var t = rmLatest(r.k, w); if (t && (!src || t.d > src.d || (t.d === src.d && ((t.t || 0) > (src.lp.e.t || 0) || rmE1(t) <= src.est)))) src = { kind: 'test', est: rmE1(t), d: t.d, t: t, lastKg: t.v }; }
  return src;
}
function rmStart(r, w){
  var bw = S.profile.bw || DEF.bw, wk = RM_WEEK[w] || RM_WEEK[1];
  if (w > 1){ var src = strengthSrc(r.x, w - 1); if (src && src.est){ var mid = (wk.lo + wk.hi) / 2; return Math.max(r.st, roundTo(src.est / (1 + (mid + 1) / 30), r.st)); } }
  if (r.s0) return r.s0;
  return Math.max(r.st, roundTo(bw * r.f, r.st));
}
function floorTo(v, st){ return Math.floor(v / st + 1e-6) * st; }
var CHK = { sq: 1, bench: 1, dl: 1 };
// Gewichte laut Plan (aus dem Kalender) mit Ollis Regeln: RPE 9+ → Gewicht wiederholen · weniger genommen → der Plan rückt nach · Beschwerden ab 3 → nicht steigern
function planSuggest(x, p, ps){
  var base = p.kg, out = { kg: base, ref: null, msg: 'laut Plan' };
  var lp = lastPerf(x, ps.w), wk = WEEKS[ps.w] || {};
  if (!lp || wk.hold) return out;
  var lps = parseSid(lp.sid), lwk = WEEKS[lps.w] || {}, pp = doseFor(lp.sid, x);
  if (lps.w !== ps.w - 1 || phaseOfWeek(lps.w) !== phaseOfWeek(ps.w) || lwk.hold || !pp || pp.kg == null || pp.lo !== p.lo) return out;
  var e = lp.e, top = 0, ex = EX[x]; lp.sets.forEach(function(s){ if (s[0] > top) top = s[0]; });
  var rir = e.r[x], step = Math.max(0, base - pp.kg);
  out.ref = top;
  if (rir != null && rir <= 1 && top < base){ out.kg = top; out.msg = 'letztes Mal RPE 9+ (Reserve ' + rir + ') – Gewicht wiederholen'; }
  else if (top < pp.kg){ out.kg = Math.min(base, top + step); out.msg = 'letztes Mal ' + kgText(top, ex) + ' statt ' + kgText(pp.kg, ex) + ' – der Plan rückt eine Stufe nach'; }
  else if ((e.k >= 3 || e.o >= 3 || e.sh >= 3) && top < base){ out.kg = top; out.msg = 'letztes Mal Beschwerden ab 3 – heute nicht steigern'; }
  else if (step > 0) out.msg = 'laut Plan · +' + fmtNum(step) + ' kg zur Vorwoche';
  return out;
}
function suggest(x, p, sid){
  var ex = EX[x]; if (!ex || ex.t !== 'kg' || !p) return null;
  var ps = parseSid(sid); if (!ps) return null;
  var wk = WEEKS[ps.w] || {}, st = ex.st || 2.5, load, msg = '', ref = null, src;
  if (wk.chk && CHK[x]){
    // Check: Richtung für den Dreier bei RPE 8–9 (Reserve 1–2) aus dem letzten Satz
    var cs = strengthSrc(x, ps.w); if (!cs || cs.est == null) return null;
    var lo = floorTo(cs.est / (1 + 5 / 30), st), hi = floorTo(cs.est / (1 + 4 / 30), st);
    return { kg: lo, src: { kind: 'chk', est: cs.est }, msg: 'Richtung ' + fmtNum(lo) + (hi > lo ? '–' + fmtNum(hi) : '') + ' kg für den Dreier bei RPE 8–9 – berechnet aus deinem Satz vom ' + fmtShort(cs.d) };
  }
  if (p.kg != null){
    var pl = planSuggest(x, p, ps); load = pl.kg; msg = pl.msg; ref = pl.ref; src = { kind: 'plan' };
  } else {
    if (ex.nosug || p.lo == null || wk.hold) return null;
    var tReps = (p.lo + (p.hi != null ? p.hi : p.lo)) / 2, tRir = p.rlo != null ? (p.rlo + (p.rhi != null ? p.rhi : p.rlo)) / 2 : 2, div = 1 + (tReps + tRir) / 30;
    if (ex.src){
      // z. B. Kreuzheben schnell am Freitag: aus der Hauptübung berechnet
      src = strengthSrc(ex.src, ps.w); if (!src || src.est == null) return null;
      load = floorTo(src.est / div, st);
      if (src.kind === 'test') load = Math.min(load, floorTo(src.t.v * 1.1, st));
      msg = 'aus deinem ' + EX[ex.src].n + ' berechnet';
    } else {
      var lp = lastPerf(x, ps.w), r = RM_BY_X[x], t = r ? rmLatest(r.k, ps.w) : null;
      if (lp && (!t || t.d <= entryDate(lp.e))){
        // Steigerungsbremse: erst Wiederholungen, dann ein kleiner Schritt – nur nach einem guten letzten Mal
        src = { kind: 'log', lp: lp };
        var pp = doseFor(lp.sid, x), e = lp.e, sets = lp.sets, top = sets[0], last = sets[sets.length - 1];
        sets.forEach(function(s){ if (s[0] >= top[0]) top = s; });
        var rirL = e.r[x] != null ? e.r[x] : (pp && pp.rlo != null ? pp.rlo : 2), rirOk = rirL >= (pp && pp.rlo != null ? pp.rlo : 0);
        var lowOk = !pp || pp.lo == null || sets.every(function(s){ return s[1] >= pp.lo; });
        var topHit = !!(pp && pp.hi != null && sets.length >= pp.sets && sets.every(function(s){ return s[1] >= pp.hi; }));
        var good = (e.fr == null || e.fr >= 7) && !(e.k >= 3) && !(e.sh >= 3);
        ref = top[0];
        if (pp && pp.lo === p.lo && pp.hi === p.hi){
          if (topHit && rirOk && good){ load = top[0] + st; msg = '+' + fmtNum(st) + ' kg – letztes Mal alle Wiederholungen geschafft'; }
          else if (lowOk && rirOk){ load = top[0]; msg = topHit ? 'gleiches Gewicht – letztes Mal Frische unter 7 oder Beschwerden' : 'gleiches Gewicht – erst alle Sätze mit ' + pp.hi + ' Wiederholungen'; }
          else { load = Math.min(top[0], floorTo(e1rm(last[0], last[1], rirL) / div, st)); msg = load < top[0] ? 'etwas leichter – letztes Mal war es schwerer als geplant' : 'gleiches Gewicht'; }
        } else {
          var rc = pp && pp.rhi != null ? Math.min(rirL, pp.rhi) : rirL;
          load = Math.min(floorTo(e1rm(top[0], top[1], rc) / div, st), floorTo(top[0] * 1.1, st));
          if (!good) load = Math.min(load, top[0]);
          msg = 'umgerechnet auf die neue Vorgabe';
        }
      } else if (t){
        src = { kind: 'test', t: t, est: rmE1(t) };
        load = Math.min(floorTo(src.est / div, st), floorTo(t.v * 1.1, st));
      } else return null;
    }
  }
  var cur = L()[sid], fr = cur && cur.fr != null ? cur.fr : null;
  if (fr != null && fr <= 3){ load = ex.add ? floorTo(load * 0.5, st) : floorTo(load * 0.9, st); msg = ex.add ? 'Frische rot: Zusatzgewicht etwa halbieren' : 'Frische rot: etwa 10 % leichter'; }
  else if (fr != null && fr <= 6 && ref != null && load > ref){ load = ref; msg = 'Frische gelb: heute nicht steigern'; }
  load = ex.add ? Math.max(0, load) : Math.max(st, load);
  return { kg: load, src: src, msg: msg };
}

// ---------- Aufwärmen: Treppe bis zum Arbeitsgewicht ----------
// wu 'f' = volle Treppe wie in Ollis Kalender (60 × 5 · 90 × 3 · 110 × 2 · 120 × 1 vor 130): etwa 45 % · 70 % · 85 % · 92 %
// wu 's' = kurz (etwa 50 % × 6 · 75 % × 3), z. B. wenn die Muskeln schon warm sind
function warmupSets(W, ex){
  if (!(W > 0) || !ex || !ex.wu) return [];
  var bar = ex.bar || 0, st = ex.st || 2.5, rnd = (bar && W >= 60) ? 5 : st, min = ex.wu0 || 0;
  var steps = ex.wu === 's' ? [[0.5, 6], [0.75, 3]] : [[0.45, 5], [0.7, 3], [0.85, 2], [0.92, 1]];
  var out = [], last = 0;
  if (bar && !min && W >= bar + 3 * st){ out.push({ kg: bar, r: 10, bar: true }); last = bar; }
  steps.forEach(function(s){
    var kg = Math.round(W * s[0] / rnd) * rnd;
    if (kg < Math.max(bar, min)) kg = Math.max(bar, min);
    if (kg <= last || W - kg < st * 1.5 || (last && kg - last < st * 2)) return;
    out.push({ kg: kg, r: s[1] }); last = kg;
  });
  return out;
}
function warmupHtml(it, sid, sug, ed){
  var ex = it.ex, ps = parseSid(sid); if (!ex || !ex.wu || ex.t !== 'kg' || !ps) return '';
  if (typeof RM_WEEK !== 'undefined' && RM_WEEK[ps.w] && RM_BY_X[it.x]) return '';   // Testwoche: Aufwärmen steht im Kraft-Test-Kasten
  var W = sug && sug.kg > 0 ? sug.kg : null;
  if (W == null && !ed){ var s2 = suggest(it.x, it.p, sid); if (s2 && s2.kg > 0) W = s2.kg; }
  if (W == null){ var lp = lastPerf(it.x, ps.w); if (lp){ var top = 0; lp.sets.forEach(function(s){ if (s[0] > top) top = s[0]; }); if (top > 0) W = top; } }
  var sets = warmupSets(W, ex); if (!sets.length) return '';
  var hand = ex.u && /je Hand/.test(ex.u) ? ' je Hand' : '';
  return '<div class="wu"><span class="wu-h">Aufwärmen bis ' + fmtNum(W) + ' kg' + hand + ':</span>'
    + sets.map(function(s){ return '<span class="wu-s">' + (s.bar ? esc(ex.barLbl || 'Stange') : fmtNum(s.kg)) + ' × ' + s.r + '</span>'; }).join('<span class="wu-d" aria-hidden="true">·</span>')
    + (ed ? '<span class="wu-n">Richtwert: Brauchst du mehr Zwischenstufen oder mehr Wiederholungen mit wenig Gewicht, um dich gut zu fühlen, mach es so. Anders aufgewärmt? Kurz in die Notiz.</span>' : '')
    + '</div>';
}

// ---------- Schicken & Übernehmen ----------
function waNumber(){
  var p = String(S.profile.phone || '').replace(/[^\d+]/g, '');
  if (!p) return '';
  if (p.charAt(0) === '+') p = p.slice(1); else if (p.indexOf('00') === 0) p = p.slice(2); else if (p.charAt(0) === '0') p = '49' + p.slice(1);
  else if (/^1[5-7]\d{8,9}$/.test(p)) p = '49' + p;
  return /^\d{8,15}$/.test(p) ? p : '';
}
function setsLine(x, sets, ex){
  if (ex.t === 'kg') return sets.map(function(s){ return (s[0] != null ? fmtNum(s[0]) : '?') + '×' + (s[1] != null ? s[1] : '?'); }).join(', ');
  if (ex.t === 'kg1') return sets.map(function(s){ return fmtNum(s[0]) + ' kg'; }).join(', ');
  if (ex.t === 'sec') return sets.map(function(s){ return (s[0] != null ? s[0] : '?') + ' s'; }).join(', ');
  if (ex.t === 'bw') return sets.map(function(s){ return s[0] != null ? s[0] : '?'; }).join(', ') + ' Wdh.';
  return '';
}
function entryHead(e){
  var ps = parseSid(e.s), m = SESS[ps.s];
  var bits = [fmtWd(entryDate(e)) + ' · W' + ps.w + ' ' + m.s + (e.f ? ' ✓' : ' (begonnen)')];
  if (e.m != null) bits.push(e.m + ' min');
  if (e.fr != null) bits.push('Frische ' + e.fr + '/10');
  if (e.e != null) bits.push('Anstrengung ' + e.e + '/10');
  if (e.k != null) bits.push(PAIN_LBL + ' ' + e.k + '/10' + (e.ks ? ' ' + optLabel(OPT.ks, e.ks) : ''));
  if (e.o != null) bits.push('morgens danach ' + e.o + '/10');
  if (e.sh != null) bits.push(ARM_LBL + ' ' + e.sh + '/10');
  return bits.join(' · ');
}
function entryLines(e, long){
  var ps = parseSid(e.s), items = itemsOf(ps.w, ps.s), out = [], ticks = [], seen = {};
  items.forEach(function(it){
    if (seen[it.x]) return; seen[it.x] = 1;
    var ex = it.ex, sets = doneSets(e, it.x);
    if (ex.t === 'tick'){ if (it.b !== 'warm' && it.b !== 'cool' && it.b !== 'sh' && it.b !== 'shk') ticks.push(ex.n + ' ' + sets.length + '/' + it.p.sets); return; }
    if (!sets.length) return;
    out.push('• ' + ex.n + ': ' + setsLine(it.x, sets, ex) + (e.r[it.x] != null ? ' (Reserve ' + e.r[it.x] + ')' : ''));
  });
  var wq = items.filter(function(it){ return it.b === 'warm' || it.b === 'sh' || it.b === 'shk'; }), warm = wq.filter(function(it){ return !it.opt; }), wd = warm.filter(function(it){ return doneSets(e, it.x).length >= it.p.sets; }).length;
  var od = wq.filter(function(it){ return it.opt && doneSets(e, it.x).length; }).map(function(it){ return it.ex.n; });
  if (long && ticks.length) out.push('• ' + ticks.join(' · '));
  if (long && warm.length) out.push('• Aufwärmen & Schulter: ' + (wd === warm.length ? 'komplett' : wd + ' von ' + warm.length + ' Übungen') + (od.length ? ' · optional gemacht: ' + od.join(', ') : ''));
  ((e && e.z) || []).forEach(function(r){ out.push('• Zusätzlich: ' + zLine(r)); });
  return out;
}
function sendPayload(){ var pd = pending(); return { i: S.id, l: pd.l.map(function(e){ var c = JSON.parse(JSON.stringify(e)); delete c.local; return c; }), t: pd.t.map(function(t){ var c = JSON.parse(JSON.stringify(t)); delete c.local; return c; }) }; }
var SEND = { json: '', zip: '' };
function currentCode(){
  var json = JSON.stringify(sendPayload());
  if (SEND.json === json && SEND.zip) return SEND.zip;
  return CODE_TAG + ':' + b64e(json);
}
function refreshZip(){
  if (!canZip()) return;
  var json = JSON.stringify(sendPayload());
  if (SEND.json === json && SEND.zip) return;
  SEND.json = json; SEND.zip = '';
  zipB64(json).then(function(b){
    if (SEND.json !== json) return;
    var z = CODE_TAG + 'z:' + b, plain = CODE_TAG + ':' + b64e(json);
    SEND.zip = z.length < plain.length ? z : plain;
    var a = document.getElementById('wa-link'); if (a) a.href = waHref();
  }).catch(function(){});
}
function buildSendText(){
  var pd = pending(), now = todayISO(), w = curWeek(), ph = w != null ? phaseOfWeek(w) : null;
  var L0 = [TITLE + ' – Stand ' + (S.profile.name ? 'von ' + S.profile.name + ', ' : 'vom ') + fmtWd(now) + now.slice(0, 4)];
  if (ph){ var wc = weekCount(w); L0.push('Woche ' + w + ' · ' + PH_WORD + ' ' + ph.no + ' ' + ph.name + ' · ' + wc.done + ' von ' + wc.tot + ' Einheiten erledigt'); }
  if (!pd.l.length && !pd.t.length){ L0.push('', 'Nichts Neues seit dem letzten Mal – nur zur Info.'); return L0.join('\n'); }
  var old = addDays(now, -10);
  pd.l.forEach(function(e){
    L0.push('', entryHead(e));
    var long = entryDate(e) >= old || pd.l.length <= 6;
    if (long){ entryLines(e, true).forEach(function(x){ L0.push(x); }); if (e.n) L0.push('„' + e.n + '“'); }
  });
  if (pd.t.length){
    L0.push('', 'Tests:');
    pd.t.slice().sort(function(a, b){ return a.d < b.d ? -1 : 1; }).forEach(function(t){ L0.push(fmtShort(t.d) + ' ' + testLine(t)); });
  }
  L0.push('', 'Code für ' + TITLE + ' (bitte mitkopieren):', currentCode());
  return L0.join('\n');
}
function waHref(){ return 'https://wa.me/' + waNumber() + '?text=' + encodeURIComponent(buildSendText()); }
function markSent(){ lsSet(LK('sent'), todayISO()); }
// ---------- Selbst-Modus: Trainer und Athlet in einer Person – Einträge landen direkt im Plan ----------
function selfOn(){ return SELF && MODE === 'writer'; }
function selfSync(msg){
  if (!selfOn()) return false;
  flushNow();
  var pd = pending(); if (!pd.l.length && !pd.t.length) return false;
  var add = pd.l.map(function(x){ var c = JSON.parse(JSON.stringify(x)); delete c.local; return normEntry(c); }).filter(Boolean);
  var tadd = pd.t.map(function(x){ var c = JSON.parse(JSON.stringify(x)); delete c.local; return normTest(c); }).filter(Boolean);
  commit(function(s){
    add.forEach(function(x){ var b = s.log[x.s]; if (!b || x.t > b.t) s.log[x.s] = x; });
    var idx = {}; s.tests.forEach(function(t, i){ idx[t.id] = i; });
    tadd.forEach(function(t){ var i = idx[t.id]; if (i == null) s.tests.push(t); else if (t.t > s.tests[i].t) s.tests[i] = t; });
    s.imported = new Date().toISOString();
  }, true);
  if (msg) toast(msg);
  return true;
}
function copyText(text, okMsg, onFail){
  try { navigator.clipboard.writeText(text).then(function(){ toast(okMsg); }, function(){ onFail(); }); } catch (e) { onFail(); }
}
function importCode(){
  var box = document.getElementById('imp-code'), txt = box ? box.value : '';
  var m = new RegExp(CODE_TAG + '(z?):([A-Za-z0-9+/=]+)').exec(txt || '');
  if (!m){ toast(/nur zur Info/.test(txt || '') ? 'Diese Nachricht ist nur zur Info – es gibt nichts zu übernehmen.' : 'Kein Code gefunden. Bitte die ganze Nachricht einfügen.'); return; }
  var p = m[1] === 'z' ? (canZip() ? unzipB64(m[2]) : Promise.reject(new Error('nozip'))) : Promise.resolve().then(function(){ return b64d(m[2]); });
  p.then(function(json){ applyImport(parseJSON(json)); }, function(err){ toast(err && err.message === 'nozip' ? 'Dieser Browser kann den Code nicht entpacken. Bitte in Safari oder Chrome öffnen.' : 'Der Code ist unvollständig. Bitte die ganze Nachricht einfügen.'); });
}
function applyImport(obj){
  if (!obj || typeof obj !== 'object' || !Array.isArray(obj.l)){ toast('Der Code ist unvollständig. Bitte die ganze Nachricht einfügen.'); return; }
  if (obj.i && obj.i !== S.id){ toast('Diese Nachricht gehört zu einem anderen Trainingsplan.'); return; }
  var add = obj.l.map(normEntry).filter(Boolean), tadd = (Array.isArray(obj.t) ? obj.t : []).map(normTest).filter(Boolean);
  if (!add.length && !tadd.length){ toast('Nichts zu übernehmen – die Nachricht enthält keine neuen Einträge.'); return; }
  function merge(s){
    var n = { l: 0, t: 0 };
    add.forEach(function(e){ var b = s.log[e.s]; if (!b || e.t > b.t){ s.log[e.s] = e; n.l++; } });
    var idx = {}; s.tests.forEach(function(t, i){ idx[t.id] = i; });
    tadd.forEach(function(t){ var i = idx[t.id]; if (i == null){ s.tests.push(t); n.t++; } else if (t.t > s.tests[i].t){ s.tests[i] = t; n.t++; } });
    return n;
  }
  var cnt = merge(JSON.parse(JSON.stringify(S)));
  if (!cnt.l && !cnt.t){ toast('Alles aus dieser Nachricht ist schon im Plan.'); return; }
  commit(function(s){ merge(s); s.imported = new Date().toISOString(); }, true);
  var box = document.getElementById('imp-code'); if (box) box.value = '';
  var parts = [];
  if (cnt.l) parts.push(cnt.l + (cnt.l === 1 ? ' Einheit' : ' Einheiten'));
  if (cnt.t) parts.push(cnt.t + (cnt.t === 1 ? ' Testwert' : ' Testwerte'));
  toast('Übernommen: ' + parts.join(', ') + '.');
}

// ---------- Tests ----------
function testDef(k){ return TDEF[k] || null; }
function testsOf(k){ return allTests().filter(function(t){ return t.k === k; }).sort(function(a, b){ return a.d < b.d ? -1 : (a.d > b.d ? 1 : a.t - b.t); }); }
function sym(t){ if (!t || t.l == null || t.r == null || !(Math.max(t.l, t.r) > 0)) return null; return Math.round(Math.min(t.l, t.r) / Math.max(t.l, t.r) * 100); }
function testLine(t){
  var def = testDef(t.k); if (!def) return '';
  if (def.kind === 'lr'){ var s = sym(t); return def.name + ': L ' + fmtNum(t.l) + ' · R ' + fmtNum(t.r) + ' ' + def.unit + (s != null && !def.pain ? ' (' + s + ' %)' : ''); }
  if (def.kind === 'rm'){ var est = rmE1(t), r = def.rm; return def.name + ': ' + fmtNum(t.v) + ' kg' + (r.hand ? ' je Hand' : '') + ' × ' + t.n + ' (Reserve ' + t.q + ') → Kraft-Schätzwert ' + fmtNum(Math.round(est * 2) / 2) + ' kg' + (r.rel && S.profile.bw ? ' = ' + relTxt(est) : ''); }
  return def.name + ': ' + fmtNum(t.v) + ' ' + def.unit;
}
// Testfenster: Eingang (Woche 0–2), Mitte (Woche 4–6), Ende (ab Woche 8)
var TWIN = [['start','Eingang',-8,2],['mid','Mitte',4,6],['end','Ende',8,99]];
function testIn(k, win){
  var a = testsOf(k).filter(function(t){ var w = weekOf(t.d); return w != null && w >= win[2] && w <= win[3]; });
  return a.length ? a[a.length - 1] : null;
}

// ---------- Speichern (Seite schreibt sich selbst neu) ----------
function resetCss(){
  try { var all = document.head ? document.head.querySelectorAll('style') : []; for (var i = 0; i < all.length; i++){ var t = all[i].textContent; if (t && /safe-area-inset/.test(t) && /\[hidden\]/.test(t)) return t; } } catch (e) {}
  return FALLBACK_RESET;
}
function buildDocument(state){
  var json = JSON.stringify(state).replace(/</g, '\\u003c');
  return '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>' + resetCss() + '</style></head><body>'
    + '<title>' + TITLE + '</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n'
    + '<link rel="stylesheet" href="' + FONT_HREF + '">\n'
    + '<style id="fk-style">' + SRC.style + '</style>\n'
    + '<script type="application/json" id="fk-state">' + json + '<\/script>\n'
    + SHELL + '\n'
    + '<script id="fk-app">' + SRC.app + '<\/script>\n'
    + '</body></html>';
}
function uiSnapshot(){ return { tab: UI.tab, sess: UI.sess, back: UI.backSess, week: UI.week, lift: UI.lift, y: window.scrollY, edit: !!UI.editProfile, refs: !!UI.refsOpen, tdraft: UI.tdraft }; }
function stashLocal(){
  if (MODE === 'reader') return;
  ssSet('fk-pending', { after: SAVE.busy ? SAVE.inflight : (S.saveId || '-'), at: Date.now(), state: S });
}
function commit(fn, now){
  if (MODE === 'reader'){ toast('Den Plan bearbeitet ' + therNom() + '.'); return false; }
  fn(S); SAVE.err = ''; invalidate();
  stashLocal();
  renderAll();
  scheduleSave(now);
  return true;
}
function formHeld(){ return MODE !== 'reader' && UI.editProfile; }
function pointerHeld(){ return ACT.down && Date.now() - ACT.downAt < 4000; }
var FINE = (function(){ try { return window.matchMedia('(hover: hover) and (pointer: fine)').matches; } catch (e) { return false; } })();
function typingNow(){ return fieldFocused() && !(FINE && Date.now() - ACT.last > 5000); }
function scheduleSave(now){
  if (now) SAVE.urgent = true;
  SAVE.state = (!SAVE.urgent && formHeld()) ? 'dirty' : 'pending';
  updateSaveBadge();
  armSave(now ? 120 : SAVE_DELAY);
}
function armSave(ms){ clearTimeout(SAVE.timer); SAVE.timer = setTimeout(saveTick, Math.max(40, ms)); }
function saveTick(){
  if (SAVE.state !== 'pending' && SAVE.state !== 'dirty') return;
  if (MODE === 'boot') return armSave(500);
  if (SAVE.busy){ SAVE.again = true; return; }
  if (typingNow() || pointerHeld()) return armSave(600);
  if (!SAVE.urgent){
    var idle = Date.now() - ACT.last;
    if (idle < IDLE_MIN) return armSave(IDLE_MIN - idle + 60);
    if (formHeld() && idle < FORM_IDLE){ if (SAVE.state !== 'dirty'){ SAVE.state = 'dirty'; updateSaveBadge(); } return armSave(1000); }
  }
  doPublish();
}
function doPublish(){
  clearTimeout(SAVE.timer);
  SAVE.urgent = false;
  if (MODE !== 'writer' || !NS.artifact){ SAVE.state = 'idle'; updateSaveBadge(); return; }
  if (SAVE.busy){ SAVE.again = true; return; }
  SAVE.busy = true; SAVE.state = 'saving'; updateSaveBadge();
  var snap = JSON.parse(JSON.stringify(S));
  snap.rev = (S.rev || 0) + 1; snap.saveId = rid(); snap.updated = new Date().toISOString();
  SAVE.inflight = snap.saveId;
  ssSet('fk-pending', { saveId: snap.saveId, at: Date.now(), state: snap });
  ssSet('fk-ui', uiSnapshot());
  if (TOAST.msg && Date.now() - TOAST.at < 4000) ssSet('fk-flash', { msg: TOAST.msg, at: Date.now() });
  var html = buildDocument(snap);
  Promise.resolve().then(function(){ return NS.artifact.publish(html); }).then(function(){
    S.rev = snap.rev; S.saveId = snap.saveId; S.updated = snap.updated;
    SAVE.busy = false; SAVE.retried = false; SAVE.state = 'saved'; updateSaveBadge();
    if (SAVE.again){ SAVE.again = false; stashLocal(); scheduleSave(); }
  }, function(err){
    SAVE.busy = false;
    var code = (err && err.code) || 'upstream_error';
    if (code === 'conflict'){ SAVE.state = 'saving'; updateSaveBadge(); return; }
    if (['not_writer', 'not_granted', 'not_declared', 'consent_required', 'capability_disabled', 'capability_removed', 'read_only_path'].indexOf(code) >= 0){ ssDel('fk-pending'); goReader('nowriter'); return; }
    stashLocal();
    if (code === 'rate_limited'){ SAVE.state = 'pending'; updateSaveBadge(); armSave(8000 + Math.random() * 4000); return; }
    if (code === 'upstream_error' && !SAVE.retried){ SAVE.retried = true; SAVE.state = 'pending'; updateSaveBadge(); armSave(1200 + Math.random() * 1600); return; }
    SAVE.retried = false; SAVE.state = 'error';
    SAVE.err = code === 'too_large' ? 'Der Stand ist zu groß zum Speichern. Bitte eine Sicherung speichern und alte Einträge löschen.' : 'Speichern hat gerade nicht geklappt. Deine Änderung ist noch auf dieser Seite – tippe auf „Erneut speichern“.';
    renderAll();
  });
}
function goReader(why){
  clearTimeout(SAVE.timer);
  MODE = 'reader'; WHY = why || ''; SAVE.state = 'ro'; UI.editProfile = false; CONFLICT = null;
  S = normalize(parseJSON(ORIG_TEXT)); invalidate();
  applyLocal();
  if (UI.view == null) UI.view = 'ath';
  renderAll();
  toast('Den Plan bearbeitet ' + therNom() + '. Deine Einträge speicherst du auf diesem Gerät.');
}
function setMode(m, why){
  MODE = m; WHY = why || ''; invalidate();
  if (UI.view == null) UI.view = (m === 'writer' && !SELF) ? 'pro' : 'ath';
  if (m !== 'writer'){ clearTimeout(SAVE.timer); SAVE.state = 'ro'; UI.editProfile = false; CONFLICT = null; S = normalize(parseJSON(ORIG_TEXT)); applyLocal(); }
  else if (SAVE.state !== 'pending' && SAVE.state !== 'dirty') SAVE.state = 'saved';
  if (m === 'writer' && !S.profile.name) UI.editProfile = true;
  if (fieldFocused()){ UI.stale = true; updateSaveBadge(); return; }
  renderAll();
}
function safeUse(n){ try { return Promise.resolve(window.claude.use(n)).catch(function(){ return null; }); } catch (e) { return Promise.resolve(null); } }
function initCaps(){
  var c = window.claude;
  if (!c || typeof c.use !== 'function'){ setMode('reader', 'standalone'); return; }
  Promise.all([safeUse('artifact'), safeUse('user'), safeUse('downloads')]).then(function(r){
    NS.artifact = r[0]; NS.user = r[1]; NS.downloads = r[2];
    if (!NS.artifact){ setMode('reader', 'standalone'); return; }
    // Nur wer neue Versionen veröffentlichen darf (Olli), bearbeitet den Plan. Die Athletin nutzt den Link auf ihrem Gerät.
    if (!NS.user || typeof NS.user.canEdit !== 'function'){ setMode('reader', 'nouser'); return; }
    Promise.resolve().then(function(){ return NS.user.canEdit(); }).catch(function(){ return false; })
      .then(function(can){ if (can === true) setMode('writer'); else setMode('reader', 'nowriter'); });
  });
}
function saveFile(filename, data, okMsg){
  if (!NS.downloads){ toast('Speichern als Datei ist hier nicht verfügbar.'); return; }
  Promise.resolve().then(function(){ return NS.downloads.save({ filename: filename, data: data }); }).then(function(r){
    toast(r && r.status === 'delivered' ? 'Übergeben.' : okMsg);
  }, function(err){
    var c = (err && err.code) || '';
    if (c === 'declined') toast('Speichern abgebrochen.');
    else if (c === 'rate_limited') toast('Bitte kurz warten und noch einmal tippen.');
    else if (['unavailable', 'not_granted', 'capability_disabled', 'capability_removed'].indexOf(c) >= 0){ NS.downloads = null; renderAll(); toast('Speichern als Datei ist hier nicht verfügbar.'); }
    else toast('Speichern hat nicht geklappt.');
  });
}

// ---------- Athletin: Eintragen ----------
function canLog(){ return MODE === 'reader' || (SELF && MODE === 'writer'); }
function getEntry(sid){ var e = L()[sid]; return e ? JSON.parse(JSON.stringify(e)) : null; }
function newEntry(sid){ var ps = parseSid(sid); return { s: sid, d: '', x: {}, r: {}, e: null, m: SESS[ps.s].min, fr: null, k: null, ks: '', o: null, sh: null, n: '', f: 0, t: Date.now() }; }
function putEntry(e, quiet){
  e.t = Date.now(); if (!e.d || !e.f) e.d = todayISO();
  var map = localLog(); var n = normEntry(e); if (!n) return false;
  map[n.s] = n;
  var ok = saveLocalLog(map);
  if (!ok && !quiet) toast('Auf diesem Gerät kann nichts gespeichert werden (privates Fenster?). Schick deine Werte direkt an ' + therAcc() + '.');
  return ok;
}
var PENDING_SET = null;
var flushSet = debounce(function(){ if (PENDING_SET){ var e = PENDING_SET; PENDING_SET = null; putEntry(e, true); } }, 400);
function setFromInput(t){
  var key = t.getAttribute('data-set').split('|'), sid = UI.sess, x = key[0], i = +key[1], j = +key[2];
  if (!sid || !canLog()) return;
  var e = PENDING_SET && PENDING_SET.s === sid ? PENDING_SET : (getEntry(sid) || newEntry(sid));
  var ex = EX[x], nv = ex.t === 'kg' ? 2 : (ex.t === 'tick' ? 0 : 1);
  var arr = e.x[x] || []; while (arr.length <= i){ var row = []; for (var q = 0; q < nv; q++) row.push(null); row.push(0); arr.push(row); }
  var v = num(t.value); arr[i][j] = v; e.x[x] = arr;
  PENDING_SET = e; flushSet();
}

// ---------- Bausteine ----------
function ref(list){ if (!isPro() || !list || !list.length) return ''; return list.map(function(n){ return '<a class="ref" href="#q' + n + '" data-act="gotoref" data-n="' + n + '">[' + n + ']</a>'; }).join(''); }
function proBox(list, title){
  if (!isPro() || !list || !list.length) return '';
  return '<div class="pro"><h4>' + esc(title || 'Fachinfo für Olli') + '</h4><ul>' + list.map(function(x){ return '<li>' + esc(x[0]) + ref(x[1]) + '</li>'; }).join('') + '</ul></div>';
}
function zone(v){ return v == null ? -1 : (v <= 2 ? 0 : (v <= 4 ? 1 : 2)); }
function fzone(v){ return v == null ? -1 : (v >= 7 ? 0 : (v >= 4 ? 1 : 2)); }
function freshChip(v, label){ var z = fzone(v); if (z < 0) return ''; var c = ['ok', 'warn', 'bad'][z], n = ['frisch', 'mittel', 'platt'][z]; return '<span class="chip ' + c + '"><i></i>' + (label ? esc(label) + ' ' : '') + v + '/10 · ' + n + '</span>'; }
function zoneChip(v, label){ var z = zone(v); if (z < 0) return ''; var c = ['ok', 'warn', 'bad'][z], n = ['Grün', 'Gelb', 'Rot'][z]; return '<span class="chip ' + c + '"><i></i>' + (label ? esc(label) + ' ' : '') + v + '/10 · ' + n + '</span>'; }
function chip(cls, text){ return '<span class="chip ' + (cls || '') + '">' + (cls && cls !== 'acc' ? '<i></i>' : '') + text + '</span>'; }
function phChip(ph){ return '<span class="phchip"><i style="background:' + ph.col + '"></i>' + PH_WORD + ' ' + ph.no + ' · ' + esc(ph.name) + '</span>'; }
function field(label, inner, forId, help){
  return '<div class="field">' + (forId ? '<label for="' + forId + '">' + esc(label) + '</label>' : '<span class="flabel">' + esc(label) + '</span>') + inner + (help ? '<span class="help">' + esc(help) + '</span>' : '') + '</div>';
}
function selectHtml(id, list, val, attrs){
  return '<select class="inp" id="' + id + '" ' + (attrs || '') + '>' + list.map(function(o){ return '<option value="' + esc(o[0]) + '"' + (o[0] === val ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
}
function segHtml(name, label, list, val, attrs){
  return '<fieldset class="field" style="border:0;padding:0;margin:0"><legend class="flabel" style="padding:0;margin-bottom:6px;font-size:14px;font-weight:600;color:var(--ink-2)">' + esc(label) + '</legend><div class="seg">'
    + list.map(function(o){ var id = name + '-' + (o[0] || 'x'); return '<input type="radio" name="' + name + '" id="' + id + '" value="' + esc(o[0]) + '"' + (String(val) === String(o[0]) ? ' checked' : '') + ' ' + (attrs || '') + '><label for="' + id + '">' + esc(o[1]) + '</label>'; }).join('')
    + '</div></fieldset>';
}
function painHtml(name, label, val, attrs){
  var h = '<fieldset class="field" style="border:0;padding:0;margin:0"><legend class="flabel" style="padding:0;margin-bottom:6px;font-size:14px;font-weight:600;color:var(--ink-2)">' + esc(label) + '</legend><div class="pain">';
  for (var i = 0; i <= 10; i++){ var id = name + '-' + i; h += '<input type="radio" name="' + name + '" id="' + id + '" value="' + i + '"' + (String(val) === String(i) ? ' checked' : '') + ' ' + (attrs || '') + '><label for="' + id + '" class="z' + zone(i) + '">' + i + '</label>'; }
  return h + '</div><div class="pain-scale"><span>0 = kein Schmerz</span><span>10 = stärkster</span></div></fieldset>';
}
function rpeHtml(name, label, val, attrs){
  var h = '<fieldset class="field" style="border:0;padding:0;margin:0"><legend class="flabel" style="padding:0;margin-bottom:6px;font-size:14px;font-weight:600;color:var(--ink-2)">' + esc(label) + '</legend><div class="rpe">';
  for (var i = 0; i <= 10; i++){ var id = name + '-' + i; h += '<input type="radio" name="' + name + '" id="' + id + '" value="' + i + '"' + (String(val) === String(i) ? ' checked' : '') + ' ' + (attrs || '') + '><label for="' + id + '">' + i + '</label>'; }
  return h + '</div><div class="pain-scale"><span>0 = ganz locker</span><span>5 = schwer</span><span>10 = maximal</span></div></fieldset>';
}
function freshHtml(name, label, val, attrs){
  var h = '<fieldset class="field" style="border:0;padding:0;margin:0"><legend class="flabel" style="padding:0;margin-bottom:6px;font-size:14px;font-weight:600;color:var(--ink-2)">' + esc(label) + '</legend><div class="pain">';
  for (var i = 0; i <= 10; i++){ var id = name + '-' + i; h += '<input type="radio" name="' + name + '" id="' + id + '" value="' + i + '"' + (String(val) === String(i) ? ' checked' : '') + ' ' + (attrs || '') + '><label for="' + id + '" class="z' + fzone(i) + '">' + i + '</label>'; }
  return h + '</div><div class="pain-scale"><span>0 = völlig platt</span><span>10 = topfit</span></div></fieldset>';
}
function ampelBox(list, rule){
  list = list || AMPEL;
  return '<div class="ampel">' + list.map(function(a){ return '<div class="amp ' + a.c + '"><span class="lamp"><i></i>' + esc(a.l) + '</span><span>' + esc(a.t) + '</span></div>'; }).join('') + '</div>'
    + (rule === false ? '' : '<p><b>Die 24-Stunden-Regel:</b> ' + esc(RULE24) + '</p>');
}

// ---------- Anzeigetafel, Banner, Tabs ----------
function saveBadge(){
  if (MODE === 'boot') return '<span class="save" data-s="boot" id="fk-save"><i></i>Verbinde …</span>';
  if (MODE === 'reader') return '<span class="save" data-s="ro" id="fk-save"><i></i>' + (WHY === 'standalone' ? 'Auf diesem Gerät' : 'Gespeichert auf diesem Gerät') + '</span>';
  var map = { idle: 'Bereit', pending: 'Änderung wird gespeichert …', dirty: 'Noch nicht gespeichert', saving: 'Speichert …', saved: 'Gespeichert', error: 'Nicht gespeichert' };
  var t = map[SAVE.state] || 'Bereit';
  if ((SAVE.state === 'saved' || SAVE.state === 'idle') && S.updated){ var d = new Date(S.updated); if (!isNaN(d)){ var iso = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); t = 'Gespeichert · ' + (iso === todayISO() ? pad(d.getHours()) + ':' + pad(d.getMinutes()) : pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.'); } }
  var ds = SAVE.state === 'idle' ? 'saved' : SAVE.state === 'dirty' ? 'pending' : SAVE.state;
  if (SELF && ds === 'saved'){ var pdx = pending(); if (pdx.l.length || pdx.t.length){ t = 'Noch nicht im Plan'; ds = 'pending'; } }
  return '<span class="save" data-s="' + ds + '" id="fk-save" role="status"><i></i>' + esc(t) + '</span>';
}
function updateSaveBadge(){ var el = document.getElementById('fk-save'); if (el) el.outerHTML = saveBadge(); }
function board(){
  var w = curWeek(), ph = w != null ? phaseOfWeek(w) : null, wt, et = '–', es = '', title, sub;
  if (w == null || w < 1){ wt = '0'; title = 'Start am ' + fmtWd(startISO()); sub = 'Vorbereitung'; }
  else if (w > LAST_WEEK){ wt = '✓'; title = 'Block geschafft'; sub = 'Weiter mit dem nächsten Block'; }
  else { var wc = weekCount(w); wt = String(w); et = String(wc.done); es = '<small>/' + wc.tot + '</small>'; title = WEEKS[w].t; sub = PH_WORD + ' ' + ph.no + ' · ' + ph.name; }
  return '<header class="board">'
    + '<div class="board-top"><span class="brand">' + esc(TITLE) + '</span>' + saveBadge() + '</div>'
    + '<div class="board-main">'
    + '<div class="cell"><span class="lbl">Woche</span><span class="val">' + esc(wt) + (w != null && w >= 1 && w <= MAIN_WEEKS ? '<small>/' + MAIN_WEEKS + '</small>' : '') + '</span></div>'
    + '<div class="cell"><span class="lbl">Einheiten</span><span class="val">' + esc(et) + es + '</span></div>'
    + '<div class="board-info"><div class="who">' + (S.profile.name ? esc(S.profile.name) + ' · ' : '') + esc(POSITION) + '</div><div class="what">' + esc(sub) + '</div><div class="ph">' + esc(title) + '</div></div>'
    + '</div>'
    + '<div class="board-foot"><span class="hint">Start ' + fmtShort(startISO()) + ' · ' + esc(GOAL_SHORT) + '</span>'
    + '<span class="viewtog" role="group" aria-label="Ansicht"><button type="button" data-act="view" data-v="ath" aria-pressed="' + (!isPro()) + '">' + esc(VIEW_LBL[0]) + '</button><button type="button" data-act="view" data-v="pro" aria-pressed="' + isPro() + '">' + esc(VIEW_LBL[1]) + '</button></span></div>'
    + '</header>';
}
function banners(){
  var h = '';
  if (CONFLICT) h += '<div class="banner bad" role="alert">' + ICON.alert + '<div class="b-body"><b>Eine Änderung wurde nicht gespeichert.</b><p>Gleichzeitig wurde eine andere Version gespeichert – die siehst du jetzt. Deine letzte Änderung kannst du übernehmen oder verwerfen.</p><div class="row"><button class="btn sm pri" data-act="conflict-apply">Meine Änderung übernehmen</button><button class="btn sm" data-act="conflict-drop">Verwerfen</button></div></div></div>';
  if (SAVE.err) h += '<div class="banner warn" role="alert">' + ICON.alert + '<div class="b-body"><p>' + esc(SAVE.err) + '</p><div class="row"><button class="btn sm" data-act="retry-save">Erneut speichern</button></div></div></div>';
  if (MODE === 'reader' && WHY === 'standalone') h += '<div class="banner info">' + ICON.info + '<div class="b-body"><p>Deine Einträge bleiben auf diesem Gerät' + (SELF ? '.' : ' – schick sie mit „Per WhatsApp schicken“ an ' + esc(therAcc()) + '.') + '</p></div></div>';
  return h;
}
var TABS = [['start', 'Überblick', 'home'], ['plan', 'Plan', 'plan'], ['log', 'Protokoll', 'log'], ['tests', 'Tests', 'gauge'], ['infos', 'Infos', 'info']];
if (!TESTS.length && !RMT.length) TABS = TABS.filter(function(t){ return t[0] !== 'tests'; });
function tabs(){
  return '<nav class="tabs" aria-label="Bereiche"><div class="tabs-in" role="tablist">' + TABS.map(function(t){
    return '<button type="button" class="tab" role="tab" id="tab-' + t[0] + '" aria-selected="' + (UI.tab === t[0]) + '" data-act="tab" data-tab="' + t[0] + '">' + ICON[t[2]] + '<span>' + t[1] + '</span></button>';
  }).join('') + '</div></nav>';
}

// ---------- Überblick ----------
function welcomeCard(){
  if (MODE !== 'reader' || lsGet(LK('welcome'), 0)) return '';
  var t = therNom();
  return '<section class="card hl" aria-labelledby="h-wel"><p class="eyebrow">Willkommen' + (S.profile.name ? ', ' + esc(S.profile.name) : '') + '</p><h2 id="h-wel">So nutzt du ' + esc(TITLE) + '</h2>'
    + '<ol class="steps">'
    + '<li><b>Immer gleich öffnen:</b> über den Link von ' + esc(t) + ' bzw. dein Lesezeichen – immer im selben Browser (zum Beispiel Safari oder Chrome), nicht im privaten Modus. Deine Einträge werden auf diesem Handy gespeichert.</li>'
    + '<li><b>Im Training:</b> „Einheit öffnen“, pro Satz Gewicht und Wiederholungen eintragen und den Haken tippen. ' + esc(WEL_TRAIN) + '</li>'
    + '<li><b>Vor und nach dem Training:</b> Vorher antippen, wie frisch du dich fühlst – die Seite sagt dir, wie viel du heute machst. Nachher Anstrengung, ' + esc(WEL_PAIN) + ' antippen und „Einheit abschließen“.</li>'
    + '<li><b>Danach:</b> „Per WhatsApp schicken“ – nichts löschen, einfach senden. So sieht ' + esc(t) + ' genau, was du gemacht hast.</li>'
    + '</ol>' + guideLine() + '<div class="row"><button type="button" class="btn pri" data-act="welcome-ok">' + ICON.check + 'Alles klar</button></div></section>';
}
function selfWelcome(){
  if (lsGet(LK('welcome'), 0)) return '';
  return '<section class="card hl" aria-labelledby="h-wel"><p class="eyebrow">Willkommen' + (S.profile.name ? ', ' + esc(S.profile.name) : '') + '</p><h2 id="h-wel">So nutzt du ' + esc(TITLE) + '</h2><ol class="steps">'
    + '<li><b>Im Training:</b> „Einheit öffnen“, pro Satz Gewicht und Wiederholungen eintragen und den Haken tippen. ' + esc(WEL_TRAIN) + '</li>'
    + '<li><b>Vorher und nachher:</b> Vorher die Frische antippen. Nachher Anstrengung, ' + esc(WEL_PAIN) + ' antippen und „Einheit abschließen“.</li>'
    + '<li><b>Gespeichert wird beim Abschließen</b> – direkt im Plan, ohne WhatsApp. Oben rechts siehst du, ob alles gespeichert ist.</li>'
    + '<li><b>Ansicht:</b> „' + esc(VIEW_LBL[0]) + '“ ist das, was deine Athletinnen sehen. „' + esc(VIEW_LBL[1]) + '“ zeigt zusätzlich Fachinfos und Quellen.</li>'
    + '</ol><div class="row"><button type="button" class="btn pri" data-act="welcome-ok">' + ICON.check + 'Alles klar</button></div></section>';
}
function selfCard(){
  var pd = pending(), nl = pd.l.length, nt = pd.t.length, parts = [];
  if (!nl && !nt) return '';
  if (nl) parts.push(nl + (nl === 1 ? ' Einheit' : ' Einheiten'));
  if (nt) parts.push(nt + (nt === 1 ? ' Testwert' : ' Testwerte'));
  var busy = SAVE.state === 'saving' || SAVE.state === 'pending';
  return '<section class="card" aria-labelledby="h-self"><p class="eyebrow">Noch nicht im Plan</p><h3 id="h-self">' + parts.join(', ') + ' nur auf diesem Gerät</h3>'
    + '<p class="small">Eine begonnene Einheit bleibt auf diesem Gerät, bis du sie abschließt. Willst du den Stand schon jetzt sichern, speicher ihn im Plan – dann ist er auch auf deinen anderen Geräten da.</p>'
    + '<div class="row"><button type="button" class="btn pri" data-act="self-sync"' + (busy ? ' disabled' : '') + '>' + ICON.save + 'Jetzt im Plan speichern</button></div></section>';
}
function selfDelHtml(sid){
  return UI.confirm === 'del:' + sid ? '<div class="row"><button type="button" class="btn sm danger" data-act="del-yes" data-sid="' + sid + '">Ja, Einheit löschen</button><button type="button" class="btn sm" data-act="cancel">Abbrechen</button></div>' : '<div class="row"><button type="button" class="btn sm ghost" data-act="del-ask" data-sid="' + sid + '">' + ICON.trash + 'Einheit löschen</button></div>';
}
function guideLine(){
  return GUIDE_URL ? '<p class="small">Alles ausführlich zum Nachlesen – mit Tests, Ampel-Regeln und Spickzettel: <a href="' + esc(GUIDE_URL) + '" target="_blank" rel="noopener">Anleitung öffnen</a></p>' : '';
}
function msgCard(){
  if (!S.profile.msg) return '';
  return '<div class="banner info">' + ICON.info + '<div class="b-body"><b>Hinweis von ' + esc(therDat()) + '</b><p>' + esc(S.profile.msg) + '</p></div></div>';
}
function lastFinished(){ var a = entriesSorted().filter(function(e){ return e.f; }); return a.length ? a[a.length - 1] : null; }
function morningTarget(){
  if (!canLog()) return null;
  var e = lastFinished(); if (!e || e.o != null) return null;
  var d = daysBetween(entryDate(e), todayISO());
  return (d === 1 || d === 2) ? e : null;
}
function morningCard(){
  var e = morningTarget(); if (!e) return '';
  var ps = parseSid(e.s);
  return '<section class="card" aria-labelledby="h-mo"><p class="eyebrow">Morgen-Check</p><h3 id="h-mo">' + esc(MORNING_Q) + '</h3><p class="small muted">Nach ' + esc(SESS[ps.s].s) + ' vom ' + fmtWd(entryDate(e)) + '. Antippen reicht – wird gleich gespeichert.</p>'
    + painHtml('mo', PAIN_LBL + ' heute Morgen', null, 'data-mo="' + e.s + '"') + '</section>';
}
function kneeAlert(){
  var e = lastFinished(); if (!e) return '';
  var age = daysBetween(entryDate(e), todayISO()); if (age == null || age > 4) return '';
  var hp = Math.max(e.k == null ? -1 : e.k, e.o == null ? -1 : e.o), el = e.sh == null ? -1 : e.sh, mx = Math.max(hp, el), what = hp >= el ? PAIN_LBL : ARM_LBL;
  if (mx >= 5) return '<div class="banner bad">' + ICON.alert + '<div class="b-body"><b>Letzte Einheit: ' + what + ' rot (' + mx + '/10)</b><p>Heute keine Sprünge und die betroffenen Übungen abändern (Tab „Infos“)' + (SELF ? '.' : ' – und ' + esc(therDat()) + ' Bescheid geben.') + '</p></div></div>';
  if (mx >= 3) return '<div class="banner warn">' + ICON.alert + '<div class="b-body"><b>Letzte Einheit: ' + what + ' gelb (' + mx + '/10)</b><p>Heute nicht steigern. Fühlt es sich beim Aufwärmen normal an, geht es normal weiter.</p></div></div>';
  return '';
}
function weekStrip(w){
  var ph = phaseOfWeek(w); if (!ph) return '';
  var ws = weekStart(w), log = L(), byDay = {};
  ph.sess.forEach(function(s){ byDay[planDate(w, s)] = s; });
  var h = '<div class="wkstrip" role="list" aria-label="Woche ' + w + '">';
  for (var i = 0; i < 7; i++){
    var d = addDays(ws, i), g = gameOn(d), s = g ? null : byDay[d], st = s ? sessStatus(w, s, log) : 'rest';
    var cls = 'wkd' + (d === todayISO() ? ' today' : '') + (g ? ' game' : (st === 'done' ? ' done' : (st === 'part' ? ' part' : (st === 'rest' ? ' rest' : ''))));
    h += '<div class="' + cls + '" role="listitem"' + (g ? ' title="' + esc('Spiel: ' + g.t) + '"' : '') + '><span class="d">' + WD[wdOf(d)] + '</span><span class="s">' + (g ? 'Spiel' : (s ? esc(s) : '·')) + '</span><span class="n">' + fmtShort(d).slice(0, 3) + '</span></div>';
  }
  return h + '</div>';
}
function gameLine(w){
  if (!GAMES.length) return '';
  var g = gamesInWeek(w);
  if (!g.length) return '<p class="small muted"><span class="gamechip">' + ICON.ball + 'Diese Woche spielfrei</span></p>';
  return '<p class="small"><span class="gamechip">' + ICON.ball + '<b>Spiel:</b></span> ' + g.map(function(x){ return esc(gameText(x)); }).join(' und ') + '</p>';
}
function sessGameInfo(w, s, e){
  if (OFF[w] && OFF[w][s]) return { cls: 'info', ic: ICON.info, t: 'Diese Einheit entfällt', p: fmtWd(planDate(w, s)) + ': ' + OFF[w][s] + '.' };
  if (!GAMES.length) return null;
  var pd = planDate(w, s), g0 = gameOn(pd);
  if (g0) return { cls: 'info', t: 'Spieltag – diese Einheit entfällt', p: fmtWd(pd) + ': ' + g0.t + '. Höchstens die kurze Spieltag-Aktivierung (Infos → Häufige Fragen).' };
  var ref = (e && e.f && e.d) ? e.d : (weekOf(todayISO()) === w ? todayISO() : pd), g = nextGameFrom(ref, 2), c = s === 'C';
  if (SESS[s] && SESS[s].pre && g && g.inDays > 0) return { cls: 'info', t: (g.inDays === 1 ? 'Morgen' : 'In ' + g.inDays + ' Tagen') + ' ist Spiel – genau so geplant', p: gameText(g) + '. Kurz, schnell und frisch – so, wie es hier steht, nichts zusätzlich.' };
  if (g && g.inDays === 0) return { cls: 'warn', t: 'Heute ist Spiel', p: 'Heute keine Einheit – höchstens die kurze Spieltag-Aktivierung (Infos → Häufige Fragen).' };
  if (g && g.inDays === 1) return c ? { cls: 'info', t: 'Morgen ist Spiel – nur Aktivierung', p: gameText(g) + '. Kurz, schnell und frisch bleiben: die Extras fallen weg, nichts bis zur Grenze.' } : { cls: 'warn', t: 'Morgen ist Spiel', p: 'Heute nur verkürzt: Hauptübungen 2 Sätze mit Reserve 3, keine Nordic und kein Copenhagen. Besser die Einheit auf einen früheren Tag legen.' };
  if (g && g.inDays === 2) return c ? { cls: 'info', t: 'In 2 Tagen ist Spiel', p: 'Freitag wie geplant – nur die Extras weglassen.' } : { cls: 'warn', t: 'In 2 Tagen ist Spiel', p: 'Bei den Hauptübungen einen Satz weniger, keine Nordic und kein Copenhagen.' };
  if (c) return { cls: 'info', t: 'Morgen ist kein Spiel', p: 'Du darfst die Einheit voll machen – mit Extras.' };
  return null;
}
function sessGameBanner(w, s, e){
  var i = sessGameInfo(w, s, e); if (!i) return '';
  return '<div class="banner ' + i.cls + '">' + (i.ic || ICON.ball) + '<div class="b-body"><b>' + esc(i.t) + '</b><p>' + esc(i.p) + '</p></div></div>';
}
function freshCard(sid, e){
  var v = e && e.fr != null ? e.fr : null, z = fzone(v);
  return '<section class="card" aria-labelledby="h-fr"><p class="eyebrow">Kurz-Check vor dem Training</p><h3 id="h-fr">Wie frisch fühlst du dich heute?</h3>'
    + freshHtml('pre-fr', 'Frische', v, 'data-fr="' + sid + '"')
    + (z >= 0 ? '<div class="ampel" style="margin-top:10px"><div class="amp ' + ['g', 'y', 'r'][z] + '"><span class="lamp"><i></i>' + esc(FRESH[z].l) + '</span><span>' + esc(FRESH[z].t) + '</span></div></div>' : '<p class="small muted" style="margin-top:6px">Antippen reicht – wird gleich gespeichert. Danach siehst du, wie viel du heute machst.</p>')
    + '</section>';
}
function todayCard(){
  var n = nextSession();
  if (!n) return '';
  if (n.over) return '<section class="card hl"><p class="eyebrow">Geschafft</p><h2>Der Block ist durch</h2><p>' + esc(OVER_TEXT) + '</p></section>';
  if (n.pre) return '<section class="card hl" aria-labelledby="h-today"><p class="eyebrow">Bald geht’s los</p><h2 id="h-today">Start am ' + fmtWd(startISO()) + '</h2><p class="lead">Noch ' + n.days + (n.days === 1 ? ' Tag' : ' Tage') + '. ' + esc(PRE_TECH) + '</p>'
    + weekStrip(1) + '<div class="row"><button type="button" class="btn pri" data-act="open-sess" data-sid="' + sidOf(1, weekSess(1)[0] || 'A') + '">' + ICON.play + 'Erste Einheit ansehen</button><button type="button" class="btn" data-act="tab" data-tab="plan">' + ICON.plan + 'Ganzer Plan</button></div></section>';
  var w = n.w, ph = phaseOfWeek(w), wk = WEEKS[w];
  var head = '<p class="eyebrow">Woche ' + w + ' · ' + weekRange(w) + '</p>';
  if (n.weekDone){
    var nx = phaseOfWeek(w + 1);
    return '<section class="card hl" aria-labelledby="h-today">' + head + '<h2 id="h-today">Woche geschafft</h2><p class="lead">Alle Einheiten dieser Woche sind erledigt. Erholung gehört zum Plan – Schlaf und Essen machen jetzt die Arbeit.</p>' + weekStrip(w)
      + (nx ? '<p class="small muted">Nächste Woche: ' + esc(WEEKS[w + 1].t) + ' (' + esc(nx.name) + ').</p>' : '') + '</section>';
  }
  var s = n.s, m = SESS[s], id = sidOf(w, s), st = sessStatus(w, s), pd = planDate(w, s);
  var when = pd === todayISO() ? 'heute geplant' : (pd < todayISO() ? 'geplant war ' + fmtWd(pd) : 'geplant für ' + fmtWd(pd));
  return '<section class="card hl" aria-labelledby="h-today">' + head
    + '<h2 id="h-today">Als Nächstes: ' + esc(s) + ' · ' + esc(m.t) + '</h2>'
    + '<div class="row">' + phChip(ph) + chip('acc', 'ca. ' + m.min + ' min') + chip('', esc(when)) + (st === 'part' ? chip('warn', 'begonnen') : '') + '</div>'
    + '<p>' + esc(m.f) + '</p>'
    + '<p class="small muted"><b>Diese Woche:</b> ' + esc(wk.note) + '</p>' + gameLine(w)
    + testHint(w, s)
    + sessGameBanner(w, s, L()[id] || null)
    + weekStrip(w)
    + '<div class="row"><button type="button" class="btn pri" data-act="open-sess" data-sid="' + id + '">' + ICON.play + (st === 'part' ? 'Weitermachen' : 'Einheit öffnen') + '</button><button type="button" class="btn" data-act="plan-week" data-w="' + w + '">' + ICON.plan + 'Ganze Woche</button></div>'
    + '</section>';
}
// Hinweis im Überblick: In den Testwochen steht direkt dabei, was getestet und wo eingetragen wird
function testHint(w, s){
  var h = '';
  if (s === TEST_SESS && WEEKS[w] && WEEKS[w].test){
    h += '<div class="banner info">' + ICON.gauge + '<div class="b-body"><b>Diese Einheit mit Sprungtests</b><p>Nach dem Aufwärmen testen und die Werte im Tab „Tests“ eintragen – in der Einheit führt dich der Knopf „Testwerte jetzt eintragen“ hin.</p></div></div>';
  }
  if (RM_WEEK[w]){
    var lifts = itemsOf(w, s).filter(function(it){ return RM_BY_X[it.x]; }).map(function(it){ return it.ex.n; });
    if (lifts.length){
      var list = lifts.length > 1 ? lifts.slice(0, -1).join(', ') + ' und ' + lifts[lifts.length - 1] : lifts[0];
      h += '<div class="banner info">' + ICON.gauge + '<div class="b-body"><b>Diese Einheit mit Kraft-Test</b><p>Bei ' + esc(list) + ' machst du zuerst den Test im blauen Kasten „Zuerst: Kraft-Test“ – direkt in der Einheit eintragen und „Test speichern“. Daraus rechnet die Seite deine Gewichte.</p></div></div>';
    }
  }
  return h;
}
function sendCard(){
  if (MODE !== 'reader') return '';
  var pd = pending(), nl = pd.l.length, nt = pd.t.length, last = lsGet(LK('sent'), ''), parts = [];
  if (nl) parts.push(nl + (nl === 1 ? ' Einheit' : ' Einheiten'));
  if (nt) parts.push(nt + (nt === 1 ? ' Testwert' : ' Testwerte'));
  var info = parts.length ? 'Noch nicht bei ' + esc(therDat()) + ': <b>' + parts.join(', ') + '</b>.' : 'Gerade gibt es nichts Neues – alles ist bei ' + esc(therDat()) + '.';
  refreshZip();
  var noNum = !waNumber();
  return '<section class="card" aria-labelledby="h-send"><p class="eyebrow">Fortschritt teilen</p><h3 id="h-send">Stand an ' + esc(therAcc()) + ' schicken</h3>'
    + '<p>' + info + '</p>'
    + '<div class="row"><a class="btn pri" id="wa-link" href="' + esc(waHref()) + '" target="_blank" rel="noopener" data-act="sent-wa">' + ICON.send + 'Per WhatsApp schicken</a><button type="button" class="btn" data-act="copy-send">' + ICON.copy + 'Text kopieren</button></div>'
    + '<p class="small muted">' + (last ? 'Zuletzt geschickt am ' + fmtDate(last) + '. ' : '') + 'Am besten nach jeder Einheit schicken, spätestens sonntags. In WhatsApp einfach abschicken – gern mit eigener Nachricht dazu, aber den Text nicht kürzen.' + (noNum ? ' WhatsApp öffnet sich ohne Empfänger – wähle ' + esc(therAcc()) + ' aus.' : '') + '</p>'
    + (UI.sendText ? '<label class="small" for="send-box">Kopieren hat nicht automatisch geklappt – Text markieren und kopieren:</label><textarea class="inp codebox" id="send-box" readonly>' + esc(UI.sendText) + '</textarea>' : '')
    + '</section>';
}
function importCard(){
  if (MODE !== 'writer' || (SELF && !isPro())) return '';
  if (SELF) return '<section class="card" aria-labelledby="h-imp"><p class="eyebrow">Von einem anderen Gerät</p><h3 id="h-imp">Stand per Nachricht übernehmen</h3><p class="small">Nur nötig, wenn du ohne Anmeldung eingetragen und dir den Stand per WhatsApp geschickt hast: die ganze Nachricht hier einfügen.</p><label class="vh" for="imp-code">Nachricht</label><textarea class="inp codebox" id="imp-code" placeholder="Nachricht hier einfügen …"></textarea><div class="row"><button type="button" class="btn" data-act="import-code">' + ICON.open + 'Übernehmen</button></div></section>';
  return '<section class="card" aria-labelledby="h-imp"><p class="eyebrow">Nachricht der Athletin</p><h3 id="h-imp">Stand von ' + esc(who()) + ' übernehmen</h3>'
    + '<p class="small">Schickt dir ' + esc(who()) + ' ihren Stand per WhatsApp: die ganze Nachricht kopieren und hier einfügen. Einheiten mit allen Gewichten und Tests landen dann im Plan. Steht unten kein Code, ist die Nachricht nur zur Info.</p>'
    + '<label class="vh" for="imp-code">Nachricht der Athletin</label><textarea class="inp codebox" id="imp-code" placeholder="Nachricht hier einfügen …"></textarea>'
    + '<div class="row"><button type="button" class="btn pri" data-act="import-code">' + ICON.open + 'Übernehmen</button></div></section>';
}
function freshTrend(){
  var a = entriesSorted().filter(function(e){ return e.f && e.fr != null; });
  if (a.length < 2) return null;
  var last = a.slice(-3), prev = a.slice(-6, -3);
  function avg(l){ return l.reduce(function(s, e){ return s + e.fr; }, 0) / l.length; }
  var m = avg(last), p = prev.length ? avg(prev) : null, r1 = function(v){ return fmtNum(Math.round(v * 10) / 10); };
  if (a.slice(-2).every(function(e){ return e.fr <= 3; })) return { cls: 'bad', t: 'Frische zweimal in Folge platt', p: 'Die letzten beiden Einheiten mit Frische 3 oder weniger. Woche entlasten (das Optionale und Superset 2 streichen, Hauptübungen 1 Satz weniger) und ehrlich hinschauen: Schlaf, Stress, Arbeit, Krankheit?' };
  if (m <= 4) return { cls: 'warn', t: 'Frische niedrig (Ø ' + r1(m) + ')', p: 'Im Schnitt der letzten Einheiten eher müde. Belastung prüfen und bei Bedarf eine leichtere Woche einschieben.' };
  if (p != null && p - m >= 2) return { cls: 'warn', t: 'Frische sinkt', p: 'Die Frische ist um ' + r1(p - m) + ' Punkte gefallen (letzte 3 Einheiten gegenüber den 3 davor). Früh gegensteuern: weniger Umfang, das Optionale streichen.' };
  return null;
}
function statusCard(){
  if (MODE !== 'writer') return '';
  var e = lastFinished(), w = curWeek(), wc = (w != null && w >= 1 && w <= LAST_WEEK) ? weekCount(w) : null;
  var all = entriesSorted().filter(function(x){ return x.f; }), done = all.length, plan = plannedSoFar();
  var kv = [];
  kv.push([SELF ? 'Zuletzt im Plan gespeichert' : 'Zuletzt übernommen', fmtStamp(S.imported) || 'noch nichts']);
  if (wc) kv.push(['Diese Woche', wc.done + ' von ' + wc.tot + ' Einheiten']);
  kv.push(['Bisher erledigt', done + (plan ? ' von ' + plan + ' geplanten Einheiten' : ' Einheiten')]);
  var sqs = strengthSrc(MAIN_LIFT[0], 99);
  if (sqs && sqs.est) kv.push([MAIN_LIFT[1] + ' (Schätzwert)', fmtNum(Math.round(sqs.est * 2) / 2) + ' kg' + (S.profile.bw ? ' · ' + fmtNum(Math.round(sqs.est / S.profile.bw * 100) / 100) + ' × KG' : '')]);
  if (e) kv.push(['Letzte Einheit', fmtWd(entryDate(e)) + ' · ' + SESS[parseSid(e.s).s].s + (e.e != null ? ' · Anstrengung ' + e.e + '/10' : '')]);
  var knee = e ? (e.fr != null ? freshChip(e.fr, 'Frische') : '') + (e.k != null ? ' ' + zoneChip(e.k, PAIN_LBL) : '') + (e.o != null ? ' ' + zoneChip(e.o, 'morgens') : '') + (e.sh != null ? ' ' + zoneChip(e.sh, ARM_LBL) : '') : '', ft = freshTrend();
  return '<section class="card" aria-labelledby="h-st"><p class="eyebrow">Auf einen Blick</p><h3 id="h-st">Stand von ' + esc(who()) + '</h3>'
    + '<dl class="kv">' + kv.map(function(x){ return '<dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd>'; }).join('') + '</dl>'
    + (knee ? '<div class="row">' + knee + '</div>' : '')
    + (ft ? '<div class="banner ' + ft.cls + '">' + ICON.alert + '<div class="b-body"><b>' + esc(ft.t) + '</b><p>' + esc(ft.p) + '</p></div></div>' : '')
    + '<div class="row"><button type="button" class="btn sm" data-act="tab" data-tab="log">' + ICON.log + 'Protokoll öffnen</button></div></section>';
}
function stairCard(){
  var w = curWeek(), rows = '';
  rows += '<li class="goal"><span class="node">' + ICON.flag + '</span><div><div class="s-t">' + esc(STAIR_GOAL.t) + '</div><div class="s-n">' + esc(STAIR_GOAL.n) + '</div></div></li>';
  for (var i = PHASES.length - 1; i >= 0; i--){
    var ph = PHASES[i], first = ph.weeks[0], last = ph.weeks[ph.weeks.length - 1];
    var cls = (w != null && w > last) ? 'done' : ((w != null && w >= first && w <= last) ? 'cur' : '');
    var cnt = 0, tot = 0, log = L(); ph.weeks.forEach(function(k){ weekSess(k).forEach(function(s){ tot++; if (sessStatus(k, s, log) === 'done') cnt++; }); });
    rows += '<li class="' + cls + '"><span class="node">' + (cls === 'done' ? ICON.check : ph.no) + '</span><div><div class="s-t">' + PH_WORD + ' ' + ph.no + ': ' + esc(ph.name) + '</div><div class="s-n">' + esc(ph.goal) + ' <i>Dafür nötig: ' + esc(ph.need) + '.</i></div><div class="s-m">' + phaseRange(ph) + ' · ' + cnt + ' von ' + tot + ' Einheiten</div></div></li>';
  }
  rows += '<li class="done"><span class="node">' + ICON.start + '</span><div><div class="s-t">Start</div><div class="s-m">' + fmtWd(startISO()) + startISO().slice(0, 4) + '</div></div></li>';
  return '<section class="card" aria-labelledby="h-stair"><p class="eyebrow">Vom Ziel her gedacht</p><h2 id="h-stair">Der Weg bis Weihnachten</h2>'
    + '<p>' + esc(STAIR_TEXT) + '</p>'
    + '<ol class="stair">' + rows + '</ol>'
    + proBox(STAIR_PRO) + '</section>';
}
function profileCard(){
  if (MODE !== 'writer') return '';
  if (UI.editProfile) return profileForm();
  var p = S.profile;
  var kv = SELF ? [['Name', p.name || '–'], ['Körpergewicht', p.bw ? fmtNum(p.bw) + ' kg' : '–'], ['Start (Montag Woche 1)', fmtWd(p.start) + p.start.slice(0, 4)], [PAIN_LBL + ' meldet sich eher', optLabel(OPT.side, p.side) || 'noch unklar']] : [['Athletin', p.name || '–'], ['Position', POSITION], ['Körpergewicht', p.bw ? fmtNum(p.bw) + ' kg' : '–'], ['Start', fmtWd(p.start) + p.start.slice(0, 4)], ['Knie meldet sich eher', optLabel(OPT.side, p.side)], ['Ansprechpartner', p.ther || '–'], ['WhatsApp', p.phone || '–'], ['Hinweis an sie', p.msg || '–']];
  return '<section class="card" aria-labelledby="h-prof"><div class="row" style="justify-content:space-between"><div><p class="eyebrow">Einstellungen</p><h2 id="h-prof">' + (SELF ? 'Name & Plan' : 'Athletin & Plan') + '</h2></div><button type="button" class="btn sm" data-act="editprofile">Bearbeiten</button></div>'
    + '<dl class="kv">' + kv.map(function(x){ return '<dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd>'; }).join('') + '</dl></section>';
}
function profileForm(){
  if (SELF) return selfProfileForm();
  var p = S.profile, a = 'data-pf';
  return '<section class="card hl" aria-labelledby="h-pf"><p class="eyebrow">Einstellungen</p><h2 id="h-pf">Athletin & Plan</h2>'
    + '<p class="small muted">Gespeichert wird mit „Speichern“. Der Name ist für die Athletin sichtbar – Vorname oder Kürzel reicht.</p>'
    + '<p id="pf-err" role="alert" hidden></p>'
    + '<div class="grid2">'
    + field('Athletin (Vorname oder Kürzel)', '<input class="inp" type="text" id="pf-name" ' + a + '="name" maxlength="60" value="' + esc(p.name) + '" placeholder="z. B. Lena">', 'pf-name')
    + field('Körpergewicht (kg)', '<input class="inp" type="text" inputmode="decimal" id="pf-bw" ' + a + '="bw" maxlength="6" value="' + esc(p.bw != null ? fmtNum(p.bw) : '') + '">', 'pf-bw', 'Für die Startpunkte im Kraft-Test und den Vergleich mit dem Körpergewicht.')
    + field('Start (Montag von Woche 1)', '<input class="inp" type="date" id="pf-start" ' + a + '="start" value="' + esc(p.start) + '">', 'pf-start', 'Alle Wochen und Daten richten sich danach.')
    + field('Knie: welche Seite meldet sich eher?', selectHtml('pf-side', OPT.side, p.side, a + '="side"'), 'pf-side', 'Wird beim Eintragen von Beschwerden schon vorgewählt.')
    + field('Ansprechpartner', '<input class="inp" type="text" id="pf-ther" ' + a + '="ther" maxlength="80" value="' + esc(p.ther) + '">', 'pf-ther')
    + field('WhatsApp-Nummer', '<input class="inp" type="tel" id="pf-phone" ' + a + '="phone" maxlength="40" value="' + esc(p.phone) + '">', 'pf-phone', 'An diese Nummer schickt sie ihren Stand.')
    + '</div>'
    + field('Hinweis an die Athletin (erscheint oben im Überblick)', '<input class="inp" type="text" id="pf-msg" ' + a + '="msg" maxlength="300" value="' + esc(p.msg) + '" placeholder="z. B. Diese Woche Fokus auf saubere Landungen">', 'pf-msg')
    + '<div class="row"><button type="button" class="btn pri" data-act="doneprofile">' + ICON.check + 'Speichern</button>' + (p.name ? '<button type="button" class="btn" data-act="cancelprofile">Abbrechen</button>' : '') + '</div></section>';
}
function selfProfileForm(){
  var p = S.profile, a = 'data-pf';
  return '<section class="card hl" aria-labelledby="h-pf"><p class="eyebrow">Einstellungen</p><h2 id="h-pf">Name & Plan</h2>'
    + '<p class="small muted">Gespeichert wird mit „Speichern“.</p><p id="pf-err" role="alert" hidden></p>'
    + '<div class="grid2">'
    + field('Name', '<input class="inp" type="text" id="pf-name" ' + a + '="name" maxlength="60" value="' + esc(p.name) + '">', 'pf-name')
    + field('Körpergewicht (kg)', '<input class="inp" type="text" inputmode="decimal" id="pf-bw" ' + a + '="bw" maxlength="6" value="' + esc(p.bw != null ? fmtNum(p.bw) : '') + '">', 'pf-bw', 'Für den Vergleich mit dem Körpergewicht im Protokoll.')
    + field('Start (Montag von Woche 1)', '<input class="inp" type="date" id="pf-start" ' + a + '="start" value="' + esc(p.start) + '">', 'pf-start', 'Alle Wochen richten sich danach. Fällt eine ganze Woche aus, den Start eine Woche später setzen.')
    + field(PAIN_LBL + ': welche Seite meldet sich eher?', selectHtml('pf-side', OPT.side, p.side, a + '="side"'), 'pf-side', 'Wird beim Eintragen schon vorgewählt.')
    + '</div>'
    + '<div class="row"><button type="button" class="btn pri" data-act="doneprofile">' + ICON.check + 'Speichern</button><button type="button" class="btn" data-act="cancelprofile">Abbrechen</button></div></section>';
}
function peakCard(){
  if (typeof PEAK === 'undefined' || !PEAK) return '';
  var d = daysBetween(todayISO(), PEAK.d); if (d == null || d < 0) return '';
  var when = d === 0 ? 'Heute' : (d === 1 ? 'Morgen' : 'In ' + d + ' Tagen');
  return '<div class="banner info">' + ICON.ball + '<div class="b-body"><b>Stichtag – ' + esc(when) + ': ' + esc(PEAK.t) + ' (' + fmtWd(PEAK.d) + ')</b><p>' + esc(PEAK.p) + '</p></div></div>';
}
function viewStart(){
  if (MODE === 'writer'){
    if (UI.editProfile) return profileForm() + todayCard() + stairCard();
    if (SELF) return selfWelcome() + morningCard() + kneeAlert() + todayCard() + selfCard() + (isPro() ? statusCard() + importCard() : '') + stairCard() + profileCard();
    return importCard() + statusCard() + peakCard() + todayCard() + stairCard() + profileCard();
  }
  return welcomeCard() + msgCard() + morningCard() + kneeAlert() + peakCard() + todayCard() + sendCard() + stairCard();
}

// ---------- Plan ----------
function choiceCard(){
  if (!CHOICES.length) return '';
  var wr = MODE === 'writer';
  return '<section class="card" aria-labelledby="h-choice">' + (SELF ? '<p class="eyebrow">' + esc(CHOICE_EYEBROW) + '</p><h2 id="h-choice">' + esc(CHOICE_HEAD) + '</h2>' : '<p class="eyebrow">Aus ' + (wr ? 'ihrem' : 'deinem') + ' Fragebogen</p><h2 id="h-choice">' + (wr ? 'Was ' + esc(who()) + ' mitentschieden hat' : 'Das hast du mitentschieden') + '</h2>')
    + '<ul class="dots">' + CHOICES.map(function(x){ return '<li><b>' + esc(x[0]) + ':</b> ' + esc(x[1]) + '</li>'; }).join('') + '</ul></section>';
}
function perioCard(){
  return '<section class="card" aria-labelledby="h-perio"><p class="eyebrow">Periodisierung</p><h2 id="h-perio">' + esc(PERIO.t) + '</h2>'
    + '<p>' + esc(PERIO.p) + '</p>'
    + '<div class="legend"><span><i class="bx" style="background:var(--s1)"></i>Umfang</span><span><i class="lk" style="background:var(--s2);height:3px"></i>Intensität</span><span class="muted">je relativ zur Höchstwoche</span></div>'
    + '<div class="chart" id="perio-chart" tabindex="0" role="img" aria-label="' + esc(PERIO.aria) + '"></div>'
    + '</section>';
}
function shortDose(p, ex){
  if (!p) return '–';
  if (p.txt) return p.txt;
  var side = p.side ? '/S' : '';
  if (p.unit === 'min') return (p.sets > 1 ? p.sets + '×' : '') + rng(p.lo, p.hi) + ' min';
  if (p.unit === 's' || p.unit === 'm') return p.sets + '×' + rng(p.lo, p.hi) + ' ' + p.unit + side;
  if (p.lo == null) return p.sets + '×' + side;
  return p.sets + '×' + rng(p.lo, p.hi) + side + (p.rlo != null ? ' R' + rng(p.rlo, p.rhi) : '') + (p.kg != null ? ' · ' + kgText(p.kg, ex, true) : '');
}
function doseTables(ph){
  var multi = ph.weeks.length > 1 && ph.id !== 'p4';
  return ph.sess.map(function(s){
    var rows = (PLAN[ph.id][s] || []).filter(function(it){ return it[0] !== 'warm' && it[0] !== 'cool'; });
    var head = '<tr><th>Übung</th>' + (multi ? ph.weeks.map(function(w){ return '<th>W' + w + '</th>'; }).join('') : '<th>jede Woche</th>') + '</tr>';
    var body = rows.map(function(it){
      var cells = multi ? ph.weeks.map(function(w, i){ var d = it[2][Math.min(i, it[2].length - 1)]; return '<td>' + (d ? esc(shortDose(parseDose(d), EX[it[1]])) : '–') + '</td>'; }).join('') : '<td>' + esc(shortDose(parseDose(it[2][0]), EX[it[1]])) + '</td>';
      return '<tr><td>' + esc(EX[it[1]].n) + (it[4] ? ' <span class="muted">(optional)</span>' : '') + '</td>' + cells + '</tr>';
    }).join('');
    return '<h4 style="margin-top:8px">' + esc(s) + ' · ' + esc(SESS[s].t) + '</h4><div class="tbl-wrap"><table class="tbl dose-tbl"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>';
  }).join('') + '<p class="small muted" style="margin-top:6px">R = Reserve (Wiederholungen, die noch gegangen wären) · /S = je Seite · ohne Aufwärmen.</p>';
}
function phaseCards(){
  var w = curWeek();
  return '<section class="card flat"><p class="eyebrow">Die Phasen</p><div class="phgrid">' + PHASES.map(function(ph){
    var cur = w != null && ph.weeks.indexOf(w) >= 0;
    return '<article class="phcard' + (cur ? ' cur' : '') + '"><div class="ph-top"><span class="sw" style="background:' + ph.col + '"></span><div><h3>' + PH_WORD + ' ' + ph.no + ': ' + esc(ph.name) + '</h3><div class="when">Woche ' + ph.weeks[0] + (ph.weeks.length > 1 ? '–' + ph.weeks[ph.weeks.length - 1] : '') + ' · ' + phaseRange(ph) + '</div></div></div>'
      + '<p>' + esc(ph.goal) + '</p><ul class="rules">' + ph.rules.map(function(r){ return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>'
      + '<details class="how" id="dt-' + ph.id + '"><summary>Alle Übungen Woche für Woche</summary>' + doseTables(ph) + '</details>'
      + proBox(ph.pro) + '</article>';
  }).join('') + '</div></section>';
}
function weekPicker(sel){
  var w0 = curWeek();
  var h = '<div class="wkchips" role="group" aria-label="Woche wählen">';
  for (var w = 1; w <= LAST_WEEK; w++){
    var ph = phaseOfWeek(w), lab = w <= MAIN_WEEKS ? 'W' + w : 'E' + (w - MAIN_WEEKS);
    h += '<button type="button" class="wkchip' + (w === w0 ? ' now' : '') + '" data-act="plan-week" data-w="' + w + '" aria-pressed="' + (w === sel) + '"><b>' + lab + '</b><span>' + fmtShort(weekStart(w)) + '</span><i style="background:' + ph.col + '"></i></button>';
  }
  return h + '</div>';
}
function weekCard(w){
  var ph = phaseOfWeek(w), wk = WEEKS[w], log = L(), n = nextSession();
  var list = ph.sess.map(function(s){
    var id = sidOf(w, s), st = sessStatus(w, s, log), m = SESS[s], e = log[id];
    var isNext = n && n.w === w && n.s === s;
    var meta = st === 'off' ? 'entfällt – ' + (OFF[w] && OFF[w][s] ? OFF[w][s] : 'am ' + fmtWd(planDate(w, s)) + ' ist Spiel') : (st === 'done' ? 'erledigt' + (e && e.d ? ' am ' + fmtWd(e.d) : '') + (e && e.e != null ? ' · Anstrengung ' + e.e : '') : (st === 'part' ? 'begonnen' : 'geplant ' + fmtWd(planDate(w, s)) + ' · ca. ' + m.min + ' min'));
    return '<li><button type="button" class="scard ' + st + (isNext && st !== 'done' ? ' next' : '') + '" data-act="open-sess" data-sid="' + id + '"><span class="sid">' + (st === 'done' ? ICON.check.replace('aria-hidden="true"', 'aria-hidden="true" width="22" height="22"') : esc(s)) + '</span><span class="st"><b>' + esc(m.t) + '</b><span>' + esc(meta) + '</span></span><span class="sx">' + ICON.next + '</span></button></li>';
  }).join('');
  return '<section class="card" aria-labelledby="h-wk"><p class="eyebrow">Woche ' + w + ' · ' + weekRange(w) + '</p><h2 id="h-wk">' + esc(wk.t) + '</h2>'
    + '<div class="row">' + phChip(ph) + (wk.test ? chip('acc', esc(wk.test) + ' am ' + fmtWd(planDate(w, TEST_SESS))) : '') + '</div>'
    + '<p>' + esc(wk.note) + '</p>' + gameLine(w) + weekPicker(w) + '<ul class="slist">' + list + '</ul></section>';
}
function progCard(){
  return '<section class="card" aria-labelledby="h-prog"><p class="eyebrow">Progression</p><h2 id="h-prog">So steigt das Gewicht – langsam und sicher</h2>'
    + '<ul class="rules">' + PROG.rules.map(function(r){ return '<li><b>' + esc(r[0]) + ':</b> ' + esc(r[1]) + ref(r[2]) + '</li>'; }).join('') + '</ul>'
    + proBox(PROG.pro) + '</section>';
}
function viewPlan(){
  if (UI.sess) return viewSession(UI.sess);
  var w = UI.week || (function(){ var c = curWeek(); return c == null || c < 1 ? 1 : Math.min(c, LAST_WEEK); })();
  return weekCard(w) + choiceCard() + perioCard() + phaseCards() + progCard();
}

// ---------- Einheit ----------
function itemGroups(items){
  var out = [], cur = null;
  items.forEach(function(it){ if (!cur || cur.b !== it.b){ cur = { b: it.b, items: [] }; out.push(cur); } cur.items.push(it); });
  return out;
}
function unitLabel(ex, j){
  if (ex.t === 'kg') return j === 0 ? 'kg' : 'Wdh.';
  if (ex.t === 'kg1') return 'kg';
  if (ex.t === 'sec') return 's';
  return 'Wdh.';
}
function prevText(x, sid){
  var ps = parseSid(sid), lp = lastPerf(x, ps.w); if (!lp) return '';
  var ex = EX[x];
  return 'Letztes Mal (W' + parseSid(lp.sid).w + '): ' + setsLine(x, lp.sets, ex) + (lp.e.r[x] != null ? ' · Reserve ' + lp.e.r[x] : '');
}
function exCard(it, e, sid, ed){
  var ex = it.ex, x = it.x, p = it.p, sets = (e && e.x[x]) || [], doneN = sets.filter(function(s){ return s[s.length - 1]; }).length;
  var rows = Math.max(p.sets, sets.length) + (UI.extra[sid + ':' + x] || 0), allDone = doneN >= p.sets;
  var sug = ed ? suggest(x, p, sid) : null, prev = (ex.t === 'kg' || ex.t === 'bw' || ex.t === 'sec' || ex.t === 'kg1') ? prevText(x, sid) : '';
  if (sug && sug.src.kind === 'test'){ var st0 = sug.src.t, r0 = RM_BY_X[ex.src || x]; prev = 'Aus deinem Kraft-Test' + (ex.src && r0 ? ' ' + r0.name : '') + ' (' + fmtShort(st0.d) + '): ' + fmtNum(st0.v) + ' kg' + (r0 && r0.hand ? ' je Hand' : '') + ' × ' + st0.n + ' · Reserve ' + st0.q; }
  var rmb = rmBox(it, sid);
  var h = '<div class="exlog' + (allDone ? ' done' : '') + '" id="ex-' + x + '">'
    + '<div class="exhead"><span class="nm">' + esc(ex.n) + (it.opt ? ' <span class="tag">optional</span>' : '') + '</span><span class="cnt">' + doneN + '/' + p.sets + '</span><span class="ds">' + esc(doseText(p, ex)) + '</span>'
    + (it.n || ex.u ? '<span class="nt">' + esc([it.n, ex.u ? 'Gewicht: ' + ex.u : ''].filter(Boolean).join(' · ')) + '</span>' : '') + '</div>';
  h += rmb;
  if (x === 'tests' && ed) h += '<div class="row"><button type="button" class="btn sm pri" data-act="goto-tests">' + ICON.gauge + 'Testwerte jetzt eintragen</button><span class="small muted">danach mit „Zurück zur Einheit“ weiter</span></div>';
  if (prev || sug) h += '<div class="prevline">' + (prev ? '<span>' + esc(prev) + '</span>' : '') + (sug ? '<span class="sugg">Vorschlag ' + (sug.src && sug.src.kind === 'plan' ? '' : '~') + kgText(sug.kg, ex) + '</span>' + (sug.msg ? '<span class="why">' + esc(sug.msg) + '</span>' : '') : '') + '</div>';
  else if (ed && ex.t === 'kg' && !ex.nosug && parseSid(sid).w <= 2) h += '<div class="prevline"><span>' + (rmb ? 'Nach dem Kraft-Test erscheint hier dein Gewicht.' : 'Startgewicht finden: so wählen, dass ' + (p.rlo != null ? 'etwa ' + rng(p.rlo, p.rhi) : 'etwa 3') + ' Wiederholungen Reserve bleiben.') + '</span></div>';
  h += warmupHtml(it, sid, sug, ed);
  if (!ed){
    h += sets.length ? '<div class="ro-sets">' + (ex.t === 'tick' ? doneN + ' von ' + p.sets + ' erledigt' : esc(setsLine(x, sets.filter(function(s){ return s[s.length - 1]; }), ex)) || '–') + (e && e.r[x] != null ? ' · Reserve ' + e.r[x] : '') + '</div>' : '<div class="ro-sets muted">noch nicht eingetragen</div>';
  } else {
    h += '<div class="sets">';
    var phKg = sug ? fmtNum(sug.kg) : '', phReps = p.lo != null ? String(p.lo) : '';
    if (!phKg && (ex.t === 'kg' || ex.t === 'kg1')){ var lp = lastPerf(x, parseSid(sid).w); if (lp) phKg = fmtNum(lp.sets[lp.sets.length - 1][0]); }
    if (!phKg && ex.z0) phKg = '0';
    if (ex.t === 'tick'){
      h += '<div class="ticks" role="group" aria-label="' + esc(ex.n) + ' abhaken">';
      for (var ti = 0; ti < p.sets; ti++){
        var ts = sets[ti] || [], ton = !!ts[ts.length - 1] && ts.length > 0, tl = p.sets === 1 ? 'Erledigt' : String(ti + 1);
        h += '<button type="button" class="tickbtn' + (p.sets === 1 ? ' wide' : '') + '" data-act="setok" data-x="' + x + '" data-i="' + ti + '" aria-pressed="' + ton + '" aria-label="' + esc(ex.n + (p.sets > 1 ? ', Durchgang ' + (ti + 1) : '') + ' erledigt') + '">' + (ton ? ICON.check : '') + '<span>' + esc(tl) + '</span></button>';
      }
      h += '</div>';
    }
    for (var i = 0; i < (ex.t === 'tick' ? 0 : rows); i++){
      var s = sets[i] || [], on = !!s[s.length - 1] && s.length > 0, base = 'in-' + x + '-' + i;
      var lab = 'Satz ' + (i + 1);
      var btn = '<button type="button" class="okbtn" data-act="setok" data-x="' + x + '" data-i="' + i + '" aria-pressed="' + on + '" aria-label="' + esc(lab) + ' erledigt">' + ICON.check + '</button>';
      if (ex.t === 'kg'){
        h += '<div class="setrow' + (on ? ' on' : '') + '"><span class="sn">' + esc(lab) + '</span>'
          + '<label class="unit"><span class="vh">' + esc(lab) + ' Gewicht</span><input type="text" inputmode="decimal" id="' + base + '-0" data-set="' + x + '|' + i + '|0" placeholder="' + esc(phKg) + '" value="' + (s[0] != null ? esc(fmtNum(s[0])) : '') + '" autocomplete="off"><em>kg</em></label>'
          + '<label class="unit"><span class="vh">' + esc(lab) + ' Wiederholungen</span><input type="text" inputmode="numeric" id="' + base + '-1" data-set="' + x + '|' + i + '|1" placeholder="' + esc(phReps) + '" value="' + (s[1] != null ? esc(String(s[1])) : '') + '" autocomplete="off"><em>Wdh.</em></label>'
          + btn + '</div>';
      } else {
        var ph1 = ex.t === 'kg1' ? phKg : phReps;
        h += '<div class="setrow one' + (on ? ' on' : '') + '"><span class="sn">' + esc(lab) + '</span>'
          + '<label class="unit"><span class="vh">' + esc(lab) + '</span><input type="text" inputmode="' + (ex.t === 'kg1' ? 'decimal' : 'numeric') + '" id="' + base + '-0" data-set="' + x + '|' + i + '|0" placeholder="' + esc(ph1) + '" value="' + (s[0] != null ? esc(fmtNum(s[0])) : '') + '" autocomplete="off"><em>' + unitLabel(ex, 0) + '</em></label>'
          + btn + '</div>';
      }
    }
    h += '</div>';
    var foot = '';
    if (ex.t === 'kg'){
      var rv = e && e.r[x] != null ? e.r[x] : null, nm = 'rir-' + x;
      foot += '<div class="rir"><span>Reserve im letzten Satz</span><div class="seg">' + [0, 1, 2, 3, 4].map(function(v){ return '<input type="radio" name="' + nm + '" id="' + nm + '-' + v + '" value="' + v + '" data-rir="' + x + '"' + (rv === v ? ' checked' : '') + '><label for="' + nm + '-' + v + '">' + (v === 4 ? '4+' : v) + '</label>'; }).join('') + '</div></div>';
    }
    if (ex.t !== 'tick') foot += '<button type="button" class="btn sm ghost" data-act="addset" data-x="' + x + '">' + ICON.plus + 'Satz</button>';
    if (foot) h += '<div class="exfoot">' + foot + '</div>';
  }
  h += howBox(ex, it.x === 'tests');
  return h + '</div>';
}
function rmSteps(wk, r){
  return '<ol class="steps small">'
    + '<li>Aufwärmen: 10 Wiederholungen leicht, dann 2–3 Sätze mit je 5 Wiederholungen und steigendem Gewicht.</li>'
    + '<li>Ein Testgewicht wählen, mit dem du etwa ' + wk.lo + '–' + wk.hi + ' saubere Wiederholungen schaffst. Der Startpunkt oben hilft.</li>'
    + '<li>So viele saubere Wiederholungen wie möglich – aufhören, wenn noch genau 1 gegangen wäre oder die Technik nachlässt. Nicht bis zum Versagen.</li>'
    + '<li>Deutlich mehr als ' + (wk.hi + 2) + ' oder weniger als ' + Math.max(2, wk.lo - 2) + ' geschafft? 3 Minuten Pause, Gewicht anpassen, ein zweiter Versuch ist erlaubt.</li>'
    + (r.hand ? '<li>Gewicht je Hand eintragen.' + (r.x === 'bss' ? ' Beide Beine mit demselben Gewicht testen und die Seite mit weniger Wiederholungen eintragen.' : '') + '</li>' : '')
    + '<li>' + esc(RMSTEP_PAIN) + '</li>'
    + '<li>Eintragen – danach geht die Übung mit dem berechneten Gewicht weiter.</li></ol>';
}
function rmBox(it, sid){
  var ps = parseSid(sid), wk = RM_WEEK[ps.w], r = RM_BY_X[it.x]; if (!wk || !r) return '';
  var t = rmTestFor(r.k, ps.w), ed = canLog(), editing = UI.rmEdit === r.k;
  var h = '<div class="rmbox' + (t && !editing ? ' done' : '') + '"><div class="rm-h"><b>' + (t && !editing ? 'Kraft-Test erledigt' : 'Zuerst: Kraft-Test') + '</b><span>' + wk.lo + '–' + wk.hi + ' Wdh. bis Reserve 1</span></div>';
  if (t && !editing){
    var est = rmE1(t);
    h += '<p class="rm-res">' + esc(fmtNum(t.v) + ' kg' + (r.hand ? ' je Hand' : '') + ' × ' + t.n + ' · Reserve ' + t.q) + ' → Kraft-Schätzwert <b>' + esc(fmtNum(Math.round(est * 2) / 2)) + ' kg</b>' + (r.rel && S.profile.bw ? ' · ' + esc(relTxt(est)) : '') + '</p>';
    if (ed) h += '<div><button type="button" class="linkbtn small" data-act="rm-edit" data-k="' + r.k + '">Test ändern</button></div>';
    return h + '</div>';
  }
  if (!ed) return h + '<p class="small muted">Noch nicht eingetragen.</p></div>';
  var start = rmStart(r, ps.w), d = UI.rmDraft[r.k] || {}, q = d.q != null ? d.q : (t ? t.q : 1);
  h += '<p class="small">Startpunkt etwa <b>' + fmtNum(start) + ' kg' + (r.hand ? ' je Hand' : '') + '</b> ' + (!strengthSrc(r.x, ps.w - 1) ? (r.s0 ? '(aus deinen aktuellen Gewichten, bewusst etwas darunter – erst aufwärmen, dann herantasten).' : '(grob aus deinem Körpergewicht – erst aufwärmen, dann herantasten).') : '(aus deinem bisherigen Training).') + '</p>'
    + '<div class="rm-form">'
    + '<label class="unit"><span class="vh">Testgewicht</span><input type="text" inputmode="decimal" id="rm-kg-' + r.k + '" data-rm="' + r.k + ':kg" placeholder="' + esc(fmtNum(start)) + '" value="' + esc(d.kg != null ? d.kg : (t ? fmtNum(t.v) : '')) + '" autocomplete="off"><em>kg</em></label>'
    + '<label class="unit"><span class="vh">Wiederholungen</span><input type="text" inputmode="numeric" id="rm-n-' + r.k + '" data-rm="' + r.k + ':n" placeholder="' + wk.lo + '–' + wk.hi + '" value="' + esc(d.n != null ? d.n : (t ? String(t.n) : '')) + '" autocomplete="off"><em>Wdh.</em></label>'
    + '</div>'
    + '<div class="rir"><span>Reserve am Ende</span><div class="seg">' + [0, 1, 2, 3].map(function(v){ var id = 'rmq-' + r.k + '-' + v; return '<input type="radio" name="rmq-' + r.k + '" id="' + id + '" value="' + v + '" data-rmq="' + r.k + '"' + (q === v ? ' checked' : '') + '><label for="' + id + '">' + v + '</label>'; }).join('') + '</div></div>'
    + (UI.rmErr && UI.rmErr.k === r.k ? '<p role="alert">' + chip('bad', esc(UI.rmErr.m)) + '</p>' : '')
    + '<div class="row"><button type="button" class="btn sm pri" data-act="rm-save" data-k="' + r.k + '" data-w="' + ps.w + '">' + ICON.check + 'Test speichern</button>' + (editing ? '<button type="button" class="btn sm" data-act="rm-cancel">Abbrechen</button>' : '') + '</div>'
    + '<details class="exd2"><summary>So läuft der Test</summary><div class="how">' + rmSteps(wk, r) + '</div></details>';
  return h + '</div>';
}
function tickText(p, i){
  if (p.unit === 'min') return (p.lo != null ? p.lo + ' min' : '') + (p.sets > 1 ? ' · Durchgang ' + (i + 1) : '');
  if (p.unit === 's') return rng(p.lo, p.hi) + ' s' + (p.side ? ' je Seite' : '');
  if (p.unit === 'm') return rng(p.lo, p.hi) + ' m' + (p.side ? ' je Seite' : '');
  if (p.lo != null) return rng(p.lo, p.hi) + ' Wdh.' + (p.side ? ' je Seite' : '');
  return p.side ? 'je Seite' : (p.txt || 'erledigt');
}
// Anleitung: Text oder nummerierte Schritte
function howHtml(ex){
  if (Array.isArray(ex.how)) return '<ol class="steps small">' + ex.how.map(function(t){ return '<li>' + esc(t) + '</li>'; }).join('') + '</ol>';
  return '<p>' + esc(ex.how) + '</p>';
}
function howBox(ex, isTest){
  return '<details class="exd2"><summary>So geht’s</summary><div class="how">' + howHtml(ex) + (ex.cue ? '<p><b>Achte auf:</b> ' + esc(ex.cue) + '</p>' : '') + (ex.knee ? '<p class="kneehint"><b>Bei Beschwerden:</b> ' + esc(ex.knee) + '</p>' : '') + (ex.alt ? '<p><b>Ohne Gerät / Alternative:</b> ' + esc(ex.alt) + '</p>' : '')
    + (isTest ? '<p><button type="button" class="btn sm" data-act="goto-tests">' + ICON.gauge + 'Zu den Tests</button></p>' : '') + '</div></details>';
}
// ---------- Zusätzlich gemacht: eigene Übungen am Ende der Einheit ----------
function zNorm(a){
  var out = [];
  (Array.isArray(a) ? a : []).slice(0, 8).forEach(function(r){
    if (!r || typeof r !== 'object') return;
    var n = typeof r.n === 'string' ? r.n.replace(/\s+/g, ' ').trim().slice(0, 60) : '';
    var s = clampN(r.s, 0, 30), w = clampN(r.r, 0, 300), kg = clampN(r.kg, 0, 500);
    s = s >= 1 ? Math.round(s) : null; w = w >= 1 ? Math.round(w) : null; kg = kg > 0 ? Math.round(kg * 10) / 10 : null;
    if (!n && s == null && w == null && kg == null) return;
    out.push({ n: n, s: s, r: w, kg: kg });
  });
  return out;
}
function zText(r){
  var t = '';
  if (r.s != null && r.r != null) t = r.s + ' × ' + r.r;
  else if (r.s != null) t = r.s + (r.s === 1 ? ' Satz' : ' Sätze');
  else if (r.r != null) t = r.r + ' Wdh.';
  if (r.kg != null) t += (t ? ' · ' : '') + fmtNum(r.kg) + ' kg';
  return t;
}
function zLine(r){ var t = zText(r); return (r.n || 'Zusatzübung') + (t ? ' ' + t : ''); }
function zRows(e){
  return ((e && e.z) || []).map(function(r){ return '<div class="xrow"><span class="xn">' + esc(r.n || 'Zusatzübung') + ' <span class="tag">zusätzlich</span></span><span class="xv">' + esc(zText(r) || '–') + '</span></div>'; }).join('');
}
// Entwurf (auch leere Zeilen) liegt in UI.fin, gespeichert werden nur ausgefüllte Zeilen
function zDraft(sid, e){
  var f = UI.fin[sid];
  if (f && Array.isArray(f.z)) return f.z;
  return ((e && e.z) || []).map(function(r){ return { n: r.n || '', s: r.s != null ? String(r.s) : '', r: r.r != null ? String(r.r) : '', kg: r.kg != null ? fmtNum(r.kg) : '' }; });
}
function zHold(sid){
  UI.fin[sid] = UI.fin[sid] || {};
  if (!Array.isArray(UI.fin[sid].z)) UI.fin[sid].z = zDraft(sid, PENDING_SET && PENDING_SET.s === sid ? PENDING_SET : L()[sid]);
  return UI.fin[sid].z;
}
function zStore(sid){
  if (!canLog() || !SIDS[sid]) return;
  if (PENDING_SET && PENDING_SET.s !== sid) flushNow();
  var rows = zNorm(UI.fin[sid] && UI.fin[sid].z), cur = PENDING_SET && PENDING_SET.s === sid ? PENDING_SET : getEntry(sid);
  if (!cur && !rows.length) return;
  var e = cur || newEntry(sid); e.z = rows; PENDING_SET = e; flushSet();
}
function zAdd(){
  var sid = UI.sess; if (!sid || !canLog()) return;
  var rows = zHold(sid);
  if (rows.length >= 8){ toast('Mehr passt hier nicht – den Rest bitte in die Notiz schreiben.'); return; }
  rows.push({ n: '', s: '', r: '', kg: '' });
  renderAll();
  var el = document.getElementById('fz-' + (rows.length - 1) + '-n'); if (el){ try { el.focus(); } catch (e) {} }
}
function zDel(i){
  var sid = UI.sess; if (!sid || !canLog()) return;
  var rows = zHold(sid); if (!(i >= 0 && i < rows.length)) return;
  rows.splice(i, 1); zStore(sid); renderAll();
}
function zSet(t){
  var sid = UI.sess; if (!sid || !canLog()) return;
  var p = String(t.getAttribute('data-fz') || '').split('|'), i = +p[0], k = p[1], rows = zHold(sid);
  if (!rows[i] || ['n', 's', 'r', 'kg'].indexOf(k) < 0) return;
  rows[i][k] = String(t.value == null ? '' : t.value).slice(0, k === 'n' ? 60 : 6);
  zStore(sid);
}
function zUnit(i, k, val, lab, mode){
  return '<label class="unit"><span class="vh">Zusatzübung ' + (i + 1) + ': ' + lab + '</span><input type="text" inputmode="' + mode + '" id="fz-' + i + '-' + k + '" data-fz="' + i + '|' + k + '" maxlength="6" value="' + esc(val) + '" autocomplete="off"><em>' + lab + '</em></label>';
}
function zBlock(sid, e){
  var rows = zDraft(sid, e);
  var h = '<fieldset class="field" style="border:0;padding:0;margin:0"><legend class="flabel" style="padding:0;margin-bottom:6px;font-size:14px;font-weight:600;color:var(--ink-2)">Zusätzlich gemacht (optional)</legend>'
    + '<p class="help" style="margin-bottom:4px">Was du außerhalb des Plans gemacht hast, zum Beispiel Beinstrecker. Der Name reicht – Sätze, Wiederholungen und Gewicht gern dazu.</p>';
  rows.forEach(function(r, i){
    h += '<div class="zrow">'
      + '<label class="zn"><span class="vh">Zusatzübung ' + (i + 1) + ': Name</span><input class="inp" type="text" id="fz-' + i + '-n" data-fz="' + i + '|n" maxlength="60" value="' + esc(r.n) + '" placeholder="Übung, z. B. Beinstrecker" autocomplete="off" autocapitalize="sentences"></label>'
      + '<button type="button" class="zdel" data-act="fz-del" data-i="' + i + '" aria-label="Zusatzübung ' + (i + 1) + ' entfernen">' + ICON.trash + '</button>'
      + zUnit(i, 's', r.s, 'Sätze', 'numeric') + zUnit(i, 'r', r.r, 'Wdh.', 'numeric') + zUnit(i, 'kg', r.kg, 'kg', 'decimal')
      + '</div>';
  });
  if (rows.length < 8) h += '<div class="row" style="margin-top:4px"><button type="button" class="btn sm" data-act="fz-add">' + ICON.plus + (rows.length ? 'Noch eine Übung' : 'Übung hinzufügen') + '</button></div>';
  return h + '</fieldset>';
}
function finishCard(sid, e, ed){
  var ps = parseSid(sid), m = SESS[ps.s];
  if (!ed){
    if (!e) return '';
    var kv = [['Datum', e.d ? fmtWd(e.d) : '–'], ['Status', e.f ? 'abgeschlossen' : 'begonnen'], ['Dauer', e.m != null ? e.m + ' min' : '–'], ['Frische vorher', e.fr != null ? e.fr + '/10' : '–'], ['Anstrengung', e.e != null ? e.e + '/10' : '–'], [PAIN_LBL, e.k != null ? e.k + '/10' + (e.ks ? ' (' + optLabel(OPT.ks, e.ks) + ')' : '') : '–'], [PAIN_LBL + ' am Morgen danach', e.o != null ? e.o + '/10' : '–']];
    if (e.sh != null) kv.push([ARM_LBL, e.sh + '/10']);
    if (e.z && e.z.length) kv.push(['Zusätzlich gemacht', e.z.map(zLine).join('; ')]);
    if (e.n) kv.push(['Notiz', e.n]);
    var load = e.e != null && e.m != null ? e.e * e.m : null;
    if (load != null) kv.push(['Belastung', fmtInt(load) + ' (Anstrengung × Minuten)']);
    return '<section class="card" aria-labelledby="h-fin"><p class="eyebrow">Rückmeldung</p><h3 id="h-fin">So lief die Einheit</h3><dl class="kv">' + kv.map(function(x){ return '<dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd>'; }).join('') + '</dl>'
      + (MODE === 'writer' ? (UI.confirm === 'del:' + sid ? '<div class="row"><button type="button" class="btn sm danger" data-act="del-yes" data-sid="' + sid + '">Ja, Einheit löschen</button><button type="button" class="btn sm" data-act="cancel">Abbrechen</button></div>' : '<div class="row"><button type="button" class="btn sm ghost" data-act="del-ask" data-sid="' + sid + '">' + ICON.trash + 'Einheit aus dem Plan löschen</button></div>') : '') + '</section>';
  }
  var f = UI.fin[sid] || {}, v = function(k, d){ return f[k] != null ? f[k] : (e && e[k] != null ? e[k] : d); };
  var kv2 = v('k', null);
  return '<section class="card hl finish" id="finish" aria-labelledby="h-fin"><p class="eyebrow">Zum Schluss</p><h3 id="h-fin">' + (e && e.f ? 'Rückmeldung ändern' : 'Einheit abschließen') + '</h3>'
    + '<div class="grid2">' + field('Datum', '<input class="inp" type="date" id="fin-d" data-fin="d" value="' + esc(v('d', '') || todayISO()) + '" max="' + todayISO() + '">', 'fin-d')
    + field('Dauer (Minuten)', '<input class="inp" type="text" inputmode="numeric" id="fin-m" data-fin="m" value="' + esc(v('m', m.min)) + '">', 'fin-m') + '</div>'
    + freshHtml('fin-fr', 'Wie frisch warst du vor dem Training?', v('fr', null), 'data-fin="fr"')
    + rpeHtml('fin-e', 'Wie anstrengend war die Einheit insgesamt?', v('e', null), 'data-fin="e"')
    + painHtml('fin-k', FIN_K_LBL, kv2, 'data-fin="k"')
    + (kv2 != null && kv2 > 0 ? segHtml('fin-ks', 'Welche Seite?', OPT.ks, v('ks', S.profile.side || ''), 'data-fin="ks"') : '')
    + painHtml('fin-sh', FIN_SH_LBL, v('sh', null), 'data-fin="sh"')
    + zBlock(sid, e)
    + field(SELF ? 'Notiz (optional) – was dir aufgefallen ist' : 'Notiz (optional) – was ' + therNom() + ' wissen sollte', '<textarea class="inp" id="fin-n" data-fin="n" maxlength="400" placeholder="' + esc(FIN_NOTE_PH) + '">' + esc(v('n', '')) + '</textarea>', 'fin-n')
    + (UI.finErr ? '<p role="alert">' + chip('bad', esc(UI.finErr)) + '</p>' : '')
    + '<div class="row"><button type="button" class="btn pri" data-act="finish" data-sid="' + sid + '">' + ICON.check + (e && e.f ? 'Änderungen speichern' : 'Einheit abschließen') + '</button></div>'
    + '<p class="small muted">' + (selfOn() ? 'Beim Abschließen wird die Einheit direkt in deinem Plan gespeichert.' : 'Danach im Überblick „Per WhatsApp schicken“ tippen.') + '</p>' + (selfOn() && e ? selfDelHtml(sid) : '') + '</section>';
}
function viewSession(sid){
  var ps = parseSid(sid); if (!ps || !SIDS[sid]){ UI.sess = null; return viewPlan(); }
  var w = ps.w, s = ps.s, m = SESS[s], ph = phaseOfWeek(w), wk = WEEKS[w], items = itemsOf(w, s), e = L()[sid] || null, ed = canLog();
  var st = sessStatus(w, s), pr = entryProgress(e, w, s);
  var h = '<div class="backbar"><button type="button" class="btn sm" data-act="close-sess">' + ICON.back + 'Woche ' + w + '</button>' + (st === 'done' ? chip('ok', 'abgeschlossen') : (st === 'part' ? chip('warn', pr.got + ' von ' + pr.tot + ' Sätzen') : '')) + '</div>';
  h += '<section class="card" aria-labelledby="h-sess"><p class="eyebrow">Woche ' + w + ' · Einheit ' + esc(s) + ' · geplant ' + fmtWd(planDate(w, s)) + '</p><h2 id="h-sess">' + esc(m.t) + '</h2>'
    + '<div class="row">' + phChip(ph) + chip('acc', 'ca. ' + m.min + ' min') + '</div>'
    + '<p class="small"><b>' + esc(wk.t) + ':</b> ' + esc(wk.note) + '</p>'
    + (ed ? '<p class="small muted">Tut eine Übung weh oder passt nicht: nicht durchziehen, sondern abändern – wie, steht bei der Übung unter „So geht’s“. Was du geändert hast, kommt in die Notiz – Übungen zusätzlich zum Plan ganz unten unter „Zusätzlich gemacht“.</p>' : '')
    + '<p class="small muted"><b>Reihenfolge:</b> ' + esc(ORDER_NOTE) + '</p>'
    + sessGameBanner(w, s, e)
    + (MODE === 'writer' && !SELF ? '<p class="small muted">Hier siehst du, was ' + esc(who()) + ' eingetragen hat (nach dem Übernehmen).</p>' : '')
    + (ed ? kneeAlert() : '') + '</section>'
    + (ed && !(e && e.f) && !sessOff(w, s) ? freshCard(sid, e) : '');
  itemGroups(items).forEach(function(g, gi){
    var quick = ed && QUICK_BLK[g.b] && g.items.every(function(it){ return it.ex.t === 'tick'; });
    var allOn = quick && g.items.filter(function(it){ return !it.opt; }).every(function(it){ return doneSets(e, it.x).length >= it.p.sets; });
    h += '<section class="blk" aria-label="' + esc(BLK[g.b] || g.b) + '"><div class="blk-h"><h3>' + esc(BLK[g.b] || g.b) + '</h3>'
      + (quick ? '<button type="button" class="btn sm' + (allOn ? '' : ' ghost') + '" data-act="blockok" data-g="' + gi + '" aria-pressed="' + !!allOn + '">' + ICON.check + (allOn ? 'Erledigt' : 'Alles erledigt') + '</button>' : '<span>' + esc(BLK_INFO[g.b] || '') + '</span>') + '</div>'
      + g.items.map(function(it){ return exCard(it, e, sid, ed); }).join('') + '</section>';
  });
  h += finishCard(sid, e, ed);
  return h;
}

// ---------- Protokoll ----------
function demoLog(){
  var out = {}, base = DEMO_BASE;
  for (var w = 1; w <= 3; w++){
    (phaseOfWeek(w) || PHASES[0]).sess.forEach(function(s, si){
      var id = sidOf(w, s), e = { s: id, d: planDate(w, s), x: {}, r: {}, e: s === 'C' ? 4 : 6 + (w > 1 ? 1 : 0), m: SESS[s].min - 5 + si, fr: (w === 3 && s !== 'A') ? 4 : 7 + (si % 2), k: s === 'A' ? (w === 2 ? 3 : 1) : 0, ks: (w === 2 && s === 'A') ? 'l' : '', o: s === 'A' ? (w === 2 ? 2 : 0) : null, sh: s === 'A' && w === 3 ? 2 : 0, n: w === 2 && s === 'A' ? 'Frontkniebeuge im Kreuzgriff, Handgelenk so okay. Knie links leicht gespürt.' : '', f: 1, t: 1 };
      itemsOf(w, s).forEach(function(it){
        var p = it.p, ex = it.ex, arr = [];
        for (var i = 0; i < p.sets; i++){
          if (ex.t === 'tick') arr.push([1]);
          else if (ex.t === 'kg'){ var kg = (base[it.x] != null ? base[it.x] : 10) + (w - 1) * (ex.st || 2.5) * (DEMO_BIG[it.x] ? 2 : 1); arr.push([kg, (p.hi || p.lo || 8) - (i === p.sets - 1 ? 1 : 0), 1]); }
          else if (ex.t === 'kg1') arr.push([base[it.x] || 12, 1]);
          else arr.push([p.lo || 8, 1]);
        }
        e.x[it.x] = arr; if (ex.t === 'kg' || ex.t === 'bw') e.r[it.x] = p.rlo != null ? p.rlo : 2;
      });
      var n = normEntry(e); if (n) out[id] = n;
    });
  }
  return out;
}
function LV(){ return (UI.demo && MODE !== 'reader') ? demoLog() : L(); }
function weekLoads(log){
  var o = {};
  Object.keys(log).forEach(function(k){ var e = log[k]; if (!e.f || e.e == null || e.m == null) return; var w = parseSid(k).w; o[w] = o[w] || { load: 0, n: 0 }; o[w].load += e.e * e.m; o[w].n++; });
  return o;
}
function viewLog(){
  var log = LV(), es = entriesSorted(log), fin = es.filter(function(e){ return e.f; }), demo = UI.demo && MODE !== 'reader';
  var h = '';
  if (demo) h += '<div class="banner warn">' + ICON.info + '<div class="b-body"><b>Beispieldaten</b><p>So sieht das Protokoll aus, wenn ' + esc(who()) + ' 3 Wochen eingetragen hat. Nichts davon wird gespeichert.</p><div class="row"><button type="button" class="btn sm" data-act="demo">Beispiel ausblenden</button></div></div></div>';
  if (!es.length){
    h += '<section class="card"><p class="eyebrow">Protokoll</p><h2>Noch keine Einheiten</h2><p>' + (MODE === 'writer' && !SELF ? 'Sobald ' + esc(who()) + ' ihren Stand per WhatsApp schickt und du ihn im Überblick übernimmst, steht hier jede Einheit mit allen Gewichten, Wiederholungen, Frische und Beschwerden.' : 'Hier erscheinen deine Einheiten mit allen Gewichten, sobald du die erste eingetragen hast.') + '</p>'
      + (MODE !== 'reader' && !SELF ? '<div class="row"><button type="button" class="btn" data-act="demo">' + ICON.log + 'Beispiel ansehen</button></div>' : '') + '</section>';
    return h;
  }
  var frs = fin.filter(function(e){ return e.fr != null; }), lastF = frs.length ? frs[frs.length - 1].fr : null;
  var rpes = fin.filter(function(e){ return e.e != null; }), avg = rpes.length ? rpes.reduce(function(a, e){ return a + e.e; }, 0) / rpes.length : null;
  var plan = plannedSoFar();
  h += '<section class="card" aria-labelledby="h-sum"><p class="eyebrow">Protokoll</p><h2 id="h-sum">Bisher</h2><div class="stats">'
    + '<div class="stat"><b>' + fin.length + (plan && !demo ? '<small style="font-size:18px;color:var(--ink-3)">/' + plan + '</small>' : '') + '</b><span>Einheiten erledigt' + (plan && !demo ? ' (von bisher geplant)' : '') + '</span></div>'
    + '<div class="stat"><b>' + (avg == null ? '–' : fmtNum(Math.round(avg * 10) / 10)) + '</b><span>Ø Anstrengung (0–10)</span></div>'
    + '<div class="stat"><b>' + (lastF == null ? '–' : lastF) + '</b><span>Frische zuletzt (0–10)' + (lastF != null ? ' · ' + ['frisch', 'mittel', 'platt'][fzone(lastF)] : '') + '</span></div>'
    + '</div></section>';
  h += '<section class="card" aria-labelledby="h-str"><p class="eyebrow">Kraftverlauf</p><h3 id="h-str">Kraft-Schätzwert pro Einheit</h3>'
    + '<div class="fchips" role="group" aria-label="Übung">' + LIFTS.map(function(l){ return '<button type="button" class="fchip" data-act="lift" data-l="' + l[0] + '" aria-pressed="' + (UI.lift === l[0]) + '">' + esc(l[1]) + '</button>'; }).join('') + '</div>'
    + '<div class="legend"><span><i class="sw" style="background:var(--s1);border-radius:50%;width:10px;height:10px"></i>Training</span>' + (RMT.length ? '<span><i class="sw" style="background:var(--panel);border:2px solid var(--s1);border-radius:50%;width:11px;height:11px"></i>Kraft-Test</span>' : '') + (UI.lift === 'sq' && S.profile.bw && SQ_REF ? '<span><i class="lk" style="background:var(--ink-3)"></i>Orientierung ' + fmtNum(SQ_REF) + ' × KG</span>' : '') + '</div>'
    + '<div class="chart" id="str-chart" tabindex="0" role="img" aria-label="Geschätzte Maximalkraft je Einheit für die gewählte Übung. Die Werte stehen auch in der Liste unten."></div>'
    + '<p class="small muted">Geschätztes Gewicht für 1 Wiederholung, berechnet aus Gewicht, Wiederholungen und Reserve. Steigt die Linie, wirst du stärker.</p>' + proBox([['e1RM nach Epley mit RIR-Korrektur: kg × (1 + (Wdh. + Reserve) / 30); bester Satz der Einheit.', [R.e1rm]]]) + '</section>';
  h += '<section class="card" aria-labelledby="h-load"><p class="eyebrow">Belastung</p><h3 id="h-load">Wochen-Belastung</h3>'
    + '<div class="chart" id="load-chart" tabindex="0" role="img" aria-label="Summe aus Anstrengung mal Minuten je Woche."></div>'
    + '<p class="small muted">' + esc(LOAD_TEXT) + '</p>' + proBox([['Session-RPE-Methode (Anstrengung 0–10 × Dauer).', [R.srpe]]]) + '</section>';
  h += '<section class="card" aria-labelledby="h-fresh"><p class="eyebrow">Frische</p><h3 id="h-fresh">Frische vor dem Training</h3>'
    + '<div class="chart" id="fresh-chart" tabindex="0" role="img" aria-label="Frische 0 bis 10 vor jeder Einheit, grün ab 7."></div>'
    + '<p class="small muted">Fällt die Linie über mehrere Einheiten, ist es zu viel – dann die Woche entlasten.</p>'
    + proBox([['Warnzeichen für zu viel Belastung: Frische zweimal in Folge 3 oder weniger, Frische fällt um 2 Punkte oder mehr, Beschwerden am Morgen höher als nach dem Training, Kraft-Schätzwerte fallen, Anstrengung steigt bei gleichen Gewichten. Die Seite meldet die ersten beiden im Überblick.', [R.srpe]]]) + '</section>';
  h += '<section class="card" aria-labelledby="h-knee"><p class="eyebrow">Beschwerden</p><h3 id="h-knee">' + esc(PAIN_HEAD) + '</h3>'
    + '<div class="legend"><span><i class="lk" style="background:var(--s1);height:3px"></i>' + esc(PAIN_SERIES[0]) + '</span><span><i class="lk" style="background:var(--s2);height:3px"></i>am Morgen danach</span><span><i class="lk" style="background:var(--ink-3);height:3px"></i>' + esc(PAIN_SERIES[2]) + '</span></div>'
    + '<div class="chart" id="knee-chart" tabindex="0" role="img" aria-label="Beschwerden 0 bis 10 je Einheit mit Ampel-Bereichen."></div></section>';
  // Liste nach Wochen
  var byW = {}; es.forEach(function(e){ var w = parseSid(e.s).w; (byW[w] = byW[w] || []).push(e); });
  var ws = Object.keys(byW).map(Number).sort(function(a, b){ return b - a; });
  h += '<section class="card" aria-labelledby="h-list"><p class="eyebrow">Alle Einheiten</p><h3 id="h-list">Was gemacht wurde</h3>' + ws.map(function(w){
    return '<h4 style="margin-top:6px">Woche ' + w + ' · ' + esc(WEEKS[w].t) + '</h4><ul class="loglist">' + byW[w].slice().reverse().map(function(e){ return logItem(e); }).join('') + '</ul>';
  }).join('') + '</section>';
  return h;
}
function logItem(e){
  var ps = parseSid(e.s), m = SESS[ps.s], items = itemsOf(ps.w, ps.s), seen = {};
  var rows = items.filter(function(it){ if (seen[it.x]) return false; seen[it.x] = 1; return it.ex.t !== 'tick' && doneSets(e, it.x).length; }).map(function(it){
    return '<div class="xrow"><span class="xn">' + esc(it.ex.n) + '</span><span class="xv">' + esc(setsLine(it.x, doneSets(e, it.x), it.ex)) + (e.r[it.x] != null ? ' · Reserve ' + e.r[it.x] : '') + '</span></div>';
  }).join('');
  var ticks = items.filter(function(it){ return it.ex.t === 'tick' && it.b !== 'warm' && it.b !== 'cool'; });
  var tk = ticks.length ? '<div class="xrow"><span class="xn">Sprünge & Co.</span><span class="xv">' + esc(ticks.map(function(it){ return it.ex.n + ' ' + doneSets(e, it.x).length + '/' + it.p.sets; }).join(' · ')) + '</span></div>' : '';
  var meta = [e.m != null ? e.m + ' min' : '', e.e != null ? 'Anstrengung ' + e.e : ''].filter(Boolean).join(' · ');
  return '<li><details class="logitem' + (e.local ? ' local' : '') + '"><summary><span class="lt">' + esc(fmtWd(entryDate(e))) + ' · ' + esc(ps.s) + ' ' + esc(m.s) + '</span>' + (e.f ? chip('ok', 'fertig') : chip('warn', 'begonnen'))
    + '<span class="lm">' + esc(meta) + (e.fr != null ? ' ' + freshChip(e.fr, 'Frische') : '') + (e.k != null ? ' ' + zoneChip(e.k, PAIN_LBL) : '') + (e.o != null ? ' ' + zoneChip(e.o, 'morgens') : '') + (e.sh != null && e.sh > 0 ? ' ' + zoneChip(e.sh, ARM_LBL) : '') + (e.local && MODE === 'reader' ? ' ' + chip('warn', 'noch nicht geschickt') : (e.local && selfOn() ? ' ' + chip('warn', 'noch nicht im Plan') : '')) + '</span></summary>'
    + '<div class="lb">' + rows + tk + zRows(e) + (e.n ? '<p class="small">„' + esc(e.n) + '“</p>' : '') + '<div class="row"><button type="button" class="btn sm" data-act="open-sess" data-sid="' + e.s + '">Einheit öffnen</button></div></div></details></li>';
}

// ---------- Tests ----------
function testCard(def){
  var list = testsOf(def.k).slice().reverse(), last = list[0], w = MODE === 'writer', r = canLog(), res = '';
  if (!last) res = '<p class="small muted">Noch kein Wert eingetragen.</p>';
  else if (def.kind === 'lr'){ var sv = sym(last); res = '<div class="lsi"><span class="big">L ' + fmtNum(last.l) + ' · R ' + fmtNum(last.r) + '</span><span class="muted">' + esc(def.unit) + '</span>' + (def.pain ? zoneChip(Math.max(last.l || 0, last.r || 0), def.plabel || 'Schmerz') : (sv != null ? (sv >= 90 ? chip('ok', sv + ' % · ausgeglichen') : chip('warn', sv + ' % · Seitenunterschied')) : '')) + '</div><p class="small muted">' + fmtDate(last.d) + '</p>'; }
  else res = '<div class="lsi"><span class="big">' + fmtNum(last.v) + '</span><span class="muted">' + esc(def.unit) + '</span>' + (def.pain ? zoneChip(last.v, def.plabel || 'Schmerz') : '') + '</div><p class="small muted">' + fmtDate(last.d) + '</p>';
  var hist = '';
  if (list.length){
    hist = '<details class="how"><summary>Alle Werte (' + list.length + ')</summary><div class="tbl-wrap" style="margin-top:8px"><table class="tbl"><thead><tr><th>Datum</th>' + (def.kind === 'lr' ? '<th>Links</th><th>Rechts</th>' + (def.pain ? '' : '<th>Seiten</th>') : '<th>Wert</th>') + '<th><span class="vh">Aktion</span></th></tr></thead><tbody>'
      + list.map(function(t){
        var cells = def.kind === 'lr' ? '<td>' + fmtNum(t.l) + '</td><td>' + fmtNum(t.r) + '</td>' + (def.pain ? '' : '<td>' + (sym(t) == null ? '–' : sym(t) + ' %') + '</td>') : '<td>' + fmtNum(t.v) + ' ' + esc(def.unit) + '</td>';
        var canDel = w ? !t.local : (r && !!t.local), act = '';
        if (canDel) act = UI.confirm === 'tdel:' + t.id ? '<button type="button" class="btn sm danger" data-act="tdel-yes" data-id="' + t.id + '">Löschen</button> <button type="button" class="btn sm" data-act="cancel">Nein</button>' : '<button type="button" class="linkbtn small" data-act="tdel-ask" data-id="' + t.id + '">löschen</button>';
        return '<tr><td>' + fmtShort(t.d) + '</td>' + cells + '<td>' + act + '</td></tr>';
      }).join('') + '</tbody></table></div></details>';
  }
  return '<section class="test" id="t-' + def.k + '" aria-labelledby="th-' + def.k + '"><div class="test-head"><h3 id="th-' + def.k + '">' + esc(def.name) + '</h3></div>'
    + '<p class="small"><b>Ziel:</b> ' + esc(def.target) + ref(def.r) + '</p>' + res
    + '<details class="how"><summary>So wird getestet</summary><p>' + esc(def.how) + '</p></details>'
    + hist + (r || w ? testForm(def) : '') + '</section>';
}
function testForm(def){
  var d = UI.tdraft[def.k] || {}, id = 'tf-' + def.k;
  var date = field('Datum', '<input class="inp" type="date" id="' + id + '-date" data-tdraft="' + def.k + ':date" value="' + esc(d.date || todayISO()) + '" max="' + todayISO() + '">', id + '-date');
  var inner = def.kind === 'lr'
    ? date + field('Links (' + def.unit + ')', '<input class="inp" type="text" inputmode="decimal" id="' + id + '-a" data-tdraft="' + def.k + ':a" value="' + esc(d.a || '') + '">', id + '-a') + field('Rechts (' + def.unit + ')', '<input class="inp" type="text" inputmode="decimal" id="' + id + '-b" data-tdraft="' + def.k + ':b" value="' + esc(d.b || '') + '">', id + '-b')
    : date + field('Wert (' + def.unit + ')', '<input class="inp" type="text" inputmode="decimal" id="' + id + '-a" data-tdraft="' + def.k + ':a" value="' + esc(d.a || '') + '">', id + '-a');
  return '<div class="stack" style="gap:10px"><div class="grid3">' + inner + '</div>' + (UI.tErr && UI.tErr.k === def.k ? '<p role="alert">' + chip('bad', esc(UI.tErr.m)) + '</p>' : '') + '<div class="row"><button type="button" class="btn sm pri" data-act="addtest" data-k="' + def.k + '">' + ICON.plus + 'Wert speichern</button></div></div>';
}
function testSummary(){
  var rows = TESTS.map(function(def){
    var a = TWIN.map(function(win){ return testIn(def.k, win); });
    function cell(t){ if (!t) return '–'; return def.kind === 'lr' ? fmtNum(t.l) + ' / ' + fmtNum(t.r) : fmtNum(t.v); }
    var first = a[0], lastT = a[2] || a[1], chg = '';
    if (first && lastT && first !== lastT && !def.pain){
      var f = def.kind === 'lr' ? ((first.l || 0) + (first.r || 0)) / 2 : first.v, l = def.kind === 'lr' ? ((lastT.l || 0) + (lastT.r || 0)) / 2 : lastT.v;
      if (f > 0){ var pc = Math.round((l - f) / f * 100), good = def.up ? pc > 0 : pc < 0; chg = '<span class="' + (pc === 0 ? '' : (good ? 'up' : 'down')) + '">' + (pc > 0 ? '+' : '') + pc + ' %</span>'; }
    }
    return '<tr><td>' + esc(def.name) + (def.kind === 'lr' ? ' <span class="muted">(L / R)</span>' : '') + '</td><td>' + cell(a[0]) + '</td><td>' + cell(a[1]) + '</td><td>' + cell(a[2]) + '</td><td>' + (chg || '–') + '</td></tr>';
  }).join('');
  return '<section class="card" aria-labelledby="h-tsum"><p class="eyebrow">Auf einen Blick</p><h3 id="h-tsum">Eingang · Mitte · Ende</h3><div class="tbl-wrap"><table class="tbl dose-tbl"><thead><tr><th>Test</th><th>Eingang</th><th>Mitte</th><th>Ende</th><th>Änderung</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
    + '<p class="small muted">Änderung: Ende (oder Mitte) gegenüber dem Eingangstest. Beim Seitenvergleich zählt die schwächere Seite – Ziel mindestens 90 %.</p></section>';
}
function rmCard(){
  var bw = S.profile.bw, w = MODE === 'writer', r0 = canLog();
  var rows = RMT.map(function(r){
    var a = TWIN.map(function(win){ return testIn(r.k, win); });
    function cell(t){ if (!t) return '–'; var est = rmE1(t); return fmtNum(Math.round(est * 2) / 2) + (r.rel && bw ? '<br><span class="muted small">' + fmtNum(Math.round(est / bw * 100) / 100) + ' × KG</span>' : ''); }
    var f = a[0], l = a[2] || a[1], chg = '–';
    if (f && l && f !== l){ var pc = Math.round((rmE1(l) - rmE1(f)) / rmE1(f) * 100); chg = '<span class="' + (pc > 0 ? 'up' : (pc < 0 ? 'down' : '')) + '">' + (pc > 0 ? '+' : '') + pc + ' %</span>'; }
    return '<tr><td>' + esc(r.name) + (r.hand ? ' <span class="muted">(je Hand)</span>' : '') + '</td><td>' + cell(a[0]) + '</td><td>' + cell(a[1]) + '</td><td>' + cell(a[2]) + '</td><td>' + chg + '</td></tr>';
  }).join('');
  var sqs = testsOf('rm-sq'), sq = sqs.length ? sqs[sqs.length - 1] : null;
  var orient = '';
  var form = '';
  if (w || r0){
    var d = UI.rmDraft._tab || {};
    form = '<details class="how"' + (UI.rmErr && UI.rmErr.k === '_tab' ? ' open' : '') + '><summary>Test von Hand eintragen</summary><div class="stack" style="gap:10px;margin-top:8px"><div class="grid2">'
      + field('Übung', selectHtml('rmf-k', RMT.map(function(r){ return [r.k, r.name + (r.hand ? ' (je Hand)' : '')]; }), d.k || 'rm-sq', 'data-rmf="k"'), 'rmf-k')
      + field('Datum', '<input class="inp" type="date" id="rmf-d" data-rmf="d" value="' + esc(d.d || todayISO()) + '" max="' + todayISO() + '">', 'rmf-d')
      + field('Gewicht (kg)', '<input class="inp" type="text" inputmode="decimal" id="rmf-kg" data-rmf="kg" value="' + esc(d.kg || '') + '">', 'rmf-kg')
      + field('Wiederholungen', '<input class="inp" type="text" inputmode="numeric" id="rmf-n" data-rmf="n" value="' + esc(d.n || '') + '">', 'rmf-n')
      + '</div>' + segHtml('rmf-q', 'Reserve am Ende', [['0','0'],['1','1'],['2','2'],['3','3']], d.q != null ? String(d.q) : '1', 'data-rmf="q"')
      + (UI.rmErr && UI.rmErr.k === '_tab' ? '<p role="alert">' + chip('bad', esc(UI.rmErr.m)) + '</p>' : '')
      + '<div class="row"><button type="button" class="btn sm pri" data-act="rm-add">' + ICON.plus + 'Test speichern</button></div></div></details>';
  }
  var list = allTests().filter(function(t){ return testDef(t.k) && testDef(t.k).kind === 'rm'; }).sort(function(a, b){ return a.d < b.d ? 1 : -1; });
  var hist = list.length ? '<details class="how"><summary>Alle Kraft-Tests (' + list.length + ')</summary><ul class="dots small" style="margin-top:6px">' + list.map(function(t){
    var canDel = w ? !t.local : (r0 && !!t.local);
    return '<li>' + fmtShort(t.d) + ' · ' + esc(testLine(t).replace('Kraft-Test ', '')) + (canDel ? ' ' + (UI.confirm === 'tdel:' + t.id ? '<button type="button" class="btn sm danger" data-act="tdel-yes" data-id="' + t.id + '">Löschen</button> <button type="button" class="btn sm" data-act="cancel">Nein</button>' : '<button type="button" class="linkbtn small" data-act="tdel-ask" data-id="' + t.id + '">löschen</button>') : '') + '</li>';
  }).join('') + '</ul></details>' : '';
  return '<section class="card" aria-labelledby="h-rm"><p class="eyebrow">Kraft-Test</p><h2 id="h-rm">Wie stark bist du?</h2>'
    + '<p>' + RM_TEXT + '</p>'
    + '<div class="tbl-wrap"><table class="tbl dose-tbl"><thead><tr><th>Kraft-Schätzwert (kg)</th><th>Eingang</th><th>Mitte</th><th>Ende</th><th>Änderung</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
    + orient + form + hist
    + proBox(RM_PRO)
    + '</section>';
}
function backSessBtn(){
  return UI.backSess && SIDS[UI.backSess] ? '<div class="row"><button type="button" class="btn sm pri" data-act="back-sess">' + ICON.back + 'Zurück zur Einheit</button></div>' : '';
}
function testsIntro(){
  var d = [2, 5, 9].map(function(w){ return fmtWd(planDate(w, TEST_SESS)); });
  return '<section class="card flat">' + backSessBtn() + '<p class="eyebrow">Messen statt raten</p><h2>Tests</h2>'
    + '<p><b>So trägst du deine Testwerte ein:</b></p><ol class="steps small">'
    + '<li><b>Kraft-Tests</b> (Woche 2, 5 und 9): direkt in der Einheit A (Montag) oder B (Mittwoch) – bei der Übung im blauen Kasten „Zuerst: Kraft-Test“. Gewicht, Wiederholungen und Reserve eintragen, dann „Test speichern“.</li>'
    + '<li><b>Sprungtests</b> (' + d[0] + ', ' + d[1] + ' und ' + d[2] + '): hier in diesem Tab – beim jeweiligen Test den Wert eintragen (bei zwei Seiten links und rechts), dann „Wert speichern“.</li>'
    + '<li>Danach wie immer „Per WhatsApp schicken“ – die Testwerte gehen automatisch mit.</li></ol>'
    + '<div class="row"><button type="button" class="btn sm" data-act="scrollto" data-to="h-jump">' + ICON.gauge + 'Zu den Sprungtests</button><button type="button" class="btn sm" data-act="scrollto" data-to="h-rm">' + ICON.gauge + 'Zu den Kraft-Tests</button></div>'
    + '<p class="small muted">Immer gleich testen: gleiche Schuhe, ähnliche Tageszeit, ausgeruht. Seitenvergleich = schwächere Seite geteilt durch stärkere Seite.</p></section>';
}
function jumpBlock(){
  return '<section class="card" aria-labelledby="h-jump"><p class="eyebrow">Mittwoch in Woche 2, 5 und 9</p><h2 id="h-jump">' + esc(JUMP_HEAD) + '</h2>'
    + '<p class="small">' + esc(JUMP_INTRO) + '</p></section>'
    + TESTS.map(testCard).join('') + backSessBtn();
}
function viewTests(){
  // Athletin: zuerst die Tests, die sie hier einträgt · Coach: zuerst die Übersicht
  return testsIntro() + (MODE === 'reader' ? jumpBlock() + rmCard() + testSummary() : rmCard() + testSummary() + jumpBlock());
}

// ---------- Infos ----------
function viewInfo(){
  var h = '';
  if (GUIDE_URL) h += '<section class="card" aria-labelledby="h-guide"><p class="eyebrow">Anleitung</p><h2 id="h-guide">Alles zum Nachlesen</h2><p>Wie die Seite funktioniert, die Kraft- und Sprungtests, die Ampel-Regeln und ein Spickzettel – Schritt für Schritt erklärt.</p><div class="row"><a class="btn pri" href="' + esc(GUIDE_URL) + '" target="_blank" rel="noopener">' + ICON.info + 'Anleitung öffnen</a></div></section>';
  h += '<section class="card" aria-labelledby="h-fr-amp"><p class="eyebrow">Frische-Ampel</p><h2 id="h-fr-amp">Wie frisch bist du heute?</h2><p>Vor jeder Einheit tippst du an, wie frisch du dich fühlst (0 = völlig platt, 10 = topfit). Danach richtet sich, wie viel du heute machst:</p>' + ampelBox(FRESH, false) + '<p class="small muted">' + esc(FRESH_NOTE) + '</p></section>';
  h += '<section class="card" aria-labelledby="h-amp"><p class="eyebrow">Beschwerde-Ampel</p><h2 id="h-amp">' + esc(AMP_HEAD) + '</h2>' + ampelBox()
    + '<h4>Wenn sich etwas meldet (während, nach dem Training oder am nächsten Tag) – so passt du an</h4><p class="small">Ohne Beschwerden gilt immer die volle Bewegung. Erst wenn sich etwas meldet, änderst du die Übung ab:</p><ul class="dots">' + FIX_TIPS.map(function(t){ return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>'
    + proBox(AMP_PRO) + '</section>';
  h += '<section class="card" aria-labelledby="h-pos"><p class="eyebrow">' + esc(POS_EYEBROW) + '</p><h2 id="h-pos">' + esc(POS_HEAD) + '</h2><p>' + esc(POS) + ref(POS_REFS) + '</p>'
    + '<ul class="dots">' + POS_LIST.map(function(x){ return '<li><b>' + esc(x[0]) + ':</b> ' + esc(x[1]) + '</li>'; }).join('') + '</ul>'
    + proBox(POS_PRO) + '</section>';
  h += '<section class="card" aria-labelledby="h-faq"><p class="eyebrow">Gut zu wissen</p><h2 id="h-faq">Häufige Fragen</h2><div class="faq">' + FAQ.map(function(f, i){ return '<details id="faq-' + i + '"><summary>' + esc(f.q) + '</summary><p>' + esc(f.a) + ref(f.r) + '</p></details>'; }).join('') + '</div></section>';
  h += libCard() + dataCard();
  h += '<section class="card" aria-labelledby="h-refs"><p class="eyebrow">Evidenz</p><h2 id="h-refs">Quellen</h2><details id="refs-box"' + (UI.refsOpen || isPro() ? ' open' : '') + '><summary class="small" style="cursor:pointer;font-weight:600">' + REFS.length + ' Quellen anzeigen</summary><ol class="refs" style="margin-top:10px">'
    + REFS.map(function(r){ return '<li id="q' + r.n + '">' + esc(r.t) + ' <a href="' + esc(r.u) + '" target="_blank" rel="noopener">Link</a></li>'; }).join('') + '</ol></details>'
    + '<p class="small muted">' + esc(INFO_NOTE) + '</p></section>';
  return h;
}
function libCard(){
  var groups = {}, order = [];
  Object.keys(EX).forEach(function(id){ var ex = EX[id]; if (id === 'tests') return; if (!groups[ex.g]){ groups[ex.g] = []; order.push(ex.g); } groups[ex.g].push(ex); });
  return '<section class="card" aria-labelledby="h-lib"><p class="eyebrow">Übungen</p><h2 id="h-lib">Alle Übungen</h2><div class="lib">' + order.map(function(g){
    return '<div class="libgrp">' + esc(g) + '</div>' + groups[g].map(function(ex){ return '<details><summary>' + esc(ex.n) + '</summary><div class="how">' + howHtml(ex) + (ex.cue ? '<p><b>Achte auf:</b> ' + esc(ex.cue) + '</p>' : '') + (ex.knee ? '<p class="kneehint"><b>Bei Beschwerden:</b> ' + esc(ex.knee) + '</p>' : '') + (ex.alt ? '<p><b>Alternative:</b> ' + esc(ex.alt) + '</p>' : '') + '</div></details>'; }).join('');
  }).join('') + '</div></section>';
}
function dataCard(){
  var w = MODE === 'writer', dl = !!NS.downloads, h = '<section class="card" aria-labelledby="h-data"><p class="eyebrow">Teilen & Sichern</p><h2 id="h-data">Daten</h2>';
  if (w){
    h += (SELF ? '<p>Deine Einträge liegen während des Trainings auf diesem Gerät und landen beim Abschließen im Plan. Zusätzlich kannst du alles als Datei sichern.</p>' : '<p>Gib ' + esc(who()) + ' den Link zu dieser Seite. Sie sieht den Plan, trägt ihre Gewichte ein – gespeichert auf ihrem Handy – und schickt dir ihren Stand per WhatsApp. Im Überblick übernimmst du ihn mit „Übernehmen“.</p>')
      + '<div class="row">' + (dl ? '<button type="button" class="btn" data-act="export-html">' + ICON.save + 'Protokoll als Datei</button><button type="button" class="btn" data-act="export-json">' + ICON.save + 'Sicherung speichern</button>' : '')
      + '<label class="btn" for="imp-file">' + ICON.open + 'Sicherung laden</label><input class="vh" type="file" id="imp-file" accept=".json,application/json"></div>';
    if (UI.confirm === 'import' && UI.importData) h += '<div class="banner warn">' + ICON.alert + '<div class="b-body"><p><b>Sicherung laden?</b> Der aktuelle Stand wird ersetzt.</p><div class="row"><button type="button" class="btn sm pri" data-act="import-yes">Ja, laden</button><button type="button" class="btn sm" data-act="cancel">Abbrechen</button></div></div></div>';
    h += '<div class="sep"></div>' + (SELF ? '<h4>Neu anfangen</h4><p class="small">Zurücksetzen löscht alle Einheiten im Plan und auf diesem Gerät. Die Einstellungen bleiben.</p>' : '<h4>Neue Athletin</h4><p class="small">Für eine andere Athletin am besten eine eigene Kopie dieser Seite verwenden. Zurücksetzen löscht alle Einheiten und Tests auf dieser Seite (die Einstellungen bleiben).</p>')
      + (UI.confirm === 'reset' ? '<div class="row"><button type="button" class="btn sm danger" data-act="reset-yes">Ja, alles löschen</button><button type="button" class="btn sm" data-act="cancel">Abbrechen</button></div>' : '<div class="row"><button type="button" class="btn sm danger" data-act="reset-ask">' + ICON.trash + 'Zurücksetzen</button></div>');
  } else {
    h += '<p>Deine Einträge liegen auf diesem Gerät. Schick sie regelmäßig an ' + esc(therAcc()) + ' – dann sind sie auch im Plan gesichert.</p>'
      + '<div class="row"><button type="button" class="btn pri" data-act="tab" data-tab="start">' + ICON.send + 'Zu „Stand schicken“</button></div>';
    if (WHY === 'nouser' && NS.artifact) h += '<div class="sep"></div><h4>Nur für ' + esc(therAcc()) + '</h4><p class="small">Falls die Seite dich als Trainer nicht erkennt, kannst du das Bearbeiten hier freischalten.</p><div class="row"><button type="button" class="btn sm" data-act="force-writer">Bearbeiten freischalten</button></div>';
  }
  return h + '</section>';
}
function foot(){ return '<p class="foot">' + esc(TITLE) + ' – ' + esc(FOOT_TEXT) + (SELF ? ' Bei ungewohnten Schmerzen, Schwellung oder Instabilität: Training pausieren und abklären lassen.' : ' Bei ungewohnten Schmerzen, Schwellung oder Instabilität: Training pausieren und ' + esc(therAcc()) + ' oder ärztlich abklären.') + '</p>'; }

// ---------- Rendern ----------
function tabBody(){
  switch (UI.tab){
    case 'plan': return viewPlan();
    case 'log': return viewLog();
    case 'tests': return viewTests();
    case 'infos': return viewInfo();
    default: return viewStart();
  }
}
function renderAll(keepScroll){
  var root = document.getElementById('fk-root'); if (!root) return;
  var y = window.scrollY, ae = document.activeElement, fid = ae && keepFocus(ae) ? ae.id : '';
  UI.stale = false; invalidate();
  root.innerHTML = board() + banners() + tabs() + '<main id="fk-main" class="stack" style="gap:14px">' + tabBody() + '</main>' + foot();
  drawCharts();
  if (keepScroll !== false) window.scrollTo(0, y);
  if (fid){ var f = document.getElementById(fid); if (f){ try { f.focus({ preventScroll: true }); } catch (e) {} } }
  ssSet('fk-ui', uiSnapshot());
}
function keepFocus(el){
  if (!el || !el.tagName || el === document.body) return false;
  var t = el.tagName;
  if (t === 'BUTTON' || t === 'A' || t === 'SUMMARY') return true;
  return t === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio');
}
var NOFIELD = /^(checkbox|radio|button|submit|reset|file|range|color|image|hidden)$/;
function isField(el){ if (!el || !el.tagName) return false; var t = el.tagName; if (t === 'TEXTAREA' || t === 'SELECT') return true; return t === 'INPUT' && !NOFIELD.test(el.type || 'text'); }
function fieldFocused(){ var a = document.activeElement, r = document.getElementById('fk-root'); return isField(a) && !!r && r.contains(a); }
function blurField(){ if (fieldFocused()){ try { document.activeElement.blur(); } catch (e) {} } }
function toast(msg){
  TOAST.msg = msg; TOAST.at = Date.now();
  var old = document.getElementById('fk-toast'); if (old) old.remove();
  var t = document.createElement('div'); t.id = 'fk-toast'; t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t);
  clearTimeout(TOAST.t); TOAST.t = setTimeout(function(){ var x = document.getElementById('fk-toast'); if (x) x.remove(); }, 3400);
}

// ---------- Diagramme ----------
function tipPos(box, tip, x, y){
  var bw = box.clientWidth, tw = tip.offsetWidth, th = tip.offsetHeight;
  var left = Math.min(Math.max(x + 12, 0), Math.max(0, bw - tw)); if (x + 12 + tw > bw) left = Math.max(0, x - tw - 12);
  var top = y - th - 10; if (top < 0) top = y + 14;
  tip.style.left = left + 'px'; tip.style.top = top + 'px';
}
function getTip(box){ var t = box.querySelector('.tip'); if (!t){ t = document.createElement('div'); t.className = 'tip'; t.hidden = true; box.appendChild(t); } return t; }
function bindTips(box){
  var tip = getTip(box);
  box.querySelectorAll('.hit').forEach(function(g){
    function show(ev){
      tip.innerHTML = g.getAttribute('data-tip'); tip.hidden = false;
      var r = box.getBoundingClientRect(), x, y;
      if (ev && ev.clientX != null){ x = ev.clientX - r.left; y = ev.clientY - r.top; }
      else { var b = g.getBoundingClientRect(); x = b.left - r.left + b.width / 2; y = b.top - r.top; }
      tipPos(box, tip, x, y);
    }
    g.addEventListener('pointerenter', show); g.addEventListener('pointermove', show); g.addEventListener('pointerdown', show); g.addEventListener('focus', function(){ show(null); });
    g.addEventListener('pointerleave', function(){ tip.hidden = true; }); g.addEventListener('blur', function(){ tip.hidden = true; });
  });
}
function svgText(x, y, s, extra){ return '<text x="' + x + '" y="' + y + '" ' + (extra || '') + '>' + esc(s) + '</text>'; }
var AX = 'font-size="11" fill="var(--ink-3)" style="font-variant-numeric:tabular-nums"';
function niceMax(v){ if (v <= 0) return 10; var p = Math.pow(10, Math.floor(Math.log(v) / Math.LN10)), n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }
function roundedTopRect(x, y, w, h, r){
  if (h <= 0) return '';
  r = Math.min(r, w / 2, h);
  return '<path d="M' + x + ' ' + (y + h) + 'V' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ' ' + y + ' ' + (x + w) + ' ' + (y + r) + 'V' + (y + h) + 'Z"';
}

// Periodisierung: Umfang (Balken) und Intensität (Linie), beide relativ zur Höchstwoche – eine gemeinsame Achse 0–100 %
function drawPerio(box){
  if (!box) return;
  var W = Math.max(280, Math.round(box.clientWidth || 320)), H = 244, m = { l: 34, r: 8, t: 40, b: 34 };
  var weeks = []; for (var w = 1; w <= 10; w++) weeks.push(w);
  var n = weeks.length, bw = (W - m.l - m.r) / n;
  function X(i){ return m.l + i * bw; }
  function Y(v){ return m.t + (1 - v / 100) * (H - m.t - m.b); }
  var o = ['<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true">'];
  // Phasen-Bänder
  PHASES.forEach(function(ph, k){
    var i0 = ph.weeks[0] - 1, i1 = Math.min(ph.weeks[ph.weeks.length - 1], 10) - 1; if (i0 > 9) return;
    var x0 = X(i0), x1 = X(i1 + 1);
    o.push('<rect x="' + (x0 + 1) + '" y="4" width="' + Math.max(1, x1 - x0 - 2) + '" height="6" rx="3" fill="' + ph.col + '"/>');
    var lab = ph.id === 'p4' ? 'Erhalt' : ph.name, fits = lab.length * 6.3 < (x1 - x0 - 4);
    o.push(svgText(x0 + 2, 25, fits ? lab : (ph.id === 'p4' ? 'E' : PH_WORD.charAt(0) + ph.no), 'font-size="11.5" font-weight="700" fill="var(--ink-2)"'));
    if (k > 0) o.push('<line x1="' + x0 + '" x2="' + x0 + '" y1="' + (m.t - 2) + '" y2="' + Y(0) + '" stroke="var(--grid)" stroke-width="1"/>');
  });
  [0, 50, 100].forEach(function(v){
    o.push('<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="' + (v === 0 ? 'var(--axis)' : 'var(--grid)') + '" stroke-width="1"/>');
    o.push('<text x="' + (m.l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" ' + AX + '>' + v + ' %</text>');
  });
  // heute
  var cw = curWeek(), today = todayISO();
  if (cw != null && cw >= 1 && cw <= 10){
    var frac = (daysBetween(weekStart(cw), today) + 0.5) / 7, xt = X(cw - 1 + frac);
    o.push('<line x1="' + xt + '" x2="' + xt + '" y1="' + (m.t - 2) + '" y2="' + Y(0) + '" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="3 3"/>');
  }
  // Balken Umfang
  var barW = Math.max(6, Math.min(26, bw * 0.46));
  weeks.forEach(function(w, i){ var v = WEEKS[w].v, x = X(i) + (bw - barW) / 2, y = Y(v); o.push(roundedTopRect(x, y, barW, Y(0) - y, 4) + ' fill="var(--s1)"/>'); });
  // Linie Intensität
  var d = ''; weeks.forEach(function(w, i){ d += (i ? 'L' : 'M') + (X(i) + bw / 2).toFixed(1) + ' ' + Y(WEEKS[w].i).toFixed(1); });
  o.push('<path d="' + d + '" fill="none" stroke="var(--s2)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>');
  weeks.forEach(function(w, i){ o.push('<circle cx="' + (X(i) + bw / 2) + '" cy="' + Y(WEEKS[w].i) + '" r="4" fill="var(--s2)" stroke="var(--panel)" stroke-width="2"/>'); });
  // Wochen-Beschriftung + Hover-Flächen
  weeks.forEach(function(w, i){
    var lab = w <= MAIN_WEEKS ? String(w) : 'E', ph = phaseOfWeek(w);
    o.push('<text x="' + (X(i) + bw / 2) + '" y="' + (H - 18) + '" text-anchor="middle" ' + AX + ' font-weight="' + (w === cw ? '700' : '400') + '">' + lab + '</text>');
    var tip = '<b>' + (w <= MAIN_WEEKS ? 'Woche ' + w : 'Erhalt (Woche 10–12)') + '</b><div class="tip-h">' + weekRange(w) + ' · ' + esc(ph.name) + '</div>' + esc(WEEKS[w].t)
      + '<div class="tr"><span><i class="sw" style="background:var(--s1)"></i>Umfang</span><b>' + WEEKS[w].v + ' %</b></div><div class="tr"><span><i class="lk" style="background:var(--s2)"></i>Intensität</span><b>' + WEEKS[w].i + ' %</b></div>'
      + (w <= MAIN_WEEKS ? '<div class="tip-h">' + (gamesInWeek(w).length ? 'Spiel ' + esc(gamesInWeek(w).map(function(g){ return fmtWd(g.d); }).join(', ')) : 'spielfrei') + '</div>' : '');
    o.push('<g class="hit" tabindex="0" data-tip="' + esc(tip) + '"><rect x="' + X(i) + '" y="' + (m.t - 2) + '" width="' + bw + '" height="' + (Y(0) - m.t + 2) + '" fill="transparent"/></g>');
  });
  o.push('<text x="' + m.l + '" y="' + (H - 3) + '" ' + AX + '>Woche</text>');
  o.push('</svg>');
  box.innerHTML = o.join('');
  bindTips(box);
}
function liftPoints(x){
  var log = LV(), pts = [];
  Object.keys(log).forEach(function(k){ var e = log[k], b = bestOf(e, x); if (b) pts.push({ d: entryDate(e), w: parseSid(k).w, s: parseSid(k).s, v: b.est, b: b }); });
  return pts.sort(function(a, b){ return a.d < b.d ? -1 : 1; });
}
function drawStrength(box){
  if (!box) return;
  var pts = liftPoints(UI.lift), name = (LIFTS.filter(function(l){ return l[0] === UI.lift; })[0] || ['', ''])[1];
  var rr = RM_BY_X[UI.lift], tpts = (rr && !(UI.demo && MODE !== 'reader')) ? testsOf(rr.k).map(function(t){ return { d: t.d, v: rmE1(t), t: t }; }) : [];
  var all = pts.concat(tpts).sort(function(a, b){ return a.d < b.d ? -1 : 1; });
  if (!all.length){ box.innerHTML = '<p class="small muted">Für ' + esc(name) + ' gibt es noch keinen Kraft-Test und keine Einträge mit Gewicht.</p>'; return; }
  var refV = (UI.lift === 'sq' && S.profile.bw && SQ_REF) ? SQ_REF * S.profile.bw : null;
  var W = Math.max(280, Math.round(box.clientWidth || 320)), H = 220, m = { l: 40, r: 14, t: 26, b: 28 };
  var vals = all.map(function(p){ return p.v; }); if (refV) vals.push(refV);
  var vmin = Math.min.apply(null, vals), vmax = Math.max.apply(null, vals);
  var lo = Math.max(0, Math.floor((vmin * 0.9) / 5) * 5), hi = Math.ceil((vmax * 1.06) / 5) * 5; if (hi - lo < 10) hi = lo + 10;
  var d0 = parseISO(all[0].d), d1 = parseISO(all[all.length - 1].d), span = Math.max(1, (d1 - d0) / 864e5), single = d1 === d0;
  function X(p){ return single ? (W - m.l - m.r) / 2 + m.l : m.l + ((parseISO(p.d) - d0) / 864e5) / span * (W - m.l - m.r); }
  function Y(v){ return m.t + (1 - (v - lo) / (hi - lo)) * (H - m.t - m.b); }
  var o = ['<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true">'];
  var step = niceMax((hi - lo) / 4);
  for (var v = Math.ceil(lo / step) * step; v <= hi; v += step){
    o.push('<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="var(--grid)" stroke-width="1"/>');
    o.push('<text x="' + (m.l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" ' + AX + '>' + fmtNum(v) + '</text>');
  }
  o.push('<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + Y(lo) + '" y2="' + Y(lo) + '" stroke="var(--axis)" stroke-width="1"/>');
  o.push('<text x="' + (m.l - 6) + '" y="11" text-anchor="end" font-size="10.5" fill="var(--ink-3)">kg</text>');
  if (refV){
    o.push('<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + Y(refV) + '" y2="' + Y(refV) + '" stroke="var(--ink-3)" stroke-width="1.5" stroke-dasharray="5 4"/>');
    var rl = 'Orientierung ' + fmtNum(SQ_REF) + ' × KG';
    o.push('<text x="' + (m.l + 4) + '" y="' + (Y(refV) - 5) + '" text-anchor="start" font-size="11" fill="var(--ink-3)">' + esc(rl) + '</text>');
  }
  if (pts.length > 1){ var d = ''; pts.forEach(function(p, i){ d += (i ? 'L' : 'M') + X(p).toFixed(1) + ' ' + Y(p.v).toFixed(1); }); o.push('<path d="' + d + '" fill="none" stroke="var(--s1)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'); }
  var ud = []; all.forEach(function(p){ if (ud.indexOf(p.d) < 0) ud.push(p.d); });
  var nL = Math.max(1, Math.min(ud.length, Math.floor((W - m.l - m.r) / 70))), lastX = -999;
  for (var k = 0; k < nL; k++){
    var di = ud.length === 1 ? 0 : Math.round(k * (ud.length - 1) / Math.max(1, nL - 1)), dd = ud[di], xx = X({ d: dd });
    if (xx - lastX < 56) continue; lastX = xx;
    var anc = ud.length === 1 ? 'middle' : (di === 0 ? 'start' : (di === ud.length - 1 ? 'end' : 'middle'));
    o.push('<text x="' + xx + '" y="' + (H - 8) + '" text-anchor="' + anc + '" ' + AX + '>' + fmtShort(dd) + '</text>');
  }
  tpts.forEach(function(p){
    var tt = p.t, tip = '<div class="tip-h">' + esc(fmtWd(p.d)) + ' · Kraft-Test</div><div class="tr"><span>Testsatz</span><b>' + fmtNum(tt.v) + ' kg × ' + tt.n + '</b></div><div class="tr"><span>Reserve</span><b>' + tt.q + '</b></div><div class="tr"><span>Kraft-Schätzwert</span><b>' + fmtNum(Math.round(p.v * 2) / 2) + ' kg</b></div>';
    o.push('<g class="hit" tabindex="0" data-tip="' + esc(tip) + '"><circle cx="' + X(p) + '" cy="' + Y(p.v) + '" r="6" fill="var(--panel)" stroke="var(--s1)" stroke-width="2.5"/><circle cx="' + X(p) + '" cy="' + Y(p.v) + '" r="14" fill="transparent"/></g>');
  });
  pts.forEach(function(p){
    var tip = '<div class="tip-h">' + esc(fmtWd(p.d)) + ' · Woche ' + p.w + ' · ' + esc(SESS[p.s].s) + '</div><div class="tr"><span>Bester Satz</span><b>' + fmtNum(p.b.kg) + ' kg × ' + p.b.reps + '</b></div><div class="tr"><span>Kraft-Schätzwert</span><b>' + fmtNum(Math.round(p.v * 2) / 2) + ' kg</b></div>';
    o.push('<g class="hit" tabindex="0" data-tip="' + esc(tip) + '"><circle cx="' + X(p) + '" cy="' + Y(p.v) + '" r="4.5" fill="var(--s1)" stroke="var(--panel)" stroke-width="2"/><circle cx="' + X(p) + '" cy="' + Y(p.v) + '" r="14" fill="transparent"/></g>');
  });
  var lp = all[all.length - 1], first = all[0];
  var lbl = fmtNum(Math.round(lp.v * 2) / 2) + ' kg' + (all.length > 1 ? ' (' + (lp.v >= first.v ? '+' : '') + Math.round((lp.v - first.v) / first.v * 100) + ' %)' : '');
  var lx = Math.min(X(lp), W - m.r - lbl.length * 6.6), ly = Y(lp.v) - 12; if (ly < 12) ly = Y(lp.v) + 20;
  o.push('<text x="' + lx + '" y="' + ly + '" font-size="12" font-weight="700" fill="var(--ink)">' + esc(lbl) + '</text>');
  o.push('</svg>');
  box.innerHTML = o.join('');
  bindTips(box);
}
function drawLoad(box){
  if (!box) return;
  var wl = weekLoads(LV()), keys = Object.keys(wl).map(Number);
  if (!keys.length){ box.innerHTML = '<p class="small muted">Noch keine abgeschlossene Einheit mit Anstrengung und Dauer.</p>'; return; }
  var last = Math.max(MAIN_WEEKS, Math.max.apply(null, keys)), weeks = []; for (var w = 1; w <= last; w++) weeks.push(w);
  var W = Math.max(280, Math.round(box.clientWidth || 320)), H = 190, m = { l: 44, r: 8, t: 12, b: 28 };
  var mx = niceMax(Math.max.apply(null, keys.map(function(k){ return wl[k].load; })) * 1.05), bw = (W - m.l - m.r) / weeks.length, barW = Math.max(6, Math.min(26, bw * 0.55));
  function Y(v){ return m.t + (1 - v / mx) * (H - m.t - m.b); }
  var o = ['<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true">'];
  [0, mx / 2, mx].forEach(function(v){ o.push('<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="' + (v === 0 ? 'var(--axis)' : 'var(--grid)') + '" stroke-width="1"/><text x="' + (m.l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" ' + AX + '>' + fmtInt(v) + '</text>'); });
  weeks.forEach(function(w, i){
    var x = m.l + i * bw + (bw - barW) / 2, v = wl[w] ? wl[w].load : 0;
    if (v > 0) o.push(roundedTopRect(x, Y(v), barW, Y(0) - Y(v), 4) + ' fill="var(--s1)"/>');
    o.push('<text x="' + (m.l + i * bw + bw / 2) + '" y="' + (H - 9) + '" text-anchor="middle" ' + AX + '>' + (w <= MAIN_WEEKS ? w : 'E' + (w - MAIN_WEEKS)) + '</text>');
    var tip = '<b>Woche ' + w + '</b><div class="tip-h">' + weekRange(w) + '</div><div class="tr"><span>Einheiten</span><b>' + (wl[w] ? wl[w].n : 0) + '</b></div><div class="tr"><span>Belastung</span><b>' + fmtInt(v) + '</b></div>';
    o.push('<g class="hit" tabindex="0" data-tip="' + esc(tip) + '"><rect x="' + (m.l + i * bw) + '" y="' + m.t + '" width="' + bw + '" height="' + (Y(0) - m.t) + '" fill="transparent"/></g>');
  });
  o.push('</svg>');
  box.innerHTML = o.join('');
  bindTips(box);
}
function drawScale(box, cfg){
  if (!box) return;
  var es = entriesSorted(LV()).filter(function(e){ return e.f && cfg.series.some(function(s){ return e[s[0]] != null; }); });
  if (!es.length){ box.innerHTML = '<p class="small muted">' + esc(cfg.empty) + '</p>'; return; }
  var W = Math.max(280, Math.round(box.clientWidth || 320)), H = 200, m = { l: 26, r: 60, t: 10, b: 26 };
  var d0 = parseISO(entryDate(es[0])), d1 = parseISO(entryDate(es[es.length - 1])), span = Math.max(1, (d1 - d0) / 864e5);
  function X(e){ return es.length === 1 ? m.l + (W - m.l - m.r) / 2 : m.l + ((parseISO(entryDate(e)) - d0) / 864e5) / span * (W - m.l - m.r); }
  function Y(v){ return m.t + (1 - v / 10) * (H - m.t - m.b); }
  var o = ['<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true">'];
  cfg.bands.forEach(function(b){
    o.push('<rect x="' + m.l + '" y="' + Y(b[1]) + '" width="' + (W - m.l - m.r) + '" height="' + (Y(b[0]) - Y(b[1])) + '" fill="' + b[2] + '"/>');
    var cy = (Y(b[0]) + Y(b[1])) / 2;
    o.push('<circle cx="' + (W - m.r + 10) + '" cy="' + cy + '" r="4" fill="' + b[3] + '"/><text x="' + (W - m.r + 18) + '" y="' + (cy + 4) + '" font-size="11" fill="var(--ink-3)">' + b[4] + '</text>');
  });
  [0, 2, 4, 6, 8, 10].forEach(function(v){ o.push('<text x="' + (m.l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" ' + AX + '>' + v + '</text>'); });
  o.push('<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + Y(0) + '" y2="' + Y(0) + '" stroke="var(--axis)" stroke-width="1"/>');
  cfg.series.forEach(function(sr){
    var key = sr[0], col = sr[1], d = '', pen = false;
    es.forEach(function(e){ var v = e[key]; if (v == null){ pen = false; return; } d += (pen ? 'L' : 'M') + X(e).toFixed(1) + ' ' + Y(v).toFixed(1); pen = true; });
    if (d && es.length > 1) o.push('<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>');
    es.forEach(function(e){ if (e[key] == null) return; o.push('<circle cx="' + X(e) + '" cy="' + Y(e[key]) + '" r="4" fill="' + col + '" stroke="var(--panel)" stroke-width="2"/>'); });
  });
  var nL = Math.max(2, Math.min(es.length, Math.floor((W - m.l - m.r) / 64))), shown = {};
  for (var k = 0; k < nL; k++){ var idx = es.length === 1 ? 0 : Math.round(k * (es.length - 1) / (nL - 1)); if (shown[idx]) continue; shown[idx] = 1; var anc = es.length === 1 ? 'middle' : (idx === 0 ? 'start' : (idx === es.length - 1 ? 'end' : 'middle')); o.push('<text x="' + X(es[idx]) + '" y="' + (H - 8) + '" text-anchor="' + anc + '" ' + AX + '>' + fmtShort(entryDate(es[idx])) + '</text>'); }
  es.forEach(function(e){
    var ps = parseSid(e.s), tip = '<div class="tip-h">' + esc(fmtWd(entryDate(e))) + ' · ' + esc(SESS[ps.s].s) + '</div>' + cfg.series.map(function(sr){ return '<div class="tr"><span><i class="lk" style="background:' + sr[1] + '"></i>' + esc(sr[2]) + '</span><b>' + (e[sr[0]] == null ? '–' : e[sr[0]] + '/10') + '</b></div>'; }).join('') + (cfg.side && e.ks ? '<div class="tip-h">' + esc(optLabel(OPT.ks, e.ks)) + '</div>' : '');
    o.push('<g class="hit" tabindex="0" data-tip="' + esc(tip) + '"><rect x="' + (X(e) - 10) + '" y="' + m.t + '" width="20" height="' + (Y(0) - m.t) + '" fill="transparent"/></g>');
  });
  o.push('</svg>');
  box.innerHTML = o.join('');
  bindTips(box);
}
var PAIN_BANDS = [[0, 2.5, 'var(--ok-soft)', 'var(--ok-dot)', 'Grün'], [2.5, 4.5, 'var(--warn-soft)', 'var(--warn-dot)', 'Gelb'], [4.5, 10, 'var(--bad-soft)', 'var(--bad-dot)', 'Rot']];
var FRESH_BANDS = [[0, 3.5, 'var(--bad-soft)', 'var(--bad-dot)', 'platt'], [3.5, 6.5, 'var(--warn-soft)', 'var(--warn-dot)', 'mittel'], [6.5, 10, 'var(--ok-soft)', 'var(--ok-dot)', 'frisch']];
function drawKnee(box){ drawScale(box, { bands: PAIN_BANDS, series: [['k', 'var(--s1)', PAIN_SERIES[0]], ['o', 'var(--s2)', PAIN_SERIES[1]], ['sh', 'var(--ink-3)', PAIN_SERIES[2]]], side: true, empty: PAIN_EMPTY }); }
function drawFresh(box){ drawScale(box, { bands: FRESH_BANDS, series: [['fr', 'var(--s1)', 'Frische vor dem Training']], empty: 'Noch keine Frische-Werte.' }); }
function drawCharts(){
  if (UI.tab === 'plan' && !UI.sess) drawPerio(document.getElementById('perio-chart'));
  if (UI.tab === 'log'){ drawStrength(document.getElementById('str-chart')); drawLoad(document.getElementById('load-chart')); drawKnee(document.getElementById('knee-chart')); drawFresh(document.getElementById('fresh-chart')); }
}

// ---------- Aktionen ----------
function flushNow(){ if (PENDING_SET){ var e = PENDING_SET; PENDING_SET = null; putEntry(e, true); } }
function setOk(x, i){
  var sid = UI.sess; if (!sid || !canLog()) return;
  flushNow();
  var e = getEntry(sid) || newEntry(sid), ex = EX[x], nv = ex.t === 'kg' ? 2 : (ex.t === 'tick' ? 0 : 1);
  var arr = e.x[x] || []; while (arr.length <= i){ var row = []; for (var q = 0; q < nv; q++) row.push(null); row.push(0); arr.push(row); }
  var s = arr[i], on = !s[nv];
  if (on){
    // leere Felder mit den grau angezeigten Vorschlägen füllen
    for (var j = 0; j < nv; j++){
      var inp = document.getElementById('in-' + x + '-' + i + '-' + j);
      var val = inp ? num(inp.value) : null; if (val == null && inp) val = num(inp.placeholder);
      if (val != null) s[j] = val;
    }
  }
  s[nv] = on ? 1 : 0; e.x[x] = arr;
  if (!putEntry(e)) return;
  renderAll();
}
function blockOk(gi){
  var sid = UI.sess; if (!sid || !canLog()) return;
  flushNow();
  var ps = parseSid(sid), g = itemGroups(itemsOf(ps.w, ps.s))[gi]; if (!g) return;
  var e = getEntry(sid) || newEntry(sid);
  var allOn = g.items.filter(function(it){ return !it.opt; }).every(function(it){ return doneSets(e, it.x).length >= it.p.sets; });
  g.items.forEach(function(it){ if (it.ex.t !== 'tick' || it.opt) return; var arr = []; for (var i = 0; i < it.p.sets; i++) arr.push([allOn ? 0 : 1]); e.x[it.x] = arr; });
  if (putEntry(e)) renderAll();
}
function addSet(x){ var k = UI.sess + ':' + x; UI.extra[k] = (UI.extra[k] || 0) + 1; renderAll(); var el = document.getElementById('ex-' + x); if (el){ var ins = el.querySelectorAll('input[data-set]'); if (ins.length){ try { ins[ins.length - (EX[x].t === 'kg' ? 2 : 1)].focus({ preventScroll: true }); } catch (e) {} } } }
function setRir(x, v){
  var sid = UI.sess; if (!sid || !canLog()) return;
  flushNow();
  var e = getEntry(sid) || newEntry(sid); e.r[x] = v; putEntry(e);
}
function finishSession(sid){
  if (!canLog()) return;
  flushNow();
  var f = UI.fin[sid] || {}, e = getEntry(sid) || newEntry(sid);
  function g(id){ var el = document.getElementById(id); return el ? el.value : null; }
  function radio(name){ var el = document.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : null; }
  var d = g('fin-d'), m = num(g('fin-m')), fr = radio('fin-fr'), rpe = radio('fin-e'), knee = radio('fin-k'), ks = radio('fin-ks'), sh = radio('fin-sh'), n = (g('fin-n') || '').trim();
  UI.finErr = '';
  if (parseISO(d) == null || d > todayISO()){ UI.finErr = 'Bitte ein gültiges Datum wählen (nicht in der Zukunft).'; renderAll(); return; }
  if (fr == null){ UI.finErr = 'Bitte antippen, wie frisch du vor dem Training warst.'; renderAll(); scrollToId('finish'); return; }
  if (rpe == null){ UI.finErr = 'Bitte antippen, wie anstrengend die Einheit war.'; renderAll(); scrollToId('finish'); return; }
  if (knee == null){ UI.finErr = FIN_K_REQ; renderAll(); scrollToId('finish'); return; }
  if (Array.isArray(f.z)) e.z = zNorm(f.z);
  e.d = d; e.m = m; e.fr = +fr; e.e = +rpe; e.k = +knee; e.ks = (+knee > 0 && ks) ? ks : ''; e.sh = sh != null ? +sh : e.sh; e.n = n; var wasDone = !!e.f; e.f = 1;
  if (!putEntry(e)) return;
  delete UI.fin[sid];
  if (selfOn()){
    if (!wasDone){ UI.sess = null; UI.tab = 'start'; }
    selfSync(wasDone ? 'Gespeichert – steht im Plan.' : 'Stark! Einheit abgeschlossen und im Plan gespeichert.');
    if (!wasDone) window.scrollTo(0, 0);
    return;
  }
  renderAll();
  toast(wasDone ? 'Gespeichert.' : 'Stark! Einheit abgeschlossen – schick deinen Stand an ' + therAcc() + '.');
  if (!wasDone){ UI.sess = null; UI.tab = 'start'; renderAll(false); window.scrollTo(0, 0); var sc = document.getElementById('h-send'); if (sc){ try { sc.scrollIntoView({ block: 'center' }); } catch (e2) {} } }
}
function scrollToId(id){ var el = document.getElementById(id); if (el){ try { el.scrollIntoView({ block: 'start' }); } catch (e) {} } }
function saveMorning(sid, v){
  if (!canLog()) return;
  var e = getEntry(sid); if (!e) return;
  e.o = v; if (putEntry(e)){ if (selfSync('Danke – ' + PAIN_LBL + ' heute Morgen: ' + v + '/10. Im Plan gespeichert.')) return; renderAll(); toast('Danke – ' + PAIN_LBL + ' heute Morgen: ' + v + '/10.'); }
}
function saveFresh(sid, v){
  if (!canLog() || !SIDS[sid]) return;
  flushNow();
  var e = getEntry(sid) || newEntry(sid); e.fr = v;
  if (UI.fin[sid]) delete UI.fin[sid].fr;
  if (putEntry(e)) renderAll();
}
function addTest(k){
  var def = testDef(k); if (!def) return;
  var id = 'tf-' + k, date = (document.getElementById(id + '-date') || {}).value || '', a = num((document.getElementById(id + '-a') || {}).value), b = num((document.getElementById(id + '-b') || {}).value);
  UI.tErr = null;
  function err(m){ UI.tErr = { k: k, m: m }; renderAll(); }
  if (parseISO(date) == null) return err('Bitte ein Datum wählen.');
  if (date > todayISO()) return err('Das Datum liegt in der Zukunft.');
  var t = { id: rid(), k: k, d: date, t: Date.now() };
  if (def.kind === 'lr'){ if (a == null || b == null) return err('Bitte beide Seiten eintragen.'); t.l = a; t.r = b; }
  else { if (a == null) return err('Bitte einen Wert eintragen.'); t.v = a; }
  if (def.pain && ((t.l != null && t.l > 10) || (t.r != null && t.r > 10) || (t.v != null && t.v > 10))) return err('Schmerz bitte von 0 bis 10 angeben.');
  UI.tdraft[k] = {};
  var nt = normTest(t);
  if (MODE === 'writer'){ commit(function(s){ s.tests.push(nt); }, true); toast('Wert gespeichert.'); return; }
  var lt = localTests(); lt.push(nt);
  if (!lsSet(LK('tests'), lt)) toast('Auf diesem Gerät kann nichts gespeichert werden (privates Fenster?).');
  else toast('Wert gespeichert – auf diesem Gerät.');
  invalidate(); renderAll();
}
function valOf(id){ var el = document.getElementById(id); return el ? el.value : ''; }
function saveRmTest(t){
  var nt = normTest(t); if (!nt) return false;
  if (MODE === 'writer'){ commit(function(s){ var i = -1; s.tests.forEach(function(x, j){ if (x.id === nt.id) i = j; }); if (i >= 0) s.tests[i] = nt; else s.tests.push(nt); }, true); return true; }
  var lt = localTests().filter(function(x){ return x.id !== nt.id; }); lt.push(nt);
  if (!lsSet(LK('tests'), lt)){ toast('Auf diesem Gerät kann nichts gespeichert werden (privates Fenster?).'); return false; }
  invalidate(); return true;
}
function rmFail(k, m){ UI.rmErr = { k: k, m: m }; renderAll(); }
function saveRm(k, w){
  var kg = num(valOf('rm-kg-' + k)), n = num(valOf('rm-n-' + k)), qEl = document.querySelector('input[name="rmq-' + k + '"]:checked'), q = qEl ? +qEl.value : 1;
  UI.rmErr = null;
  if (!(kg > 0)) return rmFail(k, 'Bitte das Testgewicht eintragen.');
  if (!(n >= 1 && n <= 30)) return rmFail(k, 'Bitte die geschafften Wiederholungen eintragen.');
  var ex = rmTestFor(k, w), today = todayISO(), ps = parseSid(UI.sess);
  var d = ex ? ex.d : (weekOf(today) === w ? today : (ps ? planDate(w, ps.s) : today));
  if (d > today) d = today;
  if (!saveRmTest({ id: ex ? ex.id : rid(), k: k, d: d, v: kg, n: Math.round(n), q: q, t: Date.now() })) return;
  UI.rmEdit = null; UI.rmDraft[k] = {};
  if (MODE !== 'writer') renderAll();
  var est = e1rm(kg, n, q);
  toast('Test gespeichert – Kraft-Schätzwert ' + fmtNum(Math.round(est * 2) / 2) + ' kg. Die Gewichte sind angepasst.');
}
function addRmTab(){
  var k = valOf('rmf-k'), d = valOf('rmf-d'), kg = num(valOf('rmf-kg')), n = num(valOf('rmf-n')), qEl = document.querySelector('input[name="rmf-q"]:checked'), q = qEl ? +qEl.value : 1;
  UI.rmErr = null;
  if (!testDef(k)) return rmFail('_tab', 'Bitte eine Übung wählen.');
  if (parseISO(d) == null || d > todayISO()) return rmFail('_tab', 'Bitte ein gültiges Datum wählen.');
  if (!(kg > 0)) return rmFail('_tab', 'Bitte das Testgewicht eintragen.');
  if (!(n >= 1 && n <= 30)) return rmFail('_tab', 'Bitte die Wiederholungen eintragen.');
  if (!saveRmTest({ id: rid(), k: k, d: d, v: kg, n: Math.round(n), q: q, t: Date.now() })) return;
  UI.rmDraft._tab = { k: k };
  if (MODE !== 'writer') renderAll();
  toast('Test gespeichert.');
}
var PF_DATES = { start: 1 };
function saveProfile(){
  if (MODE !== 'writer') return;
  var root = document.getElementById('fk-root'), els = root ? root.querySelectorAll('[data-pf]') : [], bad = null, np = JSON.parse(JSON.stringify(S.profile));
  for (var i = 0; i < els.length; i++){
    var el = els[i], f = el.getAttribute('data-pf'), v = String(el.value == null ? '' : el.value).trim().slice(0, 300);
    el.removeAttribute('aria-invalid');
    if (PF_DATES[f] && parseISO(v) == null){ bad = bad || [el, 'Bitte ein gültiges Startdatum wählen.']; continue; }
    np[f] = v;
  }
  if (bad){ var box = document.getElementById('pf-err'); if (box){ box.innerHTML = chip('bad', esc(bad[1])); box.hidden = false; } bad[0].setAttribute('aria-invalid', 'true'); return; }
  UI.editProfile = false; blurField();
  commit(function(s){ s.profile = normProfile(np); }, true);
  window.scrollTo(0, 0);
  toast('Gespeichert.');
}
function doReset(){
  UI.confirm = null;
  commit(function(s){ s.log = {}; s.tests = []; s.imported = ''; s.id = rid(); }, true);
  toast('Zurückgesetzt – Einheiten und Tests sind gelöscht.');
}
function reportHtml(){
  var css = 'body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#0f1b2d;margin:24px;line-height:1.45;font-size:14px}h1{font-size:22px;margin:0 0 2px}h2{font-size:16px;margin:24px 0 8px;border-bottom:2px solid #0c2a33;padding-bottom:4px}h3{font-size:14px;margin:14px 0 4px}table{border-collapse:collapse;width:100%;margin:6px 0}th,td{border:1px solid #cfd8e3;padding:5px 7px;text-align:left;vertical-align:top}th{background:#eef2f7;font-size:12px}.m{color:#5f6e85}@media print{body{margin:12mm}h2{break-after:avoid}tr{break-inside:avoid}}';
  var h = '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(TITLE) + ' – ' + esc(athName()) + ' – ' + fmtDate(todayISO()) + '</title><style>' + css + '</style></head><body>';
  h += '<h1>' + esc(TITLE) + ' · ' + esc(athName()) + '</h1><div class="m">' + esc(POSITION) + ' · Start ' + fmtDate(startISO()) + ' · Stand ' + fmtDate(todayISO()) + '</div>';
  var ts = allTests().slice().sort(function(a, b){ return a.d < b.d ? -1 : 1; });
  h += '<h2>Tests</h2>' + (ts.length ? '<table><thead><tr><th>Datum</th><th>Test</th><th>Ergebnis</th></tr></thead><tbody>' + ts.map(function(t){ return '<tr><td>' + fmtDate(t.d) + '</td><td>' + esc(testDef(t.k).name) + '</td><td>' + esc(testLine(t).replace(testDef(t.k).name + ': ', '')) + '</td></tr>'; }).join('') + '</tbody></table>' : '<p class="m">Noch keine Tests.</p>');
  var es = entriesSorted();
  h += '<h2>Einheiten</h2>' + (es.length ? es.map(function(e){
    var ps = parseSid(e.s);
    return '<h3>' + esc(fmtWd(entryDate(e))) + ' · Woche ' + ps.w + ' · ' + esc(SESS[ps.s].t) + (e.f ? '' : ' (begonnen)') + '</h3><div class="m">' + esc(entryHead(e).split(' · ').slice(1).join(' · ')) + '</div><ul>' + entryLines(e, true).map(function(l){ return '<li>' + esc(l.replace(/^• /, '')) + '</li>'; }).join('') + '</ul>' + (e.n ? '<p>„' + esc(e.n) + '“</p>' : '');
  }).join('') : '<p class="m">Noch keine Einheiten.</p>');
  h += '<p class="m" style="margin-top:24px">Erstellt mit ' + esc(TITLE) + '. ' + esc(S.profile.ther || '') + '</p>';
  return h + '</body></html>';
}

// ---------- Ereignisse ----------
function onClick(ev){
  var b = ev.target.closest('[data-act]'); if (!b) return;
  var a = b.getAttribute('data-act');
  if (b.tagName === 'A' && a !== 'sent-wa' && a !== 'gotoref') ev.preventDefault();
  switch (a){
    case 'sent-wa':
      // Link mit dem aktuellsten (ggf. gepackten) Text ausstatten, bevor WhatsApp öffnet
      try { b.href = waHref(); } catch (e) {}
      markSent(); setTimeout(function(){ if (!fieldFocused()) renderAll(); }, 900); break;
    case 'copy-send':
      var stx = buildSendText();
      copyText(stx, 'Kopiert – jetzt in WhatsApp an ' + therAcc() + ' einfügen.', function(){ UI.sendText = stx; renderAll(); var sb = document.getElementById('send-box'); if (sb){ sb.focus(); sb.select(); } });
      markSent(); break;
    case 'welcome-ok': lsSet(LK('welcome'), 1); renderAll(); break;
    case 'self-sync': if (!selfSync('Im Plan gespeichert.')) toast('Alles ist schon im Plan.'); break;
    case 'force-writer': S = normalize(parseJSON(ORIG_TEXT)); setMode('writer'); toast('Bearbeiten ist freigeschaltet.'); break;
    case 'tab':
      ev.preventDefault();
      UI.tab = b.getAttribute('data-tab'); UI.sess = null; UI.backSess = null; UI.confirm = null; UI.tErr = null; UI.finErr = '';
      renderAll(false); window.scrollTo(0, 0); break;
    case 'goto-tests':
      flushNow(); UI.backSess = UI.sess || null; UI.tab = 'tests'; UI.sess = null; UI.confirm = null; UI.tErr = null;
      renderAll(false); var gt = document.getElementById(b.getAttribute('data-to') || 'h-jump');
      if (gt){ try { gt.scrollIntoView({ block: 'start' }); } catch (e) { window.scrollTo(0, 0); } } else window.scrollTo(0, 0); break;
    case 'back-sess':
      var bs = UI.backSess; UI.backSess = null;
      if (bs && SIDS[bs]){ UI.tab = 'plan'; UI.sess = bs; }
      renderAll(false); window.scrollTo(0, 0); break;
    case 'scrollto': var se = document.getElementById(b.getAttribute('data-to')); if (se){ try { se.scrollIntoView({ block: 'start' }); } catch (e) {} } break;
    case 'view': UI.view = b.getAttribute('data-v'); lsSet('fk:view', UI.view); renderAll(); break;
    case 'open-sess': flushNow(); UI.tab = 'plan'; UI.sess = b.getAttribute('data-sid'); UI.finErr = ''; UI.confirm = null; renderAll(false); window.scrollTo(0, 0); break;
    case 'close-sess': flushNow(); var ps = parseSid(UI.sess); UI.sess = null; if (ps) UI.week = ps.w; renderAll(false); window.scrollTo(0, 0); break;
    case 'plan-week': UI.tab = 'plan'; UI.sess = null; UI.week = +b.getAttribute('data-w'); var y0 = window.scrollY; renderAll(false); window.scrollTo(0, UI.tab === 'plan' ? Math.min(y0, 0) : 0); break;
    case 'setok': setOk(b.getAttribute('data-x'), +b.getAttribute('data-i')); break;
    case 'addset': addSet(b.getAttribute('data-x')); break;
    case 'blockok': blockOk(+b.getAttribute('data-g')); break;
    case 'rm-save': saveRm(b.getAttribute('data-k'), +b.getAttribute('data-w')); break;
    case 'rm-add': addRmTab(); break;
    case 'rm-edit': UI.rmEdit = b.getAttribute('data-k'); UI.rmErr = null; renderAll(); break;
    case 'rm-cancel': UI.rmEdit = null; UI.rmErr = null; renderAll(); break;
    case 'fz-add': zAdd(); break;
    case 'fz-del': zDel(+b.getAttribute('data-i')); break;
    case 'finish': finishSession(b.getAttribute('data-sid')); break;
    case 'lift': UI.lift = b.getAttribute('data-l'); renderAll(); break;
    case 'demo': UI.demo = !UI.demo; renderAll(); break;
    case 'gotoref': ev.preventDefault(); UI.tab = 'infos'; UI.sess = null; UI.refsOpen = true; renderAll(false); var q = document.getElementById('q' + b.getAttribute('data-n')); if (q) q.scrollIntoView({ block: 'center' }); break;
    case 'editprofile': UI.editProfile = true; renderAll(); break;
    case 'cancelprofile': UI.editProfile = false; renderAll(); break;
    case 'doneprofile': saveProfile(); break;
    case 'reset-ask': UI.confirm = 'reset'; renderAll(); break;
    case 'reset-yes': doReset(); break;
    case 'cancel': UI.confirm = null; UI.importData = null; renderAll(); break;
    case 'del-ask': UI.confirm = 'del:' + b.getAttribute('data-sid'); renderAll(); break;
    case 'del-yes': flushNow(); var ds = b.getAttribute('data-sid'); UI.confirm = null; if (SELF){ var ml = localLog(); delete ml[ds]; saveLocalLog(ml); } if (S.log[ds]) commit(function(s){ delete s.log[ds]; }, true); else renderAll(); toast('Einheit gelöscht.'); break;
    case 'tdel-ask': UI.confirm = 'tdel:' + b.getAttribute('data-id'); renderAll(); break;
    case 'tdel-yes':
      var tid = b.getAttribute('data-id'); UI.confirm = null;
      if (MODE === 'writer') commit(function(s){ s.tests = s.tests.filter(function(t){ return t.id !== tid; }); }, true);
      else { lsSet(LK('tests'), localTests().filter(function(t){ return t.id !== tid; })); invalidate(); renderAll(); }
      toast('Wert gelöscht.'); break;
    case 'addtest': addTest(b.getAttribute('data-k')); break;
    case 'import-code': importCode(); break;
    case 'export-html': saveFile(TITLE + '_' + slug(S.profile.name) + '_' + todayISO() + '.html', reportHtml(), 'Datei gespeichert.'); break;
    case 'export-json': saveFile(TITLE + '_Sicherung_' + slug(S.profile.name) + '_' + todayISO() + '.json', JSON.stringify({ app: APP_ID, v: 1, exported: new Date().toISOString(), state: S }, null, 2), 'Sicherung gespeichert.'); break;
    case 'import-yes': if (UI.importData){ var data = UI.importData; UI.importData = null; UI.confirm = null; commit(function(s){ var n = normalize(data); n.rev = s.rev; n.saveId = s.saveId; n.updated = s.updated; Object.keys(n).forEach(function(k){ s[k] = n[k]; }); }, true); toast('Sicherung geladen.'); } break;
    case 'conflict-apply': if (CONFLICT){ var c = normalize(CONFLICT); CONFLICT = null; c.rev = S.rev; c.saveId = S.saveId; c.updated = S.updated; S = c; invalidate(); stashLocal(); renderAll(); scheduleSave(true); } break;
    case 'conflict-drop': CONFLICT = null; ssDel('fk-pending'); renderAll(); break;
    case 'retry-save': SAVE.err = ''; renderAll(); scheduleSave(true); break;
  }
}
function onChange(ev){
  var t = ev.target;
  if (t.hasAttribute('data-rir')){ setRir(t.getAttribute('data-rir'), +t.value); return; }
  if (t.hasAttribute('data-rmq')){ var qk = t.getAttribute('data-rmq'); UI.rmDraft[qk] = UI.rmDraft[qk] || {}; UI.rmDraft[qk].q = +t.value; return; }
  if (t.hasAttribute('data-rm') || t.hasAttribute('data-rmf')){ rmDraftFrom(t); return; }
  if (t.hasAttribute('data-fr')){ saveFresh(t.getAttribute('data-fr'), +t.value); return; }
  if (t.hasAttribute('data-mo')){ saveMorning(t.getAttribute('data-mo'), +t.value); return; }
  if (t.hasAttribute('data-fz')){ zSet(t); return; }
  if (t.hasAttribute('data-fin')){
    var sid = UI.sess; if (!sid) return; var k = t.getAttribute('data-fin');
    UI.fin[sid] = UI.fin[sid] || {}; UI.fin[sid][k] = (k === 'd' || k === 'n' || k === 'ks') ? t.value : num(t.value);
    if (k === 'k') renderAll();
    return;
  }
  if (t.hasAttribute('data-set')){ setFromInput(t); return; }
  if (t.id === 'imp-file' && t.files && t.files[0]){
    var fr = new FileReader();
    fr.onload = function(){ var o = parseJSON(String(fr.result || '')); if (!o || o.app !== APP_ID || !o.state){ toast('Das ist keine ' + TITLE + '-Sicherung.'); return; } UI.importData = o.state; UI.confirm = 'import'; renderAll(); };
    fr.onerror = function(){ toast('Die Datei konnte nicht gelesen werden.'); };
    fr.readAsText(t.files[0]); t.value = ''; return;
  }
  draftFrom(t);
}
function draftFrom(t){
  var tk = t.getAttribute && t.getAttribute('data-tdraft');
  if (tk){ var parts = tk.split(':'); UI.tdraft[parts[0]] = UI.tdraft[parts[0]] || {}; UI.tdraft[parts[0]][parts[1]] = t.value; }
}
function rmDraftFrom(t){
  if (t.hasAttribute('data-rm')){ var p = t.getAttribute('data-rm').split(':'); UI.rmDraft[p[0]] = UI.rmDraft[p[0]] || {}; UI.rmDraft[p[0]][p[1]] = t.value; return; }
  var f = t.getAttribute('data-rmf'); UI.rmDraft._tab = UI.rmDraft._tab || {}; UI.rmDraft._tab[f] = f === 'q' ? +t.value : t.value;
}
function onInput(ev){
  var t = ev.target;
  if (t.hasAttribute && (t.hasAttribute('data-rm') || (t.hasAttribute('data-rmf') && t.type !== 'radio'))){ rmDraftFrom(t); return; }
  if (t.type === 'radio' || t.type === 'checkbox') return;
  if (t.hasAttribute && t.hasAttribute('data-set')){ setFromInput(t); return; }
  if (t.hasAttribute && t.hasAttribute('data-fz')){ zSet(t); return; }
  if (t.hasAttribute && t.hasAttribute('data-fin')){ var sid = UI.sess; if (!sid) return; var k = t.getAttribute('data-fin'); UI.fin[sid] = UI.fin[sid] || {}; UI.fin[sid][k] = (k === 'd' || k === 'n') ? t.value : num(t.value); return; }
  draftFrom(t);
}
function onKey(ev){
  // Enter im Satz-Feld: zum nächsten Feld springen statt Formular abschicken
  if (ev.key !== 'Enter') return;
  var t = ev.target; if (!t || !t.hasAttribute) return;
  var key = t.hasAttribute('data-set') ? 'data-set' : (t.hasAttribute('data-fz') ? 'data-fz' : ''); if (!key) return;
  ev.preventDefault();
  var all = Array.prototype.slice.call(document.querySelectorAll('input[' + key + ']')), i = all.indexOf(t);
  if (i >= 0 && all[i + 1]) all[i + 1].focus(); else t.blur();
}

// ---------- Start ----------
var STARTED = false;
function start(hot){
  if (STARTED) return; STARTED = true;
  var st = (hot && hot.ui) || ssGet('fk-ui', null);
  if (st && typeof st === 'object'){
    if (st.tab) UI.tab = st.tab;
    if (st.sess && SIDS[st.sess]) UI.sess = st.sess;
    if (st.back && SIDS[st.back]) UI.backSess = st.back;
    if (st.week) UI.week = st.week;
    if (st.lift) UI.lift = st.lift;
    if (st.edit) UI.editProfile = true;
    if (st.refs) UI.refsOpen = true;
    if (st.tdraft && typeof st.tdraft === 'object') UI.tdraft = st.tdraft;
  }
  var v = lsGet('fk:view', null); if (v === 'pro' || v === 'ath') UI.view = v;
  var pend = ssGet('fk-pending', null), reapply = false;
  if (pend && typeof pend === 'object'){
    var fresh = !!pend.state && Date.now() - (pend.at || 0) < 15 * 60 * 1000;
    if (pend.saveId && pend.saveId === S.saveId) ssDel('fk-pending');
    else if (fresh && pend.after && pend.after === (S.saveId || '-')){ var c = normalize(pend.state); c.rev = S.rev; c.saveId = S.saveId; c.updated = S.updated; S = c; reapply = true; }
    else if (fresh) CONFLICT = pend.state;
    else ssDel('fk-pending');
  }
  var root = document.getElementById('fk-root');
  root.addEventListener('click', onClick); root.addEventListener('change', onChange); root.addEventListener('input', onInput); root.addEventListener('keydown', onKey);
  root.addEventListener('submit', function(ev){ ev.preventDefault(); });
  function act(){ ACT.last = Date.now(); }
  document.addEventListener('pointerdown', function(){ ACT.down = true; ACT.downAt = ACT.last = Date.now(); }, true);
  document.addEventListener('pointerup', function(){ ACT.down = false; act(); }, true);
  document.addEventListener('pointercancel', function(){ ACT.down = false; act(); }, true);
  document.addEventListener('keydown', act, true);
  document.addEventListener('input', act, true);
  window.addEventListener('scroll', act, { passive: true });
  function keepView(){
    flushNow();
    ssSet('fk-ui', uiSnapshot());
    if (MODE === 'writer' && !SAVE.busy && (SAVE.state === 'pending' || SAVE.state === 'dirty')) stashLocal();
  }
  document.addEventListener('visibilitychange', function(){ if (document.visibilityState === 'hidden') keepView(); });
  window.addEventListener('pagehide', keepView);
  renderAll(false);
  if (st && st.y) window.scrollTo(0, st.y);
  ssSet('fk-ui', uiSnapshot());
  var fl = ssGet('fk-flash', null); ssDel('fk-flash');
  if (fl && fl.msg && Date.now() - (fl.at || 0) < 15000) toast(fl.msg);
  window.addEventListener('resize', debounce(drawCharts, 150));
  initCaps();
  if (reapply) scheduleSave();
}
var HOT = (window.claude && window.claude.hot) || null;
try { if (HOT && typeof HOT.snapshot === 'function') HOT.snapshot(function(){ return { ui: uiSnapshot() }; }); } catch (e) {}
if (HOT && typeof HOT.ready === 'function'){ try { HOT.ready(start); } catch (e) { start({}); } setTimeout(function(){ if (!STARTED) start({}); }, 1500); }
else start((HOT && HOT.data) || {});
}

starten();
})();
