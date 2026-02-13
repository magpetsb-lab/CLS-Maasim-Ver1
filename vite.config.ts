import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'maasim-logo.png',
          dest: '.'
        },
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
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
});