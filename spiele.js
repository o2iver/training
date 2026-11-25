/*! O.G. Trainings-App · Minigames (Test, Aufgabe 65) · Version 6633bf7d38
 * Lädt nur, wenn ein Plan MINIGAME hat (miniStart in app_template.js) – die echten Pläne laden diese Datei nicht.
 * Punkte (⭐) gibt es nur fürs Training und fürs Eintragen: gespeicherte Einheit, Pflicht-Übungen mit mindestens einem
 * Satz, Morgen-Check, ganze Woche – dazu geheime Boni fürs Monitoring (Kurz-Check, Handball, Spieltag, Notiz,
 * Dranbleiben). Nie für mehr Gewicht, mehr Sätze, Optionales oder Extra-Training (Belastungsmanagement).
 * Mit den Punkten kauft man im Shop: Minispiele, Feiern, Begleiter-Tiere, Fellfarben, Accessoires, Namen und Sprüche.
 * Punkte, Käufe, Rekorde und Spielstände bleiben auf dem Gerät (ogt:mini:<kennung>) und gehen nicht mit der Rückmeldung raus.
 * Figuren, Spiele und Effekte sind eigene Entwürfe. Quelle: app/spiele.js (build.py setzt die Version). */
(function(){
'use strict';
var A = window.OGT_MINI;
if (!A || A.geladen) return;
A.geladen = true;

var CFG = A.cfg || {}, TEST = !!CFG.test, KEY = 'ogt:mini:' + A.id, THER = A.ther || 'deinen Coach';
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
if (ST.v !== 2 && ST.v !== 3){   // Umstieg vom ersten Test (Freischalten nach Punkten) auf den Shop: Testpunkte und Rekorde bleiben
  ST = { v: 2, bonus: Math.max(0, +ST.bonus || 0), gekauft: {}, feier: 'konfetti', deko: { kopf: '', augen: '', hals: '' }, fell: 'orange',
    rekord: ST.rekord && typeof ST.rekord === 'object' ? ST.rekord : {}, entdeckt: {}, letzte: null, hallo: 0 };
}
if (!ST.gekauft || typeof ST.gekauft !== 'object') ST.gekauft = {};
if (ST.v === 2 && (!ST.deko || typeof ST.deko !== 'object')) ST.deko = { kopf: '', augen: '', hals: '' };
if (!ST.rekord || typeof ST.rekord !== 'object') ST.rekord = {};
if (!ST.entdeckt || typeof ST.entdeckt !== 'object') ST.entdeckt = {};
if (!ST.namen || typeof ST.namen !== 'object') ST.namen = {};
function sichern(){ try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) {} }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function zahl(n){ return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function zufall(a, b){ return a + Math.random() * (b - a); }
function begrenzt(v, a, b){ return Math.max(a, Math.min(b, v)); }
function reihe(c, n){ return new Array(Math.max(0, n) + 1).join(c); }
function el(tag, cls, html){ var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

// ===================== Punkte =====================
var REGEL = { einheit: 10, uebung: 2, morgen: 3, woche: 15 };
// Geheime Boni fürs Monitoring (Olli 22.11.2026): erst sichtbar, wenn man sie zum ersten Mal bekommt
var BONI = [
  { id: 'sa', n: 'Schlaf & Co.', text: 'Kurz-Check vor dem Training komplett (Schlaf, Muskelkater, Stress)', p: 3, je: 'pro Einheit' },
  { id: 'hb', n: 'Handball gemeldet', text: 'Handball-Frage beim Speichern beantwortet – auch „Nein“ zählt', p: 2, je: 'pro Einheit', nur: 'hb' },
  { id: 'hbe', n: 'Anstrengung nachgetragen', text: 'eingetragen, wie anstrengend Handball war', p: 2, je: 'pro Einheit', nur: 'hb' },
  { id: 'spiel', n: 'Spieltag gemeldet', text: 'Frage nach dem Spiel beantwortet – auch „nicht gespielt“ zählt', p: 3, je: 'pro Spiel', nur: 'hb' },
  { id: 'notiz', n: 'Notiz an ' + THER, text: 'beim Speichern ein paar Worte notiert', p: 2, je: 'pro Einheit' },
  { id: 'dran', n: 'Dranbleiber', text: 'Woche geschafft und mindestens zwei Morgen-Checks in der Woche', p: 10, je: 'pro Woche' }
];
function boniAktiv(){ var hat = A.hat || {}; return BONI.filter(function(b){ return !b.nur || hat[b.nur]; }); }
function verdienst(){
  var es = [], ws = [], sp = [];
  try { es = A.einheiten() || []; ws = A.wochen() || []; sp = A.spiele ? (A.spiele() || []) : []; } catch (e) {}
  var t = { einheit: 0, uebung: 0, morgen: 0, woche: 0, sa: 0, hb: 0, hbe: 0, spiel: 0, notiz: 0, dran: 0 };
  es.forEach(function(x){
    t.einheit += REGEL.einheit; t.uebung += REGEL.uebung * (x.erledigt || 0);
    if (x.morgen) t.morgen += REGEL.morgen;
    if (x.sa) t.sa += 3;
    if (x.hbw) t.hb += 2;
    if (x.hbe) t.hbe += 2;
    if (x.notiz) t.notiz += 2;
  });
  t.woche = ws.length * REGEL.woche;
  t.spiel = sp.length * 3;
  ws.forEach(function(w){ if (es.filter(function(x){ return x.w === w && x.morgen; }).length >= 2) t.dran += 10; });
  var summe = 0; Object.keys(t).forEach(function(k){ summe += t[k]; });
  if (TEST) summe += Math.max(0, +ST.bonus || 0);
  return { summe: summe, teile: t, einheiten: es };
}
function ausgegeben(){ var s = Math.max(0, +ST.namensKosten || 0); Object.keys(ST.gekauft).forEach(function(k){ s += Math.max(0, +ST.gekauft[k] || 0); }); return s; }
function stand(){ var v = verdienst(), a = ausgegeben(); return { verdient: v.summe, ausgegeben: a, konto: Math.max(0, v.summe - a), teile: v.teile, einheiten: v.einheiten }; }
function neueBoni(teile){
  var neu = [];
  boniAktiv().forEach(function(b){ if (teile[b.id] > 0 && !ST.entdeckt[b.id]){ ST.entdeckt[b.id] = 1; neu.push(b); } });
  return neu;
}

// ===================== Shop: was es zu kaufen gibt =====================
var SPIELE = {
  siebenmeter: { n: '7-Meter', icon: '🤾', preis: 20, einheit: 'Tore', start: siebenmeter,
    text: 'Wirf am Torwart vorbei: Tipp ins Tor, wohin der Ball fliegen soll. 10 Würfe.' },
  parade: { n: 'Parade', icon: '🥅', preis: 20, einheit: 'Paraden', start: parade,
    text: 'Tipp die Bälle an, bevor sie im Tor sind. Nach 3 Gegentoren ist Schluss.' },
  katze: { n: 'High Five', icon: '🐾', preis: 30, einheit: 'High Fives', start: highfive,
    text: 'Klatsch deinen Begleiter ab: Tipp auf die Seite, auf der die Pfote hochgeht – aber nur dann.' },
  sprint: { n: 'Begleiter-Sprint', icon: '🏃', preis: 40, einheit: 'm', start: sprint,
    text: 'Tipp zum Springen – über Hütchen und Hürden, Sterne einsammeln. Wie weit kommst du?' },
  muckibude: { n: 'Muckibude', icon: '🏋️', preis: 50, einheit: '', eigen: true,
    text: 'Jeder Tipp ist eine Wiederholung. Sammle Kraft, kauf bessere Hanteln und einen Trainingspartner – dein Fortschritt bleibt.' }
};
var FEIERN = [
  { id: 'konfetti', n: 'Konfetti', icon: '🎊', preis: 0 },
  { id: 'zufall', n: 'Zufall', icon: '🎲', preis: 25 },
  { id: 'herzen', n: 'Herzchen', icon: '💖', preis: 30 },
  { id: 'feuerwerk', n: 'Feuerwerk', icon: '🎆', preis: 40 },
  { id: 'sterne', n: 'Sternschnuppen', icon: '🌠', preis: 50 },
  { id: 'katze', n: 'Abklatschen: „Let’s Miau!“', icon: 'katze', preis: 60 },
  { id: 'baelle', n: 'Handball-Regen', icon: 'ball', preis: 80 },
  { id: 'regenbogen', n: 'Regenbogen', icon: '🌈', preis: 90 },
  { id: 'parade', n: 'Katzen-Parade', icon: 'katzen', preis: 100 },
  { id: 'pokal', n: 'Goldener Pokal', icon: '🏆', preis: 120 }
];
var DEKO = [
  { id: 'stirnband', n: 'Stirnband', platz: 'kopf', preis: 40 },
  { id: 'fliege', n: 'Fliege', platz: 'hals', preis: 40 },
  { id: 'brille', n: 'Sonnenbrille', platz: 'augen', preis: 60 },
  { id: 'partyhut', n: 'Partyhut', platz: 'kopf', preis: 70 },
  { id: 'herzbrille', n: 'Herzbrille', platz: 'augen', preis: 80 },
  { id: 'medaille', n: 'Goldmedaille', platz: 'hals', preis: 100 },
  { id: 'krone', n: 'Krone', platz: 'kopf', preis: 150 }
];
var PLATZ = { kopf: 'Kopf', augen: 'Augen', hals: 'Hals' };
var NAME_PREIS = 25;   // Name für den Begleiter: der erste ist gratis, Umbenennen kostet (Olli 22.11.2026)
var FRECH_PREIS = 50;  // „Sprüche ohne Filter“ – nur in Plänen mit MINIGAME.fluchen
// Fellfarben – seit 22.11.2026 für alle Tiere (Olli). „Original“ = die eigenen Farben des Tiers, bei der Katze Orange.
var FELL = {
  orange: { n: 'Original', preis: 0, fell: '#f7a541', streifen: '#e07b28', creme: '#fff4e4', linie: '#3b2618' },
  grau: { n: 'Grau', preis: 40, fell: '#a9b1bb', streifen: '#7b8591', creme: '#f5f7fa', linie: '#2c3138' },
  schoko: { n: 'Schoko', preis: 50, fell: '#9a6544', streifen: '#71472e', creme: '#f6e6d6', linie: '#2a1a10' },
  weiss: { n: 'Schneeweiß', preis: 60, fell: '#fbfbff', streifen: '#e2e2ee', creme: '#ffffff', linie: '#4a4a5c' },
  schwarz: { n: 'Nachtschwarz', preis: 60, fell: '#3d3d49', streifen: '#2b2b35', creme: '#e9e9f3', linie: '#141419' },
  gold: { n: 'Gold', preis: 150, fell: '#ffd24d', streifen: '#f0a800', creme: '#fff7d6', linie: '#6b4a00' }
};
// Begleiter (Runde 3): Ollis Auswahl 22.11.2026 – Katze, Hund, Bär, Esel, Panda, Fuchs, Hase und „alles, was niedlich ist“
var TIERE = {
  katze: { n: 'Katze', preis: 0, ruf: 'Let’s Miau!' },
  hund: { n: 'Hund', preis: 60, ruf: 'Wuff – auf geht’s!', fell: '#dba56b', dunkel: '#9a673b', creme: '#fff3e2', linie: '#3b2a1a', nase: '#2a1d16' },
  esel: { n: 'Esel', preis: 60, ruf: 'I-aah – auf!', fell: '#a9a8b4', dunkel: '#5d5b68', creme: '#ece9f1', linie: '#33323c', nase: '#3b3946' },
  hase: { n: 'Hase', preis: 60, ruf: 'Hopp, hopp – los!', fell: '#e8d2ba', dunkel: '#cfae8e', creme: '#fffaf3', linie: '#4a3727', nase: '#ff8fab' },
  maus: { n: 'Maus', preis: 60, ruf: 'Piep – auf geht’s!', fell: '#babecb', dunkel: '#9298a7', creme: '#f5f3f8', linie: '#373945', nase: '#ff8fab' },
  kueken: { n: 'Küken', preis: 60, ruf: 'Klein, aber oho – los!', fell: '#ffd84a', dunkel: '#f4b400', creme: '#fff6c4', linie: '#7a5a00', nase: '#ff9a1f', pfote: '#ff9a1f', vogel: 1 },
  baer: { n: 'Bär', preis: 70, ruf: 'Brumm – auf geht’s!', fell: '#a8693b', dunkel: '#7b4a26', creme: '#f0d2ad', linie: '#3a2414', nase: '#2b1a10' },
  hamster: { n: 'Hamster', preis: 70, ruf: 'Volle Backen – los!', fell: '#f3be7a', dunkel: '#dd9548', creme: '#fff8ee', linie: '#4d3018', nase: '#ff8fab' },
  schwein: { n: 'Schweinchen', preis: 70, ruf: 'Oink – auf geht’s!', fell: '#f9c0ce', dunkel: '#ef93ab', creme: '#ffe5ec', linie: '#6e3448', nase: '#f590ad' },
  schaf: { n: 'Schaf', preis: 70, ruf: 'Mäh – auf geht’s!', fell: '#fffaf3', dunkel: '#eadfce', creme: '#ffffff', linie: '#5c4b3e', nase: '#ff9fb5', kopf: '#f6e2d2' },
  igel: { n: 'Igel', preis: 80, ruf: 'Stachelstark – auf!', fell: '#f2d8b6', dunkel: '#8b5d3b', creme: '#fff5e8', linie: '#4a2f1c', nase: '#2b1d14' },
  fuchs: { n: 'Fuchs', preis: 90, ruf: 'Auf geht’s!', fell: '#f28a2e', dunkel: '#3a2618', creme: '#fff6ec', linie: '#3d2212', nase: '#2a1810' },
  panda: { n: 'Panda', preis: 90, ruf: 'Bambus-Power!', fell: '#fbfbfb', dunkel: '#26262c', creme: '#ffffff', linie: '#26262c', nase: '#26262c' },
  koala: { n: 'Koala', preis: 90, ruf: 'Koala-Kraft – los!', fell: '#a6abb6', dunkel: '#7e8491', creme: '#f4f5f8', linie: '#363941', nase: '#34373f' },
  waschbaer: { n: 'Waschbär', preis: 90, ruf: 'Packen wir’s an!', fell: '#aaacb4', dunkel: '#3d3f47', creme: '#f7f7f9', linie: '#2f3037', nase: '#26272c', pfote: '#3d3f47' },
  pinguin: { n: 'Pinguin', preis: 100, ruf: 'Watschel-Power – los!', fell: '#3b4a66', dunkel: '#252f42', creme: '#ffffff', linie: '#1b2130', nase: '#ffa22e', pfote: '#ffa22e', vogel: 1 },
  eule: { n: 'Eule', preis: 100, ruf: 'Huhu – auf geht’s!', fell: '#ae865f', dunkel: '#7d583a', creme: '#f7e9d4', linie: '#3d2817', nase: '#f6a623', pfote: '#f6a623', vogel: 1 },
  tiger: { n: 'Tiger', preis: 120, ruf: 'Rrrr – auf geht’s!', fell: '#f7a24c', dunkel: '#2e2119', creme: '#fffaf3', linie: '#2e2119', nase: '#ff8fa8' },
  loewe: { n: 'Löwe', preis: 130, ruf: 'Löwenstark – los!', fell: '#f5c464', dunkel: '#c9772d', creme: '#fff4dc', linie: '#4b2d12', nase: '#7a4422' },
  einhorn: { n: 'Einhorn', preis: 200, ruf: 'Magisch – los geht’s!', fell: '#fefcff', dunkel: '#d9ccef', creme: '#ffffff', linie: '#5b4a70', nase: '#e9a9c7', pfote: '#efe7fb',
    maehne: ['#ff9bd0', '#b89cff', '#8fd3ff', '#9af0c8'] }
};
function spielListe(){ return (Array.isArray(CFG.spiele) ? CFG.spiele : []).filter(function(id){ return SPIELE[id]; }); }
// Kennung im Shop: spiel:<id>, feier:<id>, tier:<id>, spruch:frech – und je Tier: deko:<id>[@tier], fell:<id>[@tier]
// (ohne @tier gilt das Tier, das im Shop gerade eingestellt ist). Olli 22.11.2026: Accessoires und Fellfarben gehören je Tier,
// ein neu gekauftes Tier schaltet man wieder neu frei.
function ding(kennung){
  var s = String(kennung), at = s.indexOf('@'), fuer = at >= 0 ? s.slice(at + 1) : '', t = (at >= 0 ? s.slice(0, at) : s).split(':'), art = t[0], id = t[1], x;
  if (art === 'spiel' && SPIELE[id] && spielListe().indexOf(id) >= 0) return { art: art, id: id, n: SPIELE[id].n, preis: SPIELE[id].preis, key: 'spiel:' + id };
  if (art === 'feier'){ x = FEIERN.filter(function(f){ return f.id === id; })[0]; if (x) return { art: art, id: id, n: x.n, preis: x.preis, key: 'feier:' + id }; }
  if (art === 'deko' || art === 'fell'){
    if (!TIERE[fuer]) fuer = slotTier();
    if (art === 'deko'){ x = DEKO.filter(function(f){ return f.id === id; })[0]; if (x) return { art: art, id: id, n: x.n, preis: x.preis, platz: x.platz, tier: fuer, key: 'deko:' + id + '@' + fuer }; }
    if (art === 'fell' && FELL[id]) return { art: art, id: id, n: FELL[id].n, preis: FELL[id].preis, tier: fuer, key: 'fell:' + id + '@' + fuer };
    return null;
  }
  if (art === 'tier' && TIERE[id]) return { art: art, id: id, n: TIERE[id].n, preis: TIERE[id].preis, key: 'tier:' + id };
  if (art === 'spruch' && id === 'frech' && CFG.fluchen) return { art: art, id: id, n: 'Sprüche ohne Filter', preis: FRECH_PREIS, key: 'spruch:frech' };
  return null;
}
function besitzt(kennung){ var d = ding(kennung); return !!d && (d.preis === 0 || ST.gekauft[d.key] != null); }
function kaufen(kennung){
  var d = ding(kennung); if (!d || besitzt(kennung)) return false;
  if (stand().konto < d.preis) return false;
  ST.gekauft[d.key] = d.preis;
  if (d.art === 'feier') ST.feier = d.id;
  if (d.art === 'deko') (ST.dekos[d.tier] || (ST.dekos[d.tier] = { kopf: '', augen: '', hals: '' }))[d.platz] = d.id;
  if (d.art === 'fell') ST.felle[d.tier] = d.id;
  if (d.art === 'tier'){ if (SLOT === 'partner') ST.partner = d.id; else ST.tier = d.id; }
  if (d.art === 'spruch') ST.frech = 1;
  sichern();
  return true;
}
function aktiveFeier(){ return besitzt('feier:' + ST.feier) ? ST.feier : 'konfetti'; }
// was ein Tier trägt und welche Fellfarbe es hat – je Tier (nur Gekauftes zählt)
function dekoVon(t){ var o = {}, d = (ST.dekos && ST.dekos[t]) || {}; Object.keys(PLATZ).forEach(function(p){ var id = d[p]; o[p] = id && besitzt('deko:' + id + '@' + t) ? id : ''; }); return o; }
function fellVon(t){ var f = ST.felle && ST.felle[t]; return f && besitzt('fell:' + f + '@' + t) ? f : 'orange'; }
function meineDeko(){ return dekoVon(meinTier()); }
function meinFell(){ return fellVon(meinTier()); }
function meinTier(){ return besitzt('tier:' + ST.tier) ? ST.tier : 'katze'; }
// Abklatsch-Partner (Olli 22.11.2026): kommt nach dem Speichern zum Abklatschen – eigenes Tier und eigene Fellfarbe
function meinPartner(){ return besitzt('tier:' + ST.partner) ? ST.partner : 'katze'; }
function partnerFell(){ return fellVon(meinPartner()); }
function partnerBild(extra){
  var pt = meinPartner(), o = { tier: pt, fell: fellVon(pt), deko: pt === meinTier() ? {} : dekoVon(pt) };
  if (o.tier === meinTier() && o.fell === meinFell()) o.fell = o.fell === 'grau' ? 'orange' : 'grau';   // nie zwei gleiche nebeneinander
  Object.keys(extra || {}).forEach(function(k){ o[k] = extra[k]; });
  return o;
}
// Was der Shop gerade einstellt: Trainingsbegleiter (haupt) oder Abklatsch-Partner (partner) – Tierwahl und Fellfarbe gelten dafür
var SLOT = 'haupt';
function slotTier(){ return SLOT === 'partner' ? meinPartner() : meinTier(); }
function slotFell(){ return SLOT === 'partner' ? partnerFell() : meinFell(); }
// Namen: je Tier, der erste ist gratis
function tierName(t){ var n = ST.namen && ST.namen[t]; return n ? String(n) : ''; }
function meinName(){ return tierName(meinTier()); }
// Spitzname aus dem Plan (MINIGAME.spitzname): der Begleiter spricht damit zwischendurch an
function spitzname(){ return String(CFG.spitzname || '').replace(/\s+/g, ' ').trim().slice(0, 20); }
function frech(){ return !!CFG.fluchen && besitzt('spruch:frech') && ST.frech === 1; }
// Runde 5 (Olli 22.11.2026): Accessoires und Fellfarben gehören je Tier – ein neu gekauftes Tier startet ohne.
// Was vorher gekauft war, bleibt bei allen Tieren, die man zu dem Zeitpunkt schon hatte (die Katze behält alles).
function jeTierUmstellen(){
  if (ST.v === 3) return;
  var tiere = Object.keys(TIERE).filter(function(t){ return TIERE[t].preis === 0 || ST.gekauft['tier:' + t] != null; });
  Object.keys(ST.gekauft).forEach(function(k){
    if (!/^(deko|fell):[a-z]+$/.test(k)) return;
    var preis = ST.gekauft[k]; delete ST.gekauft[k];
    tiere.forEach(function(t, i){ ST.gekauft[k + '@' + t] = i === 0 ? preis : 0; });   // nur einmal als ausgegeben zählen
  });
  var haupt = ST.tier && TIERE[ST.tier] ? ST.tier : 'katze', alt = ST.deko || {};
  ST.dekos = {}; ST.felle = {};
  ST.dekos[haupt] = { kopf: alt.kopf || '', augen: alt.augen || '', hals: alt.hals || '' };
  if (ST.fell) ST.felle[haupt] = ST.fell;
  if (ST.partner && TIERE[ST.partner] && ST.partnerFell && !ST.felle[ST.partner]) ST.felle[ST.partner] = ST.partnerFell;
  delete ST.deko; delete ST.fell; delete ST.partnerFell;
  ST.v = 3; sichern();
}
jeTierUmstellen();
if (!ST.dekos || typeof ST.dekos !== 'object') ST.dekos = {};
if (!ST.felle || typeof ST.felle !== 'object') ST.felle = {};
function meineKatze(extra){ var o = { tier: meinTier(), deko: meineDeko(), fell: meinFell() }; Object.keys(extra || {}).forEach(function(k){ o[k] = extra[k]; }); return o; }
// günstigstes Ding, das man noch nicht hat (für „Als Nächstes“)
function naechstesZiel(){
  var alle = [];
  spielListe().forEach(function(id){ alle.push('spiel:' + id); });
  FEIERN.forEach(function(f){ alle.push('feier:' + f.id); });
  DEKO.forEach(function(d){ alle.push('deko:' + d.id + '@' + meinTier()); });
  Object.keys(FELL).forEach(function(f){ alle.push('fell:' + f + '@' + meinTier()); });
  Object.keys(TIERE).forEach(function(t){ alle.push('tier:' + t); });
  if (CFG.fluchen) alle.push('spruch:frech');
  var offen = alle.filter(function(k){ return !besitzt(k); }).map(ding).filter(Boolean).sort(function(a, b){ return a.preis - b.preis; });
  return offen[0] || null;
}

// ===================== Die Begleiter (gezeichnet, eigene Entwürfe, 120 × 120, gleicher Kopf für Accessoires) =====================
// Fellfarbe auf jedes Tier (Olli 22.11.2026): ersetzt Fell, dunkle und helle Stellen und den Umriss. Die Kennzeichen bleiben
// (Panda-Flecken, Waschbär-Maske, Tiger-Streifen, Fuchs-Ohrspitzen, Pinguin-Gesicht, Einhorn-Mähne); beim Igel färbt sie die Stacheln.
var UMFAERBEN = { panda: ['fell', 'creme'], waschbaer: ['fell'], tiger: ['fell'], fuchs: ['fell', 'linie'], pinguin: ['fell', 'dunkel', 'linie'], einhorn: ['fell', 'creme'], igel: ['dunkel'] };
function tierFarben(opt){
  var t = opt && TIERE[opt.tier] ? opt.tier : 'katze';
  if (t === 'katze'){
    var f = FELL[opt && opt.fell] || FELL.orange;
    return { tier: t, fell: f.fell, kopf: f.fell, streifen: f.streifen, creme: f.creme, linie: f.linie, dunkel: f.streifen, nase: '#ff7fa0', pfote: f.creme, hand: f.creme, ohr: '#ffadc4', vogel: false };
  }
  var T = TIERE[t], c = { fell: T.fell, dunkel: T.dunkel, creme: T.creme, linie: T.linie }, ff = opt && opt.fell !== 'orange' ? FELL[opt.fell] : null;
  if (ff){ var neu = { fell: ff.fell, dunkel: ff.streifen, creme: ff.creme, linie: ff.linie }; (UMFAERBEN[t] || ['fell', 'dunkel', 'creme', 'linie']).forEach(function(k){ c[k] = neu[k]; }); }
  var pfote = T.pfote || (t === 'panda' ? c.dunkel : c.creme);
  return { tier: t, fell: c.fell, kopf: T.kopf || c.fell, streifen: c.dunkel, creme: c.creme, linie: c.linie, dunkel: c.dunkel, nase: T.nase, pfote: pfote,
    hand: T.vogel ? (t === 'eule' ? c.dunkel : c.fell) : pfote, ohr: '#ffb3c7', vogel: !!T.vogel };
}
function katzeSvg(opt){
  opt = opt || {};
  var F = tierFarben(opt), t = F.tier, L = F.linie, arm = opt.arm || 0, g = opt.gesicht || '', d = opt.deko || {};
  var dunkleAugen = t === 'panda' || t === 'waschbaer', M = TIERE.einhorn.maehne, i;
  function X(x, links){ return links ? x : 120 - x; }
  function strich(dd, farbe, breite, extra){ return '<path d="' + dd + '" fill="none" stroke="' + farbe + '" stroke-width="' + breite + '" stroke-linecap="round" stroke-linejoin="round"' + (extra || '') + '/>'; }
  function flaeche(dd, farbe, breite){ return '<path d="' + dd + '" fill="' + farbe + '"' + (breite ? ' stroke="' + L + '" stroke-width="' + breite + '" stroke-linejoin="round"' : '') + '/>'; }
  function kreis(cx, cy, r, farbe, breite){ return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + farbe + '"' + (breite ? ' stroke="' + L + '" stroke-width="' + breite + '"' : '') + '/>'; }
  function oval(cx, cy, rx, ry, farbe, breite, extra){ return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + farbe + '"' + (breite ? ' stroke="' + L + '" stroke-width="' + breite + '"' : '') + (extra || '') + '/>'; }
  var h = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"' + (opt.gross ? ' width="512" height="512"' : '') + ' aria-hidden="true" focusable="false">';
  h += oval(60, 113, 30, 4.5, 'rgba(0,0,0,.16)');
  // ganz hinten: Stacheln (Igel), Mähne (Löwe), Mähne an der Seite (Einhorn)
  if (t === 'igel'){
    var st = '';
    for (i = 0; i <= 34; i++){
      var a = (-28 + 236 * i / 34) * Math.PI / 180, spitze = i % 2 === 1;
      st += (i ? ' L' : 'M') + (60 + (spitze ? 53 : 41) * Math.cos(a)).toFixed(1) + ' ' + (64 - (spitze ? 49 : 38) * Math.sin(a)).toFixed(1);
    }
    h += flaeche(st + ' Z', F.dunkel, 2.6);
  }
  if (t === 'loewe'){
    for (i = 0; i < 18; i++){ var b = i * 20 * Math.PI / 180; h += kreis((60 + 39 * Math.cos(b)).toFixed(1), (57 + 34 * Math.sin(b)).toFixed(1), 9.5, F.dunkel, 2.6); }
    h += oval(60, 57, 40, 35, F.dunkel);
  }
  if (t === 'einhorn') [[31, 33, 10, 0], [23, 45, 9.5, 1], [20, 58, 9, 2], [23, 71, 8.5, 3], [30, 82, 7.5, 0]].forEach(function(k){ h += kreis(k[0], k[1], k[2], M[k[3]], 2.4); });
  // Schwanz
  if (t === 'katze' || t === 'tiger'){
    var sk = 'M79 101 C100 103 106 86 97 75';
    h += strich(sk, L, 13) + strich(sk, F.fell, 8);
    h += t === 'tiger' ? '<path d="' + sk + '" fill="none" stroke="' + F.dunkel + '" stroke-width="8" stroke-dasharray="3.5 6.5"/>' : strich('M99 81 C101 78 100 76 98 75', F.streifen, 4);
  } else if (t === 'fuchs'){
    h += '<path d="M78 100 C104 106 112 84 100 68 C96 80 90 88 80 92 Z" fill="' + F.fell + '" stroke="' + L + '" stroke-width="3" stroke-linejoin="round"/><path d="M100 68 C104 74 106 80 104 86 C101 82 99 76 100 68 Z" fill="' + F.creme + '"/>';
  } else if (t === 'hund'){
    h += strich('M80 96 Q96 92 96 78', L, 11) + strich('M80 96 Q96 92 96 78', F.fell, 6.5);
  } else if (t === 'baer'){
    h += kreis(83, 101, 7, F.fell, 2.6);
  } else if (t === 'esel'){
    h += strich('M80 98 Q92 96 95 84', L, 7) + strich('M80 98 Q92 96 95 84', F.fell, 3.5) + flaeche('M95 84 l-3 -9 l6 2 l1 -6 l3 9 Z', F.dunkel, 1.6);
  } else if (t === 'hase'){
    h += kreis(84, 100, 8.5, F.creme, 2.6);
  } else if (t === 'schaf'){
    h += kreis(84, 99, 7.5, F.fell, 2.4);
  } else if (t === 'maus'){
    var sm = 'M80 101 C98 106 108 96 103 86 C98 77 104 70 110 72';
    h += strich(sm, L, 6.2) + strich(sm, '#f7aabd', 3);
  } else if (t === 'schwein'){
    var ss = 'M81 98 C89 100 94 94 90 90 C86 86 81 91 85 94 C89 97 96 93 97 86';
    h += strich(ss, L, 6) + strich(ss, F.fell, 3);
  } else if (t === 'waschbaer'){
    var sw = 'M78 100 C100 104 108 86 99 72';
    h += strich(sw, L, 17) + strich(sw, F.fell, 12) + '<path d="' + sw + '" fill="none" stroke="' + F.dunkel + '" stroke-width="12" stroke-dasharray="5 6"/>';
  } else if (t === 'loewe'){
    h += strich('M80 99 Q96 98 99 84', L, 7) + strich('M80 99 Q96 98 99 84', F.fell, 3.6) + flaeche('M99 87 C93 83 94 75 99 72 C104 75 105 83 99 87 Z', F.dunkel, 2.2);
  } else if (t === 'einhorn'){
    var se = 'M79 99 C99 102 106 87 98 75';
    h += strich(se, L, 15) + strich(se, M[0], 11) + strich(se, M[1], 7) + strich(se, M[2], 3);
  }
  // Körper
  if (t === 'schaf'){
    for (i = 0; i < 12; i++){ var c = i * 30 * Math.PI / 180; h += kreis((60 + 20 * Math.cos(c)).toFixed(1), (92 + 14 * Math.sin(c)).toFixed(1), 7, F.fell, 2.4); }
    h += oval(60, 92, 21, 15, F.fell);
  } else h += oval(60, 92, 23, 18, F.fell, 3);
  if (t === 'panda') h += '<path d="M38 86 Q60 74 82 86 L82 96 Q60 86 38 96 Z" fill="' + F.dunkel + '"/>';
  if (t === 'tiger') h += strich('M39 88 l6 2 M38.5 95 l5.5 1 M81 88 l-6 2 M81.5 95 l-5.5 1', F.dunkel, 2.8);
  if (t === 'pinguin') h += oval(60, 94, 17, 15, F.creme);
  else if (t !== 'schaf') h += oval(60, 96, 12.5, 11.5, F.creme);
  if (t === 'eule') h += strich('M53 92 q3.5 3 7 0 q3.5 3 7 0 M49.5 99 q3.5 3 7 0 q3.5 3 7 0 q3.5 3 7 0', F.dunkel, 1.8);
  function pfoteUnten(x){
    return oval(x, 106, 8, 5.8, F.pfote, 2.6)
      + (t === 'panda' || t === 'waschbaer' ? oval(x, 107, 3, 2, '#ff9ebb') : '<path d="M' + (x - 2.4) + ' 103.5v4M' + (x + 2.4) + ' 103.5v4" stroke="' + L + '" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>');
  }
  if (arm !== -1) h += pfoteUnten(49);
  if (arm !== 1) h += pfoteUnten(71);
  if (t === 'kueken') h += flaeche('M33 93 L39 87 L44 93 L50 86 L55 92 L60 86 L65 92 L70 86 L76 93 L81 87 L87 93 Q88 113 60 113 Q32 113 33 93 Z', '#ffffff', 2.6);
  if (F.vogel){   // Flügel in Ruhe
    if (arm !== -1) h += flaeche('M40 82 Q30 90 35 102 Q42 98 44 88 Z', F.hand, 2.6);
    if (arm !== 1) h += flaeche('M80 82 Q90 90 85 102 Q78 98 76 88 Z', F.hand, 2.6);
  }
  // Ohren (hinter dem Kopf)
  function ohr(links){
    var x = function(v){ return X(v, links); };
    switch (t){
      case 'katze': return '<path d="M' + x(29) + ' 42 L' + x(25) + ' 14 Q' + x(26) + ' 9 ' + x(31) + ' 11 L' + x(54) + ' 28 Z" fill="' + F.fell + '" stroke="' + L + '" stroke-width="3" stroke-linejoin="round"/><path d="M' + x(32) + ' 36 L' + x(30) + ' 18 L' + x(47) + ' 29 Z" fill="#ffadc4"/>';
      case 'fuchs': return '<path d="M' + x(27) + ' 44 L' + x(22) + ' 8 Q' + x(24) + ' 5 ' + x(28) + ' 7 L' + x(54) + ' 27 Z" fill="' + F.fell + '" stroke="' + L + '" stroke-width="3" stroke-linejoin="round"/><path d="M' + x(23) + ' 15 L' + x(22.5) + ' 8 Q' + x(24) + ' 5.5 ' + x(27.5) + ' 7.5 L' + x(33) + ' 12 Z" fill="' + F.dunkel + '"/><path d="M' + x(31) + ' 37 L' + x(28) + ' 17 L' + x(46) + ' 28 Z" fill="' + F.creme + '"/>';
      case 'esel': return '<g transform="translate(0 3) rotate(' + (links ? -40 : 40) + ' ' + x(40) + ' 34)"><ellipse cx="' + x(44) + '" cy="10" rx="10" ry="24" fill="' + F.fell + '" stroke="' + L + '" stroke-width="3"/><ellipse cx="' + x(44) + '" cy="12" rx="4.2" ry="16" fill="' + F.creme + '"/><path d="M' + x(36.2) + ' 0 Q' + x(44) + ' -16 ' + x(51.8) + ' 0 Q' + x(44) + ' -4 ' + x(36.2) + ' 0 Z" fill="' + F.dunkel + '"/></g>';
      case 'baer': return kreis(x(32), 31, 12, F.fell, 3) + kreis(x(32), 32, 6.5, F.creme);
      case 'panda': return kreis(x(31), 30, 12, F.dunkel, 2);
      case 'tiger': return kreis(x(31), 31, 11, F.fell, 3) + kreis(x(31), 32, 5.5, F.creme);
      case 'loewe': return kreis(x(33), 30, 9, F.fell, 3) + kreis(x(33), 31, 4.6, F.creme);
      case 'koala': return kreis(x(23), 41, 17, F.fell, 3) + kreis(x(24), 42, 10.5, F.creme) + strich('M' + x(17) + ' 36 l3 3 M' + x(16) + ' 44 l4 0 M' + x(19) + ' 51 l3 -3', F.dunkel, 1.6);
      case 'maus': return kreis(x(26), 33, 16.5, F.fell, 3) + kreis(x(27), 34, 10.5, F.ohr);
      case 'hamster': return kreis(x(34), 31, 8.5, F.fell, 3) + kreis(x(34), 32, 4.6, F.ohr);
      case 'igel': return kreis(x(29), 35, 7, F.fell, 2.6) + kreis(x(29), 35.5, 3.6, F.ohr);
      case 'hase': return '<g transform="rotate(' + (links ? -10 : 26) + ' ' + x(44) + ' 36)">' + oval(x(44), 19, 9.5, 17.5, F.fell, 3) + oval(x(44), 21, 4.6, 12.5, F.ohr) + '</g>';
      case 'schwein': return flaeche('M' + x(28) + ' 40 L' + x(23) + ' 18 Q' + x(24) + ' 13 ' + x(29) + ' 15 L' + x(50) + ' 29 Z', F.fell, 3) + flaeche('M' + x(30) + ' 35 L' + x(27) + ' 20 L' + x(44) + ' 30 Z', F.dunkel);
      case 'waschbaer': return flaeche('M' + x(27) + ' 42 L' + x(24) + ' 17 Q' + x(26) + ' 12 ' + x(32) + ' 15 L' + x(52) + ' 29 Z', F.fell, 3) + flaeche('M' + x(30) + ' 36 L' + x(28) + ' 21 L' + x(45) + ' 30 Z', F.dunkel);
      case 'eule': return flaeche('M' + x(31) + ' 38 L' + x(21) + ' 13 L' + x(48) + ' 30 Z', F.dunkel, 3);
      case 'schaf': return '<g transform="rotate(' + (links ? -25 : 25) + ' ' + x(22) + ' 50)">' + oval(x(22), 50, 13, 6.5, F.kopf, 2.6) + oval(x(23), 50, 7.5, 3, F.ohr) + '</g>';
      case 'einhorn': return flaeche('M' + x(31) + ' 40 L' + x(29) + ' 14 Q' + x(31) + ' 9 ' + x(36) + ' 12 L' + x(52) + ' 28 Z', F.fell, 3) + flaeche('M' + x(33) + ' 34 L' + x(32) + ' 18 L' + x(46) + ' 28 Z', F.ohr);
    }
    return '';
  }
  h += ohr(true) + ohr(false);
  // Kopf
  h += oval(60, 56, 37, 31, F.kopf, 3);
  // Zeichnungen auf dem Kopf
  if (t === 'katze') h += '<path d="M53 29.5v7M60 27.5v8.5M67 29.5v7" stroke="' + F.streifen + '" stroke-width="3.6" stroke-linecap="round"/>';
  if (t === 'tiger') h += strich('M60 26.5 v8.5 M50.5 28.5 Q53 33 50 37.5 M69.5 28.5 Q67 33 70 37.5', F.dunkel, 3.4) + strich('M23.5 50 L32 52.5 M23.2 58 L31 59 M96.5 50 L88 52.5 M96.8 58 L89 59', F.dunkel, 3);
  if (t === 'fuchs') h += '<path d="M25 58 Q36 80 60 76 Q84 80 95 58 Q84 66 72 62 Q60 72 48 62 Q36 66 25 58 Z" fill="' + F.creme + '"/>';
  if (t === 'hamster') h += flaeche('M24.5 60 Q27 85 60 86 Q93 85 95.5 60 Q88 68 76 66 Q68 64 60 60 Q52 64 44 66 Q32 68 24.5 60 Z', F.creme);
  if (t === 'hund') h += oval(74, 53, 12, 11, F.dunkel, 0, ' opacity=".55"');
  if (t === 'esel') h += flaeche('M50 27 Q54 16 58 26 Q61 14 64 26 Q68 17 70 28 Q60 33 50 27 Z', F.dunkel, 2);
  if (t === 'pinguin') h += flaeche('M60 41 C52 31 28 34 28 57 C28 75 44 84 60 84 C76 84 92 75 92 57 C92 34 68 31 60 41 Z', F.creme);
  if (t === 'waschbaer') h += oval(44, 41.5, 8, 4, F.creme) + oval(76, 41.5, 8, 4, F.creme)
    + flaeche('M23.5 58 Q29 45 44 47 Q55 49 60 55 Q65 49 76 47 Q91 45 96.5 58 Q91 68 76 67 Q66 66 60 62 Q54 66 44 67 Q29 68 23.5 58 Z', F.dunkel);
  if (t === 'eule') h += '<circle cx="45" cy="56" r="14" fill="' + F.creme + '" stroke="' + F.dunkel + '" stroke-width="2"/><circle cx="75" cy="56" r="14" fill="' + F.creme + '" stroke="' + F.dunkel + '" stroke-width="2"/>';
  if (t === 'igel') h += flaeche('M25 47 C27 30 42 24.5 60 24.5 C78 24.5 93 30 95 47 L89 41 L85 48 L79 39 L74 46 L67 37 L62 44 L56 36 L50 44 L44 37 L39 46 L33 40 L29 48 Z', F.dunkel, 2.2);
  if (t === 'schaf') [[37, 38, 6.5], [44, 31, 8], [53, 27, 8.5], [63, 26.5, 8.5], [72, 29.5, 8], [79, 36, 6.5]].forEach(function(k){ h += kreis(k[0], k[1], k[2], F.fell, 2.4); });
  if (t === 'kueken') h += flaeche('M55 28 C51 18 57 15 60 22 C61 13 69 14 65 24 C70 19 76 23 67 28 Z', F.fell, 2.2);
  if (t === 'einhorn'){
    h += flaeche('M53.5 34 L60 1.5 L66.5 34 Z', '#ffd66e', 2.4) + strich('M56 27 L64 24.6 M57.2 20 L62.8 18.2 M58.4 13 L61.6 12', '#e0a43a', 1.8);
    h += kreis(51, 34, 5.8, M[0], 2.2) + kreis(58.5, 32.5, 6, M[1], 2.2) + kreis(66, 34, 5.4, M[2], 2.2);
  }
  // Hängeohren (Hund) vor dem Kopf
  if (t === 'hund'){
    [true, false].forEach(function(l){ var x = function(v){ return X(v, l); };
      h += '<path d="M' + x(30) + ' 34 Q' + x(14) + ' 38 ' + x(17) + ' 62 Q' + x(20) + ' 72 ' + x(29) + ' 66 Q' + x(34) + ' 50 ' + x(36) + ' 38 Z" fill="' + F.dunkel + '" stroke="' + L + '" stroke-width="3" stroke-linejoin="round"/>'; });
  }
  // Augenflecken (Panda)
  if (t === 'panda') h += '<ellipse cx="44" cy="58" rx="11" ry="13" fill="' + F.dunkel + '" transform="rotate(25 44 58)"/><ellipse cx="76" cy="58" rx="11" ry="13" fill="' + F.dunkel + '" transform="rotate(-25 76 58)"/>';
  // Bäckchen, Schnauze
  var by = t === 'waschbaer' ? 72 : 67, bf = t === 'schwein' ? '#ff6f9a' : '#ff8fb0';
  h += oval(32, by, 6.5, 3.8, bf, 0, ' opacity=".55"') + oval(88, by, 6.5, 3.8, bf, 0, ' opacity=".55"');
  if (t === 'esel') h += oval(60, 72, 20, 14, F.creme, 2.4);
  else if (t === 'waschbaer' || t === 'tiger' || t === 'einhorn') h += oval(60, 69.5, 15.5, 10, t === 'einhorn' ? '#fdeef6' : F.creme);
  else if (t === 'loewe') h += oval(60, 68.5, 14.5, 9.5, F.creme);
  else if (['fuchs', 'schwein', 'koala', 'hamster', 'pinguin', 'eule', 'kueken'].indexOf(t) < 0) h += oval(60, 67.5, 13.5, 9, F.creme);
  if (t === 'katze' || t === 'maus' || t === 'tiger') h += '<path d="M29 63 L16 60M29 67.5 L15 68.5M91 63 L104 60M91 67.5 L105 68.5" stroke="' + L + '" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>';
  // Augen
  var hell = dunkleAugen ? '#ffffff' : L;
  if (g === 'froh') h += '<path d="M37 58 Q45 49 53 58M67 58 Q75 49 83 58" fill="none" stroke="' + hell + '" stroke-width="3.4" stroke-linecap="round"/>';
  else {
    var ry = g === 'grummel' ? 5.2 : 8.8, gy = g === 'grummel' ? 55 : 52.6, auge = dunkleAugen ? '#111' : '#2a1f22';
    h += '<ellipse cx="45" cy="56.5" rx="7.2" ry="' + ry + '" fill="' + auge + '"/><ellipse cx="75" cy="56.5" rx="7.2" ry="' + ry + '" fill="' + auge + '"/>';
    h += '<circle cx="42.4" cy="' + gy + '" r="3" fill="#fff"/><circle cx="72.4" cy="' + gy + '" r="3" fill="#fff"/><circle cx="47.6" cy="60.8" r="1.4" fill="#fff"/><circle cx="77.6" cy="60.8" r="1.4" fill="#fff"/>';
    if (g === 'grummel') h += '<path d="M37 51 L53 53.5M83 51 L67 53.5" stroke="' + hell + '" stroke-width="3.2" stroke-linecap="round"/>';
  }
  // Nase und Mund
  var mundY = 0;
  if (t === 'katze') h += '<path d="M56.6 63.2 Q60 61 63.4 63.2 Q61.2 66.8 60 66.8 Q58.8 66.8 56.6 63.2 Z" fill="' + F.nase + '"/>';
  else if (t === 'hase' || t === 'maus' || t === 'hamster' || t === 'tiger' || t === 'schaf') h += flaeche('M57 63.4 Q60 61.6 63 63.4 Q61 66.4 60 66.4 Q59 66.4 57 63.4 Z', F.nase);
  else if (t === 'esel') h += oval(54.5, 65.5, 2.3, 1.6, F.nase) + oval(65.5, 65.5, 2.3, 1.6, F.nase);
  else if (t === 'einhorn') h += oval(55.5, 66.5, 1.9, 1.4, F.nase) + oval(64.5, 66.5, 1.9, 1.4, F.nase);
  else if (t === 'schwein'){ h += oval(60, 66, 11, 7.8, F.nase, 2.2) + oval(56, 66, 1.9, 2.8, '#b4506d') + oval(64, 66, 1.9, 2.8, '#b4506d'); mundY = 9; }
  else if (t === 'koala'){ h += oval(60, 64.5, 7, 9, F.nase) + oval(58, 60.5, 2, 1.3, '#fff', 0, ' opacity=".45"'); mundY = 8; }
  else if (t === 'pinguin' || t === 'kueken') h += flaeche('M53.5 63.5 Q60 59 66.5 63.5 Q60 71 53.5 63.5 Z', F.nase, 1.6);
  else if (t === 'eule') h += flaeche('M55 61.5 Q60 59.5 65 61.5 L60 71 Z', F.nase, 1.6);
  else h += oval(60, 64.2, 5, 3.6, F.nase) + oval(58.6, 63.2, 1.6, 0.9, '#fff', 0, ' opacity=".5"');
  if (t === 'hase' && g !== 'grummel') h += flaeche('M57.3 69.6 h5.4 v4.4 q0 1.4 -1.4 1.4 h-2.6 q-1.4 0 -1.4 -1.4 Z', '#fff', 1.3) + strich('M60 69.8 v5.4', L, 1.1);
  if (!F.vogel){
    h += '<g transform="translate(0 ' + mundY + ')">' + (g === 'grummel' ? '<path d="M54.5 71.5 Q60 67.5 65.5 71.5" fill="none" stroke="' + L + '" stroke-width="2.2" stroke-linecap="round"/>'
      : '<path d="M53.6 68.2 Q56.8 72.6 60 68.6 Q63.2 72.6 66.4 68.2" fill="none" stroke="' + L + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>') + '</g>';
  }
  if (t === 'hund' && g !== 'grummel') h += '<path d="M57.5 70.5 Q60 77 62.5 70.5 Z" fill="#ff7f9c" stroke="' + L + '" stroke-width="1.4"/>';

  // Hals-Accessoires
  if (d.hals === 'fliege') h += '<path d="M60 84 L46 77 L46 91 Z M60 84 L74 77 L74 91 Z" fill="#e53935" stroke="' + L + '" stroke-width="2" stroke-linejoin="round"/><circle cx="60" cy="84" r="4" fill="#b71c1c" stroke="' + L + '" stroke-width="1.6"/>';
  if (d.hals === 'medaille') h += '<path d="M50 80 L60 94 L70 80" fill="none" stroke="#1e63d6" stroke-width="4.5" stroke-linejoin="round"/><circle cx="60" cy="97" r="7.5" fill="#ffcd2e" stroke="#a87400" stroke-width="2"/><path d="M60 92.6 l1.5 3 3.3.4-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.4z" fill="#fff3b0"/>';
  // erhobene Pfote (bei Vögeln: Flügel)
  if (arm){
    var li = arm < 0, x = function(v){ return X(v, li); };
    if (F.vogel){
      h += flaeche('M' + x(44) + ' 86 C' + x(32) + ' 88 ' + x(17) + ' 76 ' + x(15) + ' 52 C' + x(25) + ' 57 ' + x(37) + ' 66 ' + x(46) + ' 76 Z', F.hand, 2.8);
    } else {
      h += '<path d="M' + x(42) + ' 88 Q' + x(28) + ' 82 ' + x(22) + ' 66" fill="none" stroke="' + L + '" stroke-width="15" stroke-linecap="round"/>';
      h += '<path d="M' + x(42) + ' 88 Q' + x(28) + ' 82 ' + x(22) + ' 66" fill="none" stroke="' + (t === 'panda' ? F.dunkel : F.fell) + '" stroke-width="10" stroke-linecap="round"/>';
      h += '<circle cx="' + x(20) + '" cy="57" r="11" fill="' + F.pfote + '" stroke="' + L + '" stroke-width="2.8"/>';
      h += '<ellipse cx="' + x(20) + '" cy="60.5" rx="5.4" ry="4.4" fill="#ff9ebb"/><circle cx="' + x(13.5) + '" cy="52.5" r="2.5" fill="#ff9ebb"/><circle cx="' + x(20) + '" cy="49.6" r="2.6" fill="#ff9ebb"/><circle cx="' + x(26.5) + '" cy="52.5" r="2.5" fill="#ff9ebb"/>';
    }
  }
  // Kopf- und Augen-Accessoires
  if (d.augen === 'brille') h += '<rect x="34.5" y="48.5" width="21.5" height="15" rx="5.5" fill="#161616"/><rect x="64" y="48.5" width="21.5" height="15" rx="5.5" fill="#161616"/><path d="M56 54 Q60 51.5 64 54" fill="none" stroke="#161616" stroke-width="3"/><path d="M38.5 52.5 l5 -2.6M68 52.5 l5 -2.6" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>';
  if (d.augen === 'herzbrille'){ var herz = function(cx){ return '<path d="M' + cx + ' 63.5 C' + (cx - 13) + ' 55 ' + (cx - 9) + ' 45.5 ' + cx + ' 51.5 C' + (cx + 9) + ' 45.5 ' + (cx + 13) + ' 55 ' + cx + ' 63.5 Z" fill="#ff4f86" stroke="#b0164a" stroke-width="1.8"/>'; }; h += herz(45) + herz(75) + '<path d="M54 54 Q60 51.5 66 54" fill="none" stroke="#b0164a" stroke-width="2.6"/>'; }
  if (d.kopf === 'stirnband') h += '<path d="M26 44 Q60 31 94 44 L93.5 51 Q60 38.5 26.5 51 Z" fill="#e53935" stroke="' + L + '" stroke-width="2"/><path d="M27 47.5 Q60 35 93 47.5" fill="none" stroke="#fff" stroke-width="2"/>';
  if (d.kopf === 'krone') h += '<path d="M42 30 L44 12 L52 22 L60 7 L68 22 L76 12 L78 30 Z" fill="#ffcd2e" stroke="#a87400" stroke-width="2.4" stroke-linejoin="round"/><circle cx="60" cy="21" r="2.8" fill="#e53935"/><circle cx="49" cy="25" r="2.2" fill="#1e88e5"/><circle cx="71" cy="25" r="2.2" fill="#1e88e5"/>';
  if (d.kopf === 'partyhut') h += '<g transform="rotate(14 60 30)"><path d="M60 2 L74 31 L46 31 Z" fill="#7c4dff" stroke="' + L + '" stroke-width="2.2" stroke-linejoin="round"/><path d="M53.2 17 L66.8 17 M49.8 24 L70.2 24" stroke="#ffd54f" stroke-width="3.2"/><circle cx="60" cy="3" r="4.5" fill="#ff5c8a" stroke="' + L + '" stroke-width="1.8"/></g>';
  return h + '</svg>';
}
// Für die Leinwand der Spiele: dieselbe Zeichnung als Bild (einmal je Aussehen, danach aus dem Zwischenspeicher)
var KATZE_BILD = {};
function katzeBild(opt){
  var k = JSON.stringify(opt || {});
  if (KATZE_BILD[k]) return KATZE_BILD[k];
  var im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(katzeSvg(meineKatzeGross(opt)));
  return (KATZE_BILD[k] = im);
}
function meineKatzeGross(opt){ var o = {}; Object.keys(opt || {}).forEach(function(k){ o[k] = opt[k]; }); o.gross = true; return o; }
function katzeMalen(ctx, opt, cx, cy, groesse){
  var im = katzeBild(opt);
  if (im.complete && im.naturalWidth) ctx.drawImage(im, cx - groesse / 2, cy - groesse / 2, groesse, groesse);
}
// Handball (eigener Entwurf, Olli 22.11.2026: „richtiges Handball-Motiv“ statt Basketball): weiß, Mittelfeld und
// Randfelder in Blau und Gelb, graue Nähte – wie ein Spielball mit 32 Feldern
var BALL_BLAU = '#1d4ed8', BALL_GELB = '#facc15', BALL_NAHT = '#8a96a8', BALL_RAND = '#1f2937';
function ballTeile(r, rot){
  var mitte = [], naehte = [], kappen = [];
  for (var k = 0; k < 5; k++){
    var a = -Math.PI / 2 + k * TAU / 5 + (rot || 0);
    mitte.push([Math.cos(a) * r * 0.36, Math.sin(a) * r * 0.36]);
    naehte.push([Math.cos(a) * r * 0.36, Math.sin(a) * r * 0.36, Math.cos(a) * r * 1.1, Math.sin(a) * r * 1.1]);
    var b = a + TAU / 10, cx = Math.cos(b) * r * 0.9, cy = Math.sin(b) * r * 0.9, pts = [];
    for (var j = 0; j < 5; j++){ var c = b + Math.PI + j * TAU / 5; pts.push([cx + Math.cos(c) * r * 0.3, cy + Math.sin(c) * r * 0.3]); }
    kappen.push({ pts: pts, farbe: k % 2 ? BALL_GELB : BALL_BLAU });
  }
  return { mitte: mitte, naehte: naehte, kappen: kappen };
}
function ballSvg(){
  var r = 21, T = ballTeile(r, 0);
  function P(pts){ return pts.map(function(p){ return (24 + p[0]).toFixed(1) + ',' + (24 + p[1]).toFixed(1); }).join(' '); }
  var h = '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><defs><radialGradient id="ogtBallG" cx=".38" cy=".34" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d9e1ea"/></radialGradient><clipPath id="ogtBallC"><circle cx="24" cy="24" r="' + r + '"/></clipPath></defs>'
    + '<circle cx="24" cy="24" r="' + r + '" fill="url(#ogtBallG)"/><g clip-path="url(#ogtBallC)" stroke="' + BALL_NAHT + '" stroke-width="1" stroke-linejoin="round">';
  T.naehte.forEach(function(n){ h += '<line x1="' + (24 + n[0]).toFixed(1) + '" y1="' + (24 + n[1]).toFixed(1) + '" x2="' + (24 + n[2]).toFixed(1) + '" y2="' + (24 + n[3]).toFixed(1) + '"/>'; });
  T.kappen.forEach(function(k){ h += '<polygon points="' + P(k.pts) + '" fill="' + k.farbe + '"/>'; });
  h += '<polygon points="' + P(T.mitte) + '" fill="' + BALL_BLAU + '"/></g>';
  return h + '<circle cx="24" cy="24" r="' + r + '" fill="none" stroke="' + BALL_RAND + '" stroke-width="1.8"/><ellipse cx="17" cy="15" rx="4.5" ry="2.6" fill="#fff" opacity=".6" transform="rotate(-30 17 15)"/></svg>';
}
function katzenSvg(){   // Bild für „Katzen-Parade“: zwei Katzen
  return '<span class="ogt-mini-zwei">' + katzeSvg({ fell: 'grau', gesicht: 'froh' }) + katzeSvg({ fell: 'orange', arm: 1 }) + '</span>';
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
  var g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
  g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#d9e1ea');
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = g; ctx.fill();
  ctx.save(); ctx.clip();
  var T = ballTeile(r, rot || 0);
  ctx.strokeStyle = BALL_NAHT; ctx.lineWidth = Math.max(0.8, r * 0.05); ctx.lineJoin = 'round';
  T.naehte.forEach(function(n){ ctx.beginPath(); ctx.moveTo(n[0], n[1]); ctx.lineTo(n[2], n[3]); ctx.stroke(); });
  function vieleck(pts, farbe){ ctx.beginPath(); pts.forEach(function(p, i){ if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.closePath(); ctx.fillStyle = farbe; ctx.fill(); ctx.stroke(); }
  T.kappen.forEach(function(k){ vieleck(k.pts, k.farbe); });
  vieleck(T.mitte, BALL_BLAU);
  ctx.restore();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.lineWidth = Math.max(1, r * 0.085); ctx.strokeStyle = BALL_RAND; ctx.stroke();
  ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(-r * 0.32, -r * 0.4, r * 0.22, r * 0.12, -0.5, 0, TAU); ctx.fill(); ctx.restore();
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


// ===================== Spiel 3: High Five mit dem Begleiter =====================
function highfive(g){
  var S;
  function geo(){ var gr = Math.max(140, Math.min(g.W * 0.92, g.H * 0.68)); return { gr: gr, cx: g.W / 2, cy: g.H * 0.56 }; }
  function anzeige(){ g.hud('High Fives ' + S.punkte + ' · ' + reihe('❤', S.leben) + reihe('♡', 3 - S.leben)); }
  function pfote(G, seite){ return { x: G.cx + (seite < 0 ? -1 : 1) * G.gr * (40 / 120), y: G.cy + G.gr * (57 / 120 - 0.5) }; }
  function bild(arm, gesicht){ return { deko: S.basis.deko, fell: S.basis.fell, arm: arm, gesicht: gesicht }; }
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
        effekte: [], funken: [], fertig: false, ende: 0, basis: meineKatze() };
      [0, -1, 1].forEach(function(a){ ['', 'froh', 'grummel'].forEach(function(f){ katzeBild(bild(a, f)); }); });   // vorladen
      anzeige();
    },
    tipp: function(x){
      if (S.fertig || S.ende > 0) return;
      var seite = x < g.W / 2 ? -1 : 1;
      if (S.phase === 'pfote' && seite === S.seite){
        var P = pfote(geo(), seite);
        S.punkte++; S.gesicht = 'froh'; S.gesichtT = 0.45; S.fenster = Math.max(0.42, S.fenster * 0.955);
        S.effekte.push({ t: 0, text: 'Patsch!', farbe: '#86efac', x: P.x, y: P.y - 40 });
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
      katzeMalen(ctx, bild(oben ? S.seite : 0, S.gesicht), G.cx, G.cy, G.gr);
      if (oben){ var P = pfote(G, S.seite); textMalen(ctx, S.basis.tier === 'katze' ? 'Let’s Miau!' : 'High Five!', P.x + (S.seite < 0 ? 52 : -52), P.y - G.gr * 0.2, Math.min(26, W * 0.065), '#fde68a', 1); }
      S.funken.forEach(function(f){ sternMalen(ctx, f.x, f.y, 5 * (1 - f.t / 0.6) + 1, '#fde047'); });
      S.effekte.forEach(function(e){ textMalen(ctx, e.text, e.x, e.y - e.t * 40, Math.min(34, W * 0.085), e.farbe, 1 - e.t / 0.9); });
      if (S.punkte === 0 && S.leben === 3 && S.phase === 'warten') textMalen(ctx, 'Warte, bis die Pfote hochgeht …', W / 2, H * 0.12, Math.min(22, W * 0.055), '#e9d5ff', 0.9);
    }
  };
}

// ===================== Spiel 4: Begleiter-Sprint =====================
function sprint(g){
  var S;
  function geo(){ var k = Math.max(56, Math.min(g.W * 0.24, g.H * 0.2)); return { k: k, boden: g.H * 0.8, x: g.W * 0.24 }; }
  function anzeige(){ g.hud(Math.floor(S.m) + ' m · ⭐ ' + S.sterne); }
  return {
    zustand: function(){ return { m: Math.floor(S.m), sterne: S.sterne, fertig: S.fertig || S.ende > 0 }; },
    reset: function(){
      S = { y: 0, vy: 0, spruenge: 2, tempo: g.W * 0.55, m: 0, sterne: 0, hindernisse: [], sternListe: [], bis: 1.3, sternBis: 2.0, t: 0,
        fertig: false, ende: 0, effekte: [], katze: meineKatze({ gesicht: 'froh' }) };
      katzeBild(S.katze); katzeBild(meineKatze({ gesicht: 'grummel' }));
      anzeige();
    },
    tipp: function(){
      if (S.fertig || S.ende > 0 || S.spruenge <= 0) return;
      var G = geo(); S.vy = -Math.sqrt(2 * (G.k * 26) * (G.k * 1.55)); S.spruenge--;
    },
    update: function(dt){
      if (S.fertig) return;
      var G = geo();
      S.effekte.forEach(function(e){ e.t += dt; });
      S.effekte = S.effekte.filter(function(e){ return e.t < 0.8; });
      if (S.ende > 0){
        S.ende -= dt;
        if (S.ende <= 0){ S.fertig = true; var m = Math.floor(S.m); g.ende(m, m + ' m geschafft' + (S.sterne ? ' · ⭐ ' + S.sterne : '')); }
        return;
      }
      S.t += dt;
      S.tempo = g.W * (0.55 + Math.min(0.9, S.t * 0.018));
      var weg = S.tempo * dt;
      S.m += weg / (G.k * 1.2);
      S.vy += G.k * 26 * dt; S.y += S.vy * dt;
      if (S.y >= 0){ S.y = 0; S.vy = 0; S.spruenge = 2; }
      S.bis -= dt;
      if (S.bis <= 0){
        var huerde = Math.random() < 0.35;
        S.hindernisse.push({ x: g.W + 20, w: huerde ? G.k * 0.34 : G.k * 0.44, h: huerde ? G.k * 0.78 : G.k * 0.5, huerde: huerde });
        S.bis = zufall(0.85, 1.7) * Math.max(0.55, 1 - S.t * 0.006);
      }
      S.sternBis -= dt;
      if (S.sternBis <= 0){ S.sternListe.push({ x: g.W + 20, y: -G.k * zufall(1.0, 1.9) }); S.sternBis = zufall(1.6, 3.2); }
      S.hindernisse.forEach(function(o){ o.x -= weg; });
      S.hindernisse = S.hindernisse.filter(function(o){ return o.x + o.w > -20; });
      S.sternListe.forEach(function(s){ s.x -= weg; });
      S.sternListe = S.sternListe.filter(function(s){ return s.x > -20 && !s.weg; });
      var kx1 = G.x - G.k * 0.3, kx2 = G.x + G.k * 0.3, ky2 = G.boden + S.y - G.k * 0.08, ky1 = ky2 - G.k * 0.8;
      S.hindernisse.forEach(function(o){
        if (S.ende > 0) return;
        if (o.x < kx2 && o.x + o.w > kx1 && G.boden - o.h < ky2 && G.boden > ky1){
          S.ende = 0.9; S.katze = meineKatze({ gesicht: 'grummel' });
          S.effekte.push({ t: 0, text: 'Autsch!', farbe: '#fca5a5', x: G.x, y: ky1 - 12 });
        }
      });
      S.sternListe.forEach(function(s){
        var sy = G.boden + s.y;
        if (!s.weg && Math.abs(s.x - G.x) < G.k * 0.45 && Math.abs(sy - (ky1 + ky2) / 2) < G.k * 0.6){
          s.weg = true; S.sterne++; S.effekte.push({ t: 0, text: '+1 ⭐', farbe: '#fde047', x: s.x, y: sy - 18 });
        }
      });
      anzeige();
    },
    malen: function(ctx){
      var G = geo(), W = g.W, H = g.H, gr = ctx.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#20406a'); gr.addColorStop(1, '#0d2038');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      // Hallenfenster im Hintergrund (ziehen langsam vorbei)
      var fb = G.k * 1.4, fo = ((S.t * S.tempo) * 0.25) % (fb * 2);
      ctx.fillStyle = 'rgba(255,255,255,.06)';
      for (var fx = -fo; fx < W; fx += fb * 2) ctx.fillRect(fx, H * 0.12, fb, H * 0.22);
      // Hallenboden
      ctx.fillStyle = '#c98a4f'; ctx.fillRect(0, G.boden, W, H - G.boden);
      ctx.strokeStyle = 'rgba(80,40,10,.25)'; ctx.lineWidth = 2;
      var ab = G.k * 0.9, off = (S.t * S.tempo) % ab;
      for (var x = -off; x < W + ab; x += ab) linie(ctx, x, G.boden + 4, x - G.k * 0.4, H);
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; linie(ctx, 0, G.boden, W, G.boden);
      S.sternListe.forEach(function(s){ sternMalen(ctx, s.x, G.boden + s.y, G.k * 0.2, '#fde047'); });
      S.hindernisse.forEach(function(o){
        if (o.huerde){
          ctx.fillStyle = '#e5e7eb'; ctx.fillRect(o.x, G.boden - o.h, G.k * 0.06, o.h); ctx.fillRect(o.x + o.w - G.k * 0.06, G.boden - o.h, G.k * 0.06, o.h);
          streifenPfosten(ctx, o.x - G.k * 0.04, G.boden - o.h, o.w + G.k * 0.08, G.k * 0.1, false);
        } else {
          ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.moveTo(o.x, G.boden); ctx.lineTo(o.x + o.w * 0.38, G.boden - o.h); ctx.lineTo(o.x + o.w * 0.62, G.boden - o.h); ctx.lineTo(o.x + o.w, G.boden); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(o.x + o.w * 0.2, G.boden - o.h * 0.42); ctx.lineTo(o.x + o.w * 0.8, G.boden - o.h * 0.42); ctx.lineTo(o.x + o.w * 0.86, G.boden - o.h * 0.25); ctx.lineTo(o.x + o.w * 0.14, G.boden - o.h * 0.25); ctx.closePath(); ctx.fill();
        }
      });
      var K = G.k * 1.2, hopp = S.y === 0 && S.ende <= 0 ? Math.abs(Math.sin(S.t * 12)) * G.k * 0.07 : 0;
      katzeMalen(ctx, S.katze, G.x, G.boden + S.y - K * 0.42 - hopp, K);
      S.effekte.forEach(function(e){ textMalen(ctx, e.text, e.x, e.y - e.t * 40, Math.min(30, W * 0.075), e.farbe, 1 - e.t / 0.8); });
      if (S.t < 2.6 && S.ende <= 0) textMalen(ctx, 'Tippen = springen · zweimal = Doppelsprung', W / 2, H * 0.08, Math.min(19, W * 0.048), '#e2e8f0', 0.9);
    }
  };
}

// ===================== Spiel 5: Muckibude (Fortschritt bleibt gespeichert) =====================
// Eigene Währung „Kraft“ nur für dieses Spiel – sie wird nie zu Trainingspunkten. An Tagen mit gespeicherter Einheit gibt es doppelte Kraft.
var MUCKI_UP = [
  { id: 'hantel', n: 'Schwerere Hantel', text: '+1 Kraft pro Tipp', basis: 15, faktor: 1.6 },
  { id: 'partner', n: 'Trainingspartner', text: '+1 Kraft pro Sekunde, auch wenn du weg bist (bis 2 Stunden)', basis: 60, faktor: 1.7 },
  { id: 'musik', n: 'Gute Musik', text: '+25 % auf alles', basis: 250, faktor: 2.2 }
];
var MUCKI_STUFEN = [[0, 'Rookie'], [100, 'Fortgeschritten'], [500, 'Kraftpaket'], [2000, 'Maschine'], [8000, 'Legende'], [30000, 'Titan']];
function mucki(){
  var m = ST.mucki;
  if (!m || typeof m !== 'object') m = ST.mucki = { kraft: 0, gesamt: 0, hantel: 0, partner: 0, musik: 0, zeit: Date.now() };
  return m;
}
function heuteTrainiert(){ try { var h = A.heute(); return (A.einheiten() || []).some(function(x){ return x.d === h; }); } catch (e) { return false; } }
function muckiFaktor(mitHeute){ return (1 + 0.25 * mucki().musik) * (mitHeute && heuteTrainiert() ? 2 : 1); }
function muckiKosten(u){ return Math.round(u.basis * Math.pow(u.faktor, mucki()[u.id] || 0)); }
function muckiStufe(gesamt){ var i = 0; MUCKI_STUFEN.forEach(function(s, j){ if (gesamt >= s[0]) i = j; }); return i; }
function muckibudeStarten(){
  if (document.querySelector('.ogt-mini-spiel')) return;
  var m = mucki(), jetzt = Date.now(), weg = Math.min(7200, Math.max(0, (jetzt - (+m.zeit || jetzt)) / 1000));
  var offline = Math.floor(weg * m.partner * muckiFaktor(false));
  if (offline > 0){ m.kraft += offline; m.gesamt += offline; }
  m.zeit = jetzt;
  var heute = heuteTrainiert(), bruch = 0, hub = 0, pops = [], laeuft = true, raf = 0, letzte = 0, merken = 0;
  var lay = el('div', 'ogt-mini-spiel ogt-mini-mucki');
  lay.setAttribute('role', 'dialog'); lay.setAttribute('aria-modal', 'true'); lay.setAttribute('aria-label', 'Muckibude');
  lay.innerHTML = '<div class="ogt-mini-hud"><b>Muckibude</b><span class="ogt-mini-hud-r"></span><button type="button" class="ogt-mini-x" data-spiel="zu" aria-label="Schließen">✕</button></div>'
    + '<div class="ogt-mini-buehne"><canvas></canvas></div><div class="ogt-mini-muckipanel"></div>';
  document.body.appendChild(lay); sperren();
  var cv = lay.querySelector('canvas'), ctx = cv.getContext('2d'), hud = lay.querySelector('.ogt-mini-hud-r'), panel = lay.querySelector('.ogt-mini-muckipanel'), W = 1, H = 1;
  var katzeN = meineKatze(), katzeHoch = meineKatze({ gesicht: 'froh', arm: 1 });
  katzeBild(katzeN); katzeBild(katzeHoch);
  setTimeout(function(){ if (laeuft) malen(); }, 120);
  function groesse(){ var r = cv.getBoundingClientRect(), dpr = Math.min(2.5, window.devicePixelRatio || 1); W = Math.max(1, r.width); H = Math.max(1, r.height); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function proTipp(){ return (1 + m.hantel) * muckiFaktor(true); }
  function proSek(){ return m.partner * muckiFaktor(true); }
  function anzeigen(){
    var s = muckiStufe(m.gesamt), naechste = MUCKI_STUFEN[s + 1];
    hud.textContent = 'Stufe ' + (s + 1) + ' · ' + MUCKI_STUFEN[s][1];
    panel.innerHTML = (offline > 0 ? '<p class="ogt-mini-mucki-info">Während du weg warst: +' + zahl(offline) + ' Kraft vom Trainingspartner</p>' : '')
      + (heute ? '<p class="ogt-mini-mucki-info">Heute trainiert: doppelte Kraft! 💪</p>' : '<p class="ogt-mini-mucki-info leise">Tipp: An Tagen mit gespeicherter Einheit gibt es doppelte Kraft.</p>')
      + (naechste ? '<div class="ogt-mini-balken"><i style="width:' + begrenzt(Math.round((m.gesamt - MUCKI_STUFEN[s][0]) / (naechste[0] - MUCKI_STUFEN[s][0]) * 100), 2, 100) + '%"></i></div><p class="ogt-mini-mucki-info leise">Nächste Stufe: ' + esc(naechste[1]) + ' bei ' + zahl(naechste[0]) + ' Kraft insgesamt</p>' : '<p class="ogt-mini-mucki-info">Höchste Stufe erreicht – Titan!</p>')
      + MUCKI_UP.map(function(u){
        var k = muckiKosten(u), geht = m.kraft >= k;
        return '<button type="button" class="ogt-mini-upgrade' + (geht ? '' : ' zu') + '" data-mucki="' + u.id + '"><b>' + esc(u.n) + ' <small>Stufe ' + (m[u.id] || 0) + '</small></b><span>' + esc(u.text) + '</span><em>' + zahl(k) + ' Kraft</em></button>';
      }).join('');
    offline = 0;
  }
  function malen(){
    var gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2a2f45'); gr.addColorStop(1, '#151827');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#3a3f5a'; ctx.fillRect(0, H * 0.82, W, H * 0.18);
    var K = Math.min(W * 0.66, H * 0.7), cx = W / 2, cy = H * 0.56, oben = hub > 0.25;
    textMalen(ctx, zahl(Math.floor(m.kraft)) + ' Kraft', cx, H * 0.1, Math.min(40, W * 0.1), '#fde68a', 1);
    textMalen(ctx, '+' + (Math.round(proTipp() * 10) / 10).toString().replace('.', ',') + ' pro Tipp' + (m.partner ? ' · +' + (Math.round(proSek() * 10) / 10).toString().replace('.', ',') + '/s' : ''), cx, H * 0.18, Math.min(18, W * 0.045), '#cbd5e1', 0.95);
    katzeMalen(ctx, oben ? katzeHoch : katzeN, cx, cy, K);
    // Kurzhantel in der Pfote: unten an der Pfote, beim Tippen hochgezogen (Bizeps-Curl)
    var e = Math.min(1, hub * 1.4), px = cx + K * (0.092 + (0.333 - 0.092) * e), py = cy + K * (0.383 + (-0.025 - 0.383) * e);
    var hb = K * 0.3, sw = K * (0.055 + 0.008 * Math.min(10, m.hantel));
    ctx.fillStyle = '#9aa3b5'; ctx.fillRect(px - hb / 2, py - K * 0.014, hb, K * 0.028);
    ctx.fillStyle = '#1f2433'; ctx.strokeStyle = '#5b6478'; ctx.lineWidth = Math.max(1.5, K * 0.008);
    [-1, 1].forEach(function(s){ var x0 = px + s * hb / 2 - sw * 0.35; ctx.fillRect(x0, py - sw, sw * 0.7, sw * 2); ctx.strokeRect(x0, py - sw, sw * 0.7, sw * 2); });
    var F = tierFarben(katzeN);
    ctx.fillStyle = F.hand; ctx.strokeStyle = F.linie; ctx.lineWidth = Math.max(2, K * 0.022);
    ctx.beginPath(); ctx.arc(px, py, K * 0.055, 0, TAU); ctx.fill(); ctx.stroke();
    pops.forEach(function(p){ textMalen(ctx, p.text, p.x, p.y - p.t * 60, Math.min(26, W * 0.065), '#86efac', 1 - p.t / 0.8); });
    if (m.gesamt < 5) textMalen(ctx, 'Tippen = eine Wiederholung', cx, H * 0.9, Math.min(20, W * 0.05), '#e2e8f0', 0.9);
  }
  function schritt(ts){
    if (!laeuft) return;
    var dt = letzte ? Math.min(0.1, (ts - letzte) / 1000) : 0; letzte = ts;
    var auto = proSek() * dt; m.kraft += auto; m.gesamt += auto;
    hub = Math.max(0, hub - dt * 3.2);
    pops.forEach(function(p){ p.t += dt; }); pops = pops.filter(function(p){ return p.t < 0.8; });
    bruch += dt; if (bruch > 0.5){ bruch = 0; anzeigenLeicht(); }
    merken += dt; if (merken > 3){ merken = 0; m.zeit = Date.now(); ST.rekord.muckibude = muckiStufe(m.gesamt) + 1; sichern(); }
    malen();
    raf = requestAnimationFrame(schritt);
  }
  var LETZTER_STAND = '';
  function anzeigenLeicht(){   // Knöpfe nur neu bauen, wenn sich etwas geändert hat (bezahlbar / Stufe)
    var s = muckiStufe(m.gesamt) + '|' + MUCKI_UP.map(function(u){ return (m.kraft >= muckiKosten(u) ? 1 : 0) + ':' + (m[u.id] || 0); }).join(',');
    if (s !== LETZTER_STAND){ LETZTER_STAND = s; anzeigen(); }
  }
  function beenden(){
    laeuft = false; cancelAnimationFrame(raf); m.zeit = Date.now(); ST.rekord.muckibude = muckiStufe(m.gesamt) + 1; sichern();
    window.removeEventListener('resize', groesse); document.removeEventListener('visibilitychange', sicht);
    lay.remove(); sperren(); neuZeichnen();
  }
  function sicht(){ if (document.visibilityState === 'hidden'){ m.zeit = Date.now(); sichern(); } else { letzte = 0; } }
  cv.addEventListener('pointerdown', function(ev){
    if (ev.cancelable) ev.preventDefault();
    var n = proTipp(); m.kraft += n; m.gesamt += n; hub = 1;
    var r = cv.getBoundingClientRect();
    pops.push({ text: '+' + (Math.round(n * 10) / 10).toString().replace('.', ','), x: ev.clientX - r.left, y: ev.clientY - r.top - 20, t: 0 });
  });
  lay.addEventListener('click', function(ev){
    var b = ev.target && ev.target.closest ? ev.target.closest('[data-mucki], [data-spiel="zu"]') : null; if (!b) return;
    if (b.getAttribute('data-spiel') === 'zu'){ beenden(); return; }
    var u = MUCKI_UP.filter(function(x){ return x.id === b.getAttribute('data-mucki'); })[0]; if (!u) return;
    var k = muckiKosten(u);
    if (m.kraft < k){ hinweis('Noch ' + zahl(Math.ceil(k - m.kraft)) + ' Kraft – weiter tippen!'); return; }
    m.kraft -= k; m[u.id] = (m[u.id] || 0) + 1; sichern(); LETZTER_STAND = ''; anzeigenLeicht();
    hinweis(u.n + ': jetzt Stufe ' + m[u.id]);
  });
  window.addEventListener('resize', groesse); document.addEventListener('visibilitychange', sicht);
  groesse(); anzeigen(); LETZTER_STAND = ''; anzeigenLeicht(); malen();
  raf = requestAnimationFrame(schritt);
  A.spiel = { id: 'muckibude', laeuft: function(){ return laeuft; }, zustand: function(){ return { kraft: m.kraft, gesamt: m.gesamt, hantel: m.hantel, partner: m.partner }; }, groesse: function(){ return { W: W, H: H }; } };
}


// ===================== Spiel-Rahmen: Vollbild, Start- und Endtafel, Pause =====================
function sperren(){
  var offen = !!document.querySelector('.ogt-mini-spiel, .ogt-mini-kaufen');
  document.documentElement.classList.toggle('ogt-mini-offen', offen);
}
function spielStarten(id){
  if (id === 'muckibude') return muckibudeStarten();
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
  [150, 400].forEach(function(ms){ setTimeout(function(){ if (!laeuft && !zu){ try { spiel.malen(ctx); } catch (e) {} } }, ms); });   // Katzenbild lädt kurz nach
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
// weitere Feiern (Runde 2): Herzchen, Sternschnuppen, Regenbogen, Katzen-Parade
function herzMalen(ctx, x, y, r, farbe){
  ctx.save(); ctx.translate(x, y); ctx.scale(r / 10, r / 10);
  ctx.beginPath(); ctx.moveTo(0, 7); ctx.bezierCurveTo(-11, -1, -6, -10, 0, -4); ctx.bezierCurveTo(6, -10, 11, -1, 0, 7); ctx.closePath();
  ctx.fillStyle = farbe; ctx.fill(); ctx.restore();
}
function wolke(ctx, x, y, r){ ctx.fillStyle = '#ffffff'; kreis(ctx, x - r, y, r * 0.9); kreis(ctx, x, y - r * 0.5, r * 1.1); kreis(ctx, x + r, y, r * 0.9); kreis(ctx, x, y + r * 0.2, r); }
EFFEKT.herzen = function(W, H){
  var farben = ['#ff4f86', '#ff7aa8', '#ff2d55', '#ffb3c8', '#e11d74'], h = [];
  for (var i = 0; i < 46; i++) h.push({ x: zufall(0, W), y: H + zufall(10, H * 0.5), r: zufall(8, 18), v: zufall(150, 280), ph: zufall(0, TAU), c: farben[i % farben.length] });
  return { dauer: 3.2, malen: function(ctx, t, dt){
    h.forEach(function(p){ p.y -= p.v * dt; herzMalen(ctx, p.x + Math.sin(t * 3 + p.ph) * 18, p.y, p.r, p.c); });
  } };
};
EFFEKT.sterne = function(W, H){
  var s = [], hg = [];
  for (var i = 0; i < 9; i++) s.push({ start: i * 0.28 + zufall(0, 0.2), x: zufall(W * 0.3, W * 1.1), y: zufall(-H * 0.1, H * 0.35), v: zufall(500, 800), l: zufall(80, 160) });
  for (var j = 0; j < 40; j++) hg.push({ x: zufall(0, W), y: zufall(0, H), p: zufall(0, TAU), r: zufall(1, 2.4) });
  return { dauer: 3.4, malen: function(ctx, t){
    ctx.fillStyle = 'rgba(8,10,35,' + (0.5 * Math.min(1, t * 3)).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H);
    hg.forEach(function(p){ ctx.fillStyle = 'rgba(255,255,255,' + (0.4 + 0.6 * Math.abs(Math.sin(t * 3 + p.p))).toFixed(2) + ')'; kreis(ctx, p.x, p.y, p.r); });
    s.forEach(function(p){
      if (t < p.start) return;
      var tt = t - p.start, x = p.x - p.v * tt * 0.8, y = p.y + p.v * tt * 0.6;
      var gr = ctx.createLinearGradient(x, y, x + p.l * 0.8, y - p.l * 0.6);
      gr.addColorStop(0, 'rgba(255,255,220,1)'); gr.addColorStop(1, 'rgba(255,255,220,0)');
      ctx.strokeStyle = gr; ctx.lineWidth = 3; ctx.lineCap = 'round'; linie(ctx, x, y, x + p.l * 0.8, y - p.l * 0.6);
      sternMalen(ctx, x, y, 6, '#fff7c2');
    });
  } };
};
EFFEKT.regenbogen = function(W, H){
  var farben = ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#00c7be', '#007aff', '#af52de'], funken = [];
  for (var i = 0; i < 30; i++) funken.push({ w: zufall(Math.PI, TAU), d: zufall(0.85, 1.15), p: zufall(0, TAU) });
  return { dauer: 3.4, malen: function(ctx, t){
    var cx = W / 2, cy = H * 0.62, R = Math.min(W * 0.46, H * 0.42), b = R * 0.075, e = Math.min(1, t / 0.9), ende = Math.PI + Math.PI * (1 - Math.pow(1 - e, 3));
    ctx.lineCap = 'butt';
    farben.forEach(function(f, i){ ctx.strokeStyle = f; ctx.lineWidth = b + 1; ctx.beginPath(); ctx.arc(cx, cy, R - i * b, Math.PI, ende); ctx.stroke(); });
    if (t > 0.3) wolke(ctx, cx - R + b * 3, cy + b, b * 2.2);
    if (t > 0.9) wolke(ctx, cx + R - b * 3, cy + b, b * 2.2);
    funken.forEach(function(f){
      if (t < 0.8) return;
      var r = R * f.d, x = cx + Math.cos(f.w) * r, y = cy + Math.sin(f.w) * r, a = 0.5 + 0.5 * Math.sin(t * 6 + f.p);
      sternMalen(ctx, x, y, 4 * a + 1, 'rgba(255,255,255,' + a.toFixed(2) + ')');
    });
    if (t > 1.0) textMalen(ctx, 'Stark!', cx, cy + b * 4.5, Math.min(54, W * 0.13), '#ffffff', Math.min(1, (t - 1) * 3));
  } };
};
EFFEKT.parade = function(W, H){
  var felle = Object.keys(FELL), k = Math.max(64, Math.min(W * 0.24, 120)), katzen = [];
  for (var i = 0; i < 6; i++){
    var o = i === 0 ? meineKatze({ gesicht: 'froh' }) : { tier: 'katze', fell: felle[(i + 1) % felle.length], gesicht: i % 2 ? 'froh' : '', arm: i % 3 === 2 ? 1 : 0 };
    katzen.push({ x: -k * (0.6 + i * 0.95), opt: o, ph: zufall(0, TAU), v: W * zufall(0.44, 0.52) });
    katzeBild(o);
  }
  return { dauer: 3.8, malen: function(ctx, t, dt){
    katzen.forEach(function(c, i){
      c.x += c.v * dt;
      var y = H - k * 0.62 - Math.abs(Math.sin(t * 9 + c.ph)) * k * 0.18;
      katzeMalen(ctx, c.opt, c.x, y, k);
      if (Math.sin(t * 2.2 + i * 1.3) > 0.9) textMalen(ctx, i % 2 ? 'Miau!' : 'Let’s Miau!', c.x, y - k * 0.6, Math.min(20, W * 0.05), '#ffffff', 1);
    });
  } };
};

// ===================== Feier „Abklatschen“ (mit dem Abklatsch-Partner) und Auswahl der Feier =====================
function katzeFeier(){
  var alt = document.querySelector('.ogt-mini-katzenfeier'); if (alt) alt.remove();
  var box = el('div', 'ogt-mini-katzenfeier');
  box.innerHTML = '<div class="ogt-mini-sprech">' + (meinPartner() === 'katze' ? 'Let’s Miau!' : 'High Five!') + '</div><button type="button" class="ogt-mini-katze-gross" aria-label="Abklatschen">' + katzeSvg(partnerBild({ arm: 1 })) + '</button>';
  document.body.appendChild(box);
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ box.classList.add('da'); }); });
  var knopf = box.querySelector('button'), sprech = box.querySelector('.ogt-mini-sprech'), fertig = false, zeit = setTimeout(weg, 4500);
  knopf.addEventListener('pointerdown', function(ev){
    if (ev.cancelable) ev.preventDefault();
    if (fertig) return; fertig = true;
    knopf.innerHTML = katzeSvg(partnerBild({ arm: 1, gesicht: 'froh' }));
    sprech.textContent = 'Patsch! 🙌'; box.classList.add('patsch');
    burst(ev.clientX, ev.clientY);
    clearTimeout(zeit); zeit = setTimeout(weg, 1500);
  });
  function weg(){ box.classList.remove('da'); setTimeout(function(){ box.remove(); }, 450); }
}
function feiern(id){
  if (id === 'zufall'){
    var frei = FEIERN.filter(function(f){ return f.id !== 'zufall' && besitzt('feier:' + f.id); });
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
var SPRUECHE = ['Let’s Miau!', 'Auf!', 'Miau!', 'Lass knacken!', 'Schnurr …', 'Gut gemacht!', '*blinzel*'];
function sprueche(){ var t = meinTier(); return t === 'katze' ? SPRUECHE : [TIERE[t].ruf, 'Auf!', 'Lass knacken!', 'Gut gemacht!', '*blinzel*', 'Hehe!']; }
function streichelSpruch(){ var l = frech() && Math.random() < 0.2 ? frechSatz() : sprueche(); return einsetzen(l[Math.floor(Math.random() * l.length)]); }
function karteFuellen(st){
  var platz = document.getElementById('ogt-mini-platz'); if (!platz) return;
  st = st || stand();
  var z = naechstesZiel(), pct = z ? begrenzt(Math.round(st.konto / Math.max(1, z.preis) * 100), 3, 100) : 100;
  platz.innerHTML = '<section class="card ogt-mini-karte" aria-label="Punkte und Spiele">'
    + '<button type="button" class="ogt-mini-begleiter" data-mini="streicheln" aria-label="Begleiter antippen">' + katzeSvg(meineKatze()) + '</button>'
    + '<p class="eyebrow">Punkte & Spiele' + (TEST ? ' · Testplan' : '') + '</p>'
    + '<p class="ogt-mini-zahl"><span aria-hidden="true">⭐</span> ' + zahl(st.konto) + ' <small>Punkte</small></p>'
    + (z ? '<div class="ogt-mini-balken" aria-hidden="true"><i style="width:' + pct + '%"></i></div><p class="small muted ogt-mini-weiter">'
      + (st.konto >= z.preis ? 'Im Shop kannst du dir jetzt etwas holen, z. B. ' + esc(z.n) + ' (' + zahl(z.preis) + ' ⭐)' : 'Noch ' + zahl(z.preis - st.konto) + ' ⭐ bis: ' + esc(z.n)) + '</p>'
      : '<p class="small muted ogt-mini-weiter">Alles gesammelt – stark!</p>')
    + '<div class="row"><button type="button" class="btn pri" data-mini="zum-tab">Spiele & Shop</button></div>'
    + '</section>';
}
function streicheln(b){
  var gross = b.classList.contains('gross');
  b.innerHTML = katzeSvg(meineKatze({ arm: 1, gesicht: 'froh' }));
  var karte = b.closest('.ogt-mini-karte');
  if (karte){
    var alt = karte.querySelector('.ogt-mini-sprechblase'); if (alt) alt.remove();
    var s = el('div', 'ogt-mini-sprechblase' + (gross ? ' gross' : '')); s.textContent = streichelSpruch();
    karte.appendChild(s); setTimeout(function(){ s.remove(); }, 1700);
  }
  setTimeout(function(){ if (b.isConnected) b.innerHTML = katzeSvg(meineKatze(gross ? { arm: 1 } : {})); }, 800);
}

// ===================== Reiter „Spiele“: Punktestand, Spiele, Shop =====================
var REGELN_OFFEN = false;
function bildFuer(kennung){
  var d = ding(kennung); if (!d) return '';
  if (d.art === 'spiel') return '<span class="ogt-mini-emoji">' + SPIELE[d.id].icon + '</span>';
  if (d.art === 'feier'){
    var f = FEIERN.filter(function(x){ return x.id === d.id; })[0];
    return f.icon === 'katze' ? katzeSvg(partnerBild({ arm: 1 })) : (f.icon === 'ball' ? ballSvg() : (f.icon === 'katzen' ? katzenSvg() : '<span class="ogt-mini-emoji">' + f.icon + '</span>'));
  }
  if (d.art === 'deko'){ var o = {}; o[d.platz] = d.id; return katzeSvg({ tier: d.tier, deko: o, fell: fellVon(d.tier) }); }
  if (d.art === 'tier') return katzeSvg({ tier: d.id });
  if (d.art === 'spruch') return '<span class="ogt-mini-emoji">🤬</span>';
  return katzeSvg({ tier: d.tier, fell: d.id });
}
function aktiv(kennung){
  var d = ding(kennung); if (!d || !besitzt(kennung)) return false;
  if (d.art === 'feier') return aktiveFeier() === d.id;
  if (d.art === 'deko') return dekoVon(d.tier)[d.platz] === d.id;
  if (d.art === 'fell') return fellVon(d.tier) === d.id;
  if (d.art === 'tier') return slotTier() === d.id;
  if (d.art === 'spruch') return frech();
  return false;
}
function dingKachel(kennung, st){
  var d = ding(kennung); if (!d) return '';
  var hat = besitzt(kennung), an = aktiv(kennung), geht = !hat && st.konto >= d.preis, zeile;
  var partner = d.art === 'tier' && SLOT === 'partner';
  if (an) zeile = d.art === 'deko' || d.art === 'spruch' ? '✓ an' : (d.art === 'tier' ? (partner ? '✓ Partner' : '✓ dabei') : '✓ aktiv');
  else if (hat) zeile = d.art === 'deko' ? 'anziehen' : (d.art === 'spruch' ? 'anschalten' : (d.art === 'tier' ? (partner ? 'als Partner' : 'mitnehmen') : 'auswählen'));
  else zeile = '⭐ ' + zahl(d.preis);
  return '<button type="button" class="ogt-mini-ding' + (an ? ' aktiv' : '') + (hat ? ' hat' : (geht ? ' geht' : ' teuer')) + '" data-mini="' + (hat ? 'waehlen' : 'kaufen') + '" data-k="' + esc(kennung) + '" aria-pressed="' + (an ? 'true' : 'false') + '">'
    + '<span class="ogt-mini-bild">' + bildFuer(kennung) + '</span><span class="ogt-mini-name">' + esc(d.n) + '</span>'
    + (d.art === 'deko' ? '<span class="ogt-mini-platz">' + PLATZ[d.platz] + '</span>' : (d.art === 'tier' && tierName(d.id) ? '<span class="ogt-mini-tiername">„' + esc(tierName(d.id)) + '“</span>' : ''))
    + '<span class="ogt-mini-ab">' + zeile + '</span></button>';
}
function spielZeile(id, st){
  var s = SPIELE[id], k = 'spiel:' + id, hat = besitzt(k), rek = ST.rekord[id], rekText = rek != null ? (id === 'muckibude' ? 'Stufe ' + rek : rek + ' ' + s.einheit) : '';
  return '<div class="ogt-mini-spielzeile' + (hat ? '' : ' zu') + '"><span class="ogt-mini-icon" aria-hidden="true">' + s.icon + '</span>'
    + '<div class="ogt-mini-text"><b>' + esc(s.n) + '</b><span>' + esc(s.text) + '</span>' + (rekText ? '<span class="ogt-mini-rek">Rekord: ' + esc(rekText) + '</span>' : '') + '</div>'
    + (hat ? '<button type="button" class="ogt-mini-los" data-mini="spielen" data-id="' + id + '">Spielen</button>'
      : '<button type="button" class="ogt-mini-preis' + (st.konto >= s.preis ? ' geht' : '') + '" data-mini="kaufen" data-k="' + k + '">⭐ ' + zahl(s.preis) + '</button>') + '</div>';
}
function regelnHtml(st){
  var boni = boniAktiv(), entdeckt = boni.filter(function(b){ return ST.entdeckt[b.id]; });
  return '<details class="ogt-mini-regeln"' + (REGELN_OFFEN ? ' open' : '') + '><summary data-mini="regeln">So gibt’s Punkte</summary><ul>'
    + '<li>Einheit gespeichert: <b>+' + REGEL.einheit + '</b></li>'
    + '<li>jede Übung aus dem Plan (mindestens ein Satz): <b>+' + REGEL.uebung + '</b></li>'
    + '<li>Morgen-Check beantwortet: <b>+' + REGEL.morgen + '</b></li>'
    + '<li>ganze Woche geschafft: <b>+' + REGEL.woche + '</b></li></ul>'
    + '<p>Optionale Übungen und Extra-Training zählen nicht extra – Punkte gibt’s fürs Dranbleiben, nicht fürs Mehr-Machen.</p>'
    + '<p class="ogt-mini-geheim-kopf">🎁 Geheime Boni: ' + entdeckt.length + ' von ' + boni.length + ' entdeckt</p><ul class="ogt-mini-geheim">'
    + boni.map(function(b){ return ST.entdeckt[b.id] ? '<li><b>' + esc(b.n) + ':</b> ' + esc(b.text) + ' <b>+' + b.p + '</b> ' + esc(b.je) + '</li>' : '<li class="leise">??? – noch nicht entdeckt</li>'; }).join('')
    + '</ul>' + (entdeckt.length < boni.length ? '<p>Tipp: Beantworte die Fragen in der App – auch an Tagen ohne Krafttraining.</p>' : '<p>Alle entdeckt – stark!</p>') + '</details>';
}
function tabFuellen(st){
  var platz = document.getElementById('ogt-mini-tab'); if (!platz) return;
  st = st || stand();
  var h = '<section class="card ogt-mini-karte ogt-mini-kopfkarte" aria-labelledby="ogt-mini-h">'
    + '<button type="button" class="ogt-mini-begleiter gross" data-mini="streicheln" aria-label="Begleiter antippen">' + katzeSvg(meineKatze({ arm: 1 })) + '</button>'
    + '<p class="eyebrow">Dein Punktestand' + (TEST ? ' · Testplan' : '') + '</p>'
    + '<p class="ogt-mini-zahl" id="ogt-mini-h"><span aria-hidden="true">⭐</span> ' + zahl(st.konto) + ' <small>Punkte</small></p>'
    + '<p class="small muted ogt-mini-weiter">Insgesamt gesammelt: ' + zahl(st.verdient) + ' ⭐' + (st.ausgegeben ? ' · ausgegeben: ' + zahl(st.ausgegeben) + ' ⭐' : '') + '</p>'
    + regelnHtml(st) + '</section>';
  var mt = meinTier(), nm = meinName(), sn = spitzname(), pt = meinPartner();
  h += '<section class="card"><p class="eyebrow">Dein Begleiter im Training</p>'
    + '<p class="ogt-mini-bgname"><b>' + esc(nm || TIERE[mt].n) + '</b>' + (nm ? ' <span>(' + esc(TIERE[mt].n) + ')</span>' : '') + '</p>'
    + '<p class="small muted ogt-mini-weiter">' + esc(nm || TIERE[mt].n)
    + ' läuft in deinen Einheiten unten mit, feiert jeden Satz und sagt dir die nächste Übung mit dem „Achte auf“-Hinweis aus deinem Plan.'
    + (sn ? ' Zwischendurch spricht ' + esc(nm || 'dein Begleiter') + ' dich mit „' + esc(sn) + '“ an.' : '')
    + ' Nach dem Speichern kommt ' + (tierName(pt) ? esc(tierName(pt)) : 'dein Abklatsch-Partner (' + esc(TIERE[pt].n) + ')') + ' zum Abklatschen. Tippen geht einfach hindurch, beim Abhaken stört nichts.</p>'
    + '<div class="ogt-mini-reihe"><button type="button" class="' + (begleiterAn() ? 'ogt-mini-los' : '') + '" data-mini="begleiter-umschalten" aria-pressed="' + (begleiterAn() ? 'true' : 'false') + '">'
    + (begleiterAn() ? '✓ Läuft im Training mit' : 'Im Training mitlaufen lassen') + '</button>'
    + '<button type="button" data-mini="name">' + (nm ? 'Umbenennen · ' + NAME_PREIS + ' ⭐' : 'Namen geben (gratis)') + '</button></div></section>';
  h += '<section class="card"><p class="eyebrow">Minispiele</p><div class="ogt-mini-liste">' + spielListe().map(function(id){ return spielZeile(id, st); }).join('') + '</div></section>';
  var pm = SLOT === 'partner', zt = slotTier(), zn = tierName(zt) || TIERE[zt].n;
  h += '<section class="card" id="ogt-mini-shop"><p class="eyebrow">Shop</p><p class="small muted ogt-mini-weiter">Antippen zum Kaufen. Gekauftes antippen zum Auswählen.</p>'
    + '<h3 class="ogt-mini-h3">Begleiter</h3>'
    + '<div class="ogt-mini-slots" role="group" aria-label="Was stellst du ein?"><button type="button" data-mini="slot" data-id="haupt" aria-pressed="' + !pm + '">🏃 Im Training</button>'
    + '<button type="button" data-mini="slot" data-id="partner" aria-pressed="' + pm + '">🙌 Zum Abklatschen</button></div>'
    + '<p class="small muted ogt-mini-weiter">' + (pm ? 'Kommt nach dem Speichern zum Abklatschen: <b>' + esc(zn) + '</b>.' : 'Läuft im Training mit: <b>' + esc(zn) + '</b>.')
      + ' Fellfarben und Accessoires gehören zu jedem Tier einzeln – für ein neues Tier schaltest du sie wieder frei.</p>'
    + '<div class="ogt-mini-raster">' + Object.keys(TIERE).map(function(t){ return dingKachel('tier:' + t, st); }).join('') + '</div>'
    + '<h3 class="ogt-mini-h3">Fellfarbe · ' + esc(zn) + '</h3><div class="ogt-mini-raster">' + Object.keys(FELL).map(function(f){ return dingKachel('fell:' + f, st); }).join('') + '</div>'
    + '<h3 class="ogt-mini-h3">Accessoires · ' + esc(zn) + '</h3><div class="ogt-mini-raster">' + DEKO.map(function(d){ return dingKachel('deko:' + d.id, st); }).join('') + '</div>'
    + '<h3 class="ogt-mini-h3">Feier nach dem Training</h3><div class="ogt-mini-raster">' + FEIERN.map(function(f){ return dingKachel('feier:' + f.id, st); }).join('') + '</div>'
    + (CFG.fluchen ? '<h3 class="ogt-mini-h3">Sprüche</h3><div class="ogt-mini-raster">' + dingKachel('spruch:frech', st) + '</div>' : '') + '</section>';
  if (TEST) h += '<section class="card"><p class="eyebrow">Nur im Testplan</p><p class="small muted ogt-mini-weiter">Zum Ausprobieren ohne Training. In den echten Plänen gibt es diese Knöpfe nicht.</p>'
    + '<div class="ogt-mini-reihe"><button type="button" data-mini="test-plus">+100 ⭐</button><button type="button" data-mini="test-null">Testpunkte auf 0</button><button type="button" data-mini="test-alles">Käufe, Namen, Boni und Muckibude zurücksetzen</button></div></section>';
  h += '<p class="ogt-mini-klein ogt-mini-fuss">Punkte, Käufe, Rekorde und Spielstände bleiben auf diesem Handy – sie werden nicht verschickt.</p>';
  platz.innerHTML = h;
}
function neuZeichnen(){ var st = stand(); karteFuellen(st); tabFuellen(st); }

// ===================== Kaufen =====================
function kaufDialog(kennung){
  var d = ding(kennung); if (!d) return;
  var st = stand();
  if (besitzt(kennung)) return;
  if (st.konto < d.preis){ hinweis('Noch ' + zahl(d.preis - st.konto) + ' ⭐ – weiter so!'); return; }
  zuKauf();
  var box = el('div', 'ogt-mini-kaufen');
  box.innerHTML = '<div class="ogt-mini-kaufkarte" role="dialog" aria-modal="true" aria-labelledby="ogt-mini-kt"><div class="ogt-mini-bild gross">' + bildFuer(kennung) + '</div>'
    + '<h2 id="ogt-mini-kt">' + esc(d.n) + '</h2><p>Für <b>' + zahl(d.preis) + ' ⭐</b> kaufen? Du hast ' + zahl(st.konto) + ' ⭐.</p>'
    + '<div class="ogt-mini-reihe"><button type="button" class="ogt-mini-los" data-mini="kauf-ja" data-k="' + esc(kennung) + '">Kaufen</button><button type="button" data-mini="kauf-nein">Abbrechen</button></div></div>';
  document.body.appendChild(box); sperren();
  box.addEventListener('click', function(ev){ if (ev.target === box) zuKauf(); });
  var b = box.querySelector('[data-mini="kauf-ja"]'); if (b){ try { b.focus({ preventScroll: true }); } catch (e) {} }
}
function zuKauf(){ var b = document.querySelector('.ogt-mini-kaufen'); if (b) b.remove(); sperren(); }
function waehlen(kennung){
  var d = ding(kennung); if (!d || !besitzt(kennung)) return;
  if (d.art === 'feier'){ ST.feier = d.id; sichern(); neuZeichnen(); feiern(d.id); return; }
  if (d.art === 'deko'){ var dk = ST.dekos[d.tier] || (ST.dekos[d.tier] = { kopf: '', augen: '', hals: '' }); dk[d.platz] = dk[d.platz] === d.id ? '' : d.id; sichern(); neuZeichnen(); begleiterBild(); return; }
  if (d.art === 'fell'){ ST.felle[d.tier] = d.id; sichern(); neuZeichnen(); begleiterBild(); }
  if (d.art === 'tier'){ if (SLOT === 'partner') ST.partner = d.id; else ST.tier = d.id; sichern(); neuZeichnen(); begleiterBild(); }
  if (d.art === 'spruch'){ ST.frech = ST.frech === 1 ? 0 : 1; sichern(); neuZeichnen(); hinweis(ST.frech ? 'Sprüche ohne Filter: an 🤬' : 'Sprüche ohne Filter: aus'); }
}
// Namen geben (der erste ist gratis) und umbenennen (kostet NAME_PREIS ⭐) – Olli 22.11.2026
function nameDialog(){
  var t = meinTier(), alt = tierName(t), st = stand();
  if (alt && st.konto < NAME_PREIS){ hinweis('Umbenennen kostet ' + NAME_PREIS + ' ⭐ – noch ' + zahl(NAME_PREIS - st.konto) + ' ⭐'); return; }
  zuKauf();
  var box = el('div', 'ogt-mini-kaufen');
  box.innerHTML = '<form class="ogt-mini-kaufkarte" role="dialog" aria-modal="true" aria-labelledby="ogt-mini-nt"><div class="ogt-mini-bild gross">' + katzeSvg(meineKatze({ arm: 1, gesicht: 'froh' })) + '</div>'
    + '<h2 id="ogt-mini-nt">' + (alt ? 'Neuer Name für ' + esc(alt) : 'Wie soll dein Begleiter heißen?') + '</h2>'
    + '<input class="ogt-mini-namefeld" type="text" maxlength="14" autocomplete="off" spellcheck="false" aria-label="Name" value="' + esc(alt) + '">'
    + '<p>' + (alt ? 'Umbenennen kostet <b>' + NAME_PREIS + ' ⭐</b>. Du hast ' + zahl(st.konto) + ' ⭐.' : 'Der erste Name ist gratis. Umbenennen kostet später ' + NAME_PREIS + ' ⭐.') + '</p>'
    + '<div class="ogt-mini-reihe"><button type="submit" class="ogt-mini-los">' + (alt ? 'Umbenennen' : 'Speichern') + '</button><button type="button" data-mini="kauf-nein">Abbrechen</button></div></form>';
  document.body.appendChild(box); sperren();
  var form = box.querySelector('form'), feld = box.querySelector('input');
  form.addEventListener('submit', function(ev){ ev.preventDefault(); nameSpeichern(feld.value); });
  box.addEventListener('click', function(ev){ if (ev.target === box) zuKauf(); });
  try { feld.focus({ preventScroll: true }); feld.select(); } catch (e) {}
}
function nameSpeichern(wert){
  var t = meinTier(), alt = tierName(t), name = String(wert || '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 14);
  if (!name){ hinweis('Bitte einen Namen eingeben'); return; }
  if (name === alt){ zuKauf(); return; }
  if (alt){
    if (stand().konto < NAME_PREIS){ zuKauf(); hinweis('Zu wenig ⭐ zum Umbenennen'); return; }
    ST.namensKosten = (+ST.namensKosten || 0) + NAME_PREIS;
  }
  ST.namen[t] = name; sichern(); zuKauf(); neuZeichnen(); begleiterBild();
  hinweis(alt ? 'Umbenannt: ' + name + ' (−' + NAME_PREIS + ' ⭐)' : 'Hallo, ' + name + '! 👋');
}

// ===================== Begleiter im Training (Runde 3) =====================
// Läuft unten im Bild mit, solange eine Einheit offen ist: begrüßt, nennt die nächste Übung mit dem „Achte auf“-Hinweis
// aus dem Plan (nichts Neues erfunden), feiert jeden Satz und jede fertige Übung. Antippen geht durch ihn hindurch,
// er blockiert nie einen Knopf. Ausschaltbar im Reiter „Spiele“.
var BG = { el: null, bild: null, blase: null, sid: '', text: '', wander: 0, blaseZeit: 0, aktionZeit: 0, bildZeit: 0, ansageZeit: 0, gesagt: {}, letzter: '' };
var SATZ_SPRUECHE = ['Stark!', 'Sauber!', 'Weiter so!', 'Komm, nächster Satz!', 'Auf!', 'Läuft!', 'Lass knacken!'];
// ab und zu „ein richtig alter Satz“ (Olli 22.11.2026: „es darf auch lustig sein“) – etwa jede 7. Abhak-Sache ohne Fluchen
var ALTE_SAETZE = ['Donnerwetter!', 'Holla, die Waldfee!', 'Potz Blitz!', 'Ich glaub, mein Schwein pfeift!', 'Da brat mir einer ’nen Storch!', 'Heidewitzka!', 'Ei der Daus!', 'Sapperlot – stark!'];
var SATZ_NAME = ['Stark, {name}!', 'Komm, {name}, nächster Satz!', '{name}, du Maschine!'];
var UEBUNG_SPRUECHE = ['Übung geschafft! 💪', 'Abgehakt!', 'Wie ein Profi!', 'Weg damit!'];
var UEBUNG_NAME = ['Abgehakt, {name}! 💪', 'Wie ein Profi, {name}!'];
// Jugendsprache ohne Schimpfwörter (Olli: „die sind alle Anfang 20 … checkst du und safe und Digger und Alter und Junge … Sis“) –
// in Plänen mit MINIGAME.sprache = "jung" (Durchbruchkraft, Paradekraft) schon im normalen Modus dabei
var SATZ_JUNG = ['Safe stark!', 'Läuft bei dir, {sis}!', 'Gönn dir!', 'Stark, Digga!', 'Wild, Alter!', '{ehre}!', 'Slay, {sis}!', 'Sheesh!',
  'No cap – stark!', 'Lowkey Weltklasse.', 'Mies stark!', 'Junge, läuft!'];
var SATZ_JUNG_NAME = ['{name}, safe Weltklasse!', 'Digga {name}, was geht ab?!', '{name}, du Maschine – no cap!'];
var UEBUNG_JUNG = ['Übung durch – safe!', 'Check – nächste!', 'Die Übung ist Geschichte, Digga!', 'Abgehakt, Alter – stark!'];
// Sprüche ohne Filter (Olli 22.11.2026: „weil die Athletinnen mich als eher sehr viel fluchenden Physio kennen“).
// Nur in Plänen mit MINIGAME.fluchen, gekauft und angeschaltet – und nur bei jeder 4. bis 6. Abhak-Sache („der muss ja nicht
// die ganze Zeit rumfluchen“). Ollis Vorgaben: verfickt, Scheiße, leck mich, Dreck, Junge, fett geil, ultra, mega, dazu alte Sätze;
// das W-Wort ausdrücklich raus (Olli 22.11.), keine ekligen Wörter. {sis}/{ehre} werden je nach Plan zu Sis/Ehrenfrau bzw. Bro/Ehrenmann.
var FRECH = [
  'SCHEIßE JA! – So muss das laufen!', 'Verfickt gut gemacht!', 'Scheiß Maschine!!!! Let’s GOOOO!', 'Verfickt geil!', 'Scheiße, ist das geil!',
  'Fett geil, Junge!', 'Scheiß die Wand an, ist das stark!', 'Verdammte Axt, läuft bei dir!', 'Heilige Scheiße, was ein Satz!', 'Ultra stark, verdammt!',
  'Mega abgerissen!', 'Krasser Scheiß!', 'Verfickte Scheiße, bist du stark!', 'Junge, Junge, Junge – was ’ne Maschine!', 'Leck mich am Arsch, war das gut!',
  'Leck mich fett – was ein Satz!', 'Ach leck mich doch – so stark!', 'Fuck, bist du stark!', 'So ein Dreck – viel zu leicht für dich!', 'Heiliger Strohsack – verdammt stark!'
];
var FRECH_NAME = ['Verfickt gut gemacht, {name}!', 'SCHEIßE JA, {name}! – So muss das laufen!', '{name}, du verfickte Maschine!', 'Fett geil, {name}!', 'Leck mich am Arsch, {name} – war das gut!'];
var FRECH_UEBUNG = ['Übung weggeballert – Scheiße, war das gut!', 'Abgerissen, verfickt nochmal!', 'Erledigt – fett geil!', 'Die Übung hast du zerlegt, Junge!', 'Weg mit dem Dreck – nächste!', 'Leck mich – die Übung ist durch!'];
// Jugendsprache mit Fluchen – nur bei „Sprüche ohne Filter“ in Plänen mit sprache "jung"
var FRECH_JUNG = [
  'Fuck, {sis} – du ballerst!', 'Alter, was war DAS denn?! Scheiße, stark!', 'Digga, verfickt stark!', 'Bruder, was ist da los – so verdammt stark!',
  'Safe verfickt gut, Digga!', 'Fuck, Alter – Weltklasse!', 'Leck mich, Digga – war das gut!', 'Scheiße, {sis}, du bist so krass!',
  'Sheesh – verfickt nochmal, war das ultra!', 'Checkst du, wie scheißgut du bist?'
];
var FRECH_JUNG_NAME = ['Fuck, {name} – safe Weltklasse!', 'Digga {name}, leck mich – war das gut!', '{sis} {name}, du ballerst – verfickt stark!'];
var FRECH_JUNG_UEBUNG = ['Digga, die Übung ist durch – fett geil!', 'Übung zerlegt, Alter – leck mich!', 'Fuck, die Übung ist Geschichte!'];
// Jugendsprache am Ende eines „Achte auf“-Hinweises – nur in der Sprechblase, der Text im Plan bleibt, wie er ist
var CHECK = ['Checkst du?', 'Check?', 'Klar soweit?', 'Checkst du, oder was?'];
var CHECK_JUNG = ['Safe?', 'Verstanden, Digga?'];
function jung(){ return CFG.sprache === 'jung'; }
function frechSatz(){ return jung() ? FRECH.concat(FRECH_JUNG) : FRECH; }
function frechName(){ return jung() ? FRECH_NAME.concat(FRECH_JUNG_NAME) : FRECH_NAME; }
function einsetzen(s){ return String(s).replace(/\{name\}/g, spitzname()).replace(/\{sis\}/g, A.self ? 'Bro' : 'Sis').replace(/\{ehre\}/g, A.self ? 'Ehrenmann' : 'Ehrenfrau'); }
var ALLES_GESCHAFFT = 'Alles geschafft – jetzt „Training speichern“! 🎉';
function spruch(normal, mitName, frechPool){
  var name = spitzname(), istFrech = false, pool;
  if (frech()){   // Zähler: nur jede 4. bis 6. Abhak-Sache flucht
    if (!(BG.frechIn > 0)) BG.frechIn = 4 + Math.floor(Math.random() * 3);
    BG.frechIn--;
    if (BG.frechIn <= 0){ istFrech = true; BG.frechIn = 4 + Math.floor(Math.random() * 3); }
  }
  if (istFrech){ pool = (frechPool || frechSatz()).slice(); if (name) pool = pool.concat(frechName()); }
  else if (Math.random() < 0.15) pool = ALTE_SAETZE.slice();
  else { pool = normal.slice(); if (name) pool = pool.concat(mitName); }
  var s = pool[Math.floor(Math.random() * pool.length)];
  if (s === BG.letzter && pool.length > 1) s = pool[(pool.indexOf(s) + 1) % pool.length];
  BG.letzter = s; BG.warFrech = istFrech;
  return einsetzen(s);
}
// normale Töpfe je nach Plan: junge Sprache kommt dazu
function satzTopf(){ return jung() ? SATZ_SPRUECHE.concat(SATZ_JUNG) : SATZ_SPRUECHE; }
function satzNameTopf(){ return jung() ? SATZ_NAME.concat(SATZ_JUNG_NAME) : SATZ_NAME; }
function uebungTopf(){ return jung() ? UEBUNG_SPRUECHE.concat(UEBUNG_JUNG) : UEBUNG_SPRUECHE; }
// Lesezeit der Sprechblase (Olli 22.11.2026: der Spruch nach dem letzten Satz war zu schnell weg): gut 1 s plus 55 ms je Zeichen
function lesezeit(t, min, max){ return Math.round(begrenzt(1000 + String(t || '').length * 55, min, max)); }
function begruessung(){ var r = TIERE[meinTier()].ruf, n = spitzname(); return n ? 'Hey ' + n + '! ' + r : r; }
// „Alles geschafft“ nur zweimal je Einheit (Olli 22.11.2026): wenn das Haupttraining fertig ist und noch einmal,
// wenn auch alle Zusatzübungen durch sind – dazwischen die normalen Sprüche
function meilenstein(sid, uebungen){
  var g = BG.gesagt[sid] || (BG.gesagt[sid] = { haupt: false, alles: false });
  var pflicht = uebungen.filter(function(x){ return !x.opt; });
  var haupt = pflicht.length > 0 && pflicht.every(function(x){ return x.fertig; }), alles = uebungen.length > 0 && uebungen.every(function(x){ return x.fertig; });
  if (alles && !g.alles){ g.alles = g.haupt = true; return 'alles'; }
  if (haupt && !g.haupt){ g.haupt = true; return 'haupt'; }
  return '';
}
function begleiterAn(){ return ST.begleiterAus !== 1; }
function kurz(text, max){
  text = String(text || '').replace(/\s+/g, ' ').trim();
  var i = text.search(/[.!?](\s|$)/);
  if (i > 20 && i < text.length - 1) text = text.slice(0, i + 1);
  return text.length > max ? text.slice(0, max - 1).replace(/\s+\S*$/, '') + ' …' : text;
}
function naechsteUebung(s){
  var u = s.uebungen.filter(function(x){ return !x.fertig && !x.opt; })[0];
  return u || s.uebungen.filter(function(x){ return !x.fertig; })[0] || null;
}
function begleiterBild(extra, ms){
  if (!BG.bild) return;
  BG.bild.innerHTML = katzeSvg(meineKatze(extra || {}));
  clearTimeout(BG.bildZeit);
  if (ms) BG.bildZeit = setTimeout(function(){ if (BG.bild) BG.bild.innerHTML = katzeSvg(meineKatze()); }, ms);
}
function sagen(text, ms){
  if (!BG.el) return;
  var nm = meinName();
  BG.text = text;
  BG.blase.innerHTML = (nm ? '<b class="ogt-mini-bg-name">' + esc(nm) + '</b>' : '') + esc(text); BG.blase.hidden = false;
  BG.blase.classList.remove('neu'); void BG.blase.offsetWidth; BG.blase.classList.add('neu');
  blaseAusrichten();
  clearTimeout(BG.blaseZeit); BG.blaseZeit = setTimeout(function(){ if (BG.blase) BG.blase.hidden = true; }, ms || 2600);
}
// Sprechblase immer ganz im Bild (Olli 22.11.2026: Text war beim Abhaken am Rand abgeschnitten). Läuft der Begleiter
// gerade, bleibt er stehen; die Blase sitzt über ihm, so weit der Rand es zulässt, der Zipfel zeigt auf ihn.
function blaseAusrichten(){
  if (!BG.el || !BG.blase) return;
  var r = BG.el.getBoundingClientRect(), W = window.innerWidth || document.documentElement.clientWidth || 360;
  if (BG.el.classList.contains('laeuft')){ BG.el.style.left = Math.round(r.left) + 'px'; BG.el.classList.remove('laeuft'); r = BG.el.getBoundingClientRect(); }
  var bw = BG.blase.offsetWidth, mitte = r.left + r.width / 2, links = begrenzt(mitte - bw / 2, 8, Math.max(8, W - 8 - bw));
  BG.blase.style.left = Math.round(links - r.left) + 'px';
  BG.blase.style.setProperty('--zipfel', Math.round(begrenzt(mitte - links, 18, Math.max(18, bw - 18))) + 'px');
}
function aktion(art, ms){
  if (!BG.el || RUHIG) return;
  BG.el.classList.remove('huepf', 'moonwalk', 'tanz'); void BG.el.offsetWidth; BG.el.classList.add(art);
  clearTimeout(BG.aktionZeit); BG.aktionZeit = setTimeout(function(){ if (BG.el) BG.el.classList.remove(art); }, ms || 900);
}
function begleiterHin(){
  if (BG.el) return;
  var b = el('div', 'ogt-mini-bg');
  b.innerHTML = '<div class="ogt-mini-bg-blase" role="status" hidden></div><div class="ogt-mini-bg-tier"></div>';
  document.body.appendChild(b); document.body.classList.add('ogt-mini-mit-bg');
  BG.el = b; BG.blase = b.querySelector('.ogt-mini-bg-blase'); BG.bild = b.querySelector('.ogt-mini-bg-tier');
  b.style.left = '12px';
  begleiterBild();
  clearInterval(BG.wander); BG.wander = setInterval(wandern, 7000);
}
function begleiterWeg(){
  if (!BG.el) return;
  clearInterval(BG.wander); clearTimeout(BG.blaseZeit); clearTimeout(BG.aktionZeit); clearTimeout(BG.bildZeit);
  clearTimeout(BG.ansageZeit);
  BG.el.remove(); document.body.classList.remove('ogt-mini-mit-bg');
  BG.el = BG.bild = BG.blase = null; BG.sid = '';
}
function wandern(){
  if (!BG.el || document.hidden || RUHIG || (BG.blase && !BG.blase.hidden)) return;
  var ziel = Math.round(zufall(12, Math.max(12, window.innerWidth - 100)));
  BG.el.classList.add('laeuft'); BG.el.style.left = ziel + 'px';
  setTimeout(function(){ if (BG.el) BG.el.classList.remove('laeuft'); }, 1900);
}
function zeigeNaechste(u, erste){
  begleiterBild({ arm: 1 }, 1800);
  var t = ansageText(u, erste);
  sagen(t, Math.min(8000, 3500 + t.length * 30));
}
// erste Übung ansagen, solange in der Einheit noch nichts abgehakt ist (nach der Begrüßung und nach einer Reaktion im Kurz-Check)
function ersteAnsagen(ms){
  clearTimeout(BG.ansageZeit);
  BG.ansageZeit = setTimeout(function(){
    var t = A.sitzung && A.sitzung(), u = t && naechsteUebung(t);
    if (u && BG.el && BG.sid === t.sid) zeigeNaechste(u, !t.uebungen.some(function(x){ return x.begonnen; }));
  }, ms);
}
// ganzer erster Satz des „Achte auf“-Hinweises (in den Plänen höchstens 138 Zeichen); lange Ansagen bleiben länger stehen.
// Mit „Sprüche ohne Filter“ kommt jedes zweite Mal ein „Checkst du?“ dahinter (Olli 22.11.2026).
function ansageText(u, erste){
  var t = (erste ? 'Erste Übung: ' : 'Nächste Übung: ') + u.n + (u.cue ? '. Achte auf: ' + kurz(u.cue, 140) : ' – lass knacken!');
  var ch = jung() ? CHECK.concat(CHECK_JUNG) : CHECK;
  if (u.cue && frech() && Math.random() < 0.5) t += ' ' + einsetzen(ch[Math.floor(Math.random() * ch.length)]);
  return t;
}
function begleiterPruefen(){
  var s = A.sitzung ? A.sitzung() : null;
  if (!s || !begleiterAn() || s.fertig){ begleiterWeg(); return; }
  var neu = !BG.el || BG.sid !== s.sid;
  begleiterHin();
  if (!neu) return;
  BG.sid = s.sid; begleiterBild({ arm: 1, gesicht: 'froh' }, 2000); aktion('huepf');
  sagen(begruessung(), 2600);
  ersteAnsagen(2500);
}
function begleiterSatz(d){
  if (!BG.el) return;
  var s = A.sitzung && A.sitzung(); if (!s) return;
  var u = d && d.x ? s.uebungen.filter(function(x){ return x.x === d.x; })[0] : null;
  clearTimeout(BG.ansageZeit);   // es wurde wieder abgehakt: eine noch ausstehende Ansage fällt weg
  if (meilenstein(s.sid, s.uebungen)){
    aktion('tanz', 1700); begleiterBild({ arm: 1, gesicht: 'froh' }, 2500); sagen(ALLES_GESCHAFFT, 4500); return;
  }
  var hauptDurch = !!(BG.gesagt[s.sid] && BG.gesagt[s.sid].haupt);
  if ((u && u.fertig) || (d && d.block != null)){
    // Übung fertig: Spruch mindestens 4 s lesbar, erst danach „Nächste Übung“ (Olli 22.11.2026)
    var txt = spruch(uebungTopf(), UEBUNG_NAME, FRECH_UEBUNG.concat(jung() ? FRECH_JUNG_UEBUNG : [], frechSatz())), ms = lesezeit(txt, 4000, 6500);
    aktion('moonwalk', 1700); begleiterBild({ gesicht: 'froh' }, 1600); sagen(txt, ms);
    if (!hauptDurch) BG.ansageZeit = setTimeout(function(){ var t = A.sitzung && A.sitzung(), n = t && naechsteUebung(t); if (n && !n.opt && BG.el && BG.sid === t.sid) zeigeNaechste(n, false); }, ms + 400);
    return;
  }
  var satz = spruch(satzTopf(), satzNameTopf());
  aktion('huepf'); begleiterBild({ gesicht: 'froh' }, 700);
  sagen(satz, lesezeit(satz, 2200, 4500));
}
// Am Ende der Einheit: der Begleiter und der Abklatsch-Partner klatschen sich ab
function begleiterFinale(){
  if (!begleiterAn() || RUHIG) return;
  var alt = document.querySelector('.ogt-mini-finale'); if (alt) alt.remove();
  var box = el('div', 'ogt-mini-finale');
  box.setAttribute('aria-hidden', 'true');
  box.innerHTML = '<div class="ogt-mini-fin-a">' + katzeSvg(meineKatze({ arm: 1, gesicht: 'froh' })) + '</div>'
    + '<div class="ogt-mini-fin-b">' + katzeSvg(partnerBild({ arm: -1, gesicht: 'froh' })) + '</div><div class="ogt-mini-fin-text">Patsch! 🙌</div>';
  document.body.appendChild(box);
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ box.classList.add('da'); }); });
  setTimeout(function(){ box.classList.add('patsch'); var r = box.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height * 0.45); }, 1050);
  setTimeout(function(){ box.classList.add('weg'); }, 3100);
  setTimeout(function(){ box.remove(); }, 3700);
}

// Reaktion auf schlechte Werte (Olli 22.11.2026: „wenn die irgendwo einen etwas schlechteren Wert anklicken … So Krise, Digga. Fuck.“):
// nur Frische (0–3), Schlaf/Muskelkater/Stress (1–2) und Anstrengung (9–10), nie bei den Schmerzfragen; je Frage und Einheit einmal
var REAKT = { normal: ['Uff.', 'Oh je – Kopf hoch!', 'Danke fürs Ehrlich-Sein!'],
  jung: ['Krise, Digga.', 'Was ist da los, {sis}?', 'Alter … Krise.', 'Oha – Krise.', 'Was ist da los, Bruder?'],
  frech: ['Scheiße … Krise.', 'Fuck.', 'Was ist da los?', 'Uff – Scheiße.'],
  frechJung: ['Krise, Digga.', 'Fuck.', 'Was ist da los, {sis}?', 'Alter … Krise.', 'Digga, das ist ’ne Krise.', 'Was ist da los, Bruder?', 'Fuck, Digga – Krise.'] };
var REAKT_HART = { normal: ['Puh, das war hart – stark durchgezogen!', 'Respekt – das war hart!'],
  jung: ['Alter, das war hart – Respekt!', 'Krass, Digga – du hast durchgezogen!'],
  frech: ['Fuck, das war hart!', 'Alter, das war brutal – Respekt!'],
  frechJung: ['Fuck, das war hart!', 'Alter, das war brutal – Respekt!', 'Krass, Digga – du hast durchgezogen!'] };
function reaktPool(hart){ var R = hart ? REAKT_HART : REAKT; return frech() ? (jung() ? R.frechJung : R.frech) : (jung() ? R.jung : R.normal); }
function wertArt(name, v){
  if (/^sa-(sl|mk|sr)$/.test(name)) return v <= 2 ? 'schlecht' : '';
  if (name === 'pre-fr' || name === 'fin-fr') return v <= 3 ? 'schlecht' : '';
  if (name === 'fin-e') return v >= 9 ? 'hart' : '';
  return '';
}
document.addEventListener('change', function(ev){
  var t = ev.target; if (!t || t.type !== 'radio' || !BG.el) return;
  var art = wertArt(t.name, +t.value); if (!art) return;
  var k = BG.sid + '|' + t.name; BG.reagiert = BG.reagiert || {}; if (BG.reagiert[k]) return; BG.reagiert[k] = 1;
  var l = reaktPool(art === 'hart'), txt = einsetzen(l[Math.floor(Math.random() * l.length)]), ms = lesezeit(txt, 2600, 4500);
  if (art === 'hart'){ aktion('huepf', 600); begleiterBild({ gesicht: 'froh' }, 1400); } else begleiterBild({ gesicht: 'grummel' }, 1800);
  clearTimeout(BG.ansageZeit);
  sagen(txt, ms);
  var s = A.sitzung && A.sitzung();   // noch nichts abgehakt (Kurz-Check): danach die erste Übung wieder ansagen
  if (s && s.sid === BG.sid && !s.uebungen.some(function(x){ return x.begonnen; })) ersteAnsagen(ms + 400);
});

// ===================== Signale aus der App =====================
var FERTIG_ZEIT = 0;
function beiRender(){
  var st = stand();
  if (ST.letzte == null) ST.letzte = st.verdient;
  if (st.verdient !== ST.letzte){
    var plus = st.verdient - ST.letzte, neu = neueBoni(st.teile);
    ST.letzte = st.verdient; sichern();
    if (plus > 0 && Date.now() - FERTIG_ZEIT > 2000){
      pop('+' + zahl(plus) + ' ⭐');
      if (neu.length) hinweis('🎁 Geheimer Bonus entdeckt: ' + neu.map(function(b){ return b.n; }).join(', '));
    }
  }
  karteFuellen(st); tabFuellen(st);
}
function beiFertig(d){
  var st = stand(), plus = ST.letzte != null ? st.verdient - ST.letzte : 0, neu = neueBoni(st.teile), z = naechstesZiel();
  ST.letzte = st.verdient; sichern(); FERTIG_ZEIT = Date.now();
  setTimeout(function(){
    feiern(aktiveFeier());
    ergebnisKarte('<p class="ogt-mini-e-klein">Einheit gespeichert</p><p class="ogt-mini-e-gross">+' + zahl(Math.max(0, plus)) + ' ⭐</p>'
      + '<p class="ogt-mini-e-klein">Kontostand: ' + zahl(st.konto) + ' ⭐</p>'
      + neu.map(function(b){ return '<p class="ogt-mini-e-neu">🎁 Geheimer Bonus entdeckt: ' + esc(b.n) + ' (+' + b.p + ' ⭐ ' + esc(b.je) + ')</p>'; }).join('')
      + (z && st.konto >= z.preis ? '<p class="ogt-mini-e-klein">Im Shop kannst du dir jetzt etwas holen.</p><button type="button" class="ogt-mini-e-knopf" data-mini="zum-tab">Zum Shop</button>'
        : (z ? '<p class="ogt-mini-e-klein">Noch ' + zahl(z.preis - st.konto) + ' ⭐ bis: ' + esc(z.n) + '</p>' : '')),
      neu.length ? 7000 : 5200);
  }, 450);
}
window.addEventListener('ogt-mini', function(ev){
  var d = (ev && ev.detail) || {};
  if (d.art === 'render'){ beiRender(); begleiterPruefen(); }
  else if (d.art === 'uebung') pop('+' + (((d.d && d.d.n) || 1) * REGEL.uebung) + ' ⭐');
  else if (d.art === 'satz') begleiterSatz(d.d || {});
  else if (d.art === 'fertig'){ beiFertig(d.d || {}); setTimeout(begleiterFinale, aktiveFeier() === 'katze' ? 4900 : 900); }
});
document.addEventListener('click', function(ev){
  var b = ev.target && ev.target.closest ? ev.target.closest('[data-mini]') : null; if (!b) return;
  var a = b.getAttribute('data-mini'), k = b.getAttribute('data-k') || '', id = b.getAttribute('data-id') || '';
  switch (a){
    case 'zum-tab':
      var tab = document.querySelector('[data-act="tab"][data-tab="spiele"]');
      if (tab) tab.click();
      break;
    case 'regeln': REGELN_OFFEN = !REGELN_OFFEN; break;
    case 'spielen': spielStarten(id); break;
    case 'streicheln': streicheln(b); break;
    case 'kaufen': kaufDialog(k); break;
    case 'kauf-nein': zuKauf(); break;
    case 'kauf-ja':
      var d = ding(k);
      if (kaufen(k)){
        zuKauf(); burst(window.innerWidth / 2, window.innerHeight * 0.45); neuZeichnen();
        hinweis('Gekauft: ' + d.n + (d.art === 'spiel' ? ' – viel Spaß!' : ((d.art === 'deko' || d.art === 'fell') ? ' – für ' + (tierName(d.tier) || TIERE[d.tier].n) : (d.art === 'tier' ? (SLOT === 'partner' ? ' – kommt jetzt zum Abklatschen' : ' – ist jetzt dein Begleiter') : (d.art === 'spruch' ? ' – ist jetzt an 🤬' : ' – ist jetzt aktiv')))));
        begleiterBild();
        if (d.art === 'feier') setTimeout(function(){ feiern(d.id); }, 300);
      } else { zuKauf(); hinweis('Das hat nicht geklappt – zu wenig Punkte?'); }
      break;
    case 'waehlen': waehlen(k); break;
    case 'name': nameDialog(); break;
    case 'slot': SLOT = id === 'partner' ? 'partner' : 'haupt'; tabFuellen(); break;
    case 'begleiter-umschalten': ST.begleiterAus = begleiterAn() ? 1 : 0; sichern(); neuZeichnen(); hinweis(begleiterAn() ? 'Dein Begleiter läuft im Training mit' : 'Begleiter im Training ausgeblendet'); break;
    case 'test-plus': if (TEST){ ST.bonus = (+ST.bonus || 0) + 100; ST.letzte = stand().verdient; sichern(); neuZeichnen(); hinweis('+100 Testpunkte'); } break;
    case 'test-null': if (TEST){ ST.bonus = 0; ST.letzte = stand().verdient; sichern(); neuZeichnen(); hinweis('Testpunkte auf 0'); } break;
    case 'test-alles':
      if (TEST){ ST.gekauft = {}; ST.feier = 'konfetti'; ST.dekos = {}; ST.felle = {}; ST.tier = 'katze'; ST.entdeckt = {}; ST.mucki = null;
        ST.partner = 'katze'; ST.namen = {}; ST.namensKosten = 0; ST.frech = 0; BG.frechIn = 0; SLOT = 'haupt';
        ST.letzte = stand().verdient; sichern(); neuZeichnen(); hinweis('Käufe, Boni und Muckibude zurückgesetzt'); }
      break;
  }
});
document.addEventListener('keydown', function(ev){
  if (ev.key !== 'Escape') return;
  var s = document.querySelector('.ogt-mini-spiel [data-spiel="zu"]');
  if (s) s.click(); else zuKauf();
});

// ===================== Aussehen =====================
var CSS = [
  '.tabs-in:has(.tab:nth-child(6)) .tab{font-size:11.5px;padding-left:0;padding-right:0}',   // sechs Reiter (mit „Spiele“): Beschriftung passt ganz
  '.ogt-mini-karte{position:relative;gap:8px}',
  'body.ogt-mini-mit-bg{padding-bottom:calc(172px + env(safe-area-inset-bottom,0px))}',
  '.ogt-mini-bg{position:fixed;bottom:calc(74px + env(safe-area-inset-bottom,0px));left:12px;z-index:42;width:88px;height:88px;transition:left 1.8s ease-in-out;pointer-events:none}',
  '.ogt-mini-bg-tier{width:100%;height:100%}',
  '.ogt-mini-bg-tier svg{width:100%;height:100%;display:block;filter:drop-shadow(0 4px 8px rgba(0,0,0,.25))}',
  '.ogt-mini-bg-blase{position:absolute;bottom:94px;left:0;width:max-content;max-width:min(280px,calc(100vw - 16px));box-sizing:border-box;background:#fff;color:#1b1b1b;font:700 14px/1.3 var(--font-body,system-ui,sans-serif);padding:8px 11px;border-radius:14px;box-shadow:0 6px 16px rgba(0,0,0,.25);overflow-wrap:anywhere}',
  '.ogt-mini-bg-name{display:block;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#7c3aed;margin-bottom:1px}',
  ".ogt-mini-bg-blase::after{content:'';position:absolute;left:calc(var(--zipfel,32px) - 7px);bottom:-7px;border:7px solid transparent;border-top-color:#fff;border-bottom:0}",
  '.ogt-mini-bg-blase.neu{animation:ogtMiniBlase2 .25s ease}',
  '@keyframes ogtMiniBlase2{from{opacity:0;transform:translateY(6px) scale(.92)}to{opacity:1;transform:none}}',
  '.ogt-mini-bg.laeuft .ogt-mini-bg-tier{animation:ogtMiniLauf .3s ease-in-out infinite alternate}',
  '@keyframes ogtMiniLauf{from{transform:translateY(0) rotate(-4deg)}to{transform:translateY(-5px) rotate(4deg)}}',
  '.ogt-mini-bg.huepf .ogt-mini-bg-tier{animation:ogtMiniHopp .6s ease}',
  '@keyframes ogtMiniHopp{0%{transform:none}35%{transform:translateY(-22px) scale(1.05)}70%{transform:translateY(0) scale(1.08,.92)}100%{transform:none}}',
  '.ogt-mini-bg.moonwalk .ogt-mini-bg-tier{animation:ogtMiniMoon 1.6s ease-in-out}',
  '@keyframes ogtMiniMoon{0%{transform:none}20%{transform:translateX(16px) skewX(-8deg)}40%{transform:translateX(32px) skewX(8deg)}60%{transform:translateX(46px) skewX(-8deg)}80%{transform:translateX(26px) rotate(8deg)}100%{transform:none}}',
  '.ogt-mini-bg.tanz .ogt-mini-bg-tier{animation:ogtMiniTanz .4s ease-in-out 4 alternate}',
  '@keyframes ogtMiniTanz{from{transform:rotate(-10deg) translateY(0)}to{transform:rotate(10deg) translateY(-10px)}}',
  '.ogt-mini-finale{position:fixed;left:0;right:0;bottom:calc(70px + env(safe-area-inset-bottom,0px));height:150px;z-index:66;pointer-events:none;transition:opacity .5s}',
  '.ogt-mini-finale.weg{opacity:0}',
  '.ogt-mini-fin-a,.ogt-mini-fin-b{position:absolute;bottom:0;left:50%;width:130px;height:130px;transition:transform .9s cubic-bezier(.2,1.1,.4,1)}',
  '.ogt-mini-fin-a{transform:translateX(-160vw)}',
  '.ogt-mini-fin-b{transform:translateX(160vw)}',
  '.ogt-mini-finale.da .ogt-mini-fin-a{transform:translateX(-100%)}',
  '.ogt-mini-finale.da .ogt-mini-fin-b{transform:translateX(-30%)}',
  '.ogt-mini-fin-a svg,.ogt-mini-fin-b svg{width:100%;height:100%;display:block;filter:drop-shadow(0 6px 12px rgba(0,0,0,.3))}',
  '.ogt-mini-finale.patsch .ogt-mini-fin-a svg,.ogt-mini-finale.patsch .ogt-mini-fin-b svg{animation:ogtMiniHuepf .5s ease}',
  '.ogt-mini-fin-text{position:absolute;left:50%;top:-34px;transform:translateX(-50%) scale(.6);opacity:0;background:#fff;color:#1b1b1b;font:800 19px/1.2 var(--font-body,system-ui,sans-serif);padding:7px 13px;border-radius:14px;box-shadow:0 6px 16px rgba(0,0,0,.25);transition:opacity .2s,transform .3s cubic-bezier(.2,1.4,.4,1)}',
  '.ogt-mini-finale.patsch .ogt-mini-fin-text{opacity:1;transform:translateX(-50%) scale(1)}',
  '.ogt-mini-karte .ogt-mini-zahl{font-family:var(--font-display);font-weight:800;font-size:34px;line-height:1.05;margin:0}',
  '.ogt-mini-karte .ogt-mini-zahl small{font-size:16px;font-weight:700;color:var(--ink-3)}',
  '.ogt-mini-weiter{margin:0}',
  '.ogt-mini-balken{height:10px;border-radius:999px;background:var(--line-2);overflow:hidden}',
  '.ogt-mini-balken i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#ffb300,#ff6a00)}',
  '.ogt-mini-begleiter{position:absolute;right:8px;top:4px;width:82px;height:82px;padding:0;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent}',
  '.ogt-mini-begleiter.gross{width:112px;height:112px;top:2px}',
  '.ogt-mini-begleiter svg{width:100%;height:100%;display:block}',
  '.ogt-mini-kopfkarte{min-height:150px}',
  '.ogt-mini-kopfkarte .ogt-mini-zahl,.ogt-mini-kopfkarte .eyebrow,.ogt-mini-kopfkarte .ogt-mini-weiter{padding-right:110px}',
  '.ogt-mini-sprechblase{position:absolute;right:92px;top:10px;background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:12px;padding:6px 10px;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,.15);animation:ogtMiniBlase 1.7s ease forwards;pointer-events:none;white-space:nowrap}',
  '.ogt-mini-sprechblase.gross{right:122px;top:18px}',
  '@keyframes ogtMiniBlase{0%{opacity:0;transform:scale(.7)}12%{opacity:1;transform:scale(1)}80%{opacity:1}100%{opacity:0}}',
  '.ogt-mini-testband{position:fixed;top:calc(8px + env(safe-area-inset-top,0px));right:8px;z-index:45;background:#7c3aed;color:#fff;font:700 12px/1 var(--font-body,system-ui,sans-serif);padding:6px 10px;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.25);pointer-events:none}',
  'html.ogt-mini-offen,html.ogt-mini-offen body{overflow:hidden}',
  '.ogt-mini-x{flex:none;width:42px;height:42px;border-radius:999px;border:1px solid var(--line);background:var(--panel-2);color:var(--ink);font-size:18px;font-weight:700;cursor:pointer}',
  '.ogt-mini-h3{font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);margin:10px 0 0}',
  '.ogt-mini-klein{font-size:13px;color:var(--ink-3);margin:4px 0 8px}',
  '.ogt-mini-fuss{margin:0 4px}',
  '.ogt-mini-regeln{background:var(--panel-2);border-radius:12px;padding:10px 12px}',
  '.ogt-mini-regeln summary{font-weight:700;cursor:pointer}',
  '.ogt-mini-regeln ul{margin:8px 0 6px;padding-left:18px;display:grid;gap:3px}',
  '.ogt-mini-regeln p{font-size:13px;color:var(--ink-3);margin:4px 0}',
  '.ogt-mini-regeln .ogt-mini-geheim-kopf{font-weight:800;color:var(--ink);font-size:14px;margin-top:10px}',
  '.ogt-mini-regeln .leise{color:var(--ink-3);font-style:italic}',
  '.ogt-mini-liste{display:grid;gap:8px}',
  '.ogt-mini-spielzeile{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:14px;background:var(--panel-2);border:1px solid var(--line-2)}',
  '.ogt-mini-icon{font-size:30px;width:40px;text-align:center;flex:none}',
  '.ogt-mini-text{flex:1;min-width:0;display:grid;gap:2px}',
  '.ogt-mini-text span{font-size:13px;color:var(--ink-2)}',
  '.ogt-mini-text .ogt-mini-rek{color:var(--ok);font-weight:700}',
  '.ogt-mini-los,.ogt-mini-preis,.ogt-mini-reihe button{flex:none;font:inherit;font-weight:700;font-size:15px;padding:10px 14px;border-radius:12px;border:1px solid var(--line);background:var(--panel);color:var(--ink);cursor:pointer}',
  '.ogt-mini-los{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}',
  '.ogt-mini-preis{color:var(--ink-3)}',
  '.ogt-mini-preis.geht{border-color:#ff9f1c;color:var(--ink);box-shadow:0 0 0 2px rgba(255,159,28,.25)}',
  '.ogt-mini-raster{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}',
  '.ogt-mini-ding{position:relative;display:grid;justify-items:center;align-content:start;gap:3px;padding:10px 6px;border-radius:14px;border:2px solid var(--line-2);background:var(--panel-2);color:var(--ink);font:inherit;cursor:pointer;min-height:120px}',
  '.ogt-mini-ding.aktiv{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}',
  '.ogt-mini-ding.geht{border-color:#ffb347}',
  '.ogt-mini-ding.teuer .ogt-mini-bild{filter:grayscale(.85);opacity:.5}',
  '.ogt-mini-bild{font-size:34px;line-height:1;height:52px;width:52px;display:grid;place-items:center}',
  '.ogt-mini-bild svg{width:52px;height:52px;display:block}',
  '.ogt-mini-bild.gross{width:120px;height:120px;font-size:64px;margin:0 auto}',
  '.ogt-mini-bild.gross svg{width:120px;height:120px}',
  '.ogt-mini-zwei{display:flex;align-items:flex-end}',
  '.ogt-mini-zwei svg{width:30px;height:30px}',
  '.ogt-mini-bild.gross .ogt-mini-zwei svg{width:64px;height:64px}',
  '.ogt-mini-name{font-weight:700;font-size:13px;text-align:center;line-height:1.2}',
  '.ogt-mini-platz{font-size:11px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.06em}',
  '.ogt-mini-ab{font-size:12px;color:var(--ink-3)}',
  '.ogt-mini-ding.geht .ogt-mini-ab{color:#d97706;font-weight:800}',
  '.ogt-mini-ding.aktiv .ogt-mini-ab{color:var(--accent);font-weight:700}',
  '.ogt-mini-reihe{display:flex;gap:10px;flex-wrap:wrap}',
  '.ogt-mini-reihe .ogt-mini-los{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}',
  '.ogt-mini-tiername{font-size:12px;font-weight:700;color:var(--ink-2);line-height:1.1}',
  '.ogt-mini-slots{display:flex;gap:8px;margin:8px 0 2px}',
  '.ogt-mini-slots button{flex:1;font:inherit;font-weight:700;font-size:14px;padding:9px 8px;border-radius:12px;border:2px solid var(--line);background:var(--panel);color:var(--ink-2);cursor:pointer}',
  '.ogt-mini-slots button[aria-pressed="true"]{border-color:var(--accent);background:var(--accent-soft);color:var(--ink)}',
  '.ogt-mini-bgname{margin:4px 0 0;font-size:20px;font-family:var(--font-display)}',
  '.ogt-mini-bgname span{font-size:15px;color:var(--ink-3);font-family:var(--font-body)}',
  '.ogt-mini-namefeld{width:100%;box-sizing:border-box;font:inherit;font-size:18px;font-weight:700;padding:10px 12px;border-radius:12px;border:2px solid var(--line);background:var(--panel-2);color:var(--ink);text-align:center;margin:6px 0 2px}',
  '.ogt-mini-kaufen{position:fixed;inset:0;z-index:68;background:rgba(8,12,20,.6);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}',
  '.ogt-mini-kaufkarte{width:min(92vw,340px);background:var(--panel);color:var(--ink);border-radius:18px;padding:18px;text-align:center;box-shadow:0 14px 40px rgba(0,0,0,.35);font-family:var(--font-body)}',
  '.ogt-mini-kaufkarte h2{font-family:var(--font-display);font-size:28px;margin:6px 0}',
  '.ogt-mini-kaufkarte p{margin:6px 0 12px;color:var(--ink-2)}',
  '.ogt-mini-kaufkarte .ogt-mini-reihe{justify-content:center}',
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
  '.ogt-mini-muckipanel{flex:none;max-height:44%;overflow:auto;padding:8px 12px 12px;display:grid;gap:8px;background:#111426}',
  '.ogt-mini-mucki-info{margin:0;font-size:14px;font-weight:700;color:#fde68a;text-align:center}',
  '.ogt-mini-mucki-info.leise{color:#aab4c8;font-weight:600;font-size:13px}',
  '.ogt-mini-upgrade{display:grid;grid-template-columns:1fr auto;gap:2px 10px;text-align:left;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#fff;font:inherit;cursor:pointer}',
  '.ogt-mini-upgrade b{grid-column:1}',
  '.ogt-mini-upgrade b small{font-weight:600;color:#aab4c8}',
  '.ogt-mini-upgrade span{grid-column:1;font-size:13px;color:#cbd5e1}',
  '.ogt-mini-upgrade em{grid-column:2;grid-row:1 / span 2;align-self:center;font-style:normal;font-weight:800;color:#86efac}',
  '.ogt-mini-upgrade.zu{opacity:.55}',
  '.ogt-mini-upgrade.zu em{color:#fca5a5}',
  '.ogt-mini-feier{position:fixed;inset:0;z-index:66;pointer-events:none}',
  '.ogt-mini-feier canvas{width:100%;height:100%;display:block}',
  '.ogt-mini-katzenfeier{position:fixed;left:50%;bottom:-300px;transform:translateX(-50%);z-index:66;display:grid;justify-items:center;gap:6px;pointer-events:none;transition:bottom .5s cubic-bezier(.2,1.3,.4,1)}',
  '.ogt-mini-katzenfeier.da{bottom:calc(76px + env(safe-area-inset-bottom,0px))}',
  '.ogt-mini-katze-gross{pointer-events:auto;width:190px;height:190px;padding:0;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}',
  '.ogt-mini-katze-gross svg{width:100%;height:100%;display:block;filter:drop-shadow(0 6px 14px rgba(0,0,0,.3))}',
  '.ogt-mini-sprech{background:#fff;color:#1b1b1b;font:800 19px/1.2 var(--font-body,system-ui,sans-serif);padding:8px 14px;border-radius:14px;box-shadow:0 6px 16px rgba(0,0,0,.25);position:relative}',
  ".ogt-mini-sprech::after{content:'';position:absolute;left:50%;bottom:-8px;transform:translateX(-50%);border:8px solid transparent;border-top-color:#fff;border-bottom:0}",
  '.ogt-mini-katzenfeier.patsch .ogt-mini-katze-gross{animation:ogtMiniHuepf .5s ease}',
  '@keyframes ogtMiniHuepf{0%{transform:scale(1)}40%{transform:scale(1.12) rotate(-4deg)}100%{transform:scale(1)}}',
  '.ogt-mini-ergebnis{position:fixed;left:50%;top:calc(14% + env(safe-area-inset-top,0px));transform:translate(-50%,-16px) scale(.92);opacity:0;z-index:67;width:min(88vw,340px);background:var(--panel);color:var(--ink);border-radius:18px;padding:16px;text-align:center;box-shadow:0 14px 40px rgba(0,0,0,.35);transition:opacity .3s,transform .3s;box-sizing:border-box;font-family:var(--font-body)}',
  '.ogt-mini-ergebnis.da{opacity:1;transform:translate(-50%,0) scale(1)}',
  '.ogt-mini-e-klein{margin:2px 0;color:var(--ink-3);font-size:14px}',
  '.ogt-mini-e-gross{margin:2px 0;font-family:var(--font-display);font-weight:800;font-size:46px;line-height:1}',
  '.ogt-mini-e-neu{margin:8px 0 2px;font-weight:800;font-size:16px}',
  '.ogt-mini-e-knopf{margin-top:10px;font:inherit;font-weight:700;padding:10px 18px;border-radius:12px;border:0;background:var(--accent);color:var(--accent-ink);cursor:pointer}',
  '.ogt-mini-emoji{font-size:inherit;line-height:1}',
  '.ogt-mini-pop{position:fixed;z-index:67;transform:translate(-50%,0);font:800 20px/1 var(--font-display,system-ui,sans-serif);color:#ff9f1c;text-shadow:0 2px 0 rgba(0,0,0,.25);pointer-events:none;animation:ogtMiniPop .95s ease-out forwards;white-space:nowrap}',
  '@keyframes ogtMiniPop{0%{opacity:0;transform:translate(-50%,0) scale(.6)}18%{opacity:1;transform:translate(-50%,-10px) scale(1.15)}100%{opacity:0;transform:translate(-50%,-58px) scale(1)}}',
  '.ogt-mini-hinweis{position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:70;background:var(--ink);color:var(--panel);padding:10px 16px;border-radius:999px;font-weight:700;font-size:14px;max-width:calc(100% - 32px);text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.25);box-sizing:border-box}',
  '@media (prefers-reduced-motion: reduce){.ogt-mini-pop,.ogt-mini-sprechblase{animation-duration:.01s}.ogt-mini-katzenfeier,.ogt-mini-ergebnis,.ogt-mini-bg{transition:none}}'
].join('\n');

// ===================== Start =====================
(function(){
  var s = document.createElement('style'); s.id = 'ogt-mini-stil'; s.textContent = CSS; document.head.appendChild(s);
  if (TEST){ var band = el('div', 'ogt-mini-testband', 'Testplan · Minigames'); band.setAttribute('aria-hidden', 'true'); document.body.appendChild(band); }
  var st = stand();
  if (ST.letzte == null) ST.letzte = st.verdient;
  neueBoni(st.teile);   // was schon da ist, gilt still als entdeckt
  var erstesMal = !ST.hallo; ST.hallo = 1;
  sichern();
  karteFuellen(st); tabFuellen(st);
  if (erstesMal) setTimeout(function(){
    ergebnisKarte('<p class="ogt-mini-e-neu">Neu: ⭐ Punkte, Shop & Minispiele</p><p class="ogt-mini-e-klein">Für jede gespeicherte Einheit gibt’s Punkte – und für ein paar geheime Dinge auch. Im Reiter „Spiele“ holst du dir davon Spiele, Feiern, Tiere und Sachen für deinen Begleiter.</p>'
      + '<button type="button" class="ogt-mini-e-knopf" data-mini="zum-tab">Anschauen</button>', 9000);
  }, 900);
})();
// Für die automatischen Prüfungen (tests/tests_minigame.html): Blick auf Stand, Shop und Feiern von außen
A.pruefen = { stand: stand, kaufen: kaufen, besitzt: besitzt, feiern: feiern, spielStarten: spielStarten, katzeSvg: katzeSvg,
  effekt: function(id, W, H){ return EFFEKT[id] ? EFFEKT[id](W, H) : null; }, ST: function(){ return JSON.parse(JSON.stringify(ST)); },
  begleiter: function(){ return { da: !!BG.el, text: BG.blase && !BG.blase.hidden ? BG.text : '', tier: meinTier(), name: meinName() }; }, finale: begleiterFinale,
  tiere: function(){ return Object.keys(TIERE); }, tierBild: function(o){ return katzeSvg(o); },
  spruch: function(){ return spruch(satzTopf(), satzNameTopf()); }, lesezeit: lesezeit, jung: jung, alte: ALTE_SAETZE.slice(), einsetzen: einsetzen, warFrech: function(){ return !!BG.warFrech; }, gruss: begruessung, meilenstein: meilenstein, frech: FRECH.slice(),
  check: CHECK.concat(jung() ? CHECK_JUNG : []), reaktionen: function(){ return reaktPool(false).concat(reaktPool(true)).map(einsetzen); },
  alleSprueche: function(){ return [].concat(SPRUECHE, SATZ_SPRUECHE, SATZ_NAME, ALTE_SAETZE, UEBUNG_SPRUECHE, UEBUNG_NAME, SATZ_JUNG, SATZ_JUNG_NAME, UEBUNG_JUNG,
    FRECH, FRECH_NAME, FRECH_UEBUNG, FRECH_JUNG, FRECH_JUNG_NAME, FRECH_JUNG_UEBUNG, CHECK, CHECK_JUNG, [ALLES_GESCHAFFT],
    REAKT.normal, REAKT.jung, REAKT.frech, REAKT.frechJung, REAKT_HART.normal, REAKT_HART.jung, REAKT_HART.frech, REAKT_HART.frechJung); }, ansage: ansageText, dekoVon: dekoVon, fellVon: fellVon,
  partner: function(){ return { tier: meinPartner(), fell: partnerFell() }; }, slot: function(){ return SLOT; } };
})();
