import { defineConfig } from 'vite';

// Configuração mínima do Vite. `base: './'` permite abrir o build (dist/)
// a partir de qualquer subpasta de um servidor estático.
export default defineConfig({
  base: './',
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 2000,
  },
});
