import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    assetsDir: '.',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'src/index.html'),
        admin: resolve(import.meta.dirname, 'src/admin.html'),
        demo: resolve(import.meta.dirname, 'src/demo.html')
      },
      output: {
        assetFileNames: '[name][extname]',
        chunkFileNames: '[name].js',
        entryFileNames: '[name].js'
      }
    }
  },
  server: {
    open: '/server/local'
  }
});
