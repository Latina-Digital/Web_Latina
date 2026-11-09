import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      {
        name: 'suppress-vite-hmr-websocket-error',
        transform(code, id) {
          if (id.includes('vite/dist/client/client.mjs')) {
            return code
              .replace(
                'reject(/* @__PURE__ */ new Error("WebSocket closed without opened."));',
                'resolve();'
              )
              .replace(
                'console.error(`[vite] failed to connect to websocket.',
                'console.debug(`[vite] hmr disabled.'
              )
              .replace(
                'console.error(`[vite] failed to connect to websocket (${e}). `);',
                'console.debug(`[vite] hmr disabled.`);'
              );
          }
          return null;
        },
      },
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/three')) {
              return 'vendor-three';
            }
            if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) {
              return 'vendor-pdf';
            }
            if (id.includes('node_modules/firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-lucide';
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio to prevent WebSocket errors in the preview iframe.
      hmr: false,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
