import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'app.html'),
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    open: '/app.html',
    allowedHosts: true,
    proxy: {
      '/panel-api': {
        target: 'http://localhost:3001',
        rewrite: path => path.replace(/^\/panel-api/, '/api'),
      },
    },
  },
});
