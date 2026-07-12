// 智能行事曆 Service Worker
const CACHE_NAME = 'cal-cache-v1';
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 安裝：預快取核心檔案
self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(c){ return c.addAll(CORE).catch(function(){}); })
  );
});

// 啟用：清掉舊快取
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k!==CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

// 抓取策略：
// - Firebase / 動態請求 → 一律走網路（不快取，確保資料即時）
// - App 靜態檔 → 網路優先，失敗時回快取（離線也打得開）
self.addEventListener('fetch', function(e){
  var url = e.request.url;
  if (e.request.method !== 'GET') return;
  if (url.indexOf('firebaseio.com') >= 0 || url.indexOf('googleapis.com') >= 0 || url.indexOf('gstatic.com') >= 0) {
    return; // 交給瀏覽器直接連網，不攔截
  }
  e.respondWith(
    fetch(e.request).then(function(res){
      var copy = res.clone();
      caches.open(CACHE_NAME).then(function(c){ c.put(e.request, copy).catch(function(){}); });
      return res;
    }).catch(function(){
      return caches.match(e.request).then(function(r){ return r || caches.match('./index.html'); });
    })
  );
});
