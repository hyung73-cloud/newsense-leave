import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages(프로젝트 경로)와 커스텀 도메인 모두에서 동작
  base: './',
  plugins: [react(), tailwindcss()],
});
