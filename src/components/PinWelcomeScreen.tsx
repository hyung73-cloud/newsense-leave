import { useMemo } from 'react';
import { pickRandomWallpaper } from '../data/wallpapers';

export function PinWelcomeScreen() {
  const wallpaper = useMemo(() => pickRandomWallpaper(), []);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-slate-200/80">
        <div className="relative aspect-[16/10] w-full">
          <img
            src={wallpaper}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 px-5 py-6 text-center text-white">
            <p className="text-lg font-bold drop-shadow-sm">PIN 입력 후 작성 가능</p>
            <p className="mt-1 text-sm text-white/85 drop-shadow-sm">
              위에서 4자리 PIN을 입력해주세요
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
