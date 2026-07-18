import { fileURLToPath, URL } from 'node:url';
import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';
import wyw from '@wyw-in-js/vite';

// https://vitejs.dev/config/
export default defineConfig(async ({ command, mode }) => {
  // Use relative base path (./) for EVERYTHING in production.
  // This is the most portable way (works for GitHub Pages and Tauri).
  const isProduction = mode === 'production';
  const isLite = process.env.LITE === 'true';
  const base = isProduction ? './' : '/';

  const plugins: any[] = [
    ...(!isLite ? [splitVendorChunkPlugin()] : []),
    react(),
    wyw({
      include: ['**/*.{ts,tsx}'],
    }),
  ];

  // Only load imagetools in full mode (sharp dependency is heavy)
  if (!isLite) {
    const imagetoolsMod = await import('vite-imagetools');
    plugins.push(
      imagetoolsMod.imagetools({
        exclude: ['./src/assets/mvp_icons_animated/**/*'],
        defaultDirectives: (url: URL) => {
          return new URLSearchParams({
            format: 'webp',
            lossless: 'false',
          });
        },
      })
    );
  }

  return {
    base: base,
    define: {
      __LITE_MODE__: isLite,
    },
    json: {
      stringify: true,
    },
    resolve: {
      alias: [
        // In lite mode, swap utils/index to skip import.meta.glob
        ...(isLite ? [{
          find: /^@\/utils$/,
          replacement: fileURLToPath(new URL('./src/utils/index.lite', import.meta.url)),
        }] : []),
        {
          find: '@',
          replacement: fileURLToPath(new URL('./src', import.meta.url)),
        },
      ],
    },
    plugins,
    build: {
      rollupOptions: {
        output: {
          manualChunks: isLite
            ? (id: string) => {
                if (id.includes('node_modules/firebase')) {
                  return 'firebase';
                }
                if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
                  return 'react-vendor';
                }
                if (id.includes('node_modules/dayjs')) {
                  return 'dayjs';
                }
              }
            : undefined,
        },
      },
    },
  };
});
