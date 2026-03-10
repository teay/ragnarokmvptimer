import { fileURLToPath, URL } from 'node:url';
import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';
import { imagetools } from 'vite-imagetools';
import { VitePWA } from 'vite-plugin-pwa';
import wyw from '@wyw-in-js/vite';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production';
  // Use /ragnarokmvptimer/ for GitHub Pages production build, / for dev or tauri
  const base = isProduction && !process.env.TAURI_PLATFORM ? '/ragnarokmvptimer/' : '/';

  return {
    base: base,
    json: {
      stringify: true,
    },
    resolve: {
      alias: [
        {
          find: '@',
          replacement: fileURLToPath(new URL('./src', import.meta.url)),
        },
      ],
    },
    plugins: [
      splitVendorChunkPlugin(),
      react(),
      wyw({
        include: ['**/*.{ts,tsx}'],
        base: base,
      }),
      imagetools({
        exclude: ['./src/assets/mvp_icons_animated/**/*'],
        defaultDirectives: (url) => {
          return new URLSearchParams({
            format: 'webp',
            lossless: 'false',
          });
        },
      }),
      VitePWA({
        disable: !!process.env.TAURI_PLATFORM,
        base: base,
        injectRegister: false,
        registerType: 'autoUpdate',
        devOptions: {
          enabled: process.env.NODE_ENV === 'development',
        },
        manifest: {
          short_name: 'MVP Timer',
          name: 'Ragnarok MVP Timer',
          lang: 'en',
          description: 'app to track ragnarok mvp respawn',
          display: 'standalone',
          theme_color: '#f89200',
          background_color: '#F6F8FA',
          related_applications: [
            {
              platform: 'web',
              url: 'https://teay.github.io/ragnarokmvptimer/',
            },
          ],
          icons: [
            {
              src: 'icons/favicon-16x16.png',
              sizes: '16x16',
              type: 'image/png',
            },
            {
              src: 'icons/favicon-32x32.png',
              sizes: '32x32',
              type: 'image/png',
            },
            {
              src: 'icons/android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'icons/android-chrome-256x256.png',
              sizes: '256x256',
              type: 'image/png',
            },
          ],
        },
      }),
    ],
  };
});
