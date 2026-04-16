import { fileURLToPath, URL } from 'node:url';
import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';
import { imagetools } from 'vite-imagetools';
import wyw from '@wyw-in-js/vite';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Use relative base path (./) for EVERYTHING in production.
  // This is the most portable way (works for GitHub Pages and Tauri).
  const isProduction = mode === 'production';
  const base = isProduction ? './' : '/';

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
    ],
  };
});
