/** 서버에서 최신 index.html을 받아오도록 강제 새로고침합니다. */
export function hardRefresh() {
  const { origin, pathname } = window.location;
  const path = pathname || '/';
  const url = `${origin}${path}?_=${Date.now()}`;

  // 캐시·SW 정리는 기다리지 않고 바로 이동 (느린 fetch 때문에 멈추는 문제 방지)
  if ('caches' in window) {
    void caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker.getRegistrations().then((regs) => {
      void Promise.all(regs.map((r) => r.unregister()));
    });
  }

  window.location.replace(url);
}
