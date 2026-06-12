/** 깨끗한 URL로 페이지를 서버에서 다시 불러옵니다. */
export async function hardRefresh() {
  const path = window.location.pathname || '/';

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    await fetch(`${window.location.origin}${path}`, {
      cache: 'no-store',
      headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache' },
    });
  } catch {
    // fetch 실패해도 reload는 진행
  }

  window.history.replaceState(null, '', path);
  window.location.reload();
}
