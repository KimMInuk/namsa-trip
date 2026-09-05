/* namsa-trip service worker — cache first, offline capable */
const VERSION = "namsa-v202609050316";
const CORE = VERSION + '-core';
const RUNTIME = VERSION + '-runtime';

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css",
  "./img/atacama--el-tatio-geysers.jpg",
  "./img/atacama--hero-san-pedro-de-atacama.jpg",
  "./img/atacama--laguna-cejar.jpg",
  "./img/atacama--san-pedro-de-atacama-village.jpg",
  "./img/atacama--valle-de-la-luna-atacama.jpg",
  "./img/cusco--hero-cusco.jpg",
  "./img/cusco--machu-picchu.jpg",
  "./img/cusco--maras-salt-ponds.jpg",
  "./img/cusco--mercado-san-pedro-cusco.jpg",
  "./img/cusco--qorikancha.jpg",
  "./img/cusco--sacsayhuaman.jpg",
  "./img/cusco--san-blas-cusco.jpg",
  "./img/cusco--vinicunca-rainbow-mountain.jpg",
  "./img/ica--ballestas-islands.jpg",
  "./img/ica--hero-huacachina.jpg",
  "./img/ica--huacachina-oasis.jpg",
  "./img/ica--ica-desert-dunes.jpg",
  "./img/ica--ica-pisco-bodega.jpg",
  "./img/ica--nazca-lines.jpg",
  "./img/ica--paracas-national-reserve.jpg",
  "./img/intro--hero-machu-picchu-andes.jpg",
  "./img/lapaz--cholita-wrestling-el-alto.jpg",
  "./img/lapaz--hero-la-paz.jpg",
  "./img/lapaz--mi-teleferico-la-paz.jpg",
  "./img/lapaz--plaza-murillo.jpg",
  "./img/lapaz--tiwanaku.jpg",
  "./img/lapaz--valle-de-la-luna-la-paz.jpg",
  "./img/lapaz--witches-market-la-paz.jpg",
  "./img/lima--barranco-lima.jpg",
  "./img/lima--hero-lima.jpg",
  "./img/lima--huaca-pucllana.jpg",
  "./img/lima--larcomar-miraflores.jpg",
  "./img/lima--magic-water-circuit-lima.jpg",
  "./img/lima--plaza-mayor-de-lima.jpg",
  "./img/puno--hero-lake-titicaca-puno.jpg",
  "./img/puno--sillustani.jpg",
  "./img/puno--taquile-island.jpg",
  "./img/puno--uros-floating-islands.jpg",
  "./img/santiago--barrio-bellavista-santiago.jpg",
  "./img/santiago--cerro-san-cristobal.jpg",
  "./img/santiago--cerro-santa-lucia.jpg",
  "./img/santiago--hero-santiago-chile.jpg",
  "./img/santiago--la-chascona.jpg",
  "./img/santiago--mercado-central-santiago.jpg",
  "./img/santiago--plaza-de-armas-santiago.jpg",
  "./img/uyuni--hero-salar-de-uyuni.jpg",
  "./img/uyuni--incahuasi-island.jpg",
  "./img/uyuni--laguna-colorada.jpg",
  "./img/uyuni--salar-de-uyuni-salt-flat.jpg",
  "./img/uyuni--termas-de-polques.jpg",
  "./img/uyuni--uyuni-train-cemetery.jpg",
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CORE)
      .then(function (c) {
        return Promise.all(PRECACHE.map(function (u) {
          return c.add(new Request(u, { cache: 'reload' })).catch(function () {});
        }));
      })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k !== CORE && k !== RUNTIME;
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var isCDN = url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'fonts.gstatic.com';
  if (!isCDN && url.origin !== self.location.origin) return;

  // Navigations resolve to the cached shell so deep hash links work offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then(function (hit) {
        return hit || fetch(req).catch(function () { return caches.match('./'); });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && (res.ok || res.type === 'opaque')) {
          var copy = res.clone();
          caches.open(isCDN ? RUNTIME : CORE).then(function (c) {
            c.put(req, copy);
          }).catch(function () {});
        }
        return res;
      }).catch(function () { return caches.match('./index.html'); });
    })
  );
});
