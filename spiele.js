/*! O.G. Trainings-App · Minigames (Test, Aufgabe 65) · Version 32238b6404
 * Lädt nur, wenn ein Plan MINIGAME hat (miniStart in app_template.js) – die echten Pläne laden diese Datei nicht.
 * Punkte gibt es nur fürs Training: gespeicherte Einheit, Pflicht-Übungen mit mindestens einem Satz, Morgen-Check,
 * ganze Woche. Nie für mehr Gewicht, mehr Sätze, Optionales oder Extra-Training (Belastungsmanagement).
 * Punkte, Rekorde und Auswahl bleiben auf dem Gerät (ogt:mini:<kennung>) und gehen nicht mit der Rückmeldung raus.
 * Figuren, Spiele und Effekte sind eigene Entwürfe. Quelle: app/spiele.js (build.py setzt die Version). */
(function(){
'use strict';
var A = window.OGT_MINI;
if (!A || A.geladen) return;
A.geladen = true;

var CFG = A.cfg || {}, TEST = !!CFG.test, KEY = 'ogt:mini:' + A.id;
var RUHIG = false;
try { RUHIG = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) {}
var SCHRIFT = "'Barlow Condensed','Arial Narrow',system-ui,sans-serif";
var TAU = Math.PI * 2;

// ===================== Speicher (nur auf diesem Gerät) =====================
function lesen(){
  try { var o = JSON.parse(localStorage.getItem(KEY) || 'null'); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; }
  catch (e) { return {}; }
}
var ST = lesen();
if (!ST.rekord || typeof ST.rekord !== 'object') ST.rekord = {};
if (!Array.isArray(ST.gesehen)) ST.gesehen = null;   // null = erster Start auf diesem Gerät
function sichern(){ try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) {} }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function zahl(n){ return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function zufall(a, b){ return a + Math.random() * (b - a); }
function begrenzt(v, a, b){ return Math.max(a, Math.min(b, v)); }
function reihe(c, n){ return new Array(Math.max(0, n) + 1).join(c); }
function el(tag, cls, html){ var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

// ===================== Punkte =====================
var REGEL = { einheit: 10, uebung: 2, morgen: 3, woche: 15 };
function einheitPunkte(x){ return REGEL.einheit + REGEL.uebung * (x.erledigt || 0) + (x.morgen ? REGEL.morgen : 0); }
function stand(){
  var es = [], ws = [];
  try { es = A.einheiten() || []; ws = A.wochen() || []; } catch (e) {}
  var p = 0;
  es.forEach(function(x){ p += einheitPunkte(x); });
  p += ws.length * REGEL.woche;
  if (TEST) p += Math.max(0, +ST.bonus || 0);
  return { punkte: p, einheiten: es, wochen: ws };
}

// ===================== Was es freizuschalten gibt =====================
var SPIELE = {
  siebenmeter: { n: '7-Meter', icon: '🤾', einheit: 'Tore', start: siebenmeter,
    text: 'Wirf am Torwart vorbei: Tipp ins Tor, wohin der Ball fliegen soll. 10 Würfe.' },
  parade: { n: 'Parade', icon: '🥅', einheit: 'Paraden', start: parade,
    text: 'Tipp die Bälle an, bevor sie im Tor sind. Nach 3 Gegentoren ist Schluss.' },
  katze: { n: 'High Five', icon: '🐾', einheit: 'High Fives', start: highfive,
    text: 'Klatsch die Pixelkatze ab: Tipp auf die Seite, auf der sie die Pfote hebt – aber nur dann.' }
};
var SPIEL_AB = [10, 60, 150];   // erstes Spiel nach der ersten gespeicherten Einheit, dann nach und nach
var FEIERN = [
  { id: 'konfetti', n: 'Konfetti', icon: '🎊', ab: 0 },
  { id: 'feuerwerk', n: 'Feuerwerk', icon: '🎆', ab: 50 },
  { id: 'zufall', n: 'Zufall', icon: '🎲', ab: 50 },
  { id: 'katze', n: 'Pixelkatze High Five', icon: 'katze', ab: 120 },
  { id: 'baelle', n: 'Handball-Regen', icon: 'ball', ab: 250 },
  { id: 'pokal', n: 'Goldener Pokal', icon: '🏆', ab: 400 }
];
var KATZE_AB = 120;
var DEKO = [
  { id: 'stirnband', n: 'Stirnband', ab: 200 },
  { id: 'brille', n: 'Sonnenbrille', ab: 350 },
  { id: 'krone', n: 'Krone', ab: 600 }
];
function spielListe(){ return (Array.isArray(CFG.spiele) ? CFG.spiele : []).filter(function(id){ return SPIELE[id]; }); }
function spielAb(id){ var i = spielListe().indexOf(id); return SPIEL_AB[Math.min(Math.max(i, 0), SPIEL_AB.length - 1)]; }
function alleDinge(){
  var a = [];
  spielListe().forEach(function(id){ a.push({ id: 'spiel:' + id, n: 'Spiel „' + SPIELE[id].n + '“', ab: spielAb(id) }); });
  FEIERN.forEach(function(f){ if (f.ab > 0 && f.id !== 'zufall') a.push({ id: 'feier:' + f.id, n: f.n, ab: f.ab }); });
  DEKO.forEach(function(d){ a.push({ id: 'deko:' + d.id, n: d.n + ' für die Katze', ab: d.ab }); });
  return a;
}
function naechstes(p){ var n = null; alleDinge().forEach(function(d){ if (d.ab > p && (!n || d.ab < n.ab)) n = d; }); return n; }
function vorige(p){ var v = 0; alleDinge().forEach(function(d){ if (d.ab <= p && d.ab > v) v = d.ab; }); return v; }
// Was seit dem letzten Mal neu freigeschaltet ist (wird dabei als gesehen gemerkt)
function neuFrei(p){
  var an = alleDinge().filter(function(d){ return p >= d.ab; });
  if (ST.gesehen === null){ ST.gesehen = an.map(function(d){ return d.id; }); return []; }
  var neu = an.filter(function(d){ return ST.gesehen.indexOf(d.id) < 0; });
  if (neu.length) ST.gesehen = ST.gesehen.concat(neu.map(function(d){ return d.id; }));
  return neu;
}
function aktiveFeier(p){
  var id = ST.feier || 'konfetti', f = FEIERN.filter(function(x){ return x.id === id; })[0];
  return f && p >= f.ab ? id : 'konfetti';
}
function aktiveDeko(p){
  var d = DEKO.filter(function(x){ return x.id === ST.deko; })[0];
  return d && p >= d.ab ? d.id : '';
}

// ===================== Pixelkatze (eigener Entwurf, 20 × 20 Pixel) =====================
var KATZE16 = [
  '..k' + reihe('.', 10) + 'k..',
  '..kk' + reihe('.', 8) + 'kk..',
  '..kpk' + reihe('.', 6) + 'kpk..',
  '..kpp' + reihe('k', 6) + 'ppk..',
  '.k' + reihe('o', 12) + 'k.',
  '.koowe' + reihe('o', 4) + 'weook.',
  '.kooee' + reihe('o', 4) + 'eeook.',
  '.kowwwwppwwwwok.',
  '.koowwkwwkwwook.',
  '..koo' + reihe('w', 6) + 'ook..',
  '..kooo' + reihe('w', 4) + 'oook..',
  '.kooo' + reihe('w', 6) + 'oook.',
  '.koosowwwwosook.',
  '.kooooowwoooook.',
  '.kowwwkookwwwok.',
  '..' + reihe('k', 12) + '..'
];
var KATZE = [reihe('.', 20), reihe('.', 20), reihe('.', 20)].concat(KATZE16.map(function(r){ return '..' + r + '..'; }), [reihe('.', 20)]);
// erhobene Pfote (links im Bild; rechts gespiegelt)
var ARM = [[1, 4, 'k'], [2, 4, 'k'], [0, 5, 'k'], [1, 5, 'w'], [2, 5, 'w'], [3, 5, 'k'], [0, 6, 'k'], [1, 6, 'p'], [2, 6, 'p'], [3, 6, 'k'],
  [0, 7, 'k'], [1, 7, 'w'], [2, 7, 'w'], [3, 7, 'k'], [0, 8, 'k'], [1, 8, 'o'], [2, 8, 'o'], [3, 8, 'k'], [0, 9, 'k'], [1, 9, 'o'], [2, 9, 'o'], [3, 9, 'k'],
  [0, 10, 'k'], [1, 10, 'o'], [2, 10, 'o'], [3, 10, 'k'], [0, 11, 'k'], [1, 11, 'o'], [2, 11, 'o'], [3, 11, 'k'], [0, 12, 'k'], [1, 12, 'o'], [2, 12, 'o'], [3, 12, 'o'],
  [1, 13, 'k'], [2, 13, 'o'], [3, 13, 'o'], [4, 13, 'o'], [2, 14, 'k'], [3, 14, 'o'], [5, 17, 'o'], [6, 17, 'o'], [7, 17, 'o']];
var DEKO_PIX = {
  stirnband: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(function(x){ return [x, 7, x === 9 || x === 10 ? 'h' : 'r']; }),
  brille: [[5, 8, 'b'], [6, 8, 'g'], [7, 8, 'b'], [8, 8, 'b'], [9, 8, 'b'], [10, 8, 'b'], [11, 8, 'b'], [12, 8, 'g'], [13, 8, 'b'], [14, 8, 'b'],
    [5, 9, 'b'], [6, 9, 'b'], [7, 9, 'b'], [8, 9, 'b'], [11, 9, 'b'], [12, 9, 'b'], [13, 9, 'b'], [14, 9, 'b']],
  krone: [[7, 2, 'y'], [9, 2, 'y'], [10, 2, 'y'], [12, 2, 'y'], [7, 3, 'y'], [8, 3, 'y'], [9, 3, 'y'], [10, 3, 'y'], [11, 3, 'y'], [12, 3, 'y'],
    [7, 4, 'y'], [8, 4, 'r'], [9, 4, 'y'], [10, 4, 'y'], [11, 4, 'r'], [12, 4, 'y'], [7, 5, 'd'], [8, 5, 'd'], [9, 5, 'd'], [10, 5, 'd'], [11, 5, 'd'], [12, 5, 'd']]
};
var FARBE = { k: '#2b1d14', o: '#f39a32', s: '#cf6f1d', w: '#fff4e3', p: '#f7a8c2', e: '#1f1a17', r: '#e53935', h: '#ffffff',
  b: '#161616', g: '#9fb1c4', y: '#ffcd2e', d: '#c58f0c' };
// opt: { arm: -1 | 0 | 1, gesicht: '' | 'froh' | 'grummel', deko: '' | 'stirnband' | 'brille' | 'krone' }
function katzeGitter(opt){
  opt = opt || {};
  var g = KATZE.map(function(r){ return r.split(''); });
  function setz(x, y, c){ if (y >= 0 && y < 20 && x >= 0 && x < 20) g[y][x] = c; }
  if (opt.arm) ARM.forEach(function(p){ setz(opt.arm < 0 ? p[0] : 19 - p[0], p[1], p[2]); });
  if (opt.gesicht === 'froh') [6, 7, 12, 13].forEach(function(x){ setz(x, 8, 'o'); setz(x, 9, 'k'); });
  else if (opt.gesicht === 'grummel') [6, 7, 12, 13].forEach(function(x){ setz(x, 8, 'k'); });
  (DEKO_PIX[opt.deko] || []).forEach(function(p){ setz(p[0], p[1], p[2]); });
  return g;
}
function katzeSvg(opt){
  var g = katzeGitter(opt), out = '';
  for (var y = 0; y < 20; y++){
    var x = 0;
    while (x < 20){
      var c = g[y][x];
      if (c === '.' || !FARBE[c]){ x++; continue; }
      var x2 = x; while (x2 < 20 && g[y][x2] === c) x2++;
      out += '<rect x="' + x + '" y="' + y + '" width="' + (x2 - x) + '" height="1" fill="' + FARBE[c] + '"/>';
      x = x2;
    }
  }
  return '<svg viewBox="0 0 20 20" shape-rendering="crispEdges" aria-hidden="true" focusable="false">' + out + '</svg>';
}
var KATZE_BILD = {};
function katzeBild(opt){
  var k = (opt.arm || 0) + '|' + (opt.gesicht || '') + '|' + (opt.deko || '');
  if (KATZE_BILD[k]) return KATZE_BILD[k];
  var c = document.createElement('canvas'); c.width = 20; c.height = 20;
  var x = c.getContext('2d'), g = katzeGitter(opt);
  for (var yy = 0; yy < 20; yy++) for (var xx = 0; xx < 20; xx++){ var ch = g[yy][xx]; if (FARBE[ch]){ x.fillStyle = FARBE[ch]; x.fillRect(xx, yy, 1, 1); } }
  return (KATZE_BILD[k] = c);
}
function katzeMalen(ctx, opt, cx, cy, groesse){
  ctx.save(); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(katzeBild(opt), Math.round(cx - groesse / 2), Math.round(cy - groesse / 2), Math.round(groesse), Math.round(groesse));
  ctx.restore();
}
function ballSvg(){
  return '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><circle cx="24" cy="24" r="21" fill="#ffd23f" stroke="#1f2937" stroke-width="2"/>'
    + '<path d="M24 3v42M7 13c8 6 8 16 0 22M41 13c-8 6-8 16 0 22" fill="none" stroke="#1d4ed8" stroke-width="3"/></svg>';
}

// ===================== Malhilfen =====================
function linie(ctx, x1, y1, x2, y2){ ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function kreis(ctx, x, y, r){ ctx.beginPath(); ctx.arc(x, y, Math.max(0.5, r), 0, TAU); ctx.fill(); }
function abstandStrecke(px, py, x1, y1, x2, y2){
  var dx = x2 - x1, dy = y2 - y1, l = dx * dx + dy * dy, t = l ? begrenzt(((px - x1) * dx + (py - y1) * dy) / l, 0, 1) : 0;
  var qx = x1 + t * dx, qy = y1 + t * dy;
  return Math.sqrt((px - qx) * (px - qx) + (py - qy) * (py - qy));
}
function ballMalen(ctx, x, y, r, rot){
  r = Math.max(2, r);
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = '#ffd23f'; ctx.fill();
  ctx.save(); ctx.clip(); ctx.rotate(rot || 0);
  ctx.strokeStyle = '#1d4ed8'; ctx.lineWidth = Math.max(1.2, r * 0.16);
  linie(ctx, 0, -r, 0, r);
  ctx.beginPath(); ctx.arc(-r * 1.05, 0, r * 0.8, -1.1, 1.1); ctx.stroke();
  ctx.beginPath(); ctx.arc(r * 1.05, 0, r * 0.8, Math.PI - 1.1, Math.PI + 1.1); ctx.stroke();
  ctx.restore();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.lineWidth = Math.max(1, r * 0.09); ctx.strokeStyle = 'rgba(15,23,42,.55)'; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.38)'; kreis(ctx, -r * 0.35, -r * 0.38, r * 0.26);
  ctx.restore();
}
function streifenPfosten(ctx, x, y, w, h, senkrecht){
  var n = senkrecht ? Math.max(4, Math.round(h / (w * 2.2))) : Math.max(6, Math.round(w / (h * 2.2))), l = (senkrecht ? h : w) / n;
  for (var i = 0; i < n; i++){
    ctx.fillStyle = i % 2 ? '#ffffff' : '#e11d2e';
    if (senkrecht) ctx.fillRect(x, y + i * l, w, l + 0.6); else ctx.fillRect(x + i * l, y, l + 0.6, h);
  }
}
function torMalen(ctx, gx, gy, gw, gh){
  ctx.fillStyle = 'rgba(4,10,22,.6)'; ctx.fillRect(gx, gy, gw, gh);
  ctx.strokeStyle = 'rgba(255,255,255,.13)'; ctx.lineWidth = 1;
  var m = Math.max(9, gw / 16), x, y;
  ctx.beginPath();
  for (x = gx + m; x < gx + gw - 1; x += m){ ctx.moveTo(x, gy); ctx.lineTo(x, gy + gh); }
  for (y = gy + m; y < gy + gh - 1; y += m){ ctx.moveTo(gx, y); ctx.lineTo(gx + gw, y); }
  ctx.stroke();
  var p = Math.max(6, gw * 0.03);
  streifenPfosten(ctx, gx - p, gy - p, p, gh + p, true);
  streifenPfosten(ctx, gx + gw, gy - p, p, gh + p, true);
  streifenPfosten(ctx, gx - p, gy - p, gw + 2 * p, p, false);
}
function hallenBoden(ctx, W, H, oben, unten){
  var gr = ctx.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, oben); gr.addColorStop(1, unten);
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
}
function textMalen(ctx, t, x, y, groesse, farbe, alpha){
  if (alpha != null && alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha == null ? 1 : Math.min(1, alpha);
  ctx.font = '800 ' + Math.round(groesse) + 'px ' + SCHRIFT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, groesse * 0.14); ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.strokeText(t, x, y);
  ctx.fillStyle = farbe; ctx.fillText(t, x, y);
  ctx.restore();
}
function sternMalen(ctx, x, y, r, farbe){
  ctx.beginPath();
  for (var i = 0; i < 10; i++){ var w = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(w) * rr, y + Math.sin(w) * rr); }
  ctx.closePath(); ctx.fillStyle = farbe; ctx.fill();
}

// ===================== Spiel 1: 7-Meter =====================
function siebenmeter(g){
  var S, MAX = 10;
  function geo(){
    var gw = Math.min(g.W * 0.88, g.H * 0.46 * 1.5), gh = gw / 1.5;
    return { gw: gw, gh: gh, gx: (g.W - gw) / 2, gy: Math.max(28, g.H * 0.1), r: gw * 0.042, sx: g.W / 2, sy: g.H * 0.86 };
  }
  function anzeige(){ g.hud('Tore ' + S.tore + ' · Wurf ' + Math.min(MAX, S.wurf + 1) + '/' + MAX); }
  // Torwart aus Strecken (Rumpf, Arme, Beine) und Kopf: daraus wird gemalt und geprüft, ob er den Ball hat
  function koerper(G){
    var cx = G.gx + S.kx * G.gw, boden = G.gy + G.gh, h = G.gh * 0.95, bw = G.gw * 0.08;
    var schulter = boden - h * 0.72, huefte = boden - h * 0.38, kopfR = h * 0.095, hand, fuss;
    // die Hände gehen auf die Höhe des Wurfs (hoch / halbhoch), bei flachen Würfen gehen die Beine raus
    if (S.arme < 0){ hand = [G.gw * 0.17, G.gy + G.gh * begrenzt(S.zielV, 0.04, 0.38)]; fuss = G.gw * 0.06; }
    else if (S.arme > 0){ hand = [G.gw * 0.14, boden - h * 0.32]; fuss = G.gw * 0.18; }
    else { hand = [G.gw * 0.18, G.gy + G.gh * begrenzt(S.zielV, 0.38, 0.7)]; fuss = G.gw * 0.07; }
    return { cx: cx, bw: bw, schulter: schulter, huefte: huefte, kopf: [cx, schulter - kopfR * 1.2, kopfR], teile: [
      [cx, schulter, cx, huefte, bw * 0.5],
      [cx - bw * 0.35, schulter + bw * 0.25, cx - hand[0], hand[1], bw * 0.22],
      [cx + bw * 0.35, schulter + bw * 0.25, cx + hand[0], hand[1], bw * 0.22],
      [cx - bw * 0.2, huefte, cx - fuss, boden - bw * 0.15, bw * 0.24],
      [cx + bw * 0.2, huefte, cx + fuss, boden - bw * 0.15, bw * 0.24]] };
  }
  function gehalten(G, x, y){
    var K = koerper(G), r = G.r * 0.55;
    if (Math.sqrt(Math.pow(x - K.kopf[0], 2) + Math.pow(y - K.kopf[1], 2)) < K.kopf[2] + r) return true;
    return K.teile.some(function(t){ return abstandStrecke(x, y, t[0], t[1], t[2], t[3]) < t[4] + r; });
  }
  return {
    zustand: function(){ var G = geo(); return { tore: S.tore, wurf: S.wurf, kx: S.kx, frei: !S.ball && S.warte <= 0 && !S.fertig, gx: G.gx, gy: G.gy, gw: G.gw, gh: G.gh }; },
    reset: function(){
      S = { wurf: 0, tore: 0, kx: 0.5, dir: Math.random() < 0.5 ? -1 : 1, kv: 0.32, reakt: 0.62, wechsel: zufall(0.5, 1.3),
        ball: null, rest: null, msg: null, warte: 0, fertig: false, arme: 0, zielV: 0.45, t: 0 };
      anzeige();
    },
    tipp: function(x, y){
      if (S.ball || S.fertig || S.warte > 0) return;
      var G = geo(), u = (x - G.gx) / G.gw, v = (y - G.gy) / G.gh;
      var art = (u >= 0 && u <= 1 && v >= 0 && v <= 1) ? 'tor' : ((u > -0.07 && u < 1.07 && v > -0.08 && v <= 1.03) ? 'pfosten' : 'daneben');
      S.ball = { x: x, y: y, u: u, t: 0, T: 0.4, art: art };
      S.arme = v < 0.38 ? -1 : (v > 0.7 ? 1 : 0);   // der Torwart liest die Höhe des Wurfs
      S.zielV = begrenzt(v, 0, 1);
    },
    update: function(dt){
      if (S.fertig) return;
      S.t += dt;
      // nach kurzer Reaktionszeit (0,08 s) läuft der Torwart dem Ball nach – mit jedem Tor schneller
      if (S.ball && S.ball.t > 0.08){ var ziel = begrenzt(S.ball.u, 0.1, 0.9), sp = S.reakt * dt; S.kx += begrenzt(ziel - S.kx, -sp, sp); }
      else if (S.warte <= 0){
        S.kx += S.dir * S.kv * dt; S.wechsel -= dt;
        if (S.kx < 0.15){ S.kx = 0.15; S.dir = 1; } else if (S.kx > 0.85){ S.kx = 0.85; S.dir = -1; }
        if (S.wechsel <= 0){ S.dir *= -1; S.wechsel = zufall(0.35, 1.3); }
      }
      if (S.ball){
        S.ball.t += dt;
        if (S.ball.t >= S.ball.T){
          var G = geo(), b = S.ball, tor = b.art === 'tor' && !gehalten(G, b.x, b.y);
          S.wurf++;
          if (tor){ S.tore++; S.kv = Math.min(1.1, S.kv + 0.07); S.reakt = Math.min(1.55, S.reakt + 0.12); }
          S.msg = { t: tor ? 'TOR!' : (b.art === 'tor' ? 'Gehalten!' : (b.art === 'pfosten' ? 'Pfosten!' : 'Daneben!')),
            farbe: tor ? '#4ade80' : (b.art === 'tor' ? '#f87171' : '#fbbf24'), zeit: 0 };
          S.rest = { x: b.x, y: b.y, tor: tor, vx: zufall(-80, 80), vy: tor ? 0 : 260 };
          S.ball = null; S.warte = 0.85;
          anzeige();
        }
      }
      if (S.rest && !S.rest.tor){ S.rest.x += S.rest.vx * dt; S.rest.y += S.rest.vy * dt; S.rest.vy += 400 * dt; }
      if (S.msg) S.msg.zeit += dt;
      if (S.warte > 0){
        S.warte -= dt;
        if (S.warte <= 0){
          S.rest = null; S.arme = 0; S.zielV = 0.45;
          if (S.wurf >= MAX){ S.fertig = true; g.ende(S.tore, S.tore + (S.tore === 1 ? ' Tor' : ' Tore') + ' bei ' + MAX + ' Würfen'); }
        }
      }
    },
    malen: function(ctx){
      var G = geo(), W = g.W, H = g.H, abst = Math.max(20, G.sy - G.gy - G.gh);
      hallenBoden(ctx, W, H, '#1b4f7a', '#0d2a47');
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2;
      linie(ctx, 0, G.gy + G.gh, W, G.gy + G.gh);                                       // Torlinie
      ctx.beginPath(); ctx.ellipse(W / 2, G.gy + G.gh, G.gw * 0.95, abst * 0.55, 0, 0, Math.PI); ctx.stroke();   // Torraum
      ctx.save(); ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.ellipse(W / 2, G.gy + G.gh, G.gw * 1.4, abst * 0.85, 0, 0, Math.PI); ctx.stroke(); ctx.restore();
      ctx.lineWidth = 4; linie(ctx, W / 2 - G.gw * 0.08, G.sy + G.r * 2.2, W / 2 + G.gw * 0.08, G.sy + G.r * 2.2);   // 7-m-Marke
      torMalen(ctx, G.gx, G.gy, G.gw, G.gh);
      if (S.rest && S.rest.tor) ballMalen(ctx, S.rest.x, S.rest.y, G.r * 0.95, 0);   // Ball im Netz
      var K = koerper(G), t = K.teile;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = K.bw * 0.5;
      linie(ctx, t[3][0], t[3][1], t[3][2], t[3][3]); linie(ctx, t[4][0], t[4][1], t[4][2], t[4][3]);
      ctx.strokeStyle = '#16a34a'; ctx.lineWidth = K.bw;
      linie(ctx, t[0][0], t[0][1], t[0][2], t[0][3]);
      ctx.lineWidth = K.bw * 0.42;
      linie(ctx, t[1][0], t[1][1], t[1][2], t[1][3]); linie(ctx, t[2][0], t[2][1], t[2][2], t[2][3]);
      ctx.fillStyle = '#f2c79a';
      kreis(ctx, t[1][2], t[1][3], K.bw * 0.26); kreis(ctx, t[2][2], t[2][3], K.bw * 0.26); kreis(ctx, K.kopf[0], K.kopf[1], K.kopf[2]);
      ctx.fillStyle = '#052e16'; ctx.font = '800 ' + Math.max(8, Math.round(K.bw * 0.6)) + 'px ' + SCHRIFT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('1', K.cx, (K.schulter + K.huefte) / 2);
      if (S.ball){
        var e = Math.min(1, S.ball.t / S.ball.T), bx = G.sx + (S.ball.x - G.sx) * e, by = G.sy + (S.ball.y - G.sy) * e - Math.sin(Math.PI * e) * G.gh * 0.18;
        ballMalen(ctx, bx, by, G.r * (1.9 - 0.9 * e), S.t * 12);
      } else if (S.rest && !S.rest.tor) ballMalen(ctx, S.rest.x, S.rest.y, G.r, S.t * 8);
      else if (!S.fertig && S.warte <= 0) ballMalen(ctx, G.sx, G.sy, G.r * 1.9, 0);
      if (S.msg && S.msg.zeit < 0.9) textMalen(ctx, S.msg.t, W / 2, G.gy + G.gh + abst * 0.42, Math.min(56, W * 0.13), S.msg.farbe, 1 - Math.max(0, S.msg.zeit - 0.55) / 0.35);
      if (S.wurf === 0 && !S.ball) textMalen(ctx, 'Tipp ins Tor zum Werfen', W / 2, G.sy - G.r * 4.4, Math.min(22, W * 0.055), '#e2e8f0', 0.9);
    }
  };
}

// ===================== Spiel 2: Parade =====================
function parade(g){
  var S;
  function geo(){
    var gw = g.W * 0.9, gh = Math.min(g.H * 0.8, gw * 1.3);
    return { gx: (g.W - gw) / 2, gy: Math.max(18, (g.H - gh) * 0.35), gw: gw, gh: gh, r1: Math.min(gw, gh) * 0.11 };
  }
  function anzeige(){ g.hud('Paraden ' + S.gehalten + ' · Gegentore ' + (3 - S.leben) + '/3'); }
  function radius(b){ return 5 + (b.r1 - 5) * Math.pow(Math.min(1, b.t / b.T), 1.25); }
  function neu(){
    var G = geo(), m = G.r1 * 1.05;
    S.baelle.push({ x: zufall(G.gx + m, G.gx + G.gw - m), y: zufall(G.gy + m, G.gy + G.gh - m), t: 0, T: S.fenster * zufall(0.9, 1.1), r1: G.r1, rot: zufall(0, TAU) });
  }
  return {
    zustand: function(){ return { gehalten: S.gehalten, leben: S.leben, baelle: S.baelle.map(function(b){ return { x: b.x, y: b.y }; }) }; },
    reset: function(){ S = { gehalten: 0, leben: 3, baelle: [], bis: 0.7, fenster: 1.45, abstand: 0.8, effekte: [], fertig: false, ende: 0 }; anzeige(); },
    tipp: function(x, y){
      if (S.fertig || S.ende > 0) return;
      var best = -1, bd = 1e9;
      S.baelle.forEach(function(b, i){ var d = Math.sqrt((x - b.x) * (x - b.x) + (y - b.y) * (y - b.y)); if (d < radius(b) * 1.3 + 16 && d < bd){ bd = d; best = i; } });
      if (best >= 0){
        var b = S.baelle.splice(best, 1)[0];
        S.gehalten++; S.fenster = Math.max(0.55, S.fenster * 0.965); S.abstand = Math.max(0.28, S.abstand * 0.965);
        S.effekte.push({ x: b.x, y: b.y, t: 0, art: 'parade', r: radius(b) });
        anzeige();
      } else S.effekte.push({ x: x, y: y, t: 0, art: 'leer', r: 12 });
    },
    update: function(dt){
      if (S.fertig) return;
      S.effekte.forEach(function(e){ e.t += dt; });
      S.effekte = S.effekte.filter(function(e){ return e.t < 0.8; });
      if (S.ende > 0){
        S.ende -= dt;
        if (S.ende <= 0){ S.fertig = true; g.ende(S.gehalten, S.gehalten + (S.gehalten === 1 ? ' Parade' : ' Paraden')); }
        return;
      }
      S.bis -= dt;
      if (S.bis <= 0){ neu(); if (S.gehalten >= 12 && Math.random() < 0.25) neu(); S.bis = S.abstand * zufall(0.75, 1.25) + 0.12; }
      for (var i = S.baelle.length - 1; i >= 0; i--){
        var b = S.baelle[i]; b.t += dt; b.rot += dt * 4;
        if (b.t >= b.T){
          S.baelle.splice(i, 1); S.leben--;
          S.effekte.push({ x: b.x, y: b.y, t: 0, art: 'tor', r: b.r1 });
          anzeige();
          if (S.leben <= 0){ S.ende = 0.9; S.baelle = []; break; }
        }
      }
    },
    malen: function(ctx){
      var G = geo(), W = g.W, H = g.H;
      hallenBoden(ctx, W, H, '#123456', '#0a1f35');
      torMalen(ctx, G.gx, G.gy, G.gw, G.gh);
      S.baelle.forEach(function(b){
        ctx.save(); ctx.setLineDash([5, 6]); ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r1, 0, TAU); ctx.stroke(); ctx.restore();
        var f = Math.min(1, b.t / b.T);
        if (f > 0.7){ ctx.strokeStyle = 'rgba(248,113,113,' + ((f - 0.7) / 0.3).toFixed(2) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x, b.y, b.r1 + 4, 0, TAU); ctx.stroke(); }
        ballMalen(ctx, b.x, b.y, radius(b), b.rot);
      });
      S.effekte.forEach(function(e){
        var a = Math.max(0, 1 - e.t / 0.8);
        if (e.art === 'parade'){
          ctx.strokeStyle = 'rgba(74,222,128,' + a.toFixed(2) + ')'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(e.x, e.y, e.r + e.t * 90, 0, TAU); ctx.stroke();
          textMalen(ctx, 'Parade!', e.x, e.y - e.r - 14 - e.t * 30, 26, '#4ade80', a);
        } else if (e.art === 'tor'){
          ctx.fillStyle = 'rgba(248,113,113,' + (a * 0.3).toFixed(2) + ')'; ctx.fillRect(G.gx, G.gy, G.gw, G.gh);
          textMalen(ctx, 'Tor!', e.x, e.y, 34, '#f87171', a);
        } else {
          ctx.strokeStyle = 'rgba(255,255,255,' + (a * 0.5).toFixed(2) + ')'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(e.x, e.y, 8 + e.t * 40, 0, TAU); ctx.stroke();
        }
      });
      if (S.gehalten === 0 && S.leben === 3 && !S.baelle.length) textMalen(ctx, 'Gleich kommt der erste Ball …', W / 2, G.gy + G.gh / 2, Math.min(24, W * 0.06), '#e2e8f0', 0.85);
    }
  };
}

// ===================== Spiel 3: High Five mit der Pixelkatze =====================
function highfive(g){
  var S;
  function geo(){ var gr = Math.max(120, Math.floor(Math.min(g.W * 0.9, g.H * 0.66) / 20) * 20); return { gr: gr, cx: g.W / 2, cy: g.H * 0.55 }; }
  function anzeige(){ g.hud('High Fives ' + S.punkte + ' · ' + reihe('❤', S.leben) + reihe('♡', 3 - S.leben)); }
  function pfote(G, seite){ var px = G.gr / 20; return { x: G.cx + (seite < 0 ? -1 : 1) * 8.5 * px, y: G.cy - G.gr / 2 + 5.5 * px }; }
  function fehler(text){
    S.leben--; S.gesicht = 'grummel'; S.gesichtT = 0.75;
    S.effekte.push({ t: 0, text: text, farbe: '#fca5a5', x: g.W / 2, y: g.H * 0.17 });
    anzeige();
    if (S.leben <= 0) S.ende = 0.9;
  }
  return {
    zustand: function(){ return { punkte: S.punkte, leben: S.leben, phase: S.ende > 0 ? 'ende' : S.phase, seite: S.seite }; },
    reset: function(){
      S = { punkte: 0, leben: 3, phase: 'warten', t: 0, dauer: zufall(0.7, 1.2), seite: 0, fenster: 1.05, gesicht: '', gesichtT: 0,
        effekte: [], funken: [], fertig: false, ende: 0, deko: aktiveDeko(stand().punkte) };
      anzeige();
    },
    tipp: function(x){
      if (S.fertig || S.ende > 0) return;
      var seite = x < g.W / 2 ? -1 : 1;
      if (S.phase === 'pfote' && seite === S.seite){
        var P = pfote(geo(), seite);
        S.punkte++; S.gesicht = 'froh'; S.gesichtT = 0.45; S.fenster = Math.max(0.42, S.fenster * 0.955);
        S.effekte.push({ t: 0, text: 'Patsch!', farbe: '#86efac', x: P.x, y: P.y - 34 });
        for (var i = 0; i < 14; i++){ var w = zufall(0, TAU), v = zufall(60, 200); S.funken.push({ x: P.x, y: P.y, vx: Math.cos(w) * v, vy: Math.sin(w) * v, t: 0 }); }
        S.phase = 'warten'; S.t = 0; S.dauer = zufall(0.3, 0.95) * Math.max(0.5, 1 - S.punkte * 0.02);
        anzeige();
      } else {
        if (S.phase === 'pfote'){ S.phase = 'warten'; S.t = 0; S.dauer = zufall(0.4, 1); }
        fehler('Miau?!');
      }
    },
    update: function(dt){
      if (S.fertig) return;
      if (S.gesichtT > 0){ S.gesichtT -= dt; if (S.gesichtT <= 0) S.gesicht = ''; }
      S.effekte.forEach(function(e){ e.t += dt; });
      S.effekte = S.effekte.filter(function(e){ return e.t < 0.9; });
      S.funken.forEach(function(f){ f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 300 * dt; });
      S.funken = S.funken.filter(function(f){ return f.t < 0.6; });
      if (S.ende > 0){
        S.ende -= dt;
        if (S.ende <= 0){ S.fertig = true; g.ende(S.punkte, S.punkte + (S.punkte === 1 ? ' High Five' : ' High Fives')); }
        return;
      }
      S.t += dt;
      if (S.phase === 'warten' && S.t >= S.dauer){ S.phase = 'pfote'; S.seite = Math.random() < 0.5 ? -1 : 1; S.t = 0; }
      else if (S.phase === 'pfote' && S.t >= S.fenster){ S.phase = 'warten'; S.t = 0; S.dauer = zufall(0.4, 1); fehler('Zu langsam!'); }
    },
    malen: function(ctx){
      var G = geo(), W = g.W, H = g.H, gr = ctx.createLinearGradient(0, 0, 0, H), oben = S.phase === 'pfote' && S.ende <= 0;
      gr.addColorStop(0, '#2b1747'); gr.addColorStop(1, '#130b26');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.035)'; ctx.fillRect(0, 0, W / 2, H);
      if (oben){ ctx.fillStyle = 'rgba(134,239,172,.10)'; ctx.fillRect(S.seite < 0 ? 0 : W / 2, 0, W / 2, H); }
      ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1; linie(ctx, W / 2, 0, W / 2, H);
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(G.cx, G.cy + G.gr * 0.43, G.gr * 0.36, G.gr * 0.06, 0, 0, TAU); ctx.fill();
      katzeMalen(ctx, { arm: oben ? S.seite : 0, gesicht: S.gesicht, deko: S.deko }, G.cx, G.cy, G.gr);
      if (oben){ var P = pfote(G, S.seite); textMalen(ctx, 'High Five!', P.x + (S.seite < 0 ? 34 : -34), P.y - G.gr * 0.16, Math.min(24, W * 0.06), '#fde68a', 1); }
      S.funken.forEach(function(f){ sternMalen(ctx, f.x, f.y, 5 * (1 - f.t / 0.6) + 1, '#fde047'); });
      S.effekte.forEach(function(e){ textMalen(ctx, e.text, e.x, e.y - e.t * 40, Math.min(34, W * 0.085), e.farbe, 1 - e.t / 0.9); });
      if (S.punkte === 0 && S.leben === 3 && S.phase === 'warten') textMalen(ctx, 'Warte, bis sie die Pfote hebt …', W / 2, H * 0.12, Math.min(22, W * 0.055), '#e9d5ff', 0.9);
    }
  };
}

// ===================== Spiel-Rahmen: Vollbild, Start- und Endtafel, Pause =====================
function sperren(){
  var offen = !!(document.getElementById('ogt-mini') || document.querySelector('.ogt-mini-spiel'));
  document.documentElement.classList.toggle('ogt-mini-offen', offen);
}
function spielStarten(id){
  var def = SPIELE[id]; if (!def || document.querySelector('.ogt-mini-spiel')) return;
  var lay = el('div', 'ogt-mini-spiel');
  lay.setAttribute('role', 'dialog'); lay.setAttribute('aria-modal', 'true'); lay.setAttribute('aria-label', def.n);
  lay.innerHTML = '<div class="ogt-mini-hud"><b>' + esc(def.n) + '</b><span class="ogt-mini-hud-r"></span>'
    + '<button type="button" class="ogt-mini-x" data-spiel="zu" aria-label="Spiel beenden">✕</button></div>'
    + '<div class="ogt-mini-buehne"><canvas></canvas><div class="ogt-mini-tafel" hidden></div></div>';
  document.body.appendChild(lay); sperren();
  var cv = lay.querySelector('canvas'), ctx = cv.getContext('2d'), hudR = lay.querySelector('.ogt-mini-hud-r'), tafel = lay.querySelector('.ogt-mini-tafel');
  var g = { W: 1, H: 1, hud: function(t){ hudR.textContent = t; } }, spiel = def.start(g), laeuft = false, raf = 0, letzte = 0, zu = false;
  function groesse(){
    var r = cv.getBoundingClientRect(), dpr = Math.min(2.5, window.devicePixelRatio || 1);
    g.W = Math.max(1, r.width); g.H = Math.max(1, r.height);
    cv.width = Math.max(1, Math.round(g.W * dpr)); cv.height = Math.max(1, Math.round(g.H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function schritt(ts){
    if (!laeuft || zu) return;
    var dt = letzte ? Math.min(0.05, (ts - letzte) / 1000) : 0; letzte = ts;
    spiel.update(dt); spiel.malen(ctx);
    if (laeuft) raf = requestAnimationFrame(schritt);
  }
  function knoepfe(text){
    return '<div class="ogt-mini-reihe"><button type="button" class="ogt-mini-los" data-spiel="los">' + esc(text || 'Los geht’s') + '</button>'
      + '<button type="button" data-spiel="zu">Zurück</button></div>';
  }
  function tafelZeigen(html){ tafel.innerHTML = html; tafel.hidden = false; var b = tafel.querySelector('.ogt-mini-los'); if (b){ try { b.focus({ preventScroll: true }); } catch (e) {} } }
  function los(){ tafel.hidden = true; spiel.reset(); laeuft = true; letzte = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(schritt); }
  g.ende = function(wert, satz){
    laeuft = false;
    var alt = ST.rekord[id], neu = wert > 0 && (alt == null || wert > alt);
    if (neu){ ST.rekord[id] = wert; sichern(); }
    tafelZeigen('<h2>' + esc(satz) + '</h2>'
      + (neu ? '<p class="ogt-mini-rekord">Neuer Rekord! 🎉</p>' : (alt != null ? '<p>Dein Rekord: ' + alt + ' ' + esc(def.einheit) + '</p>' : ''))
      + knoepfe('Nochmal'));
    if (neu) burst(window.innerWidth / 2, window.innerHeight * 0.4);
  };
  function beenden(){
    zu = true; laeuft = false; cancelAnimationFrame(raf);
    window.removeEventListener('resize', neuGross); document.removeEventListener('visibilitychange', sicht);
    lay.remove(); sperren(); neuZeichnen();
  }
  function neuGross(){ groesse(); if (!laeuft){ try { spiel.malen(ctx); } catch (e) {} } }
  function sicht(){
    if (document.visibilityState === 'hidden' && laeuft){
      laeuft = false; cancelAnimationFrame(raf);
      tafelZeigen('<h2>Pause</h2><div class="ogt-mini-reihe"><button type="button" class="ogt-mini-los" data-spiel="weiter">Weiter</button><button type="button" data-spiel="zu">Zurück</button></div>');
    }
  }
  lay.addEventListener('click', function(ev){
    var b = ev.target && ev.target.closest ? ev.target.closest('[data-spiel]') : null; if (!b) return;
    var a = b.getAttribute('data-spiel');
    if (a === 'los') los();
    else if (a === 'weiter'){ tafel.hidden = true; laeuft = true; letzte = 0; raf = requestAnimationFrame(schritt); }
    else if (a === 'zu') beenden();
  });
  cv.addEventListener('pointerdown', function(ev){
    if (ev.cancelable) ev.preventDefault();
    if (!laeuft) return;
    var r = cv.getBoundingClientRect();
    spiel.tipp(ev.clientX - r.left, ev.clientY - r.top);
  });
  window.addEventListener('resize', neuGross); document.addEventListener('visibilitychange', sicht);
  groesse(); spiel.reset(); spiel.malen(ctx);
  var rek = ST.rekord[id];
  tafelZeigen('<h2>' + esc(def.n) + '</h2><p>' + esc(def.text) + '</p>' + (rek != null ? '<p>Dein Rekord: ' + rek + ' ' + esc(def.einheit) + '</p>' : '') + knoepfe());
  // für die automatischen Prüfungen (tests/tests_minigame.html): Stand des Spiels lesen
  A.spiel = { id: id, laeuft: function(){ return laeuft; }, zustand: function(){ return spiel.zustand(); }, groesse: function(){ return { W: g.W, H: g.H }; } };
}

// ===================== Feiern nach dem Training =====================
function leinwand(effekt){
  if (RUHIG) return;
  var lay = el('div', 'ogt-mini-feier'), cv = document.createElement('canvas');
  lay.setAttribute('aria-hidden', 'true'); lay.appendChild(cv); document.body.appendChild(lay);
  var W = window.innerWidth, H = window.innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1), ctx = cv.getContext('2d');
  cv.width = Math.max(1, Math.round(W * dpr)); cv.height = Math.max(1, Math.round(H * dpr)); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  var e = effekt(W, H), t0 = 0, vor = 0;
  function schritt(ts){
    if (!t0) t0 = vor = ts;
    var t = (ts - t0) / 1000, dt = Math.min(0.05, (ts - vor) / 1000); vor = ts;
    ctx.clearRect(0, 0, W, H);
    lay.style.opacity = t > e.dauer - 0.5 ? String(Math.max(0, (e.dauer - t) / 0.5)) : '1';
    try { e.malen(ctx, t, dt); } catch (err) { lay.remove(); throw err; }
    if (t < e.dauer) requestAnimationFrame(schritt); else lay.remove();
  }
  requestAnimationFrame(schritt);
}
var EFFEKT = {
  konfetti: function(W, H){
    var farben = ['#ff4d6d', '#ffb703', '#06d6a0', '#3a86ff', '#8338ec', '#fb5607', '#ffd60a'], teile = [];
    for (var i = 0; i < 160; i++){
      var links = i % 2 === 0;
      teile.push({ x: links ? -6 : W + 6, y: H * zufall(0.78, 0.9), vx: (links ? 1 : -1) * zufall(160, 640), vy: -zufall(1000, 1800),
        w: zufall(6, 11), h: zufall(4, 7), r: zufall(0, TAU), vr: zufall(-9, 9), c: farben[i % farben.length], ph: zufall(0, TAU), start: zufall(0, 0.25) });
    }
    return { dauer: 3.2, malen: function(ctx, t, dt){
      teile.forEach(function(p){
        if (t < p.start) return;
        p.vx *= 1 - 2.6 * dt; p.vy = p.vy * (1 - 2.6 * dt) + 900 * dt;
        p.x += (p.vx + Math.sin(t * 5 + p.ph) * 40) * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, Math.max(1.5, p.h * Math.abs(Math.cos(p.r * 1.7)))); ctx.restore();
      });
    } };
  },
  feuerwerk: function(W, H){
    var raketen = [], funken = [];
    for (var i = 0; i < 6; i++) raketen.push({ start: i * 0.32 + zufall(0, 0.15), x: zufall(W * 0.15, W * 0.85), y: H + 10, ziel: zufall(H * 0.14, H * 0.45), vy: 0, hue: Math.floor(zufall(0, 360)), los: false, knall: false });
    return { dauer: 3.6, malen: function(ctx, t, dt){
      ctx.fillStyle = 'rgba(6,10,28,' + (0.55 * Math.min(1, t * 3)).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H);
      raketen.forEach(function(r){
        if (t < r.start || r.knall) return;
        if (!r.los){ r.los = true; r.vy = -(r.y - r.ziel) / 0.7; }
        r.y += r.vy * dt;
        ctx.strokeStyle = 'hsla(' + r.hue + ',100%,70%,.55)'; ctx.lineWidth = 2; linie(ctx, r.x, r.y, r.x, r.y + 18);
        ctx.fillStyle = 'hsl(' + r.hue + ',100%,78%)'; kreis(ctx, r.x, r.y, 2.4);
        if (r.y <= r.ziel){
          r.knall = true;
          for (var k = 0; k < 90; k++){ var w = zufall(0, TAU), v = zufall(70, 280); funken.push({ x: r.x, y: r.y, vx: Math.cos(w) * v, vy: Math.sin(w) * v, life: zufall(0.9, 1.5), t: 0, hue: r.hue + zufall(-18, 18) }); }
        }
      });
      ctx.globalCompositeOperation = 'lighter';
      funken.forEach(function(f){
        if (f.t > f.life) return;
        f.t += dt; f.vx *= 1 - 1.1 * dt; f.vy = f.vy * (1 - 1.1 * dt) + 90 * dt; f.x += f.vx * dt; f.y += f.vy * dt;
        var a = Math.max(0, 1 - f.t / f.life);
        ctx.fillStyle = 'hsla(' + Math.round(f.hue) + ',100%,' + Math.round(55 + 25 * a) + '%,' + a.toFixed(3) + ')'; kreis(ctx, f.x, f.y, 2 + a * 2);
      });
      ctx.globalCompositeOperation = 'source-over';
    } };
  },
  baelle: function(W, H){
    var b = [];
    for (var i = 0; i < 14; i++){ var r = zufall(14, 26); b.push({ x: zufall(r, W - r), y: -zufall(r, H * 0.9), vx: zufall(-60, 60), vy: zufall(0, 120), r: r, rot: zufall(0, TAU), vr: zufall(-4, 4) }); }
    return { dauer: 3.4, malen: function(ctx, t, dt){
      b.forEach(function(p){
        p.vy += 1500 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        if (p.y > H - p.r){ p.y = H - p.r; p.vy = -Math.abs(p.vy) * 0.58; p.vx *= 0.92; p.vr *= 0.9; }
        if (p.x < p.r || p.x > W - p.r){ p.vx *= -1; p.x = begrenzt(p.x, p.r, W - p.r); }
        ballMalen(ctx, p.x, p.y, p.r, p.rot);
      });
    } };
  },
  pokal: function(W, H){
    var funken = [];
    for (var i = 0; i < 26; i++) funken.push({ x: zufall(W * 0.15, W * 0.85), y: zufall(H * 0.18, H * 0.62), p: zufall(0, TAU), s: zufall(3, 6) });
    function skala(t){ if (t < 0.45){ var e = t / 0.45; return 1.18 * (1 - Math.pow(1 - e, 3)); } if (t < 0.7) return 1.18 - 0.18 * ((t - 0.45) / 0.25); return 1; }
    return { dauer: 3.4, malen: function(ctx, t){
      var cx = W / 2, cy = H * 0.42, s = Math.min(W, H) * 0.0042 * skala(t), lang = Math.max(W, H);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.6);
      for (var i = 0; i < 12; i++){
        ctx.rotate(Math.PI / 6); ctx.fillStyle = 'rgba(255,214,90,' + (0.16 * Math.min(1, t * 2)).toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(lang, -lang * 0.09); ctx.lineTo(lang, lang * 0.09); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      if (s > 0.01) pokalMalen(ctx, cx, cy, s);
      funken.forEach(function(f){ var a = 0.5 + 0.5 * Math.sin(t * 6 + f.p); if (t > 0.3) sternMalen(ctx, f.x, f.y, f.s * a + 1, 'rgba(255,240,170,' + a.toFixed(2) + ')'); });
      if (t > 0.35) textMalen(ctx, 'Stark!', cx, cy + 92 * Math.max(s, 0.6) + 26, Math.min(54, W * 0.13), '#ffd54a', Math.min(1, (t - 0.35) * 4));
    } };
  }
};
function pokalMalen(ctx, cx, cy, s){
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  var gold = ctx.createLinearGradient(-50, 0, 50, 0);
  gold.addColorStop(0, '#b8860b'); gold.addColorStop(0.45, '#ffe066'); gold.addColorStop(0.55, '#fff3b0'); gold.addColorStop(1, '#c99a06');
  ctx.lineCap = 'round'; ctx.strokeStyle = '#d4a017'; ctx.lineWidth = 9;
  ctx.beginPath(); ctx.arc(-46, -30, 20, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
  ctx.beginPath(); ctx.arc(46, -30, 20, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
  ctx.fillStyle = gold; ctx.strokeStyle = '#7a5a00'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-50, -62); ctx.lineTo(50, -62); ctx.quadraticCurveTo(48, 10, 0, 22); ctx.quadraticCurveTo(-48, 10, -50, -62); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillRect(-8, 20, 16, 26); ctx.strokeRect(-8, 20, 16, 26);
  ctx.beginPath(); ctx.moveTo(-34, 62); ctx.lineTo(34, 62); ctx.lineTo(26, 46); ctx.lineTo(-26, 46); ctx.closePath(); ctx.fill(); ctx.stroke();
  sternMalen(ctx, 0, -28, 16, '#fff8d6');
  ctx.restore();
}
function burst(x, y){
  leinwand(function(){
    var farben = ['#fde047', '#4ade80', '#60a5fa', '#f472b6', '#fb923c'], teile = [];
    for (var i = 0; i < 40; i++){ var w = zufall(0, TAU), v = zufall(140, 420); teile.push({ x: x, y: y, vx: Math.cos(w) * v, vy: Math.sin(w) * v - 120, c: farben[i % farben.length], r: zufall(2.5, 4.5) }); }
    return { dauer: 1, malen: function(ctx, t, dt){
      teile.forEach(function(p){ p.vx *= 1 - 2.2 * dt; p.vy = p.vy * (1 - 2.2 * dt) + 520 * dt; p.x += p.vx * dt; p.y += p.vy * dt; ctx.fillStyle = p.c; kreis(ctx, p.x, p.y, p.r); });
    } };
  });
}
function katzeFeier(){
  var alt = document.querySelector('.ogt-mini-katzenfeier'); if (alt) alt.remove();
  var deko = aktiveDeko(stand().punkte), box = el('div', 'ogt-mini-katzenfeier');
  box.innerHTML = '<div class="ogt-mini-sprech">High Five!</div><button type="button" class="ogt-mini-katze-gross" aria-label="Pixelkatze abklatschen">' + katzeSvg({ arm: 1, deko: deko }) + '</button>';
  document.body.appendChild(box);
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ box.classList.add('da'); }); });
  var knopf = box.querySelector('button'), sprech = box.querySelector('.ogt-mini-sprech'), fertig = false, zeit = setTimeout(weg, 4500);
  knopf.addEventListener('pointerdown', function(ev){
    if (ev.cancelable) ev.preventDefault();
    if (fertig) return; fertig = true;
    knopf.innerHTML = katzeSvg({ arm: 1, gesicht: 'froh', deko: deko });
    sprech.textContent = 'Patsch! 🙌'; box.classList.add('patsch');
    burst(ev.clientX, ev.clientY);
    clearTimeout(zeit); zeit = setTimeout(weg, 1500);
  });
  function weg(){ box.classList.remove('da'); setTimeout(function(){ box.remove(); }, 450); }
}
function feiern(id){
  if (id === 'zufall'){
    var p = stand().punkte, frei = FEIERN.filter(function(f){ return f.id !== 'zufall' && p >= f.ab; });
    id = frei.length ? frei[Math.floor(Math.random() * frei.length)].id : 'konfetti';
  }
  if (id === 'katze') return katzeFeier();
  if (EFFEKT[id]) leinwand(EFFEKT[id]);
}

// ===================== Kleine Anzeigen =====================
var ZEIGER = { x: 0, y: 0, t: 0 };
document.addEventListener('pointerdown', function(ev){ ZEIGER.x = ev.clientX; ZEIGER.y = ev.clientY; ZEIGER.t = Date.now(); }, true);
function pop(text){
  var p = el('div', 'ogt-mini-pop'), x = ZEIGER.x, y = ZEIGER.y;
  if (Date.now() - ZEIGER.t > 4000){ x = window.innerWidth / 2; y = window.innerHeight * 0.45; }
  p.textContent = text; p.setAttribute('aria-hidden', 'true');
  p.style.left = begrenzt(x, 30, window.innerWidth - 30) + 'px'; p.style.top = Math.max(40, y - 18) + 'px';
  document.body.appendChild(p); setTimeout(function(){ p.remove(); }, 1000);
}
function hinweis(text){
  var alt = document.getElementById('ogt-mini-hinweis'); if (alt) alt.remove();
  var h = el('div', 'ogt-mini-hinweis'); h.id = 'ogt-mini-hinweis'; h.setAttribute('role', 'status'); h.textContent = text;
  document.body.appendChild(h); clearTimeout(hinweis.t); hinweis.t = setTimeout(function(){ h.remove(); }, 3200);
}
function ergebnisKarte(html, dauer){
  var alt = document.getElementById('ogt-mini-ergebnis'); if (alt) alt.remove();
  var k = el('div', 'ogt-mini-ergebnis', html); k.id = 'ogt-mini-ergebnis'; k.setAttribute('role', 'status');
  document.body.appendChild(k);
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ k.classList.add('da'); }); });
  var zeit = setTimeout(zu, dauer || 5200);
  function zu(){ clearTimeout(zeit); k.classList.remove('da'); setTimeout(function(){ k.remove(); }, 350); }
  k.addEventListener('click', function(){ setTimeout(zu, 0); });
}

// ===================== Startseite: Punkte-Karte =====================
var SPRUECHE = ['Miau!', 'Schnurr …', 'High Five? 🐾', 'Mrrrau!', 'Gut gemacht!', '*blinzel*'];
function karteFuellen(st){
  var platz = document.getElementById('ogt-mini-platz'); if (!platz) return;
  st = st || stand();
  var p = st.punkte, n = naechstes(p), vor = vorige(p), pct = n ? begrenzt(Math.round((p - vor) / Math.max(1, n.ab - vor) * 100), 3, 100) : 100;
  platz.innerHTML = '<section class="card ogt-mini-karte" aria-label="Punkte und Spiele">'
    + (p >= KATZE_AB ? '<button type="button" class="ogt-mini-begleiter" data-mini="streicheln" aria-label="Pixelkatze antippen">' + katzeSvg({ deko: aktiveDeko(p) }) + '</button>' : '')
    + '<p class="eyebrow">Punkte & Spiele' + (TEST ? ' · Testplan' : '') + '</p>'
    + '<p class="ogt-mini-zahl"><span aria-hidden="true">⭐</span> ' + zahl(p) + ' <small>Punkte</small></p>'
    + '<div class="ogt-mini-balken" aria-hidden="true"><i style="width:' + pct + '%"></i></div>'
    + '<p class="small muted ogt-mini-weiter">' + (n ? 'Noch ' + zahl(n.ab - p) + ' ⭐ bis: ' + esc(n.n) : 'Alles freigeschaltet – stark!') + '</p>'
    + '<div class="row"><button type="button" class="btn pri" data-mini="oeffnen">Spiele & Sammlung</button></div>'
    + '</section>';
}
function streicheln(b){
  var deko = aktiveDeko(stand().punkte);
  b.innerHTML = katzeSvg({ arm: 1, gesicht: 'froh', deko: deko });
  var karte = b.closest('.ogt-mini-karte');
  if (karte){
    var alt = karte.querySelector('.ogt-mini-sprechblase'); if (alt) alt.remove();
    var s = el('div', 'ogt-mini-sprechblase'); s.textContent = SPRUECHE[Math.floor(Math.random() * SPRUECHE.length)];
    karte.appendChild(s); setTimeout(function(){ s.remove(); }, 1700);
  }
  setTimeout(function(){ if (b.isConnected) b.innerHTML = katzeSvg({ deko: deko }); }, 750);
}

// ===================== Fenster „Spiele & Sammlung“ =====================
function dingHtml(art, id, bild, name, ab, an, aktiv){
  return '<button type="button" class="ogt-mini-ding' + (an ? '' : ' zu') + (aktiv ? ' aktiv' : '') + '" data-mini="' + (an ? art : 'gesperrt') + '" data-id="' + esc(id) + '" data-ab="' + ab + '" aria-pressed="' + (aktiv ? 'true' : 'false') + '">'
    + '<span class="ogt-mini-bild">' + bild + '</span><span class="ogt-mini-name">' + esc(name) + '</span>'
    + '<span class="ogt-mini-ab">' + (an ? (aktiv ? '✓ aktiv' : 'antippen') : '🔒 ' + zahl(ab) + ' ⭐') + '</span></button>';
}
function fensterHtml(){
  var st = stand(), p = st.punkte, h = '', deko = aktiveDeko(p), feier = aktiveFeier(p);
  h += '<div class="ogt-mini-kopf"><h2 id="ogt-mini-titel">⭐ ' + zahl(p) + ' Punkte</h2><button type="button" class="ogt-mini-x" data-mini="zu" aria-label="Schließen">✕</button></div>';
  h += '<details class="ogt-mini-regeln"><summary>So gibt’s Punkte</summary><ul>'
    + '<li>Einheit gespeichert: <b>+' + REGEL.einheit + '</b></li>'
    + '<li>jede Übung aus dem Plan (mindestens ein Satz): <b>+' + REGEL.uebung + '</b></li>'
    + '<li>Morgen-Check beantwortet: <b>+' + REGEL.morgen + '</b></li>'
    + '<li>ganze Woche geschafft: <b>+' + REGEL.woche + '</b></li></ul>'
    + '<p>Optionale Übungen und Extra-Training zählen nicht extra – Punkte gibt’s fürs Dranbleiben, nicht fürs Mehr-Machen.</p></details>';
  var spiele = spielListe();
  if (spiele.length){
    h += '<h3>Minispiele</h3><div class="ogt-mini-liste">';
    spiele.forEach(function(id){
      var s = SPIELE[id], ab = spielAb(id), an = p >= ab, rek = ST.rekord[id];
      h += '<div class="ogt-mini-spielzeile' + (an ? '' : ' zu') + '"><span class="ogt-mini-icon" aria-hidden="true">' + s.icon + '</span>'
        + '<div class="ogt-mini-text"><b>' + esc(s.n) + '</b><span>' + esc(s.text) + '</span>'
        + (rek != null ? '<span class="ogt-mini-rek">Rekord: ' + rek + ' ' + esc(s.einheit) + '</span>' : '') + '</div>'
        + (an ? '<button type="button" class="ogt-mini-los" data-mini="spielen" data-id="' + id + '">Spielen</button>'
          : '<button type="button" class="ogt-mini-sperre" data-mini="gesperrt" data-ab="' + ab + '">🔒 ' + zahl(ab) + ' ⭐</button>') + '</div>';
    });
    h += '</div>';
  }
  h += '<h3>Feier nach dem Training</h3><p class="ogt-mini-klein">Antippen zum Aussuchen und Ansehen – sie kommt nach „Training speichern“.</p><div class="ogt-mini-raster">';
  FEIERN.forEach(function(f){
    var bild = f.icon === 'katze' ? katzeSvg({ arm: 1, deko: deko }) : (f.icon === 'ball' ? ballSvg() : f.icon);
    h += dingHtml('feier', f.id, bild, f.n, f.ab, p >= f.ab, p >= f.ab && feier === f.id);
  });
  h += '</div><h3>Accessoires für die Pixelkatze</h3><div class="ogt-mini-raster">';
  h += dingHtml('deko', '', katzeSvg({}), 'ohne', KATZE_AB, p >= KATZE_AB, p >= KATZE_AB && !deko);
  DEKO.forEach(function(d){ h += dingHtml('deko', d.id, katzeSvg({ deko: d.id }), d.n, d.ab, p >= d.ab, deko === d.id); });
  h += '</div>';
  if (TEST) h += '<h3>Nur im Testplan</h3><p class="ogt-mini-klein">Zum Ausprobieren ohne Training. In den echten Plänen gibt es diese Knöpfe nicht.</p>'
    + '<div class="ogt-mini-reihe"><button type="button" data-mini="test-plus">+100 ⭐</button><button type="button" data-mini="test-null">Testpunkte auf 0</button></div>';
  h += '<p class="ogt-mini-klein ogt-mini-fuss">Punkte, Rekorde und deine Auswahl bleiben auf diesem Handy – sie werden nicht verschickt.</p>';
  return h;
}
function oeffnen(){
  var alt = document.getElementById('ogt-mini'); if (alt) alt.remove();
  var h = el('div', 'ogt-mini-hinter'); h.id = 'ogt-mini';
  h.innerHTML = '<div class="ogt-mini-fenster" role="dialog" aria-modal="true" aria-labelledby="ogt-mini-titel">' + fensterHtml() + '</div>';
  document.body.appendChild(h); sperren();
  h.addEventListener('click', function(ev){ if (ev.target === h) schliessen(); });
  var x = h.querySelector('[data-mini="zu"]'); if (x){ try { x.focus({ preventScroll: true }); } catch (e) {} }
}
function neuZeichnen(){
  var f = document.querySelector('#ogt-mini .ogt-mini-fenster');
  if (f){ var y = f.scrollTop, offen = !!(f.querySelector('.ogt-mini-regeln') || {}).open; f.innerHTML = fensterHtml(); f.scrollTop = y; if (offen) f.querySelector('.ogt-mini-regeln').open = true; }
  karteFuellen();
}
function schliessen(){ var h = document.getElementById('ogt-mini'); if (h) h.remove(); sperren(); }

// ===================== Signale aus der App =====================
var FERTIG_ZEIT = 0;
function beiRender(){
  var st = stand(), p = st.punkte;
  if (ST.letzte == null) ST.letzte = p;
  if (p !== ST.letzte){
    var plus = p - ST.letzte, neu = neuFrei(p);
    ST.letzte = p; sichern();
    if (plus > 0 && Date.now() - FERTIG_ZEIT > 2000){
      pop('+' + zahl(plus) + ' ⭐');
      if (neu.length) hinweis('Neu freigeschaltet: ' + neu.map(function(d){ return d.n; }).join(', '));
    }
  }
  karteFuellen(st);
}
function beiFertig(d){
  var st = stand(), p = st.punkte, x = st.einheiten.filter(function(e){ return e.s === d.s; })[0];
  var plus = ST.letzte != null ? p - ST.letzte : (x ? einheitPunkte(x) : 0), neu = neuFrei(p), n = naechstes(p);
  ST.letzte = p; sichern(); FERTIG_ZEIT = Date.now();
  setTimeout(function(){
    feiern(aktiveFeier(p));
    ergebnisKarte('<p class="ogt-mini-e-klein">Einheit gespeichert</p><p class="ogt-mini-e-gross">+' + zahl(Math.max(0, plus)) + ' ⭐</p>'
      + '<p class="ogt-mini-e-klein">Gesamt: ' + zahl(p) + ' ⭐</p>'
      + (neu.length ? '<p class="ogt-mini-e-neu">Neu freigeschaltet: ' + neu.map(function(z){ return esc(z.n); }).join(', ') + '</p><button type="button" class="ogt-mini-e-knopf" data-mini="oeffnen">Ansehen</button>'
        : (n ? '<p class="ogt-mini-e-klein">Noch ' + zahl(n.ab - p) + ' ⭐ bis: ' + esc(n.n) + '</p>' : '')),
      neu.length ? 7000 : 5200);
  }, 450);
}
window.addEventListener('ogt-mini', function(ev){
  var d = (ev && ev.detail) || {};
  if (d.art === 'render') beiRender();
  else if (d.art === 'uebung') pop('+' + (((d.d && d.d.n) || 1) * REGEL.uebung) + ' ⭐');
  else if (d.art === 'fertig') beiFertig(d.d || {});
});
document.addEventListener('click', function(ev){
  var b = ev.target && ev.target.closest ? ev.target.closest('[data-mini]') : null; if (!b) return;
  var a = b.getAttribute('data-mini'), id = b.getAttribute('data-id') || '', p, neu;
  switch (a){
    case 'oeffnen': oeffnen(); break;
    case 'zu': schliessen(); break;
    case 'spielen': spielStarten(id); break;
    case 'streicheln': streicheln(b); break;
    case 'feier': ST.feier = id; sichern(); neuZeichnen(); feiern(id); break;
    case 'deko': ST.deko = id; sichern(); neuZeichnen(); break;
    case 'gesperrt':
      var ab = +b.getAttribute('data-ab') || 0; p = stand().punkte;
      hinweis('Gibt’s ab ' + zahl(ab) + ' ⭐ – noch ' + zahl(Math.max(0, ab - p)) + ' ⭐'); break;
    case 'test-plus':
      if (!TEST) break;
      ST.bonus = (+ST.bonus || 0) + 100; p = stand().punkte; neu = neuFrei(p); ST.letzte = p; sichern(); neuZeichnen();
      hinweis(neu.length ? 'Neu freigeschaltet: ' + neu.map(function(z){ return z.n; }).join(', ') : '+100 Testpunkte'); break;
    case 'test-null':
      if (!TEST) break;
      ST.bonus = 0; p = stand().punkte;
      ST.gesehen = alleDinge().filter(function(z){ return p >= z.ab; }).map(function(z){ return z.id; });
      ST.letzte = p; sichern(); neuZeichnen(); hinweis('Testpunkte zurückgesetzt'); break;
  }
});
document.addEventListener('keydown', function(ev){
  if (ev.key !== 'Escape') return;
  var s = document.querySelector('.ogt-mini-spiel [data-spiel="zu"]');
  if (s) s.click(); else schliessen();
});

// ===================== Aussehen =====================
var CSS = [
  '.ogt-mini-karte{position:relative;gap:8px}',
  '.ogt-mini-karte .ogt-mini-zahl{font-family:var(--font-display);font-weight:800;font-size:34px;line-height:1.05;margin:0}',
  '.ogt-mini-karte .ogt-mini-zahl small{font-size:16px;font-weight:700;color:var(--ink-3)}',
  '.ogt-mini-karte .ogt-mini-weiter{margin:0}',
  '.ogt-mini-balken{height:10px;border-radius:999px;background:var(--line-2);overflow:hidden}',
  '.ogt-mini-balken i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#ffb300,#ff6a00)}',
  '.ogt-mini-begleiter{position:absolute;right:10px;top:6px;width:72px;height:72px;padding:0;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent}',
  '.ogt-mini-begleiter svg{width:100%;height:100%;display:block}',
  '.ogt-mini-sprechblase{position:absolute;right:84px;top:14px;background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:12px;padding:6px 10px;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,.15);animation:ogtMiniBlase 1.7s ease forwards;pointer-events:none}',
  '@keyframes ogtMiniBlase{0%{opacity:0;transform:scale(.7)}12%{opacity:1;transform:scale(1)}80%{opacity:1}100%{opacity:0}}',
  '.ogt-mini-testband{position:fixed;top:calc(8px + env(safe-area-inset-top,0px));right:8px;z-index:45;background:#7c3aed;color:#fff;font:700 12px/1 var(--font-body,system-ui,sans-serif);padding:6px 10px;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.25);pointer-events:none}',
  'html.ogt-mini-offen,html.ogt-mini-offen body{overflow:hidden}',
  '.ogt-mini-hinter{position:fixed;inset:0;z-index:62;background:rgba(8,12,20,.6);display:flex;align-items:flex-end;justify-content:center;padding:12px;box-sizing:border-box}',
  '@media (min-height:700px){.ogt-mini-hinter{align-items:center}}',
  '.ogt-mini-fenster{width:100%;max-width:560px;max-height:calc(100vh - 24px);max-height:calc(100dvh - 24px);overflow:auto;-webkit-overflow-scrolling:touch;background:var(--panel);color:var(--ink);border-radius:18px;padding:12px 16px 20px;box-sizing:border-box;box-shadow:0 12px 40px rgba(0,0,0,.35);font-family:var(--font-body)}',
  '.ogt-mini-kopf{display:flex;align-items:center;justify-content:space-between;gap:12px;position:sticky;top:-12px;background:var(--panel);padding:8px 0;z-index:1}',
  '.ogt-mini-kopf h2{font-family:var(--font-display);font-size:30px;line-height:1.05;margin:0}',
  '.ogt-mini-x{flex:none;width:42px;height:42px;border-radius:999px;border:1px solid var(--line);background:var(--panel-2);color:var(--ink);font-size:18px;font-weight:700;cursor:pointer}',
  '.ogt-mini-fenster h3{font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);margin:18px 0 8px}',
  '.ogt-mini-klein{font-size:13px;color:var(--ink-3);margin:4px 0 8px}',
  '.ogt-mini-fuss{margin-top:18px}',
  '.ogt-mini-regeln{background:var(--panel-2);border-radius:12px;padding:10px 12px;margin-top:4px}',
  '.ogt-mini-regeln summary{font-weight:700;cursor:pointer}',
  '.ogt-mini-regeln ul{margin:8px 0 6px;padding-left:18px;display:grid;gap:3px}',
  '.ogt-mini-regeln p{font-size:13px;color:var(--ink-3);margin:4px 0}',
  '.ogt-mini-liste{display:grid;gap:8px}',
  '.ogt-mini-spielzeile{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:14px;background:var(--panel-2);border:1px solid var(--line-2)}',
  '.ogt-mini-spielzeile.zu{opacity:.72}',
  '.ogt-mini-icon{font-size:30px;width:40px;text-align:center;flex:none}',
  '.ogt-mini-text{flex:1;min-width:0;display:grid;gap:2px}',
  '.ogt-mini-text span{font-size:13px;color:var(--ink-2)}',
  '.ogt-mini-text .ogt-mini-rek{color:var(--ok);font-weight:700}',
  '.ogt-mini-los,.ogt-mini-sperre,.ogt-mini-reihe button{flex:none;font:inherit;font-weight:700;font-size:15px;padding:10px 14px;border-radius:12px;border:1px solid var(--line);background:var(--panel);color:var(--ink);cursor:pointer}',
  '.ogt-mini-fenster .ogt-mini-los{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}',
  '.ogt-mini-sperre{color:var(--ink-3)}',
  '.ogt-mini-raster{display:grid;grid-template-columns:repeat(auto-fill,minmax(98px,1fr));gap:8px}',
  '.ogt-mini-ding{display:grid;justify-items:center;align-content:start;gap:4px;padding:10px 6px;border-radius:14px;border:2px solid var(--line-2);background:var(--panel-2);color:var(--ink);font:inherit;cursor:pointer;min-height:112px}',
  '.ogt-mini-ding.aktiv{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}',
  '.ogt-mini-ding.zu .ogt-mini-bild{filter:grayscale(1);opacity:.45}',
  '.ogt-mini-bild{font-size:34px;line-height:1;height:48px;width:48px;display:grid;place-items:center}',
  '.ogt-mini-bild svg{width:48px;height:48px;display:block}',
  '.ogt-mini-name{font-weight:700;font-size:13px;text-align:center;line-height:1.2}',
  '.ogt-mini-ab{font-size:12px;color:var(--ink-3)}',
  '.ogt-mini-ding.aktiv .ogt-mini-ab{color:var(--accent);font-weight:700}',
  '.ogt-mini-reihe{display:flex;gap:10px;flex-wrap:wrap}',
  '.ogt-mini-spiel{position:fixed;inset:0;z-index:64;background:#0b1626;color:#fff;display:flex;flex-direction:column;touch-action:manipulation;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);font-family:var(--font-body,system-ui,sans-serif)}',
  '.ogt-mini-hud{display:flex;align-items:center;gap:10px;padding:8px 12px;font-size:15px}',
  '.ogt-mini-hud b{font-family:var(--font-display);font-size:22px;letter-spacing:.02em}',
  '.ogt-mini-hud-r{flex:1;text-align:right;font-weight:700;color:#cfe3ff}',
  '.ogt-mini-hud .ogt-mini-x{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.25);color:#fff}',
  '.ogt-mini-buehne{position:relative;flex:1;min-height:0}',
  '.ogt-mini-buehne canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}',
  '.ogt-mini-tafel{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(88%,380px);box-sizing:border-box;background:rgba(10,20,36,.93);border:1px solid rgba(255,255,255,.15);border-radius:18px;padding:18px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.4)}',
  '.ogt-mini-tafel h2{font-family:var(--font-display);font-size:30px;line-height:1.1;margin:0 0 6px}',
  '.ogt-mini-tafel p{margin:6px 0;color:#d6e4f5}',
  '.ogt-mini-tafel .ogt-mini-reihe{justify-content:center;margin-top:14px}',
  '.ogt-mini-tafel .ogt-mini-reihe button{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.3);color:#fff}',
  '.ogt-mini-tafel .ogt-mini-reihe .ogt-mini-los{background:#22c55e;border-color:#22c55e;color:#052e16}',
  '.ogt-mini-tafel .ogt-mini-rekord{font-weight:800;color:#fde047;font-size:18px}',
  '.ogt-mini-feier{position:fixed;inset:0;z-index:66;pointer-events:none}',
  '.ogt-mini-feier canvas{width:100%;height:100%;display:block}',
  '.ogt-mini-katzenfeier{position:fixed;left:50%;bottom:-280px;transform:translateX(-50%);z-index:66;display:grid;justify-items:center;gap:8px;pointer-events:none;transition:bottom .5s cubic-bezier(.2,1.3,.4,1)}',
  '.ogt-mini-katzenfeier.da{bottom:calc(84px + env(safe-area-inset-bottom,0px))}',
  '.ogt-mini-katze-gross{pointer-events:auto;width:170px;height:170px;padding:0;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}',
  '.ogt-mini-katze-gross svg{width:100%;height:100%;display:block;filter:drop-shadow(0 6px 14px rgba(0,0,0,.35))}',
  '.ogt-mini-sprech{background:#fff;color:#1b1b1b;font:800 18px/1.2 var(--font-body,system-ui,sans-serif);padding:8px 14px;border-radius:14px;box-shadow:0 6px 16px rgba(0,0,0,.25);position:relative}',
  ".ogt-mini-sprech::after{content:'';position:absolute;left:50%;bottom:-8px;transform:translateX(-50%);border:8px solid transparent;border-top-color:#fff;border-bottom:0}",
  '.ogt-mini-katzenfeier.patsch .ogt-mini-katze-gross{animation:ogtMiniHuepf .5s ease}',
  '@keyframes ogtMiniHuepf{0%{transform:scale(1)}40%{transform:scale(1.12) rotate(-4deg)}100%{transform:scale(1)}}',
  '.ogt-mini-ergebnis{position:fixed;left:50%;top:calc(14% + env(safe-area-inset-top,0px));transform:translate(-50%,-16px) scale(.92);opacity:0;z-index:67;width:min(88vw,340px);background:var(--panel);color:var(--ink);border-radius:18px;padding:16px;text-align:center;box-shadow:0 14px 40px rgba(0,0,0,.35);transition:opacity .3s,transform .3s;box-sizing:border-box;font-family:var(--font-body)}',
  '.ogt-mini-ergebnis.da{opacity:1;transform:translate(-50%,0) scale(1)}',
  '.ogt-mini-e-klein{margin:2px 0;color:var(--ink-3);font-size:14px}',
  '.ogt-mini-e-gross{margin:2px 0;font-family:var(--font-display);font-weight:800;font-size:46px;line-height:1}',
  '.ogt-mini-e-neu{margin:8px 0 2px;font-weight:800;font-size:17px}',
  '.ogt-mini-e-knopf{margin-top:10px;font:inherit;font-weight:700;padding:10px 18px;border-radius:12px;border:0;background:var(--accent);color:var(--accent-ink);cursor:pointer}',
  '.ogt-mini-pop{position:fixed;z-index:67;transform:translate(-50%,0);font:800 20px/1 var(--font-display,system-ui,sans-serif);color:#ff9f1c;text-shadow:0 2px 0 rgba(0,0,0,.25);pointer-events:none;animation:ogtMiniPop .95s ease-out forwards;white-space:nowrap}',
  '@keyframes ogtMiniPop{0%{opacity:0;transform:translate(-50%,0) scale(.6)}18%{opacity:1;transform:translate(-50%,-10px) scale(1.15)}100%{opacity:0;transform:translate(-50%,-58px) scale(1)}}',
  '.ogt-mini-hinweis{position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:70;background:var(--ink);color:var(--panel);padding:10px 16px;border-radius:999px;font-weight:700;font-size:14px;max-width:calc(100% - 32px);text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.25);box-sizing:border-box}',
  '@media (prefers-reduced-motion: reduce){.ogt-mini-pop,.ogt-mini-sprechblase{animation-duration:.01s}.ogt-mini-katzenfeier,.ogt-mini-ergebnis{transition:none}}'
].join('\n');

// ===================== Start =====================
(function(){
  var s = document.createElement('style'); s.id = 'ogt-mini-stil'; s.textContent = CSS; document.head.appendChild(s);
  if (TEST){ var band = el('div', 'ogt-mini-testband', 'Testplan · Minigames'); band.setAttribute('aria-hidden', 'true'); document.body.appendChild(band); }
  var st = stand();
  if (ST.gesehen === null) ST.gesehen = alleDinge().filter(function(d){ return st.punkte >= d.ab; }).map(function(d){ return d.id; });
  if (ST.letzte == null) ST.letzte = st.punkte;
  var erstesMal = !ST.hallo; ST.hallo = 1;
  sichern();
  karteFuellen(st);
  if (erstesMal) setTimeout(function(){
    ergebnisKarte('<p class="ogt-mini-e-neu">Neu: ⭐ Punkte & Minispiele</p><p class="ogt-mini-e-klein">Für jede gespeicherte Einheit gibt’s Punkte. Damit schaltest du Spiele, Feiern und Accessoires frei.</p>'
      + '<button type="button" class="ogt-mini-e-knopf" data-mini="oeffnen">Anschauen</button>', 9000);
  }, 900);
})();
// Für die automatischen Prüfungen (tests/tests_minigame.html): lesender Blick auf den Stand und die Feier von außen
A.pruefen = { stand: stand, feiern: feiern, oeffnen: oeffnen, schliessen: schliessen, spielStarten: spielStarten, katzeGitter: katzeGitter,
  effekt: function(id, W, H){ return EFFEKT[id] ? EFFEKT[id](W, H) : null; }, ST: function(){ return JSON.parse(JSON.stringify(ST)); } };
})();
