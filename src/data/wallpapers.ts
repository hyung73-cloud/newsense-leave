/** 윈도우 스포트라이트 느낌 — 자연·동물 20장 (Unsplash) */
export const WALLPAPERS = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1474511320723-7a0bf7cc9663?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1530595467537-11b783afd48c?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1552728080-f78633184e77?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1432405972618-c60b0225b8b9?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1419242902214-272b31f03b4b?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1522383228803-f6ba81f3540b?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1551986782-d0169f3f8fa7?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1564349683132-77bfc7bdb198?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1400&q=85',
] as const;

export function pickRandomWallpaper() {
  return WALLPAPERS[Math.floor(Math.random() * WALLPAPERS.length)];
}
