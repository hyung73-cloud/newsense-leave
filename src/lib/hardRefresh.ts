/** 브라우저 캐시를 우회해 페이지를 완전히 다시 불러옵니다. */
export async function hardRefresh() {
  const url = `${window.location.origin}${window.location.pathname}?_=${Date.now()}`;

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    await fetch(url, { cache: 'no-store' });
  } catch {
    // 네트워크 실패해도 아래 이동은 시도
  }

  window.location.href = url;
}
