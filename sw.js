/* O.G. Trainings-App · Offline-Speicher · Version eec7b6b016
   App-Dateien kommen aus dem Speicher (schnell, auch ohne Netz). Pläne kommen zuerst aus dem
   Netz, damit Änderungen ankommen; ohne Netz gilt der zuletzt geladene Stand. */
'use strict';
var APP_CACHE = 'ogt-app-eec7b6b016';
var PLAN_CACHE = 'ogt-plaene';
var APP_DATEIEN = ['./', './index.html', './app.css', './app.js', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(APP_CACHE)
    .then(function(c){ return c.addAll(APP_DATEIEN); })
    .then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(namen){
    return Promise.all(namen.filter(function(n){ return n.indexOf('ogt-app-') === 0 && n !== APP_CACHE; })
      .map(function(n){ return caches.delete(n); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET' || req.url.indexOf(self.registration.scope) !== 0) return;
  var pfad = new URL(req.url).pathname;
  if (/\/plan-[a-z0-9]{12}\.json$/.test(pfad)){
    e.respondWith(fetch(req).then(function(r){
      if (r.ok){ var kopie = r.clone(); caches.open(PLAN_CACHE).then(function(c){ c.put(req.url, kopie); }); }
      return r;
    }).catch(function(){
      return caches.open(PLAN_CACHE).then(function(c){ return c.match(req.url); })
        .then(function(r){ return r || Response.error(); });
    }));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function(r){ return r || fetch(req); }));
});
