/** 주소창에서 ?_= 같은 임시 파라미터를 제거해 일반 URL로 유지합니다. */
export function cleanUrlOnLoad() {
  if (!window.location.search && !window.location.hash) return;
  const path = window.location.pathname || '/';
  window.history.replaceState(null, '', path);
}
