// 사장님 앱 휴대폰 알림(웹 푸시) 받기 (2026-11-19). 화면을 따로 저장해 두지는 않습니다(늘 최신 화면).
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || '본죽 단체주문', {
    body: d.body || '새 알림이 왔어요',
    tag: 'bj-n' + (d.id || ''),
    icon: 'img/icon-192.png',
    lang: 'ko',
    data: { url: './' }
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (L) {
    for (var i = 0; i < L.length; i++) { if ('focus' in L[i]) { L[i].postMessage({ t: 'notice' }); return L[i].focus(); } }
    return self.clients.openWindow((e.notification.data && e.notification.data.url) || './');
  }));
});
