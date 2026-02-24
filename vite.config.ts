import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    resolve: {
      alias: {
        '@': path.resolve('./'),
      },
    },
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          {
            src: 'manifest.json',
            dest: '.'
          },
          {
            src: 'sw.js',
            dest: '.'
          }
        ]
      })
    ],
    // This makes process.env.API_KEY available in your React code
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          }
        }
      }
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        }
      }
    }
  };
});